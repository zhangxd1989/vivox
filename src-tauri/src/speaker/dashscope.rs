// DashScope Fun-ASR real-time streaming STT provider implementation
use super::streaming_stt::{SttSession, SttVariable, StreamingSttProvider, TranscriptionEvent};
use anyhow::{anyhow, Result};
use async_trait::async_trait;
use futures_util::{SinkExt, StreamExt};
use serde_json::{json, Value};
use std::collections::HashMap;
use std::time::Duration;
use tokio::sync::mpsc;
use tokio_tungstenite::tungstenite::Message;
use tracing::{error, info, warn};
use uuid::Uuid;

const DASHSCOPE_WS_URL: &str = "wss://dashscope.aliyuncs.com/api-ws/v1/inference";

pub struct DashScopeProvider;

/// Inner state held inside SttSession for DashScope
struct DashScopeSessionInner {
    ws_write: futures_util::stream::SplitSink<
        tokio_tungstenite::WebSocketStream<
            tokio_tungstenite::MaybeTlsStream<tokio::net::TcpStream>,
        >,
        Message,
    >,
    task_id: String,
    send_count: u32,
}

#[async_trait]
impl StreamingSttProvider for DashScopeProvider {
    fn id(&self) -> &str {
        "dashscope"
    }

    fn name(&self) -> &str {
        "阿里云百炼 Fun-ASR"
    }

    fn required_variables(&self) -> Vec<SttVariable> {
        vec![SttVariable {
            key: "api_key".to_string(),
            label: "DashScope API Key".to_string(),
            is_secret: true,
        }]
    }

