// Vivox AI Speech Detection with real-time streaming STT
use crate::speaker::resampler::AudioResampler;
use crate::speaker::streaming_stt;
use crate::speaker::{AudioDevice, SpeakerInput};
use anyhow::Result;
use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use std::collections::{HashMap, VecDeque};
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::Duration;
use tauri::{AppHandle, Emitter, Listener, Manager};
use tauri_plugin_shell::ShellExt;
use tracing::{error, info, warn};

// VAD Configuration
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VadConfig {
    pub enabled: bool,
    pub hop_size: usize,
    pub sensitivity_rms: f32,
    pub peak_threshold: f32,
    pub silence_chunks: usize,
    pub min_speech_chunks: usize,
    pub pre_speech_chunks: usize,
    pub noise_gate_threshold: f32,
    pub max_recording_duration_secs: u64,
}

impl Default for VadConfig {
    fn default() -> Self {
        Self {
            enabled: true,
            hop_size: 1024,
            sensitivity_rms: 0.012,
            peak_threshold: 0.035,
            silence_chunks: 45,
            min_speech_chunks: 7,
            pre_speech_chunks: 12,
            noise_gate_threshold: 0.003,
            max_recording_duration_secs: 180,
        }
    }
}

/// Transcription event payload sent to frontend
#[derive(Debug, Clone, Serialize)]
struct TranscriptionPayload {
    text: String,
    sentence_id: i32,
    speaker_id: Option<i32>,
    begin_time: Option<i64>,
    end_time: Option<i64>,
}

#[tauri::command]
pub async fn start_system_audio_capture(
    app: AppHandle,
    vad_config: Option<VadConfig>,
    device_id: Option<String>,
    provider_id: Option<String>,
    provider_variables: Option<HashMap<String, String>>,
) -> Result<(), String> {
    eprintln!("[STT] start_system_audio_capture called: provider={:?}, device={:?}", provider_id, device_id);

    let state = app.state::<crate::AudioState>();

    // Check if already capturing (use is_capturing as authoritative flag)
    let already_capturing = {
        let is_cap = *state
            .is_capturing
            .lock()
            .map_err(|e| format!("Failed to acquire lock: {}", e))?;
        is_cap
    };
    if already_capturing {
        eprintln!("[STT] Capture already running, stopping first...");
        let _ = stop_system_audio_capture(app.clone()).await;
        tokio::time::sleep(tokio::time::Duration::from_millis(300)).await;
    }

    // Update VAD config if provided
    if let Some(config) = vad_config {
        let mut vad_cfg = state
            .vad_config
            .lock()
            .map_err(|e| format!("Failed to acquire VAD config lock: {}", e))?;
        *vad_cfg = config;
    }

    let input = SpeakerInput::new_with_device(device_id).map_err(|e| {
        error!("Failed to create speaker input: {}", e);
        format!("Failed to access system audio: {}", e)
    })?;

    let stream = input.stream();
    let sr = stream.sample_rate();

    eprintln!("[STT] Speaker input created, sample_rate={}", sr);

    if !(8000..=96000).contains(&sr) {
        error!("Invalid sample rate: {}", sr);
        return Err(format!("Invalid sample rate: {}. Expected 8000-96000 Hz", sr));
    }

    let app_clone = app.clone();
    let vad_config = state
        .vad_config
        .lock()
        .map_err(|e| format!("Failed to read VAD config: {}", e))?
        .clone();

    // Default to "dashscope" if no provider specified
    let stt_provider_id = provider_id.unwrap_or_else(|| "dashscope".to_string());
    let stt_variables = provider_variables.unwrap_or_default();

    *state
        .is_capturing
        .lock()
        .map_err(|e| format!("Failed to set capturing state: {}", e))? = true;

    let _ = app_clone.emit("capture-started", sr);

    eprintln!("[STT] Starting VAD capture: provider={}, enabled={}", stt_provider_id, vad_config.enabled);

    let state_clone = app.state::<crate::AudioState>();
    let task = tokio::spawn(async move {
        if vad_config.enabled {
            run_vad_capture(
                app_clone.clone(),
                stream,
                sr,
                vad_config,
                stt_provider_id,
                stt_variables,
            )
            .await;
        } else {
            run_continuous_capture(
                app_clone.clone(),
                stream,
                sr,
                vad_config,
                stt_provider_id,
                stt_variables,
            )
            .await;
        }

        let state = app_clone.state::<crate::AudioState>();
        if let Ok(mut guard) = state.stream_task.lock() {
            *guard = None;
        };
    });

    *state_clone
        .stream_task
        .lock()
        .map_err(|e| format!("Failed to store task: {}", e))? = Some(task);

    Ok(())
}

