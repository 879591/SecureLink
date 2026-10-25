package com.aegisremote.android.service

import android.app.Notification
import android.app.PendingIntent
import android.app.Service
import android.content.Context
import android.content.Intent
import android.content.pm.ServiceInfo
import android.os.Build
import android.os.IBinder
import androidx.core.app.NotificationCompat
import com.aegisremote.android.AegisApplication
import com.aegisremote.android.R
import com.aegisremote.android.ui.MainActivity

class ScreenCaptureService : Service() {

    private var isStreaming = false
    private var isPaused = false

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action

        when (action) {
            ACTION_START -> {
                val resultCode = intent.getIntExtra(EXTRA_RESULT_CODE, 0)
                val resultData = intent.getParcelableExtra<Intent>(EXTRA_RESULT_DATA)
                if (resultCode != 0 && resultData != null) {
                    startForegroundServiceWithNotification()
                    isStreaming = true
                    isPaused = false
                } else {
                    stopSelf()
                }
            }
            ACTION_PAUSE -> {
                isPaused = true
                updateNotification("Screen Sharing Paused", isPaused = true)
            }
            ACTION_RESUME -> {
                isPaused = false
                updateNotification("Screen Sharing Active", isPaused = false)
            }
            ACTION_STOP -> {
                stopScreenShare()
                stopSelf()
            }
        }

        return START_NOT_STICKY
    }

    private fun startForegroundServiceWithNotification() {
        val notification = buildNotification("Screen Sharing Active", isPaused = false)

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
            val serviceType = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            } else {
                ServiceInfo.FOREGROUND_SERVICE_TYPE_MEDIA_PROJECTION
            }
            startForeground(AegisApplication.NOTIFICATION_ID_SCREEN_SHARE, notification, serviceType)
        } else {
            startForeground(AegisApplication.NOTIFICATION_ID_SCREEN_SHARE, notification)
        }
    }

    private fun buildNotification(contentText: String, isPaused: Boolean): Notification {
        val openAppIntent = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val stopIntent = PendingIntent.getService(
            this,
            1,
            Intent(this, ScreenCaptureService::class.java).apply { action = ACTION_STOP },
            PendingIntent.FLAG_IMMUTABLE
        )

        val toggleActionIntent = PendingIntent.getService(
            this,
            2,
            Intent(this, ScreenCaptureService::class.java).apply {
                action = if (isPaused) ACTION_RESUME else ACTION_PAUSE
            },
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT
        )

        val builder = NotificationCompat.Builder(this, AegisApplication.CHANNEL_ID_SCREEN_SHARE)
            .setSmallIcon(android.R.drawable.ic_menu_camera)
            .setContentTitle("AegisRemote Active Session")
            .setContentText(contentText)
            .setOngoing(true)
            .setContentIntent(openAppIntent)
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .addAction(
                android.R.drawable.ic_media_pause,
                if (isPaused) "Resume" else "Pause",
                toggleActionIntent
            )
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", stopIntent)

        return builder.build()
    }

    private fun updateNotification(text: String, isPaused: Boolean) {
        val notification = buildNotification(text, isPaused)
        val manager = getSystemService(Context.NOTIFICATION_SERVICE) as android.app.NotificationManager
        manager.notify(AegisApplication.NOTIFICATION_ID_SCREEN_SHARE, notification)
    }

    private fun stopScreenShare() {
        isStreaming = false
        isPaused = false
    }

    override fun onDestroy() {
        stopScreenShare()
        super.onDestroy()
    }

    companion object {
        const val ACTION_START = "com.aegisremote.android.action.START"
        const val ACTION_PAUSE = "com.aegisremote.android.action.PAUSE"
        const val ACTION_RESUME = "com.aegisremote.android.action.RESUME"
        const val ACTION_STOP = "com.aegisremote.android.action.STOP"

        const val EXTRA_RESULT_CODE = "extra_result_code"
        const val EXTRA_RESULT_DATA = "extra_result_data"

        fun start(context: Context, resultCode: Int, data: Intent) {
            val intent = Intent(context, ScreenCaptureService::class.java).apply {
                action = ACTION_START
                putExtra(EXTRA_RESULT_CODE, resultCode)
                putExtra(EXTRA_RESULT_DATA, data)
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                context.startForegroundService(intent)
            } else {
                context.startService(intent)
            }
        }

        fun stop(context: Context) {
            val intent = Intent(context, ScreenCaptureService::class.java).apply {
                action = ACTION_STOP
            }
            context.startService(intent)
        }
    }
}
