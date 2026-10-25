package com.aegisremote.android.webrtc

import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjection
import android.util.Log
import org.webrtc.AudioTrack
import org.webrtc.DataChannel
import org.webrtc.DefaultVideoDecoderFactory
import org.webrtc.DefaultVideoEncoderFactory
import org.webrtc.EglBase
import org.webrtc.IceCandidate
import org.webrtc.MediaConstraints
import org.webrtc.MediaStream
import org.webrtc.PeerConnection
import org.webrtc.PeerConnectionFactory
import org.webrtc.RtpReceiver
import org.webrtc.ScreenCapturerAndroid
import org.webrtc.SessionDescription
import org.webrtc.SurfaceTextureHelper
import org.webrtc.VideoSource
import org.webrtc.VideoTrack
import java.nio.ByteBuffer

class WebRtcClient(
    private val context: Context,
    private val listener: WebRtcListener
) {
    private val eglBase = EglBase.create()
    private var peerConnectionFactory: PeerConnectionFactory? = null
    private var peerConnection: PeerConnection? = null
    private var videoSource: VideoSource? = null
    private var videoTrack: VideoTrack? = null
    private var audioTrack: AudioTrack? = null
    private var surfaceTextureHelper: SurfaceTextureHelper? = null
    private var screenCapturer: ScreenCapturerAndroid? = null
    private var dataChannel: DataChannel? = null

    interface WebRtcListener {
        fun onLocalDescriptionGenerated(sdp: SessionDescription)
        fun onIceCandidateGenerated(candidate: IceCandidate)
        fun onIceConnectionChange(state: PeerConnection.IceConnectionState)
        fun onDataChannelMessage(buffer: ByteBuffer)
    }

    init {
        initializePeerConnectionFactory()
    }

    private fun initializePeerConnectionFactory() {
        val options = PeerConnectionFactory.InitializationOptions.builder(context)
            .setEnableInternalTracer(false)
            .createInitializationOptions()
        PeerConnectionFactory.initialize(options)

        val encoderFactory = DefaultVideoEncoderFactory(eglBase.eglBaseContext, true, true)
        val decoderFactory = DefaultVideoDecoderFactory(eglBase.eglBaseContext)

        peerConnectionFactory = PeerConnectionFactory.builder()
            .setVideoEncoderFactory(encoderFactory)
            .setVideoDecoderFactory(decoderFactory)
            .setOptions(PeerConnectionFactory.Options())
            .createPeerConnectionFactory()
    }

    fun startScreenCapture(
        projectionData: Intent,
        width: Int = 1280,
        height: Int = 720,
        fps: Int = 30
    ) {
        val factory = peerConnectionFactory ?: return

        screenCapturer = ScreenCapturerAndroid(projectionData, object : MediaProjection.Callback() {
            override fun onStop() {
                Log.d(TAG, "MediaProjection stopped by system")
                stopScreenCapture()
            }
        })

        surfaceTextureHelper = SurfaceTextureHelper.create("ScreenCaptureThread", eglBase.eglBaseContext)
        videoSource = factory.createVideoSource(screenCapturer!!.isScreencast)
        screenCapturer!!.initialize(surfaceTextureHelper, context, videoSource!!.capturerObserver)
        screenCapturer!!.startCapture(width, height, fps)

        videoTrack = factory.createVideoTrack("ARDAMSv0", videoSource)
        videoTrack?.setEnabled(true)
    }

    fun stopScreenCapture() {
        try {
            screenCapturer?.stopCapture()
            screenCapturer?.dispose()
            screenCapturer = null
            surfaceTextureHelper?.dispose()
            surfaceTextureHelper = null
            videoSource?.dispose()
            videoSource = null
        } catch (e: Exception) {
            Log.e(TAG, "Error stopping screen capture", e)
        }
    }

    fun createPeerConnection(iceServers: List<PeerConnection.IceServer>) {
        val rtcConfig = PeerConnection.RTCConfiguration(iceServers).apply {
            sdpSemantics = PeerConnection.SdpSemantics.UNIFIED_PLAN
            continualGatheringPolicy = PeerConnection.ContinualGatheringPolicy.GATHER_CONTINUALLY
        }

        peerConnection = peerConnectionFactory?.createPeerConnection(rtcConfig, object : PeerConnection.Observer {
            override fun onSignalingChange(state: PeerConnection.SignalingState?) {}
            override fun onIceConnectionChange(state: PeerConnection.IceConnectionState?) {
                state?.let { listener.onIceConnectionChange(it) }
            }
            override fun onIceConnectionReceivingChange(receiving: Boolean) {}
            override fun onIceGatheringChange(state: PeerConnection.IceGatheringState?) {}
            override fun onIceCandidate(candidate: IceCandidate?) {
                candidate?.let { listener.onIceCandidateGenerated(it) }
            }
            override fun onIceCandidatesRemoved(candidates: Array<out IceCandidate>?) {}
            override fun onAddStream(stream: MediaStream?) {}
            override fun onRemoveStream(stream: MediaStream?) {}
            override fun onDataChannel(dc: DataChannel?) {
                dc?.registerObserver(object : DataChannel.Observer {
                    override fun onBufferedAmountChange(previousAmount: Long) {}
                    override fun onStateChange() {}
                    override fun onMessage(buffer: DataChannel.Buffer?) {
                        buffer?.data?.let { listener.onDataChannelMessage(it) }
                    }
                })
            }
            override fun onRenegotiationNeeded() {}
            override fun onAddTrack(receiver: RtpReceiver?, mediaStreams: Array<out MediaStream>?) {}
        })

        // Add Video Track
        videoTrack?.let {
            peerConnection?.addTrack(it, listOf("ARDAMS"))
        }

        // Create DataChannel for remote control inputs & commands
        val init = DataChannel.Init().apply {
            ordered = true
            maxRetransmits = 3
        }
        dataChannel = peerConnection?.createDataChannel("aegis_commands", init)
    }

    fun createOffer(constraints: MediaConstraints = MediaConstraints()) {
        peerConnection?.createOffer(object : SdpObserverAdapter() {
            override fun onCreateSuccess(desc: SessionDescription?) {
                desc?.let {
                    peerConnection?.setLocalDescription(SdpObserverAdapter(), it)
                    listener.onLocalDescriptionGenerated(it)
                }
            }
        }, constraints)
    }

    fun setRemoteDescription(sdp: SessionDescription) {
        peerConnection?.setRemoteDescription(SdpObserverAdapter(), sdp)
    }

    fun addIceCandidate(candidate: IceCandidate) {
        peerConnection?.addIceCandidate(candidate)
    }

    fun sendData(data: ByteArray) {
        val buffer = DataChannel.Buffer(ByteBuffer.wrap(data), false)
        dataChannel?.send(buffer)
    }

    fun close() {
        stopScreenCapture()
        dataChannel?.close()
        dataChannel = null
        peerConnection?.close()
        peerConnection = null
        peerConnectionFactory?.dispose()
        peerConnectionFactory = null
        eglBase.release()
    }

    companion object {
        private const val TAG = "WebRtcClient"
    }
}

open class SdpObserverAdapter : org.webrtc.SdpObserver {
    override fun onCreateSuccess(desc: SessionDescription?) {}
    override fun onSetSuccess() {}
    override fun onCreateFailure(error: String?) {
        Log.e("SdpObserverAdapter", "SDP Create Failure: $error")
    }
    override fun onSetFailure(error: String?) {
        Log.e("SdpObserverAdapter", "SDP Set Failure: $error")
    }
}
