// Streaming STT provider trait and types
use anyhow::Result;
use async_trait::async_trait;
use serde::{Deserialize, Serialize};
use tokio::sync::mpsc;

/// Event emitted by a streaming STT provider when transcription results arrive.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct TranscriptionEvent {
    /// The transcribed text (partial or final)
    pub text: String,
    /// true = sentence is complete (sentence_end), false = intermediate result
    pub is_final: bool,
    /// Sentence identifier from the STT service
    pub sentence_id: i32,
    /// Speaker identifier (0-based index) when diarization is enabled
    pub speaker_id: Option<i32>,
    /// Sentence begin time in milliseconds
    pub begin_time: Option<i64>,
    /// Sentence end time in milliseconds (only present for final results)
    pub end_time: Option<i64>,
}

/// Configuration variable descriptor for a streaming STT provider.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SttVariable {
    /// Variable key (e.g. "api_key", "app_key")
    pub key: String,
    /// Human-readable label
    pub label: String,
    /// Whether the value should be masked (password field)
    pub is_secret: bool,
}

/// Information about a streaming STT provider, returned to the frontend.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct StreamingSttProviderInfo {
    pub id: String,
    pub name: String,
    pub variables: Vec<SttVariable>,
}

/// A live session representing an active WebSocket connection to an STT service.
pub struct SttSession {
    /// Channel receiver for transcription events from the background reader task
    pub result_rx: mpsc::Receiver<TranscriptionEvent>,
    /// Opaque provider-specific state (WebSocket writer, task_id, etc.)
    pub inner: Box<dyn std::any::Any + Send>,
}

/// Trait that all streaming STT providers must implement.
/// Each provider handles the WebSocket protocol specifics.
#[async_trait]
pub trait StreamingSttProvider: Send + Sync {
    /// Unique provider identifier (e.g. "dashscope", "iflytek-ws")
    fn id(&self) -> &str;

    /// Human-readable provider name
    fn name(&self) -> &str;

    /// Configuration variables required by this provider
    fn required_variables(&self) -> Vec<SttVariable>;

    /// Connect to the STT service WebSocket and start a recognition task.
    /// `variables` contains the provider config (api_key, etc.)
    /// `sample_rate` is the audio sample rate that will be sent (e.g. 16000).
    /// Returns an `SttSession` with a channel receiver for transcription events.
    async fn connect(
        &self,
        variables: &std::collections::HashMap<String, String>,
        sample_rate: u32,
    ) -> Result<SttSession>;

    /// Send PCM audio data (i16 little-endian bytes) to the STT service.
    async fn send_audio(&self, session: &mut SttSession, pcm_bytes: &[u8]) -> Result<()>;

    /// Signal that audio sending is complete and request final results.
    /// The session's result_rx will receive remaining events before closing.
    async fn finish(&self, session: &mut SttSession) -> Result<()>;
}

// --- Provider Registry ---

use super::dashscope;

/// Get a streaming STT provider by ID. Returns None if not found.
pub fn get_provider(id: &str) -> Option<Box<dyn StreamingSttProvider>> {
    match id {
        "dashscope" => Some(Box::new(dashscope::DashScopeProvider)),
        _ => None,
    }
}

/// Get all available streaming STT providers.
pub fn get_all_providers() -> Vec<StreamingSttProviderInfo> {
    vec![
        StreamingSttProviderInfo {
            id: "dashscope".to_string(),
            name: "阿里云百炼 Fun-ASR".to_string(),
            variables: dashscope::DashScopeProvider.required_variables(),
        },
        // Future providers can be added here:
        // StreamingSttProviderInfo { id: "iflytek-ws", ... },
        // StreamingSttProviderInfo { id: "deepgram", ... },
    ]
}
