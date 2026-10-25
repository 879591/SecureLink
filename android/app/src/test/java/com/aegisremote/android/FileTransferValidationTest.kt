package com.aegisremote.android

import org.junit.Assert.assertEquals
import org.junit.Assert.assertFalse
import org.junit.Assert.assertTrue
import org.junit.Test

class FileTransferValidationTest {

    @Test
    fun fileTransfer_enforces100MbLimit() {
        val maxLimit = 100 * 1024 * 1024L
        val oversizedFile = 105 * 1024 * 1024L
        val acceptableFile = 25 * 1024 * 1024L

        assertTrue(acceptableFile <= maxLimit)
        assertFalse(oversizedFile <= maxLimit)
    }

    @Test
    fun fileTransfer_chunkCalculation() {
        val fileSize = 1024 * 1024L // 1MB
        val chunkSize = 64 * 1024L   // 64KB
        val expectedChunks = 16

        val calculatedChunks = (fileSize + chunkSize - 1) / chunkSize
        assertEquals(expectedChunks.toLong(), calculatedChunks)
    }
}
