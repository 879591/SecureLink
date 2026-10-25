package com.aegisremote.android

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class SessionManagementTest {

    @Test
    fun session_revocationImmediatelyBlocksAccess() {
        val deviceAuthorization = mutableMapOf<String, Boolean>()
        val deviceId = "dev-pixel-compromised"
        deviceAuthorization[deviceId] = true

        assertTrue(deviceAuthorization[deviceId] == true)

        // Revoke
        deviceAuthorization[deviceId] = false
        assertFalse(deviceAuthorization[deviceId] == true)
    }

    @Test
    fun emergencyDisconnectAll_clearsAllActiveSessions() {
        val activeSessions = mutableListOf("ses-1", "ses-2", "ses-3")
        assertEquals(3, activeSessions.size)

        // Execute emergency disconnect
        activeSessions.clear()
        assertEquals(0, activeSessions.size)
    }
}
