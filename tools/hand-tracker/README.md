# Independent hand tracking experiment

Build: `npm ci && npm run build` in this directory. Output: `miniprogram/ar-hand/runtime.js`.

Adapted handpose TypeScript and WeChat platform shim from https://github.com/deepkolos/wxmp-tensorflow (package declares MIT); original model/adapter source carries Google Apache-2.0 headers, retained in vendor files. TensorFlow.js dependencies carry their upstream licenses. Not an official WeChat plugin; no VKSession dependency.

Model URL substitutions use the reference author's public CDN for this development validation only. Verified model manifests and all four weight shards downloaded on 2026-11-03. Total weights ~12.5 MB; must move to controlled versioned HTTPS storage with request domain configured before production. No camera images sent to that CDN; GET requests download model files only.

Main package redirects legacy AR entry to ar-hand subpackage. Native camera RGBA frames are copied before async inference. The displayed canvas uses the exact inference frame and coordinate fit; absent hands hide overlay. Wrist scale/tilt remains an estimate, no depth occlusion or physical fit guarantee. HarmonyOS tracking performance is NOT validated by build or Node tests.

Reference commit: `4c7e612bf38401f0753500d5b35dd49ff1a074b8`. Modified the async model wrapper to dispose input tensors on inference errors.

## Device-tools integration regression

Use the developer-tools automation endpoint (default ws://127.0.0.1:9421), select a bracelet first, then `npm run check:devtools`. Override with `WECHAT_AUTOMATOR_URL` if necessary. The test feeds an upstream test image into the *real* loaded TFJS model; it checks positive detection, stable tensor count, empty frame rejection and page re-entry. This is not a substitute for a HarmonyOS camera test.

`fixtures/hands.json` is an RGB-resized copy of TensorFlow's Apache-2.0 test image at https://github.com/tensorflow/tfjs-models/blob/master/hand-pose-detection/test_data/hands.jpg . Do not package test fixtures in the mini program.

2026-11-03 developer-tools validation: hand confidence ~0.93–0.96; repeated processing held at 300 tensors; blank frame hid overlay; re-entry restarted model and camera. Warm empty camera inference ~29–39 ms on the Mac simulator, NOT a mobile performance claim. Native preview build succeeded (main ~907 KB, AR subpackage ~936 KB).

Build tfjs-hand-02: HarmonyOS user confirmed hand recognition, then reported generic 3D failure. Root rendering exception was previously discarded. AR now keeps the overlay mounted (opacity toggles), supplies explicit canvas viewport dimensions, and stops the frame loop after a render failure. Component unavailable events preserve initialization/render phase, message and stack for the next device diagnosis. Do not mark HarmonyOS rendering fixed until device retest.

Build tfjs-hand-03: center-cover camera display and matching coordinate mapping; preview scale defaults to 135% (user adjustment 70–220%, not physical calibration); fixed tilt reduced to 45 degrees; short-angle smoothing; 250 ms lost-track grace; freeze/resume and size controls. Out-of-frame wrists prompt repositioning rather than claiming a visible fit. Devtools replay validated freeze held the frame, scale increased and resume released freeze. Optical autofocus on SGU-AL10 remains unverified; no autofocus API change is claimed.
