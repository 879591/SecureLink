# Android Build & Release Instructions — AegisRemote

This guide explains how to compile, assemble, test, and sign the AegisRemote Android application.

---

## 1. Prerequisites
- **JDK**: OpenJDK 17 or higher
- **Android SDK**: Platform 34 (Android 14)
- **Android Build-Tools**: 34.0.0+
- **Gradle**: 8.4+ (Included via Gradle Wrapper)
- **Environment Variables**:
  ```bash
  export JAVA_HOME=/path/to/jdk-17
  export ANDROID_HOME=/path/to/Android/Sdk
  export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
  ```

---

## 2. Assembling Debug APK

To build the debug APK:

```bash
cd android
./gradlew assembleDebug
```

### Expected Output Path:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

### Installing onto a Connected Device via ADB:
```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 3. Running Android Unit Tests

Execute JVM unit tests for pairing crypto, signaling JSON, and session timeouts:

```bash
cd android
./gradlew testDebugUnitTest
```

Reports will be generated at:
```
android/app/build/reports/tests/testDebugUnitTest/index.html
```

---

## 4. Production Release Build & Signing

### Step 4.1: Generate a Secure Keystore
```bash
keytool -genkey -v -keystore aegis-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias aegis-key
```

### Step 4.2: Configure Signing in `android/app/build.gradle.kts`
Create a `keystore.properties` file in `android/` (never commit this to version control):
```properties
storeFile=../aegis-release-key.jks
storePassword=YOUR_KEYSTORE_PASSWORD
keyAlias=aegis-key
keyPassword=YOUR_KEY_PASSWORD
```

### Step 4.3: Assemble Release APK / Android App Bundle (AAB)
```bash
cd android

# For standalone release APK:
./gradlew assembleRelease

# For Google Play AAB:
./gradlew bundleRelease
```

### Release Output Locations:
- Release APK: `android/app/build/outputs/apk/release/app-release.apk`
- Release AAB: `android/app/build/outputs/bundle/release/app-release.aab`
