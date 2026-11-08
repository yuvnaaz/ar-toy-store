# AR Toy Store

A small portfolio project using HTML, CSS, and plain JavaScript. Explore three original low-poly glTF toys in an interactive 3D viewer, scan a Hiro marker for augmented reality, and try a demo shopping flow.

## Run locally

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Open http://localhost:8000. There is no install or build step for local development. Internet access is needed for the 3D viewer, AR libraries, and optional Firebase SDK.

## Features

- Three original glTF assets: hydraulic crane, train, and robot. Drag to rotate and scroll/pinch to zoom.
- The same model is used in the marker-based AR preview.
- Explicit camera start/stop, loading feedback, permission errors, unavailable-camera messages, and marker found/lost guidance.
- Cart quantities, removal, integer-cent totals, empty-cart protection, and demo checkout.
- Per-toy ratings and feedback; local saves survive reloads.
- Optional Google sign-in and private Firebase orders/ratings. Guest and signed-in browser caches are separate. The cart remains device-local.
- No real payments, inventory reservations, delivery, or production order fulfilment.

## New Firebase project setup

Cloud mode is disabled until you configure your own project. The old project's configuration is no longer used.

1. In https://console.firebase.google.com create a project and register a Web app. Analytics is optional and unused here.
2. Copy the public Web app configuration into `firebase-config.js`, replacing `null` with the configuration object. Never put an Admin SDK or service-account key in frontend files.
3. Enable Authentication → Sign-in method → Google and choose a support email.
4. Add `localhost` and the deployed hostname to Authentication → Settings → Authorized domains.
5. Create a Firestore database. Deploy the contents of `firestore.rules` in its Rules tab **before using cloud saves**. Alternatively use the Firebase CLI: `firebase deploy --only firestore:rules --project YOUR_PROJECT_ID`.
6. Reload, sign in, place a demo order, and submit a rating. Sign in with the same account on a second device: the last order and ratings should load there.

Data paths are `users/{uid}/orders/{orderId}` and `users/{uid}/ratings/{toyId}`. Rules restrict reads and writes to the authenticated owner and validate record fields. Orders are immutable apart from identical retry writes. These are demonstration orders: prices are still client-calculated and must not be trusted for real transactions. A real checkout needs server-authoritative prices and stock validation.

When cloud access fails, the UI reports local-only storage. Failed order uploads have a retry button; failed ratings can be resubmitted. Cloud data takes precedence when signing in. Guest data is not automatically uploaded. Local caches remain on the device after sign-out, so use a trusted device or clear browser data afterward.

## Phone and AR verification

Phone cameras require the hosted **HTTPS** URL; a desktop's `localhost` URL cannot be opened from a phone. Use Safari or Chrome directly if an embedded browser blocks the camera.

1. Open the HTTPS site on a phone.
2. Display the linked Hiro marker on a second screen or print it, keeping its black border intact.
3. Choose a toy, tap Start camera preview, and allow camera access.
4. Keep the entire marker visible in good light. Confirm the selected toy appears and stays attached as the camera moves.
5. Cover/uncover the marker and check the lost/found messages.
6. Stop the preview and verify the camera indicator goes out.
7. Repeat with camera permission denied and verify the recovery message.

Physical phone tracking and camera permission behaviour must be tested on real hardware. A desktop 3D render is not proof of marker tracking.

## Checks

```sh
node tests/store.test.js
node tests/ar.test.js
python3 scripts/create-models.py
```

The dependency-free store tests cover mixed-item totals, removal, reload persistence, checkout, ratings, malformed local data, quantity limits, and guest/account cache isolation. Firebase integration and Firestore rules still require testing against your configured project or Firebase emulators.

## Deployment

`python3 scripts/package-site.py` creates `portfolio-site/dist` using an explicit public-file allowlist. Serve this folder on a static HTTPS host to enable phone camera access. An optional local Sites manifest is copied only when present.

For Firebase Hosting instead: copy `portfolio-site/dist` to root `dist`, then run `firebase deploy --only hosting --project YOUR_PROJECT_ID` after Firebase CLI setup. `firebase.json` is provided. Deploy Firestore rules separately as above.

## Short demo recording plan (about 45 seconds)

1. Rotate the crane, switch to the robot, then show its 3D view.
2. Add two toys; open the order summary, remove one, and place a demo order.
3. Submit a rating and reload to demonstrate persistence.
4. On a phone, scan the marker and show the model tracking it.
5. After Firebase is configured, show the same account's rating/order on another device.

## Code map and asset credits

- `index.html`, `style.css`: simple responsive interface.
- `addMarkers.js`: catalogue, toy selection, preview controls.
- `markerHandler.js`: cart, validated local storage, ratings and summary helpers.
- `addButtons.js`: button creation, checkout and rating handlers.
- `preview.js`: model status and frame message handling.
- `ar.html`, `ar-preview.js`: optional A-Frame/AR.js camera scene and lifecycle.
- `firebase-config.js`, `cloud.js`, `firestore.rules`: optional cloud integration.
- `scripts/create-models.py`, `assets/*.gltf`: original procedural models; no third-party model attribution required.
- `stars.js`: original unused rating plugin retained for reference; not loaded or deployed.

Third-party libraries: Google model-viewer (Apache-2.0), A-Frame (MIT), AR.js (MIT), Firebase JavaScript SDK (Apache-2.0). Hiro marker comes from AR.js. Libraries are loaded from pinned CDN versions.

Reference documentation: https://modelviewer.dev/docs/ · https://ar-js-org.github.io/AR.js-Docs/ui-events/ · https://firebase.google.com/docs/auth/web/google-signin · https://firebase.google.com/docs/firestore/security/rules-conditions