// --- Real-time VAD capture with streaming STT ---
async fn run_vad_capture(
    app: AppHandle,
    stream: impl StreamExt<Item = f32> + Unpin,
    sr: u32,
    config: VadConfig,
    provider_id: String,
    provider_variables: HashMap<String, String>,
) {
    let mut stream = stream;
    let mut buffer: VecDeque<f32> = VecDeque::new();

    // Pre-connect WebSocket and create resampler immediately
    eprintln!("[STT] Pre-connecting WebSocket...");
    let mut stt_session: Option<streaming_stt::SttSession> = None;
    let mut resampler: Option<AudioResampler> = None;
    let mut provider: Option<Box<dyn streaming_stt::StreamingSttProvider>> = None;

    match init_streaming_stt(&app, &provider_id, &provider_variables, sr).await {
        Ok((session, resamp, prov)) => {
            stt_session = Some(session);
            resampler = Some(resamp);
            provider = Some(prov);
            eprintln!("[STT] WebSocket pre-connected successfully");
        }
        Err(e) => {
            eprintln!("[STT] Failed to pre-connect WebSocket: {}", e);
            let _ = app.emit("ws-error", format!("连接失败: {}", e));
            return;
        }
    }

    let mut sample_count: u64 = 0;
    eprintln!("[STT] VAD capture loop started, sr={}, hop_size={}", sr, config.hop_size);

    while let Some(sample) = stream.next().await {
        buffer.push_back(sample);
        sample_count += 1;

        // Log every 5 seconds of audio
        if sample_count % (sr as u64 * 5) == 0 {
            eprintln!("[STT] Audio flowing: {} samples received", sample_count);
        }

        while buffer.len() >= config.hop_size {
            let mut mono = Vec::with_capacity(config.hop_size);
            for _ in 0..config.hop_size {
                if let Some(v) = buffer.pop_front() {
                    mono.push(v);
                }
            }

            // Apply noise gate
            let mono = apply_noise_gate(&mono, config.noise_gate_threshold);

            // Send ALL audio to DashScope (it handles segmentation)
            if let (Some(ref mut session), Some(ref mut resamp), Some(ref prov)) =
                (&mut stt_session, &mut resampler, &provider)
            {
                let pcm = resamp.process(&mono);
                if !pcm.is_empty() {
                    if let Err(e) = prov.send_audio(session, &pcm).await {
                        eprintln!("[STT] Send failed: {}, attempting reconnect...", e);
                        // Try to reconnect
                        stt_session = None;
                        match init_streaming_stt(&app, &provider_id, &provider_variables, sr).await {
                            Ok((new_session, _, _)) => {
                                stt_session = Some(new_session);
                                eprintln!("[STT] Reconnected successfully");
                            }
                            Err(re) => {
                                eprintln!("[STT] Reconnect failed: {}", re);
                                let _ = app.emit("ws-error", format!("重连失败: {}", re));
                            }
                        }
                    }
                }

                // Drain any available transcription events (non-blocking)
                if let Some(ref mut session) = stt_session {
                    drain_transcription_events(&app, session).await;
                }
            } else if stt_session.is_none() && provider.is_some() {
                // Session is None but provider exists - try to reconnect
                let pcm = if let Some(ref mut resamp) = resampler {
                    resamp.process(&mono)
                } else {
                    Vec::new()
                };
                // Attempt reconnect
                match init_streaming_stt(&app, &provider_id, &provider_variables, sr).await {
                    Ok((new_session, new_resamp, _)) => {
                        stt_session = Some(new_session);
                        resampler = Some(new_resamp);
                        eprintln!("[STT] Reconnected after session loss");
                    }
                    Err(_) => {} // Silently retry next iteration
                }
            }
        }
    }

    // Clean up when stream ends
    eprintln!("[STT] Audio stream ended, finishing STT...");
    finish_streaming_stt(&app, &mut stt_session, &mut resampler, &provider).await;
}

