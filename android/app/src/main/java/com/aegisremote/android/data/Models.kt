package com.aegisremote.android.data

import kotlinx.serialization.Serializable

@Serializable
data class Device(
    val id: String,
    val name: String,
    val model: String,
    val osVersion: String,
    val appVersion: String,
    val deviceFingerprint: String,
    val status: String, // "online", "offline", "busy"
    val enrolledAt: String,
    val lastSeen: String,
    val batteryLevel: Int = 100,
    val isCharging: Boolean = false,
    val ipAddress: String = "",
    val authorized: Boolean = true,
    val capabilities: DeviceCapabilities = DeviceCapabilities()
)

@Serializable
data class DeviceCapabilities(
    val screenShare: Boolean = true,
    val remoteInput: Boolean = true,
    val fileTransfer: Boolean = true,
    val audio: Boolean = false,
    val camera: Boolean = false
)

@Serializable
data class PairingRequest(
    val code: String,
    val targetDeviceId: String,
    val clientName: String
)

@Serializable
data class PairingResponse(
    val success: Boolean,
    val message: String,
    val sessionToken: String? = null,
    val deviceId: String? = null,
    val deviceName: String? = null
)

@Serializable
data class RemoteSession(
    val id: String,
    val hostDeviceId: String,
    val hostDeviceName: String,
    val clientType: String, // "web", "android"
    val startedAt: String,
    val lastActivity: String,
    val status: String, // "active", "paused", "terminated"
    val permissions: SessionPermissions = SessionPermissions(),
    val durationSeconds: Long = 0,
    val bytesTransferred: Long = 0
)

@Serializable
data class SessionPermissions(
    val screenShare: Boolean = true,
    val remoteInput: Boolean = true,
    val fileTransfer: Boolean = true,
    val audio: Boolean = false,
    val camera: Boolean = false
)

@Serializable
data class RemoteGesture(
    val type: String, // "tap", "swipe", "action"
    val x: Float = 0f,
    val y: Float = 0f,
    val endX: Float = 0f,
    val endY: Float = 0f,
    val durationMs: Long = 100,
    val action: String? = null // "back", "home", "recents"
)

@Serializable
data class FileTransferMeta(
    val transferId: String,
    val fileName: String,
    val fileSize: Long,
    val mimeType: String,
    val sha256Checksum: String,
    val chunkCount: Int
)

@Serializable
data class SecurityEvent(
    val id: String,
    val timestamp: String,
    val eventType: String,
    val severity: String, // "info", "warning", "critical"
    val deviceId: String? = null,
    val ipAddress: String,
    val details: String
)
