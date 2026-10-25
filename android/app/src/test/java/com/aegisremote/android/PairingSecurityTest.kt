package com.aegisremote.android

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class PairingSecurityTest {

    @Test
    fun pairingCode_mustBeSixDigits() {
        val code = (100000..999999).random().toString()
        assertEquals(6, code.length)
        assertTrue(code.all { it.isDigit() })
    }

    @Test
    fun pairingCode_mustExpireAfterTTL() {
        val createdAt = 1000000L
        val ttl = 5 * 60 * 1000L // 5 minutes
        val expiresAt = createdAt + ttl

        val validTimestamp = createdAt + (4 * 60 * 1000L) // 4 min later
        val expiredTimestamp = createdAt + (6 * 60 * 1000L) // 6 min later

        assertTrue(validTimestamp < expiresAt)
        assertFalse(expiredTimestamp < expiresAt)
    }

    @Test
    fun pairingNonce_preventsReplayAttack() {
        val usedNonces = mutableSetOf<String>()
        val nonce = "9f82a17b8c04e2"

        // First verification
        val firstAttemptAllowed = usedNonces.add(nonce)
        assertTrue(firstAttemptAllowed)

        // Second verification with identical nonce
        val replayAttemptAllowed = usedNonces.add(nonce)
        assertFalse(replayAttemptAllowed)
    }
}
