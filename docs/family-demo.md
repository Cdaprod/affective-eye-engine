# Family group interaction demo

1. Open the GitHub Pages latest/main deployment via HTTPS in a mobile browser, in landscape with the front camera facing the group.
2. Tap the eyes to open controls. Enable camera; wait for a vision status with worker-landmarks, landmarks, or detector. Grant permission.
3. Enable microphone. Neural VAD initialization may take time; the status indicates energy fallback when necessary.
4. Optionally enable hand gestures on faster phones. Keep Ultra rendering off on thermally constrained phones.
5. Two or more people enter the camera field of view; the character should acknowledge newcomers and maintain stable gaze.
6. Participants take turns speaking. Visual mouth movement and local speech detection should influence the gaze selection with hysteresis.
7. Wave an open palm; a short acknowledgment should occur. Speak continuously; the listening tilt should retain bounded, alternating motion rather than roll indefinitely.
8. Silence the group and move out of view. Character should gracefully return to resting.

Do not interpret the character's responses as identification of speakers, emotions, or intentions. No audio or video is uploaded by the engine; the model asset downloads are network requests. Use the inspector to check model mode, face count, speech confidence, gesture recognition and approximate FPS.
