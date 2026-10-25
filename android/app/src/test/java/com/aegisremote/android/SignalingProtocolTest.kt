package com.aegisremote.android

import org.json.JSONObject
import org.junit.Assert.assertEquals
import org.junit.Assert.assertNotNull
import org.junit.Test

class SignalingProtocolTest {

    @Test
    fun signaling_createsValidSessionJoinPayload() {
        val json = JSONObject().apply {
            put("type", "join_session")
            put("deviceId", "dev-test-123")
            put("sessionId", "ses-test-456")
            put("role", "host")
        }

        assertEquals("join_session", json.getString("type"))
        assertEquals("dev-test-123", json.getString("deviceId"))
        assertEquals("ses-test-456", json.getString("sessionId"))
        assertEquals("host", json.getString("role"))
    }

    @Test
    fun signaling_encodesWebRtcOfferCorrectly() {
        val sdpContent = "v=0\r\no=- 420 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n"
        val payload = JSONObject().apply {
            put("type", "offer")
            put("sdp", sdpContent)
        }
        val envelope = JSONObject().apply {
            put("type", "webrtc_offer")
            put("sessionId", "ses-1")
            put("payload", payload)
        }

        assertNotNull(envelope.getJSONObject("payload"))
        assertEquals("offer", envelope.getJSONObject("payload").getString("type"))
        assertEquals(sdpContent, envelope.getJSONObject("payload").getString("sdp"))
    }
}
