# Security Review Checklist — AegisRemote

This checklist provides an exhaustive security audit of the AegisRemote Android and Backend remote device management system.

## 1. Authentication & Device Pairing

| Security Control | Implementation | Verification Status |
| :--- | :--- | :--- |
| **Short-Lived Pairing Codes** | 6-digit numeric codes generated with 5-minute (300s) TTL. | **PASS** (Tested in `tests/backend.test.ts`) |
| **Nonce & Replay Defense** | Cryptographic nonces generated per pairing request; nonces cannot be re-used. | **PASS** (Tested in `tests/backend.test.ts`) |
| **Hardware Key Attestation** | AndroidKeyStore EC P-256 key generation (`KeystoreManager.kt`) with digital signatures. | **PASS** (Source verified) |
| **Rate Limiting** | Max 5 failed pairing attempts per 15-minute window per IP to stop brute-force attacks. | **PASS** (Tested & enforced in `server.ts`) |
| **Explicit Target Confirmation** | Target phone displays incoming pairing dialog; pairing does not complete without user tap. | **PASS** (Source verified in Compose & Backend) |

---

## 2. MediaProjection & Screen Sharing

| Security Control | Implementation | Verification Status |
| :--- | :--- | :--- |
| **System Consent Dialog** | Every screen streaming session triggers Android's native `MediaProjectionManager.createScreenCaptureIntent()`. | **PASS** (Source verified in `MainActivity.kt`) |
| **No Background Snooping** | MediaProjection requires an active Foreground Service with `FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION`. | **PASS** (Configured in `AndroidManifest.xml`) |
| **Persistent Notification** | Visible ongoing notification in notification tray with "Pause" and "Stop" actions. | **PASS** (Source verified in `ScreenCaptureService.kt`) |
| **Zero Screen Storage** | Screen video is streamed peer-to-peer via WebRTC RTP packets; video is never recorded or written to server disks. | **PASS** (Verified in `server.ts`) |
| **Immediate Resource Release** | On session termination or user pause, VirtualDisplay, VideoSource, and SurfaceTextureHelper are cleanly disposed. | **PASS** (Source verified in `WebRtcClient.kt`) |

---

## 3. Remote Interaction & AccessibilityService

| Security Control | Implementation | Verification Status |
| :--- | :--- | :--- |
| **Manual User Enablement** | AccessibilityService cannot be enabled silently; user must navigate to Android Settings > Accessibility. | **PASS** (Enforced by Android OS architecture) |
| **No Window Snooping** | `canRetrieveWindowContent` is explicitly set to `false` in `accessibility_service_config.xml`. | **PASS** (Verified in XML configuration) |
| **No Password Logging** | Android OS blocks AccessibilityService gesture overlays from reading password inputs. | **PASS** (Android OS native sandbox) |
| **Scoped Gestures Only** | Only authorized taps, swipes, and system global actions (Back, Home, Recents) are accepted. | **PASS** (Verified in `RemoteAccessibilityService.kt`) |

---

## 4. File Transfer Security

| Security Control | Implementation | Verification Status |
| :--- | :--- | :--- |
| **Strict File Size Limits** | Transfers are capped at 100MB per file to prevent device resource exhaustion. | **PASS** (Tested in `tests/backend.test.ts`) |
| **Explicit File Selection** | Storage Access Framework (SAF) system file picker ensures only user-selected files are read. | **PASS** (Verified in `FileTransferManager.kt`) |
| **Cryptographic Integrity** | SHA-256 hash calculated prior to transfer and validated by recipient before writing to disk. | **PASS** (Verified in `FileTransferManager.kt`) |
| **Transfer Cancellation** | User or controller can cancel in-flight transfer at any point with cleanup of temporary buffers. | **PASS** (Verified in `FileTransferManager.kt`) |

---

## 5. Session Management & Emergency Controls

| Security Control | Implementation | Verification Status |
| :--- | :--- | :--- |
| **Emergency Disconnect All** | One-click instant termination of all active sessions across all connected devices. | **PASS** (Tested in `tests/backend.test.ts`) |
| **Cryptographic Revocation** | Revoking a device marks its key invalid, clears sessions, and rejects subsequent WebSocket packets. | **PASS** (Tested in `tests/backend.test.ts`) |
| **Heartbeat & Inactivity Timeout** | WebSocket ping/pong checks every 20s; stale sessions automatically transition to offline. | **PASS** (Verified in `server.ts` & `SignalingClient.kt`) |