/// Initialize streaming STT: get provider, create resampler, connect
async fn init_streaming_stt(
    app: &AppHandle,
    provider_id: &str,
    variables: &HashMap<String, String>,
    source_sample_rate: u32,
) -> Result<(
    streaming_stt::SttSession,
    AudioResampler,
    Box<dyn streaming_stt::StreamingSttProvider>,
)> {
    let _ = app.emit("ws-connecting", ());

    let prov = streaming_stt::get_provider(provider_id)
        .ok_or_else(|| anyhow::anyhow!("Unknown STT provider: {}", provider_id))?;

    let resamp = AudioResampler::new(source_sample_rate, 16000)?;

    let session = prov.connect(variables, 16000).await?;

    let _ = app.emit("ws-connected", ());
    info!("Streaming STT initialized: provider={}", provider_id);

    Ok((session, resamp, prov))
}

/// Finish streaming STT: flush resampler, send finish, drain remaining events
async fn finish_streaming_stt(
    app: &AppHandle,
    session: &mut Option<streaming_stt::SttSession>,
    resampler: &mut Option<AudioResampler>,
    provider: &Option<Box<dyn streaming_stt::StreamingSttProvider>>,
) {
    if let (Some(ref mut sess), Some(ref mut resamp), Some(ref prov)) =
        (session.as_mut(), resampler.as_mut(), provider.as_ref())
    {
        // Flush remaining audio
        let pcm = resamp.flush();
        if !pcm.is_empty() {
            let _ = prov.send_audio(sess, &pcm).await;
        }

        // Send finish-task
        if let Err(e) = prov.finish(sess).await {
            error!("Failed to finish STT task: {}", e);
        }

        // Drain remaining transcription events with timeout
        let deadline = tokio::time::Instant::now() + Duration::from_secs(10);
        loop {
            tokio::select! {
                event = sess.result_rx.recv() => {
                    match event {
                        Some(evt) => {
                            if evt.sentence_id >= 0 {
                                let event_name = if evt.is_final {
                                    "transcription-final"
                                } else {
                                    "transcription-partial"
                                };
                                let _ = app.emit(event_name, TranscriptionPayload {
                                    text: evt.text,
                                    sentence_id: evt.sentence_id,
                                    speaker_id: evt.speaker_id,
                                    begin_time: evt.begin_time,
                                    end_time: evt.end_time,
                                });
                            }
                            if evt.is_final && evt.sentence_id >= 0 {
                                // Got final result, we're done
                                break;
                            }
                        }
                        None => break, // Channel closed
                    }
                }
                _ = tokio::time::sleep_until(deadline) => {
                    warn!("Timeout waiting for final transcription");
                    let _ = app.emit("ws-error", "等待转录结果超时");
                    break;
                }
            }
        }
    }

    let _ = app.emit("speech-segment-complete", ());
    *session = None;
    *resampler = None;
}

/// Non-blocking drain of transcription events from session
async fn drain_transcription_events(app: &AppHandle, session: &mut streaming_stt::SttSession) {
    while let Ok(event) = session.result_rx.try_recv() {
        if event.sentence_id >= 0 {
            let event_name = if event.is_final {
                "transcription-final"
            } else {
                "transcription-partial"
            };
            let _ = app.emit(
                event_name,
                TranscriptionPayload {
                    text: event.text,
                    sentence_id: event.sentence_id,
                    speaker_id: event.speaker_id,
                    begin_time: event.begin_time,
                    end_time: event.end_time,
                },
            );
        }
    }
}

