package com.aegisremote.android.security

import android.content.Context
import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.PrivateKey
import java.security.PublicKey
import java.security.Signature

object KeystoreManager {
    private const val ANDROID_KEYSTORE = "AndroidKeyStore"
    private const val KEY_ALIAS_DEVICE_IDENTITY = "aegis_device_identity_key"
    private const val SIGNATURE_ALGORITHM = "SHA256withECDSA"

    fun init(context: Context) {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        if (!keyStore.containsAlias(KEY_ALIAS_DEVICE_IDENTITY)) {
            generateDeviceIdentityKeyPair()
        }
    }

    private fun generateDeviceIdentityKeyPair() {
        val keyPairGenerator = KeyPairGenerator.getInstance(
            KeyProperties.KEY_ALGORITHM_EC,
            ANDROID_KEYSTORE
        )

        val parameterSpec = KeyGenParameterSpec.Builder(
            KEY_ALIAS_DEVICE_IDENTITY,
            KeyProperties.PURPOSE_SIGN or KeyProperties.PURPOSE_VERIFY
        ).run {
            setDigests(KeyProperties.DIGEST_SHA256)
            setUserAuthenticationRequired(false) // Non-interactive background signature for real-time packets
            build()
        }

        keyPairGenerator.initialize(parameterSpec)
        keyPairGenerator.generateKeyPair()
    }

    fun getPublicKeyBase64(): String {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        val certificate = keyStore.getCertificate(KEY_ALIAS_DEVICE_IDENTITY) ?: return ""
        val publicKey: PublicKey = certificate.publicKey
        return Base64.encodeToString(publicKey.encoded, Base64.NO_WRAP)
    }

    fun signData(data: ByteArray): String {
        val keyStore = KeyStore.getInstance(ANDROID_KEYSTORE).apply { load(null) }
        val privateKeyEntry = keyStore.getEntry(KEY_ALIAS_DEVICE_IDENTITY, null) as? KeyStore.PrivateKeyEntry
            ?: throw IllegalStateException("Key entry not found in KeyStore")

        val privateKey: PrivateKey = privateKeyEntry.privateKey
        val signature = Signature.getInstance(SIGNATURE_ALGORITHM).apply {
            initSign(privateKey)
            update(data)
        }

        val signedBytes = signature.sign()
        return Base64.encodeToString(signedBytes, Base64.NO_WRAP)
    }

    fun verifySignature(publicKey: PublicKey, data: ByteArray, signatureBase64: String): Boolean {
        return try {
            val signatureBytes = Base64.decode(signatureBase64, Base64.NO_WRAP)
            val signature = Signature.getInstance(SIGNATURE_ALGORITHM).apply {
                initVerify(publicKey)
                update(data)
            }
            signature.verify(signatureBytes)
        } catch (e: Exception) {
            false
        }
    }
}
