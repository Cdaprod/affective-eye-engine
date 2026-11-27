# Social perception and expressive animation

The latest implementation is the default branch (\`main\`); package SemVer and Git tags identify intentional releases.

## Perception
- **Vision:** Web Worker first, attempting MediaPipe Face Landmarker (four faces, blendshapes and landmarks) at a 100 ms cadence. Worker initialization failure falls back to the main-thread Face Landmarker; if that fails, existing BlazeFace detector and lower-face image change remain.
- **Audio:** Existing stereo/mono acoustic energy estimator runs locally. Silero VAD uses \`@ricky0123/vad-web\` with the *same* microphone stream; energy fallback remains operational if VAD cannot initialize. The VAD uses an AudioWorklet when the browser supports it.
- **Hands:** MediaPipe Gesture Recognizer is **opt-in** and throttled. Waves and thumbs up provide deterministic animation events.
- **Timestamping:** Worker messages carry capture timestamps; stale observations are discarded. Rendering remains scheduled on \`requestAnimationFrame\` and consumes the latest completed inference result. Main-thread fallback may still block frames on low-power devices.

## Behavior
- An anonymous target tracker provides transient IDs. Jaw-motion change, voice activity, and optional coarse stereo balance drive hysteresis-based conversational attention.
- A persistent PAD-inspired personality model produces valence, arousal, dominance, and curiosity. This is an animation controller, **not** an inference of people's emotions.
- A semantic event interface accepts \`affective-intent\` CustomEvents; **no remote LLM is connected**.

## Animation
- Priority arbitration keeps listening gestures from colliding with other emotes.
- Focus shifts may trigger anticipatory blinks; greeting and hand gestures add secondary movement.
- The original WebGL SDF renderer and deterministic SVG fallback remain the only display backends.

## Privacy and limitations
- The application does not render camera frames as a preview, record speech, or persist biometric identities. All perception is ephemeral in local browser memory.
- MediaPipe and Silero model assets currently download from external CDNs. Initial model loading therefore requires network access.
- Per-face speech attribution is **heuristic**, not TalkNet-style neural active-speaker detection.
- Microphone energy balance is not calibrated sound direction; on iPhones the microphone stream may be mono.
- Hand and facial models may require disabling on older phones or under thermal throttling.

## Validation
- \`npm test\` validates geometry, behavioral gates, landmark extraction, voice association and animation invariants.
- \`npm run lab\` generates \`artifacts/lab-report.json\` from synthetic, deterministic scenarios; no real latency, FPS, or user-study claims.
- \`npm run render:cinematic\` captures actual Chromium WebGL and SVG browser screenshots in CI.
- Device acceptance still requires simultaneous front camera + mic + WebGL on a physical iPhone and Raspberry Pi.