// --- Continuous capture with streaming STT ---
async fn run_continuous_capture(
    app: AppHandle,
    stream: impl StreamExt<Item = f32> + Unpin,
    sr: u32,
    config: VadConfig,
    provider_id: String,
    provider_variables: HashMap<String, String>,
) {
    let mut stream = stream;
    let max_samples = (sr as u64 * config.max_recording_duration_secs) as usize;
    let start_time = std::time::Instant::now();
    let max_duration = Duration::from_secs(config.max_recording_duration_secs);

    let stop_flag = Arc::new(AtomicBool::new(false));
    let stop_flag_for_listener = stop_flag.clone();

    let stop_listener = app.listen("manual-stop-continuous", move |_| {
        stop_flag_for_listener.store(true, Ordering::Release);
    });

    let _ = app.emit("continuous-recording-start", config.max_recording_duration_secs);

    // Initialize streaming STT immediately
    let mut stt_session: Option<streaming_stt::SttSession> = None;
    let mut resampler: Option<AudioResampler> = None;
    let mut provider: Option<Box<dyn streaming_stt::StreamingSttProvider>> = None;

    match init_streaming_stt(&app, &provider_id, &provider_variables, sr).await {
        Ok((session, resamp, prov)) => {
            stt_session = Some(session);
            resampler = Some(resamp);
            provider = Some(prov);
        }
        Err(e) => {
            error!("Failed to init streaming STT for continuous mode: {}", e);
            let _ = app.emit("ws-error", e.to_string());
        }
    }

    let mut sample_count = 0usize;

    loop {
        if stop_flag.load(Ordering::Acquire) {
            break;
        }

        tokio::select! {
            sample_opt = stream.next() => {
                match sample_opt {
                    Some(sample) => {
                        if stop_flag.load(Ordering::Acquire) {
                            break;
                        }

                        // Send to resampler + STT
                        if let (Some(ref mut session), Some(ref mut resamp), Some(ref prov)) =
                            (&mut stt_session, &mut resampler, &provider)
                        {
                            let pcm = resamp.process(&[sample]);
                            if !pcm.is_empty() {
                                let _ = prov.send_audio(session, &pcm).await;
                            }
                            drain_transcription_events(&app, session).await;
                        }

                        sample_count += 1;

                        // Emit progress every second
                        if sample_count % (sr as usize) == 0 {
                            let elapsed = start_time.elapsed();
                            let _ = app.emit("recording-progress", elapsed.as_secs());
                        }

                        if sample_count >= max_samples || start_time.elapsed() >= max_duration {
                            break;
                        }
                    }
                    None => {
                        warn!("Audio stream ended unexpectedly");
                        break;
                    }
                }
            }
            _ = tokio::time::sleep(tokio::time::Duration::from_millis(10)) => {}
        }
    }

    app.unlisten(stop_listener);

    // Finish streaming STT
    if stt_session.is_some() {
        finish_streaming_stt(&app, &mut stt_session, &mut resampler, &provider).await;
    }

    let _ = app.emit("continuous-recording-stopped", ());
}

// --- Audio processing utilities ---

fn apply_noise_gate(samples: &[f32], threshold: f32) -> Vec<f32> {
    const KNEE_RATIO: f32 = 3.0;
    samples
        .iter()
        .map(|&s| {
            let abs = s.abs();
            if abs < threshold {
                s * (abs / threshold).powf(1.0 / KNEE_RATIO)
            } else {
                s
            }
        })
        .collect()
}

fn calculate_audio_metrics(chunk: &[f32]) -> (f32, f32) {
    let mut sumsq = 0.0f32;
    let mut peak = 0.0f32;
    for &v in chunk {
        let a = v.abs();
        peak = peak.max(a);
        sumsq += v * v;
    }
    let rms = (sumsq / chunk.len() as f32).sqrt();
    (rms, peak)
}

// --- Tauri commands for STT config management ---

#[tauri::command]
pub async fn get_streaming_stt_providers() -> Result<Vec<streaming_stt::StreamingSttProviderInfo>, String> {
    Ok(streaming_stt::get_all_providers())
}

#[tauri::command]
pub async fn set_stt_provider_config(
    app: AppHandle,
    provider_id: String,
    variables: HashMap<String, String>,
) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Failed to create app data directory: {}", e))?;

    let file_path = app_data_dir.join(format!("stt_config_{}.json", provider_id));
    let value = serde_json::to_string(&variables)
        .map_err(|e| format!("Failed to serialize config: {}", e))?;
    std::fs::write(&file_path, value)
        .map_err(|e| format!("Failed to write STT config: {}", e))?;
    Ok(())
}

#[tauri::command]
pub async fn get_stt_provider_config(
    app: AppHandle,
    provider_id: String,
) -> Result<HashMap<String, String>, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;
    let file_path = app_data_dir.join(format!("stt_config_{}.json", provider_id));

    if !file_path.exists() {
        return Ok(HashMap::new());
    }

    let content = std::fs::read_to_string(&file_path)
        .map_err(|e| format!("Failed to read STT config: {}", e))?;
    let variables: HashMap<String, String> = serde_json::from_str(&content)
        .map_err(|e| format!("Failed to parse STT config: {}", e))?;
    Ok(variables)
}

// --- Existing commands (unchanged) ---

