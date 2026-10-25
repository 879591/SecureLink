package com.aegisremote.android.service

import android.accessibilityservice.AccessibilityService
import android.accessibilityservice.GestureDescription
import android.graphics.Path
import android.os.Build
import android.util.Log
import android.view.accessibility.AccessibilityEvent
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow

class RemoteAccessibilityService : AccessibilityService() {

    override fun onServiceConnected() {
        super.onServiceConnected()
        instance = this
        _isServiceBound.value = true
        Log.i(TAG, "AegisRemote Accessibility Service connected and ready for authorized gestures.")
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) {
        // Intentionally no-op: AegisRemote explicitly does not monitor or read user window contents
    }

    override fun onInterrupt() {
        Log.w(TAG, "AegisRemote Accessibility Service interrupted.")
    }

    override fun onDestroy() {
        _isServiceBound.value = false
        instance = null
        super.onDestroy()
    }

    fun executeTap(x: Float, y: Float, durationMs: Long = 50): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return false

        val path = Path().apply {
            moveTo(x, y)
        }
        val stroke = GestureDescription.StrokeDescription(path, 0, durationMs)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        return dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                Log.d(TAG, "Tap completed at ($x, $y)")
            }
            override fun onCancelled(gestureDescription: GestureDescription?) {
                Log.w(TAG, "Tap cancelled at ($x, $y)")
            }
        }, null)
    }

    fun executeSwipe(
        startX: Float,
        startY: Float,
        endX: Float,
        endY: Float,
        durationMs: Long = 300
    ): Boolean {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.N) return false

        val path = Path().apply {
            moveTo(startX, startY)
            lineTo(endX, endY)
        }
        val stroke = GestureDescription.StrokeDescription(path, 0, durationMs)
        val gesture = GestureDescription.Builder().addStroke(stroke).build()

        return dispatchGesture(gesture, object : GestureResultCallback() {
            override fun onCompleted(gestureDescription: GestureDescription?) {
                Log.d(TAG, "Swipe completed from ($startX, $startY) to ($endX, $endY)")
            }
            override fun onCancelled(gestureDescription: GestureDescription?) {
                Log.w(TAG, "Swipe cancelled")
            }
        }, null)
    }

    fun executeGlobalAction(action: String): Boolean {
        return when (action.lowercase()) {
            "back" -> performGlobalAction(GLOBAL_ACTION_BACK)
            "home" -> performGlobalAction(GLOBAL_ACTION_HOME)
            "recents" -> performGlobalAction(GLOBAL_ACTION_RECENTS)
            "notifications" -> performGlobalAction(GLOBAL_ACTION_NOTIFICATIONS)
            else -> false
        }
    }

    companion object {
        private const val TAG = "RemoteAccessibility"
        private val _isServiceBound = MutableStateFlow(false)
        val isServiceBound: StateFlow<Boolean> = _isServiceBound

        var instance: RemoteAccessibilityService? = null
            private set
    }
}
