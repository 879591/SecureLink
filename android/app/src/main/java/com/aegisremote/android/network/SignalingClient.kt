package com.aegisremote.android.network

import android.util.Log
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.SharedFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.Response
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class SignalingClient(private val serverUrl: String) {

    private val client = OkHttpClient.Builder()
        .readTimeout(30, TimeUnit.SECONDS)
        .pingInterval(20, TimeUnit.SECONDS)
        .build()

    private var webSocket: WebSocket? = null
    private val scope = CoroutineScope(Dispatchers.IO + Job())
    private var pingJob: Job? = null

    private val _connectionState = MutableStateFlow(ConnectionState.DISCONNECTED)
    val connectionState: StateFlow<ConnectionState> = _connectionState

    private val _incomingMessages = MutableSharedFlow<SignalingMessage>(extraBufferCapacity = 64)
    val incomingMessages: SharedFlow<SignalingMessage> = _incomingMessages

    fun connect(deviceId: String, sessionId: String, role: String = "host") {
        if (_connectionState.value == ConnectionState.CONNECTED) return

        _connectionState.value = ConnectionState.CONNECTING
        val wsUrl = serverUrl.replace("http://", "ws://").replace("https://", "wss://") + "/ws/signaling"
        val request = Request.Builder().url(wsUrl).build()

        webSocket = client.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(ws: WebSocket, response: Response) {
                Log.d(TAG, "Signaling WebSocket connected")
                _connectionState.value = ConnectionState.CONNECTED

                // Send authentication and session join
                val joinMsg = JSONObject().apply {
                    put("type", "join_session")
                    put("deviceId", deviceId)
                    put("sessionId", sessionId)
                    put("role", role)
                }
                ws.send(joinMsg.toString())

                startPingLoop()
            }

            override fun onMessage(ws: WebSocket, text: String) {
                try {
                    val json = JSONObject(text)
                    val type = json.optString("type")
                    val message = SignalingMessage(
                        type = type,
                        sessionId = json.optString("sessionId"),
                        senderDeviceId = json.optString("senderDeviceId"),
                        payload = json.opt("payload"),
                        raw = text
                    )
                    scope.launch { _incomingMessages.emit(message) }
                } catch (e: Exception) {
                    Log.e(TAG, "Error parsing signaling message", e)
                }
            }

            override fun onClosing(ws: WebSocket, code: Int, reason: String) {
                Log.d(TAG, "Signaling closing: $reason")
                _connectionState.value = ConnectionState.DISCONNECTED
            }

            override fun onFailure(ws: WebSocket, t: Throwable, response: Response?) {
                Log.e(TAG, "Signaling connection failed", t)
                _connectionState.value = ConnectionState.ERROR
                pingJob?.cancel()
            }
        })
    }

    private fun startPingLoop() {
        pingJob?.cancel()
        pingJob = scope.launch {
            while (_connectionState.value == ConnectionState.CONNECTED) {
                delay(20000)
                webSocket?.send(JSONObject().put("type", "ping").toString())
            }
        }
    }

    fun sendOffer(sessionId: String, sdpDescription: String) {
        val json = JSONObject().apply {
            put("type", "webrtc_offer")
            put("sessionId", sessionId)
            put("payload", JSONObject().put("type", "offer").put("sdp", sdpDescription))
        }
        webSocket?.send(json.toString())
    }

    fun sendAnswer(sessionId: String, sdpDescription: String) {
        val json = JSONObject().apply {
            put("type", "webrtc_answer")
            put("sessionId", sessionId)
            put("payload", JSONObject().put("type", "answer").put("sdp", sdpDescription))
        }
        webSocket?.send(json.toString())
    }

    fun sendIceCandidate(sessionId: String, sdpMid: String, sdpMLineIndex: Int, candidate: String) {
        val json = JSONObject().apply {
            put("type", "ice_candidate")
            put("sessionId", sessionId)
            put("payload", JSONObject().apply {
                put("sdpMid", sdpMid)
                put("sdpMLineIndex", sdpMLineIndex)
                put("candidate", candidate)
            })
        }
        webSocket?.send(json.toString())
    }

    fun sendStreamState(sessionId: String, state: String) {
        val json = JSONObject().apply {
            put("type", "stream_state")
            put("sessionId", sessionId)
            put("payload", JSONObject().put("state", state))
        }
        webSocket?.send(json.toString())
    }

    fun disconnect() {
        pingJob?.cancel()
        webSocket?.close(1000, "User disconnect")
        webSocket = null
        _connectionState.value = ConnectionState.DISCONNECTED
    }

    companion object {
        private const val TAG = "SignalingClient"
    }
}

enum class ConnectionState {
    DISCONNECTED,
    CONNECTING,
    CONNECTED,
    ERROR
}

data class SignalingMessage(
    val type: String,
    val sessionId: String,
    val senderDeviceId: String,
    val payload: Any?,
    val raw: String
)
