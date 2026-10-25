package com.aegisremote.android

import android.app.Application
import android.app.NotificationChannel
import android.app.NotificationManager
import android.os.Build
import com.aegisremote.android.security.KeystoreManager

class AegisApplication : Application() {

    override fun onCreate() {
        super.onCreate()
        instance = this

        // Initialize Android Keystore master keys
        KeystoreManager.init(this)

        // Create persistent notification channels
        createNotificationChannels()
    }

    private fun createNotificationChannels() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID_SCREEN_SHARE,
                getString(R.string.notification_channel_name),
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = getString(R.string.notification_channel_desc)
                setShowBadge(true)
            }

            val fileTransferChannel = NotificationChannel(
                CHANNEL_ID_FILE_TRANSFER,
                "File Transfers",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Active file transfer progress"
            }

            val notificationManager = getSystemService(NotificationManager::class.java)
            notificationManager?.createNotificationChannel(channel)
            notificationManager?.createNotificationChannel(fileTransferChannel)
        }
    }

    companion object {
        lateinit var instance: AegisApplication
            private set

        const val CHANNEL_ID_SCREEN_SHARE = "aegis_screen_share_channel"
        const val CHANNEL_ID_FILE_TRANSFER = "aegis_file_transfer_channel"
        const val NOTIFICATION_ID_SCREEN_SHARE = 1001
        const val NOTIFICATION_ID_FILE_TRANSFER = 1002
    }
}
