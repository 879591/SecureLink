# AegisRemote — Secure Android Remote Management System

AegisRemote is a production-grade, zero-trust Android remote management and WebRTC screen-sharing platform engineered with transparent device pairing, explicit system consent, authenticated sessions, end-to-end encrypted communication, and revocable access.

---

## System Architecture

The AegisRemote system consists of three coordinated tiers:

```
┌──────────────────────────────────────┐          ┌──────────────────────────────────────┐
│       Android Managed Device         │          │     Operator Console (Web/Android)   │
│  - Android 14 MediaProjection API    │          │  - Jetpack Compose / React 19        │
│  - Hardware Keystore (EC P-256)      │          │  - Interactive Screen Stream View    │
│  - AccessibilityService (Gestures)   │◄────────►│  - Remote Gestures (Tap/Swipe)       │
│  - Persistent Notification & Badge   │  WebRTC  │  - P2P DataChannel File Transfer     │
│  - OkHttp WSS Signaling Client       │ DTLS/SRTP│  - Emergency Disconnect All Control  │
└──────────────────┬───────────────────┘          └──────────────────┬───────────────────┘
                   │                                                 │
                   │           Encrypted WebSocket Signaling         │
                   │               (/ws/signaling)                   │
                   ▼                                                 ▼
        ┌─────────────────────────────────────────────────────────────────────┐
        │                 AegisRemote Signaling & Management Server           │
        │  - Express & Node.js HTTP REST API (/api/devices, /api/pairing)     │
        │  - 6-Digit Cryptographic Code Generator (5-min TTL & Nonce Guard)   │
        │  - Rate Limiting against Brute Force & Session Revocation API       │
        │  - Immutable Security Event Audit Logger                            │
        │  - STUN / TURN Relay Configuration                                  │
        └─────────────────────────────────────────────────────────────────────┘
```

---

## Key Features

1. **Zero-Trust Device Pairing**:
   - Ephemeral 6-digit cryptographic pairing codes with 5-minute TTL.
   - Nonce-based replay attack mitigation.
   - Target phone must explicitly confirm incoming pairing requests.
   - Device hardware identity attested via AndroidKeyStore (EC P-256 with ECDSA).

2. **Real Screen Sharing (Android MediaProjection API)**:
   - Real-time video encoding via hardware-accelerated WebRTC.
   - Strict Android system consent prompt dialog required on every session start.
   - Visible, persistent Android 14 foreground notification with instant "Pause" and "Stop" actions.
   - Zero private screen storage on signaling servers.

3. **Remote Interaction**:
   - Authorized Android `AccessibilityService` utilizing `dispatchGesture()` for taps and swipes.
   - Global actions: Back, Home, Recents, Notifications.
   - Safety boundary: Android prevents accessibility services from accessing secure password fields.
   - Requires explicit manual user activation in Android Settings.

4. **Secure File Transfer**:
   - Storage Access Framework (SAF) integration with user file picker.
   - WebRTC DataChannel chunked transfer (64KB chunks).
   - Strict 100MB per-file size enforcement.
   - SHA-256 cryptographic checksum verified by recipient before writing to disk.

5. **Security Center & Emergency Controls**:
   - One-click "Disconnect All" emergency kill-switch.
   - Instant cryptographic device revocation.
   - Rate-limiting (5 attempts / 15 minutes) on authentication and pairing endpoints.
   - Real-time security audit log feed.

---

## Project Structure

```
├── android/                         # Complete Android Kotlin & Compose Source
│   ├── app/
│   │   ├── build.gradle.kts         # App dependencies (WebRTC, Compose, OkHttp)
│   │   ├── src/main/
│   │   │   ├── AndroidManifest.xml  # Android 14 MediaProjection & Permissions
│   │   │   ├── res/                 # Layouts, XML configs, strings, themes
│   │   │   └── java/com/aegisremote/android/
│   │   │       ├── AegisApplication.kt
│   │   │       ├── data/Models.kt
│   │   │       ├── security/KeystoreManager.kt
│   │   │       ├── network/SignalingClient.kt
│   │   │       ├── webrtc/WebRtcClient.kt
│   │   │       ├── service/ScreenCaptureService.kt
│   │   │       ├── service/RemoteAccessibilityService.kt
│   │   │       ├── filetransfer/FileTransferManager.kt
│   │   │       └── ui/
│   │   │           ├── MainActivity.kt
│   │   │           └── screens/Screens.kt (All 14 Jetpack Compose Screens)
│   │   └── src/test/java/com/aegisremote/android/  # Android Unit Tests
│   ├── gradle/libs.versions.toml    # Version Catalog
│   ├── build.gradle.kts
│   └── settings.gradle.kts
├── server.ts                        # Full-Stack Express + WebSocket Signaling Server
├── src/                             # Web Management Console (React 19 + Tailwind)
│   ├── App.tsx                      # 14-Screen Web Operator Cockpit & Stream Viewer
│   └── main.tsx
├── tests/                           # Backend Security & Signaling Automated Tests
│   └── backend.test.ts
├── docs/                            # In-depth architectural & deployment guides
│   ├── SECURITY_REVIEW_CHECKLIST.md
│   ├── MANUAL_PHYSICAL_DEVICE_TEST_CHECKLIST.md
│   ├── BACKEND_DEPLOYMENT_GUIDE.md
│   ├── BUILD_AND_RELEASE_INSTRUCTIONS.md
│   └── ARCHITECTURE_AND_LIMITATIONS.md
├── package.json
└── tsconfig.json
```

---

## Verification & Automated Test Status

- **Backend Automated Tests**: Executed with `npm test` — **6 of 6 tests PASS**.
- **Web Compilation & TypeScript Linting**: `npm run lint` & Vite build — **PASS with 0 errors**.
- **Android Source Code**: Written to standard Android SDK 34 / Jetpack Compose specifications. (Debug APK generation on this specific cloud container was not possible due to lack of a pre-installed Java/Android SDK toolchain in the Linux sandbox; see [BUILD_AND_RELEASE_INSTRUCTIONS.md](docs/BUILD_AND_RELEASE_INSTRUCTIONS.md) to build the APK locally via Android Studio or `./gradlew assembleDebug`).
