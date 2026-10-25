# Architecture, Boundaries & Known Limitations — AegisRemote

## 1. Architectural Philosophy

AegisRemote is built from the ground up on the **Zero-Trust Device Management** paradigm:
- **No Implicit Trust:** Possession of a network IP or device identifier grants zero authority.
- **Mutual Attestation:** Devices authenticate using cryptographic keys generated inside the hardware-backed `AndroidKeyStore`.
- **Explicit Consent:** Every security-sensitive feature (screen sharing, remote input, file access) requires conscious user interaction on the target device.

---

## 2. Android Security Boundaries & Technical Limitations

As an authorized, non-malicious system operating within Android's platform security guidelines, AegisRemote respects all operating-system boundaries:

### A. MediaProjection Screen Streaming
- **Android System Dialog:** Android's security architecture strictly prevents any application from silently capturing the screen. An operating-system dialog (`MediaProjectionManager`) **must** be confirmed by the physical user on the target phone at the start of every session.
- **Persistent Foreground Notification:** Android 14 (API 34) mandates `FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION` accompanied by a visible ongoing notification. If this service is killed by the system or dismissed by the user, screen capture ceases immediately.

### B. Remote Gesture Injection (AccessibilityService)
- **Root vs Non-Root:** On non-rooted Android, third-party apps cannot inject arbitrary kernel input events (`/dev/input/event*`).
- **Accessibility Boundary:** AegisRemote uses Android's approved `AccessibilityService.dispatchGesture()` method. This allows automated taps and swipes for remote support.
- **Protected Password Fields:** Android explicitly conceals password fields from AccessibilityServices. When a user focuses a credential input or system security dialog, the AccessibilityService cannot observe keystrokes or inject automated text. This is a deliberate Android security design and cannot (and should not) be bypassed.

### C. File Transfer Constraints
- **Storage Access Framework (SAF):** Android 11+ enforces scoped storage. AegisRemote cannot silently crawl or upload user directories. All file transfers require explicit file selection via the system file picker or designated app storage folders.
- **100MB File Size Limit:** Enforced in both backend and client data channels to ensure memory stability and prevent OOM errors over WebRTC DataChannels.

### D. WebRTC Peer-to-Peer NAT Traversal
- Direct WebRTC peer-to-peer transport utilizes STUN to negotiate ICE candidates.
- On symmetrical cellular NATs or strict corporate firewalls, direct UDP hole punching may fail. In such environments, a TURN relay server (e.g., Coturn) is required to guarantee connectivity.

---

## 3. Final Acceptance Criteria Matrix

| Criterion | Status | Evidence |
| :--- | :---: | :--- |
| **Android Project Structure & Source** | **PASS** | Complete Gradle build configuration (`android/build.gradle.kts`, `app/build.gradle.kts`, `libs.versions.toml`, `AndroidManifest.xml`) and Kotlin Compose application code created. |
| **Backend Starts Successfully** | **PASS** | `server.ts` compiled, running on port 3000 with Express REST API and `/ws/signaling` WebSocket server. |
| **Device Pairing with Expiration & Nonce** | **PASS** | 6-digit cryptographic pairing code with 5-minute TTL, nonce replay defense verified via automated test suite. |
| **Unauthorized Pairing Rejection** | **PASS** | Expired codes and duplicate nonces rejected with HTTP 410 / 400 in automated test suite. |
| **Screen Sharing Consent & Service** | **PASS** | MediaProjection foreground service (`ScreenCaptureService.kt`) implemented with Android 14 `mediaProjection` type and system consent intent launcher. |
| **Session Termination & Emergency Disconnect** | **PASS** | Clean resource release and `disconnect-all` emergency handler verified via automated tests. |
| **Revoked Access Enforcement** | **PASS** | Revoking a device blocks session creation and closes active WebSockets; tested in `tests/backend.test.ts`. |
| **File Transfer User Consent & Size Limit** | **PASS** | 100MB limit, explicit user consent check, and SHA-256 chunk verification implemented and verified via automated test suite. |
| **Security Audit Logs** | **PASS** | In-memory immutable event logger recording device ID, IP, severity, and event type. |
| **Automated Backend Tests** | **PASS** | `npm test` executed: **6 of 6 unit tests PASS** (0 failures). |
| **Web Console UI (14 Screens)** | **PASS** | All 14 required screens implemented in React 19 + Tailwind CSS with responsive layout and real-time simulator. |
| **Physical Device Verification** | **NOT TESTED** | Physical Android device hardware was not attached to this cloud sandbox container; detailed manual test checklist provided in `docs/MANUAL_PHYSICAL_DEVICE_TEST_CHECKLIST.md`. |
| **APK Generation** | **NOT TESTED** | Java/Android SDK toolchain is not pre-installed in the container environment; full build instructions provided in `docs/BUILD_AND_RELEASE_INSTRUCTIONS.md`. |
