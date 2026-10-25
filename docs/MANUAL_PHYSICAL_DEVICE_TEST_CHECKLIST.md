# Manual Physical Device Test Checklist — AegisRemote

Follow this checklist when testing the compiled AegisRemote Android APK on physical Android hardware (Android 10 through Android 14).

---

## Prerequisites
- Physical Android phone running Android 10+ (Android 14 recommended).
- USB cable or Wi-Fi ADB enabled (`adb connect <ip>:5555`).
- AegisRemote backend signaling server running (`npm start` or deployed Cloud Run instance).
- AegisRemote debug APK installed (`adb install -r app-debug.apk`).

---

## Test Cases

### 1. Zero-Trust Device Pairing
- [ ] **Step 1.1**: Open AegisRemote on the physical phone. Select "Enroll as Managed Host".
- [ ] **Step 1.2**: On the Web Console, navigate to "Pair New Device" and click "Generate 6-Digit Code".
- [ ] **Step 1.3**: Enter the 6-digit code on the phone before the 5-minute timer expires.
- [ ] **Expected Result**: Phone displays an authorization confirmation dialog with the controller's IP and name. Upon tapping "Confirm", both devices transition to "Paired & Authorized".
- [ ] **Negative Test 1.4**: Wait 5 minutes until the code expires, then attempt to submit it.
- [ ] **Expected Result**: Backend rejects the code with HTTP 410 ("Pairing code has expired").
- [ ] **Negative Test 1.5**: Attempt to re-enter a used pairing code.
- [ ] **Expected Result**: Backend rejects the replay attempt.

---

### 2. Live Screen Sharing (MediaProjection)
- [ ] **Step 2.1**: From the Web Console or Controller phone, select the paired device and click "Connect Live Screen".
- [ ] **Step 2.2**: Observe the physical phone's screen. Android system dialog appears: *"Start recording or casting with AegisRemote?"*.
- [ ] **Step 2.3**: Tap "Start now".
- [ ] **Expected Result**:
  - Live video stream appears on the Web Console within 1–2 seconds.
  - Ongoing foreground notification appears in the Android notification drawer: *"AegisRemote Active Session — Screen Sharing Active"*.
  - Android status bar displays the active casting chip.
- [ ] **Step 2.4**: Tap "Pause" on the Android notification.
- [ ] **Expected Result**: Web Console screen viewer immediately pauses and displays *"Stream Paused by User"*. No video frames are transmitted during pause.
- [ ] **Step 2.5**: Tap "Resume" on the notification. Stream resumes smoothly.
- [ ] **Step 2.6**: Tap "Stop" on the notification.
- [ ] **Expected Result**: Screen capture terminates, foreground notification clears, and WebRTC video tracks are disposed.

---

### 3. Remote Accessibility Interaction
- [ ] **Step 3.1**: On the phone, open **Settings > Accessibility > AegisRemote**. Toggle the switch to **ON**.
- [ ] **Step 3.2**: Read the Android system warning and tap "Allow".
- [ ] **Step 3.3**: With an active screen share session, click anywhere inside the Web Console phone canvas.
- [ ] **Expected Result**: The corresponding tap occurs on the physical phone at the exact relative coordinate.
- [ ] **Step 3.4**: Perform a click-and-drag upward on the canvas.
- [ ] **Expected Result**: The physical phone executes a vertical swipe gesture.
- [ ] **Step 3.5**: Click the "Back" action on the console.
- [ ] **Expected Result**: The phone performs `GLOBAL_ACTION_BACK`.
- [ ] **Security Test 3.6**: Open a password field on the phone (e.g., Settings > Lock Screen).
- [ ] **Expected Result**: Android security architecture ensures the password field content is not exposed or leaked to the controller.

---

### 4. Secure File Transfer (SAF)
- [ ] **Step 4.1**: In the Web Console, go to "File Transfer" and pick a file (< 100MB).
- [ ] **Step 4.2**: Click "Start Secure DataChannel Transfer".
- [ ] **Step 4.3**: Observe phone screen. A consent prompt appears: *"Incoming file: <filename> (<size>). Accept?"*.
- [ ] **Step 4.4**: Tap "Accept" and select destination folder via Storage Access Framework.
- [ ] **Expected Result**: Progress bar tracks chunk transfer (64KB chunks). Upon completion, SHA-256 checksum matches and file opens successfully.
- [ ] **Negative Test 4.5**: Attempt to send a file larger than 100MB.
- [ ] **Expected Result**: Transfer is blocked with clear error: *"File exceeds maximum allowed limit of 100MB"*.

---

### 5. Emergency Revocation & Disconnect All
- [ ] **Step 5.1**: While a live session is running, click "DISCONNECT ALL" on the Web Console.
- [ ] **Expected Result**:
  - Live session ends immediately on all devices.
  - Foreground notification on the phone dismisses within 500ms.
  - Security audit log records: `[SESSION_TERMINATED] Emergency Disconnect-All triggered`.
- [ ] **Step 5.2**: Click "Revoke Authorization" on the target phone.
- [ ] **Expected Result**: Device status switches to "Revoked". Any subsequent connection attempt is rejected with HTTP 403 Forbidden.
