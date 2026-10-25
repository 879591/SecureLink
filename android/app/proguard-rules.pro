# AegisRemote Proguard Rules

# WebRTC native bindings
-keep class org.webrtc.** { *; }
-dontwarn org.webrtc.**

# OkHttp & Okio
-dontwarn okhttp3.**
-dontwarn okio.**
-keepnames class okhttp3.internal.publicsuffix.PublicSuffixDatabase

# Kotlinx Serialization
-keepattributes *Annotation*,InnerClasses
-dontnote kotlinx.serialization.SerializationKt
-keepclassmembers class * {
    *** Companion;
}
-keepclasseswithmembers class * {
    kotlinx.serialization.KSerializer serializer(...);
}

# Android Security & Keystore
-keep class androidx.security.crypto.** { *; }
