package com.aegisremote.android.ui

import android.app.Activity
import android.content.Context
import android.content.Intent
import android.media.projection.MediaProjectionManager
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.material3.Surface
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.aegisremote.android.service.ScreenCaptureService
import com.aegisremote.android.ui.screens.*
import com.aegisremote.android.ui.theme.AegisDarkBg
import com.aegisremote.android.ui.theme.AegisRemoteTheme

class MainActivity : ComponentActivity() {

    private lateinit var mediaProjectionManager: MediaProjectionManager

    private val screenCaptureLauncher = registerForActivityResult(
        ActivityResultContracts.StartActivityForResult()
    ) { result ->
        if (result.resultCode == Activity.RESULT_OK && result.data != null) {
            ScreenCaptureService.start(this, result.resultCode, result.data!!)
            Toast.makeText(this, "Screen Sharing started", Toast.LENGTH_SHORT).show()
        } else {
            Toast.makeText(this, "Screen capture permission denied", Toast.LENGTH_SHORT).show()
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        mediaProjectionManager = getSystemService(Context.MEDIA_PROJECTION_SERVICE) as MediaProjectionManager

        setContent {
            AegisRemoteTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = AegisDarkBg
                ) {
                    val navController = rememberNavController()

                    NavHost(navController = navController, startDestination = "dashboard") {
                        composable("welcome") {
                            WelcomeScreen(onGetStarted = { navController.navigate("dashboard") })
                        }
                        composable("enrollment") {
                            EnrollmentScreen(onEnrolled = { navController.navigate("dashboard") })
                        }
                        composable("dashboard") {
                            DashboardScreen(
                                onNavigate = { destination -> navController.navigate(destination) },
                                onDisconnectAll = {
                                    ScreenCaptureService.stop(this@MainActivity)
                                    Toast.makeText(this@MainActivity, "All sessions terminated", Toast.LENGTH_SHORT).show()
                                }
                            )
                        }
                        composable("my_devices") {
                            DevicesScreen(
                                onDeviceClick = { id -> navController.navigate("device_details/$id") },
                                onRevokeDevice = { id ->
                                    Toast.makeText(this@MainActivity, "Device $id revoked", Toast.LENGTH_SHORT).show()
                                }
                            )
                        }
                        composable("pair_device") {
                            PairDeviceScreen(onPairSuccess = {
                                Toast.makeText(this@MainActivity, "Device successfully paired", Toast.LENGTH_SHORT).show()
                                navController.popBackStack()
                            })
                        }
                        composable("device_details/{deviceId}") { backStackEntry ->
                            val deviceId = backStackEntry.arguments?.getString("deviceId") ?: "unknown"
                            DeviceDetailsScreen(
                                deviceId = deviceId,
                                onRevoke = {
                                    Toast.makeText(this@MainActivity, "Revoked $deviceId", Toast.LENGTH_SHORT).show()
                                    navController.popBackStack()
                                }
                            )
                        }
                        composable("live_screen") {
                            LiveScreen(onStop = {
                                ScreenCaptureService.stop(this@MainActivity)
                                navController.popBackStack()
                            })
                        }
                        composable("file_transfer") {
                            FileTransferScreen()
                        }
                        composable("active_sessions") {
                            ActiveSessionsScreen(onTerminateSession = { id ->
                                Toast.makeText(this@MainActivity, "Terminated session $id", Toast.LENGTH_SHORT).show()
                            })
                        }
                        composable("history") {
                            HistoryScreen()
                        }
                        composable("security_center") {
                            SecurityCenterScreen()
                        }
                        composable("settings") {
                            SettingsScreen()
                        }
                        composable("help") {
                            HelpScreen()
                        }
                        composable("about") {
                            AboutScreen()
                        }
                    }
                }
            }
        }
    }

    fun requestScreenCapture() {
        val intent = mediaProjectionManager.createScreenCaptureIntent()
        screenCaptureLauncher.launch(intent)
    }
}
