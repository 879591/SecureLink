package com.aegisremote.android.filetransfer

import android.content.Context
import android.net.Uri
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import java.io.File
import java.io.FileInputStream
import java.io.FileOutputStream
import java.security.MessageDigest

data class TransferState(
    val transferId: String = "",
    val fileName: String = "",
    val totalBytes: Long = 0,
    val transferredBytes: Long = 0,
    val progressPercent: Int = 0,
    val status: Status = Status.IDLE,
    val error: String? = null
) {
    enum class Status {
        IDLE,
        AWAITING_CONSENT,
        TRANSFERRING,
        COMPLETED,
        CANCELLED,
        ERROR
    }
}

class FileTransferManager(private val context: Context) {

    private val _transferState = MutableStateFlow(TransferState())
    val transferState: StateFlow<TransferState> = _transferState

    private var isCancelled = false

    fun prepareOutgoingTransfer(uri: Uri, onProgress: (Int) -> Unit) {
        val contentResolver = context.contentResolver
        val cursor = contentResolver.query(uri, null, null, null, null)
        val fileName = cursor?.use {
            if (it.moveToFirst()) {
                val index = it.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                if (index != -1) it.getString(index) else "unnamed_file"
            } else "unnamed_file"
        } ?: "unnamed_file"

        val fileSize = cursor?.use {
            if (it.moveToFirst()) {
                val index = it.getColumnIndex(android.provider.OpenableColumns.SIZE)
                if (index != -1) it.getLong(index) else 0L
            } else 0L
        } ?: 0L

        if (fileSize > MAX_FILE_SIZE_BYTES) {
            _transferState.value = TransferState(
                fileName = fileName,
                status = TransferState.Status.ERROR,
                error = "File exceeds the maximum allowed limit of 100MB."
            )
            return
        }

        _transferState.value = TransferState(
            fileName = fileName,
            totalBytes = fileSize,
            transferredBytes = 0,
            progressPercent = 0,
            status = TransferState.Status.AWAITING_CONSENT
        )
    }

    fun cancelTransfer() {
        isCancelled = true
        _transferState.value = _transferState.value.copy(
            status = TransferState.Status.CANCELLED
        )
    }

    companion object {
        const val MAX_FILE_SIZE_BYTES = 100 * 1024 * 1024L // 100 MB Limit
        const val CHUNK_SIZE_BYTES = 64 * 1024 // 64 KB chunks

        fun calculateSha256(file: File): String {
            val digest = MessageDigest.getInstance("SHA-256")
            val buffer = ByteArray(8192)
            FileInputStream(file).use { input ->
                var read: Int
                while (input.read(buffer).also { read = it } != -1) {
                    digest.update(buffer, 0, read)
                }
            }
            return digest.digest().joinToString("") { "%02x".format(it) }
        }
    }
}