    async fn connect(
        &self,
        variables: &HashMap<String, String>,
        sample_rate: u32,
    ) -> Result<SttSession> {
        let api_key = variables
            .get("api_key")
            .ok_or_else(|| anyhow!("Missing api_key for DashScope"))?;

        if api_key.is_empty() {
            return Err(anyhow!("DashScope API Key is empty"));
        }

        // Build TLS connector
        let tls_connector = native_tls::TlsConnector::new()?;
        let connector = tokio_tungstenite::Connector::NativeTls(tls_connector);

        // Build WebSocket request with auth header and required WS handshake headers
        let ws_key = tokio_tungstenite::tungstenite::handshake::client::generate_key();
        let request = tokio_tungstenite::tungstenite::http::Request::builder()
            .uri(DASHSCOPE_WS_URL)
            .header("Host", "dashscope.aliyuncs.com")
            .header("Authorization", format!("Bearer {}", api_key))
            .header("user-agent", "vivox/0.1.0")
            .header("Connection", "Upgrade")
            .header("Upgrade", "websocket")
            .header("Sec-WebSocket-Version", "13")
            .header("Sec-WebSocket-Key", ws_key)
            .body(())?;

        // Connect
        let (ws_stream, _response) =
            tokio_tungstenite::connect_async_tls_with_config(request, None, false, Some(connector))
                .await
                .map_err(|e| anyhow!("WebSocket connect failed: {}", e))?;

        info!("DashScope WebSocket connected");

        // Split into write/read halves
        let (ws_write, ws_read) = ws_stream.split();

        // Generate unique task ID
        let task_id = Uuid::new_v4().to_string();

        // Send run-task message
        let run_task_msg = json!({
            "header": {
                "action": "run-task",
                "task_id": task_id,
                "streaming": "duplex"
            },
            "payload": {
                "task_group": "audio",
                "task": "asr",
                "function": "recognition",
                "model": "fun-asr-realtime",
                "parameters": {
                    "format": "pcm",
                    "sample_rate": sample_rate,
                    "heartbeat": true,
                    "semantic_punctuation_enabled": true,
                    "language_hints": ["zh"]
                },
                "input": {}
            }
        });

        let mut writer = ws_write;
        writer
            .send(Message::Text(run_task_msg.to_string()))
            .await
            .map_err(|e| anyhow!("Failed to send run-task: {}", e))?;

        eprintln!("[STT-WS] run-task sent, task_id={}", task_id);

        // Create channels
        let (tx, rx) = mpsc::channel::<TranscriptionEvent>(64);
        let (started_tx, started_rx) = tokio::sync::oneshot::channel::<bool>();

        // Spawn background task to read WebSocket messages
        let reader_task_id = task_id.clone();
        tokio::spawn(async move {
            let mut reader = ws_read;
            let mut started_tx = Some(started_tx);
            eprintln!("[STT-WS] Reader task started, waiting for messages");
            while let Some(msg_result) = reader.next().await {
                match msg_result {
                    Ok(Message::Text(text)) => {
                        eprintln!("[STT-WS] Received: {}", if text.len() > 300 { format!("{}...", &text[..text.char_indices().take_while(|(i, _)| *i < 300).last().map(|(i, c)| i + c.len_utf8()).unwrap_or(300)]) } else { text.clone() });
                        if let Ok(value) = serde_json::from_str::<Value>(&text) {
                            let event = value
                                .get("header")
                                .and_then(|h| h.get("event"))
                                .and_then(|e| e.as_str())
                                .unwrap_or("");

                            match event {
                                "task-started" => {
                                    eprintln!("[STT-WS] task-started received!");
                                    if let Some(tx) = started_tx.take() {
                                        let _ = tx.send(true);
                                    }
                                }
                                "result-generated" => {
                                    if let Some(event) = parse_result_generated(&value) {
                                        eprintln!("[STT-WS] Transcription: final={}, text={}", event.is_final, if event.text.len() > 50 { format!("{}...", &event.text[..event.text.char_indices().take_while(|(i, _)| *i < 50).last().map(|(i, c)| i + c.len_utf8()).unwrap_or(50)]) } else { event.text.clone() });
                                        let _ = tx.send(event).await;
                                    }
                                }
                                "task-finished" => {
                                    eprintln!("[STT-WS] task-finished");
                                    break;
                                }
                                "task-failed" => {
                                    let error_msg = value
                                        .get("header")
                                        .and_then(|h| h.get("error_message"))
                                        .and_then(|m| m.as_str())
                                        .unwrap_or("Unknown error");
                                    let error_code = value
                                        .get("header")
                                        .and_then(|h| h.get("error_code"))
                                        .and_then(|c| c.as_str())
                                        .unwrap_or("UNKNOWN");
                                    eprintln!("[STT-WS] task-failed: {} - {}", error_code, error_msg);
                                    let _ = tx
                                        .send(TranscriptionEvent {
                                            text: format!("识别失败: {} - {}", error_code, error_msg),
                                            is_final: true,
                                            sentence_id: -1,
                                            speaker_id: None,
                                            begin_time: None,
                                            end_time: None,
                                        })
                                        .await;
                                    if let Some(tx) = started_tx.take() {
                                        let _ = tx.send(false);
                                    }
                                    break;
                                }
                                _ => {
                                    eprintln!("[STT-WS] Unknown event: {}", event);
                                }
                            }
                        }
                    }
                    Ok(Message::Close(frame)) => {
                        eprintln!("[STT-WS] WebSocket closed by server: {:?}", frame);
                        if let Some(tx) = started_tx.take() {
                            let _ = tx.send(false);
                        }
                        break;
                    }
                    Ok(_) => {} // Ping, Pong, Binary - ignore
                    Err(e) => {
                        eprintln!("[STT-WS] WebSocket read error: {}", e);
                        if let Some(tx) = started_tx.take() {
                            let _ = tx.send(false);
                        }
                        let _ = tx
                            .send(TranscriptionEvent {
                                text: format!("WebSocket 读取错误: {}", e),
                                is_final: true,
                                sentence_id: -1,
                                speaker_id: None,
                                begin_time: None,
                                end_time: None,
                            })
                            .await;
                        break;
                    }
                }
            }
        });

        // Wait for task-started confirmation (with 10s timeout)
        match tokio::time::timeout(Duration::from_secs(10), started_rx).await {
            Ok(Ok(true)) => {
                eprintln!("[STT-WS] Task started successfully, ready to send audio");
            }
            Ok(Ok(false)) => {
                return Err(anyhow!("DashScope task failed to start"));
            }
            Ok(Err(_)) => {
                return Err(anyhow!("DashScope task-started channel closed"));
            }
            Err(_) => {
                return Err(anyhow!("Timeout waiting for DashScope task-started (10s)"));
            }
        }

        let inner = DashScopeSessionInner {
            ws_write: writer,
            task_id: reader_task_id,
            send_count: 0,
        };

        Ok(SttSession {
            result_rx: rx,
            inner: Box::new(inner),
        })
    }

