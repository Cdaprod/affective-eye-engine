# Affective Eye Engine

Standalone procedural eyes with local face detection, anonymous multi-target attention and device orientation. No camera preview, frame upload or storage. This is a V001 starter, not a trained emotion classifier.

![Neutral](artifacts/previews/neutral.svg)
![Curious](artifacts/previews/curious.svg)

## Run

Requires Node 22. Run `npm install`, `npm test`, `npm run render`, then `npm run dev`. Open the URL printed by Vite. Camera access requires localhost or HTTPS; for iPhone use GitHub Pages or an HTTPS development endpoint. Click Enable camera and then Enable orientation to grant permissions. Stop sensors releases the camera. The simulation works without camera access.

## Publish

Create an empty GitHub repository named `affective-eye-engine`, then run:

```sh
git init -b main
git add .
git commit -m "feat: initialize affective eye engine"
git remote add origin https://github.com/Cdaprod/affective-eye-engine.git
git push -u origin main
```

In repository Settings > Pages select GitHub Actions as the source. The included workflow tests, generates SVG previews, builds the site and deploys it. Run `npm install` and commit the generated package-lock.json for reproducibility; switch CI and Docker to npm ci afterward.

## Architecture

- `src/core.ts`: pure geometry, continuous parameters, smoothing, centroid tracking and attention scheduling.
- `src/main.ts`: browser sensor adapters, MediaPipe face detection, inspector and rendering loop.
- `scripts/render.ts`: deterministic SVG previews and parameter manifest.
- `gallery.html`: live expression gallery.
- `tests/`: core regression tests.

The detector uses a pretrained BlazeFace model. It downloads model and WASM assets from Google and jsDelivr; inference is local. Offline camera use requires vendoring those assets. No facial identity recognition is performed. The tracker uses temporary IDs and may swap IDs when faces cross. Orientation is a simple tilt offset, not calibrated 3D sensor fusion. Expression presets are manual; optional context-driven affect inference is future work. SVG is the canonical renderer; PNG/GIF/video generation and advanced sensor fusion are future milestones.

## Docker

`docker compose up --build` serves the inspector on port 8080. Remote camera access requires an HTTPS reverse proxy.

## Validation

Core tests and SVG generation were executed using Node's TypeScript stripping. Dependency installation was blocked by network DNS in the packaging environment, so the Vite build and live camera/orientation integration have not been verified. No lockfile is included. Validate on target browsers before release.