#[tauri::command]
pub async fn stop_system_audio_capture(app: AppHandle) -> Result<(), String> {
    let state = app.state::<crate::AudioState>();

    // Abort existing task and clear the handle
    {
        let mut guard = state
            .stream_task
            .lock()
            .map_err(|e| format!("Failed to acquire task lock: {}", e))?;
        if let Some(task) = guard.take() {
            task.abort();
        }
        // Explicitly ensure it's None (guard.take() already does this, but be safe)
        *guard = None;
    }

    // Wait for task to fully terminate
    tokio::time::sleep(tokio::time::Duration::from_millis(500)).await;

    // Clear capturing flag
    *state
        .is_capturing
        .lock()
        .map_err(|e| format!("Failed to update capturing state: {}", e))? = false;

    tokio::time::sleep(tokio::time::Duration::from_millis(200)).await;

    let _ = app.emit("capture-stopped", ());
    Ok(())
}

#[tauri::command]
pub async fn manual_stop_continuous(app: AppHandle) -> Result<(), String> {
    let _ = app.emit("manual-stop-continuous", ());
    tokio::time::sleep(tokio::time::Duration::from_millis(20)).await;
    Ok(())
}

#[tauri::command]
pub fn check_system_audio_access(_app: AppHandle) -> Result<bool, String> {
    match SpeakerInput::new() {
        Ok(_) => Ok(true),
        Err(e) => {
            error!("System audio access check failed: {}", e);
            Ok(false)
        }
    }
}

#[tauri::command]
pub async fn request_system_audio_access(app: AppHandle) -> Result<(), String> {
    #[cfg(target_os = "macos")]
    {
        app.shell()
            .command("open")
            .args(["x-apple.systempreferences:com.apple.preference.security?Privacy_AudioCapture"])
            .spawn()
            .map_err(|e| {
                error!("Failed to open system preferences: {}", e);
                e.to_string()
            })?;
    }
    #[cfg(target_os = "windows")]
    {
        app.shell()
            .command("ms-settings:sound")
            .spawn()
            .map_err(|e| {
                error!("Failed to open sound settings: {}", e);
                e.to_string()
            })?;
    }
    #[cfg(target_os = "linux")]
    {
        let commands = ["pavucontrol", "gnome-control-center sound"];
        for cmd in &commands {
            if app.shell().command(cmd).spawn().is_ok() {
                break;
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn get_vad_config(app: AppHandle) -> Result<VadConfig, String> {
    let state = app.state::<crate::AudioState>();
    let config = state
        .vad_config
        .lock()
        .map_err(|e| format!("Failed to get VAD config: {}", e))?
        .clone();
    Ok(config)
}

#[tauri::command]
pub async fn update_vad_config(app: AppHandle, config: VadConfig) -> Result<(), String> {
    if config.sensitivity_rms < 0.0 || config.sensitivity_rms > 1.0 {
        return Err("Invalid sensitivity_rms: must be 0.0-1.0".to_string());
    }
    if config.max_recording_duration_secs > 3600 {
        return Err("Invalid max_recording_duration_secs: must be <= 3600".to_string());
    }
    let state = app.state::<crate::AudioState>();
    *state
        .vad_config
        .lock()
        .map_err(|e| format!("Failed to update VAD config: {}", e))? = config;
    Ok(())
}

#[tauri::command]
pub async fn get_capture_status(app: AppHandle) -> Result<bool, String> {
    let state = app.state::<crate::AudioState>();
    let is_capturing = *state
        .is_capturing
        .lock()
        .map_err(|e| format!("Failed to get capture status: {}", e))?;
    Ok(is_capturing)
}

#[tauri::command]
pub fn get_audio_sample_rate(_app: AppHandle) -> Result<u32, String> {
    let input = SpeakerInput::new().map_err(|e| {
        error!("Failed to create speaker input: {}", e);
        format!("Failed to access system audio: {}", e)
    })?;
    let stream = input.stream();
    Ok(stream.sample_rate())
}

#[tauri::command]
pub fn get_input_devices() -> Result<Vec<AudioDevice>, String> {
    crate::speaker::list_input_devices().map_err(|e| {
        error!("Failed to get input devices: {}", e);
        format!("Failed to get input devices: {}", e)
    })
}

#[tauri::command]
pub fn get_output_devices() -> Result<Vec<AudioDevice>, String> {
    crate::speaker::list_output_devices().map_err(|e| {
        error!("Failed to get output devices: {}", e);
        format!("Failed to get output devices: {}", e)
    })
}