    async fn send_audio(&self, session: &mut SttSession, pcm_bytes: &[u8]) -> Result<()> {
        let inner = session
            .inner
            .downcast_mut::<DashScopeSessionInner>()
            .ok_or_else(|| anyhow!("Invalid session type"))?;

        // Split large audio into ~3200 byte chunks (matching DashScope SDK recommendation)
        const CHUNK_SIZE: usize = 3200;
        let mut offset = 0;
        while offset < pcm_bytes.len() {
            let end = (offset + CHUNK_SIZE).min(pcm_bytes.len());
            let chunk = &pcm_bytes[offset..end];

            inner.send_count += 1;
            if inner.send_count <= 3 {
                eprintln!("[STT-WS] Sending audio chunk #{}: {} bytes", inner.send_count, chunk.len());
            } else if inner.send_count % 50 == 0 {
                eprintln!("[STT-WS] Audio chunks sent so far: {}", inner.send_count);
            }

            inner
                .ws_write
                .send(Message::Binary(chunk.to_vec().into()))
                .await
                .map_err(|e| anyhow!("Failed to send audio: {}", e))?;

            offset = end;
        }

        Ok(())
    }

    async fn finish(&self, session: &mut SttSession) -> Result<()> {
        let inner = session
            .inner
            .downcast_mut::<DashScopeSessionInner>()
            .ok_or_else(|| anyhow!("Invalid session type"))?;

        let finish_msg = json!({
            "header": {
                "action": "finish-task",
                "task_id": inner.task_id,
                "streaming": "duplex"
            },
            "payload": {
                "input": {}
            }
        });

        inner
            .ws_write
            .send(Message::Text(finish_msg.to_string()))
            .await
            .map_err(|e| anyhow!("Failed to send finish-task: {}", e))?;

        info!("DashScope finish-task sent");
        Ok(())
    }
}

/// Parse a result-generated message into a TranscriptionEvent
fn parse_result_generated(value: &Value) -> Option<TranscriptionEvent> {
    let sentence = value.get("payload")?.get("output")?.get("sentence")?;

    let text = sentence.get("text")?.as_str()?.to_string();

    // Skip heartbeat messages
    let heartbeat = sentence
        .get("heartbeat")
        .and_then(|h| h.as_bool())
        .unwrap_or(false);
    if heartbeat {
        return None;
    }

    let sentence_end = sentence
        .get("sentence_end")
        .and_then(|s| s.as_bool())
        .unwrap_or(false);

    let sentence_id = sentence
        .get("sentence_id")
        .and_then(|s| s.as_i64())
        .unwrap_or(0) as i32;

    let speaker_id = sentence
        .get("speaker_id")
        .and_then(|s| s.as_i64())
        .map(|s| s as i32);

    let begin_time = sentence
        .get("begin_time")
        .and_then(|b| b.as_i64());

    let end_time = sentence
        .get("end_time")
        .and_then(|e| e.as_i64());

    Some(TranscriptionEvent {
        text,
        is_final: sentence_end,
        sentence_id,
        speaker_id,
        begin_time,
        end_time,
    })
}
