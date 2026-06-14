// Audio resampler: converts f32 samples from system sample rate to 16kHz i16 PCM
// Uses simple but effective anti-aliasing filter + decimation for integer ratios,
// or linear interpolation for non-integer ratios.

pub struct AudioResampler {
    source_rate: u32,
    target_rate: u32,
    ratio: f64,
    // For integer ratio decimation
    is_integer_ratio: bool,
    decimation_factor: usize,
    filter_buffer: Vec<f32>,
    // For fractional ratio interpolation
    fractional_pos: f64,
    prev_sample: f32,
}

impl AudioResampler {
    pub fn new(source_rate: u32, target_rate: u32) -> anyhow::Result<Self> {
        let ratio = source_rate as f64 / target_rate as f64;
        let is_integer = (ratio - ratio.round()).abs() < 0.01;
        let decimation_factor = if is_integer { ratio.round() as usize } else { 0 };

        Ok(Self {
            source_rate,
            target_rate,
            ratio,
            is_integer_ratio: is_integer,
            decimation_factor,
            filter_buffer: Vec::with_capacity(decimation_factor.max(1)),
            fractional_pos: 0.0,
            prev_sample: 0.0,
        })
    }

    /// Process incoming f32 samples and return resampled i16 PCM bytes (little-endian).
    pub fn process(&mut self, samples: &[f32]) -> Vec<u8> {
        if self.is_integer_ratio {
            self.process_decimation(samples)
        } else {
            self.process_interpolation(samples)
        }
    }

    /// Simple anti-aliasing filter (moving average) + decimation for integer ratios.
    /// For 48kHz→16kHz (factor=3): average every 3 samples, keep 1.
    fn process_decimation(&mut self, samples: &[f32]) -> Vec<u8> {
        let mut result = Vec::new();
        let factor = self.decimation_factor;

        for &sample in samples {
            self.filter_buffer.push(sample);

            if self.filter_buffer.len() >= factor {
                // Anti-aliasing: average the samples (simple low-pass filter)
                let avg: f32 = self.filter_buffer.iter().sum::<f32>() / factor as f32;
                self.filter_buffer.clear();

                // Convert to i16 PCM
                let clamped = avg.clamp(-1.0, 1.0);
                let i16_val = (clamped * i16::MAX as f32) as i16;
                result.extend_from_slice(&i16_val.to_le_bytes());
            }
        }

        result
    }

    /// Linear interpolation for non-integer ratios.
    fn process_interpolation(&mut self, samples: &[f32]) -> Vec<u8> {
        let mut result = Vec::new();

        for &sample in samples {
            // Generate output samples as we pass through input
            while self.fractional_pos < 1.0 {
                // Linear interpolation between prev and current
                let interpolated = self.prev_sample * (1.0 - self.fractional_pos as f32)
                    + sample * self.fractional_pos as f32;

                let clamped = interpolated.clamp(-1.0, 1.0);
                let i16_val = (clamped * i16::MAX as f32) as i16;
                result.extend_from_slice(&i16_val.to_le_bytes());

                self.fractional_pos += self.ratio;
            }

            self.fractional_pos -= 1.0;
            self.prev_sample = sample;
        }

        result
    }

    /// Flush remaining samples.
    pub fn flush(&mut self) -> Vec<u8> {
        if self.is_integer_ratio && !self.filter_buffer.is_empty() {
            // Pad with zeros and process remaining
            while self.filter_buffer.len() < self.decimation_factor {
                self.filter_buffer.push(0.0);
            }
            let avg: f32 = self.filter_buffer.iter().sum::<f32>() / self.decimation_factor as f32;
            self.filter_buffer.clear();

            let clamped = avg.clamp(-1.0, 1.0);
            let i16_val = (clamped * i16::MAX as f32) as i16;
            let mut result = Vec::new();
            result.extend_from_slice(&i16_val.to_le_bytes());
            return result;
        }
        Vec::new()
    }
}
