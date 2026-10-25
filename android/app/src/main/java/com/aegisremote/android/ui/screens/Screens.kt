package com.aegisremote.android.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontFamily
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.aegisremote.android.ui.theme.*

// 1. Welcome and Onboarding Screen
@Composable
fun WelcomeScreen(onGetStarted: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisDarkBg)
            .padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Box(
            modifier = Modifier
                .size(80.dp)
                .clip(CircleShape)
                .background(AegisPrimary.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = Icons.Default.Shield,
                contentDescription = null,
                tint = AegisPrimary,
                modifier = Modifier.size(48.dp)
            )
        }
        Spacer(modifier = Modifier.height(24.dp))
        Text(
            text = "AegisRemote",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold,
            color = AegisTextPrimary
        )
        Text(
            text = "Secure Android Remote Management",
            style = MaterialTheme.typography.bodyMedium,
            color = AegisTextSecondary
        )
        Spacer(modifier = Modifier.height(32.dp))

        SecurityFeatureItem(
            icon = Icons.Default.Lock,
            title = "Zero-Trust Device Pairing",
            description = "Ephemerally generated 6-digit codes and QR tokens with explicit target consent."
        )
        SecurityFeatureItem(
            icon = Icons.Default.Videocam,
            title = "Real-Time WebRTC MediaProjection",
            description = "Encrypted peer-to-peer screen streaming with system dialog consent."
        )
        SecurityFeatureItem(
            icon = Icons.Default.TouchApp,
            title = "Controlled Accessibility",
            description = "Authorized remote interactions with transparent persistent notification indicators."
        )

        Spacer(modifier = Modifier.height(40.dp))
        Button(
            onClick = onGetStarted,
            modifier = Modifier
                .fillMaxWidth()
                .height(52.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AegisPrimary),
            shape = RoundedCornerShape(12.dp)
        ) {
            Text("Get Started", fontSize = 16.sp, fontWeight = FontWeight.SemiBold)
        }
    }
}

@Composable
fun SecurityFeatureItem(icon: ImageVector, title: String, description: String) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
            .clip(RoundedCornerShape(12.dp))
            .background(AegisSurface)
            .padding(14.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(imageVector = icon, contentDescription = null, tint = AegisAccent, modifier = Modifier.size(28.dp))
        Spacer(modifier = Modifier.width(16.dp))
        Column {
            Text(text = title, fontWeight = FontWeight.SemiBold, color = AegisTextPrimary, fontSize = 14.sp)
            Text(text = description, color = AegisTextSecondary, fontSize = 12.sp, lineHeight = 16.sp)
        }
    }
}

// 2. Authentication or Device Enrollment Screen
@Composable
fun EnrollmentScreen(onEnrolled: () -> Unit) {
    var deviceName by remember { mutableStateOf("My Android Phone") }
    var selectedRole by remember { mutableStateOf("host") } // host or controller

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisDarkBg)
            .padding(20.dp)
    ) {
        Text("Device Enrollment", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold, color = AegisTextPrimary)
        Text("Register this phone with hardware-backed Keystore identity.", color = AegisTextSecondary, fontSize = 13.sp)

        Spacer(modifier = Modifier.height(24.dp))
        OutlinedTextField(
            value = deviceName,
            onValueChange = { deviceName = it },
            label = { Text("Device Name") },
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = AegisTextPrimary,
                unfocusedTextColor = AegisTextPrimary,
                focusedBorderColor = AegisPrimary,
                unfocusedBorderColor = AegisBorder
            )
        )

        Spacer(modifier = Modifier.height(20.dp))
        Text("Device Mode", fontWeight = FontWeight.Medium, color = AegisTextPrimary, fontSize = 14.sp)
        Spacer(modifier = Modifier.height(8.dp))
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
            FilterChip(
                selected = selectedRole == "host",
                onClick = { selectedRole = "host" },
                label = { Text("Managed Host (Share Screen)") },
                modifier = Modifier.weight(1f)
            )
            FilterChip(
                selected = selectedRole == "controller",
                onClick = { selectedRole = "controller" },
                label = { Text("Controller (Manage)") },
                modifier = Modifier.weight(1f)
            )
        }

        Spacer(modifier = Modifier.height(24.dp))
        Card(
            colors = CardDefaults.cardColors(containerColor = AegisSurface),
            shape = RoundedCornerShape(12.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp)) {
                Text("Cryptographic Hardware Identity", fontWeight = FontWeight.SemiBold, color = AegisAccent, fontSize = 13.sp)
                Spacer(modifier = Modifier.height(6.dp))
                Text("Key Algorithm: EC P-256 (SHA-256 with ECDSA)\nKeystore: AndroidKeyStore (Hardware Isolated)\nCertificate: Self-signed Device Attestation", color = AegisTextSecondary, fontSize = 12.sp, fontFamily = FontFamily.Monospace)
            }
        }

        Spacer(modifier = Modifier.weight(1f))
        Button(
            onClick = onEnrolled,
            modifier = Modifier
                .fillMaxWidth()
                .height(50.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AegisPrimary),
            shape = RoundedCornerShape(10.dp)
        ) {
            Text("Enroll & Generate Identity", fontWeight = FontWeight.SemiBold)
        }
    }
}

// 3. Dashboard Screen
@Composable
fun DashboardScreen(
    onNavigate: (String) -> Unit,
    onDisconnectAll: () -> Unit
) {
    var showDisconnectDialog by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisDarkBg)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Dashboard", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = AegisTextPrimary)
                Text("Aegis Security Operations Cockpit", color = AegisTextSecondary, fontSize = 12.sp)
            }
            IconButton(onClick = { onNavigate("security_center") }) {
                Icon(Icons.Default.Security, contentDescription = "Security", tint = AegisAccent)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
        // Quick Action Row: Pair Device & Emergency Disconnect
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            Button(
                onClick = { onNavigate("pair_device") },
                colors = ButtonDefaults.buttonColors(containerColor = AegisPrimary),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.QrCodeScanner, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Pair Device", fontSize = 13.sp)
            }
            Button(
                onClick = { showDisconnectDialog = true },
                colors = ButtonDefaults.buttonColors(containerColor = AegisDanger),
                shape = RoundedCornerShape(8.dp),
                modifier = Modifier.weight(1f)
            ) {
                Icon(Icons.Default.PowerSettingsNew, contentDescription = null, modifier = Modifier.size(18.dp))
                Spacer(modifier = Modifier.width(6.dp))
                Text("Disconnect All", fontSize = 13.sp)
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
        // Stats Overview Cards
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(10.dp)
        ) {
            StatusStatCard(title = "Registered", count = "2 Devices", status = "Online", color = AegisAccent, modifier = Modifier.weight(1f))
            StatusStatCard(title = "Active Sessions", count = "1 Running", status = "Encrypted", color = AegisPrimary, modifier = Modifier.weight(1f))
        }

        Spacer(modifier = Modifier.height(16.dp))
        Text("Quick Navigation", fontWeight = FontWeight.SemiBold, color = AegisTextPrimary, fontSize = 14.sp)
        Spacer(modifier = Modifier.height(8.dp))

        // Grid / List of Navigation screens
        val navItems = listOf(
            Triple("My Devices", "View and revoke paired devices", "my_devices"),
            Triple("Live Screen Stream", "Real-time WebRTC display", "live_screen"),
            Triple("File Transfer", "Secure peer-to-peer files", "file_transfer"),
            Triple("Active Sessions", "Inspect and pause sessions", "active_sessions"),
            Triple("Connection History", "Audit log of past events", "history"),
            Triple("Security Center", "Zero-trust status & tokens", "security_center"),
            Triple("Settings", "Signaling and server configs", "settings"),
            Triple("Help & Troubleshooting", "Permissions & WebRTC guide", "help"),
            Triple("About Developer", "Security pledge & architecture", "about")
        )

        LazyColumn(
            modifier = Modifier.weight(1f),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(navItems) { item ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onNavigate(item.third) },
                    colors = CardDefaults.cardColors(containerColor = AegisSurface),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text(item.first, fontWeight = FontWeight.SemiBold, color = AegisTextPrimary, fontSize = 14.sp)
                            Text(item.second, color = AegisTextSecondary, fontSize = 12.sp)
                        }
                        Icon(Icons.Default.ChevronRight, contentDescription = null, tint = AegisTextSecondary)
                    }
                }
            }
        }
    }

    if (showDisconnectDialog) {
        AlertDialog(
            onDismissRequest = { showDisconnectDialog = false },
            title = { Text("Emergency Disconnect All") },
            text = { Text("This will immediately terminate all active screen shares, accessibility bindings, and signaling connections across all devices.") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDisconnectDialog = false
                        onDisconnectAll()
                    },
                    colors = ButtonDefaults.textButtonColors(contentColor = AegisDanger)
                ) {
                    Text("Disconnect Everything")
                }
            },
            dismissButton = {
                TextButton(onClick = { showDisconnectDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
fun StatusStatCard(title: String, count: String, status: String, color: Color, modifier: Modifier = Modifier) {
    Card(
        modifier = modifier,
        colors = CardDefaults.cardColors(containerColor = AegisSurface),
        shape = RoundedCornerShape(10.dp)
    ) {
        Column(modifier = Modifier.padding(12.dp)) {
            Text(title, color = AegisTextSecondary, fontSize = 11.sp)
            Text(count, fontWeight = FontWeight.Bold, color = AegisTextPrimary, fontSize = 16.sp)
            Spacer(modifier = Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Box(modifier = Modifier.size(6.dp).clip(CircleShape).background(color))
                Spacer(modifier = Modifier.width(4.dp))
                Text(status, color = color, fontSize = 11.sp, fontWeight = FontWeight.Medium)
            }
        }
    }
}

// 4. My Devices Screen
@Composable
fun DevicesScreen(onDeviceClick: (String) -> Unit, onRevokeDevice: (String) -> Unit) {
    val sampleDevices = listOf(
        Triple("dev-pixel8-01", "Pixel 8 Pro (Work)", "Online • 88% Battery • Android 14"),
        Triple("dev-galaxy-s24", "Samsung Galaxy S24 Ultra", "Online • 64% Battery • Android 14")
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisDarkBg)
            .padding(16.dp)
    ) {
        Text("Authorized Devices", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = AegisTextPrimary)
        Text("Devices with valid mutual cryptographic authorization.", color = AegisTextSecondary, fontSize = 12.sp)

        Spacer(modifier = Modifier.height(16.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(10.dp)) {
            items(sampleDevices) { dev ->
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clickable { onDeviceClick(dev.first) },
                    colors = CardDefaults.cardColors(containerColor = AegisSurface),
                    shape = RoundedCornerShape(10.dp)
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(14.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Column(modifier = Modifier.weight(1f)) {
                            Text(dev.second, fontWeight = FontWeight.Bold, color = AegisTextPrimary, fontSize = 14.sp)
                            Text(dev.third, color = AegisTextSecondary, fontSize = 12.sp)
                        }
                        IconButton(onClick = { onRevokeDevice(dev.first) }) {
                            Icon(Icons.Default.DeleteOutline, contentDescription = "Revoke", tint = AegisDanger)
                        }
                    }
                }
            }
        }
    }
}

// 5. Pair New Device Screen
@Composable
fun PairDeviceScreen(onPairSuccess: () -> Unit) {
    var pairingCode by remember { mutableStateOf("482915") }
    var secondsRemaining by remember { mutableStateOf(294) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisDarkBg)
            .padding(20.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text("Pair New Device", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = AegisTextPrimary)
        Text("Enter this code on the target phone or scan the QR code.", color = AegisTextSecondary, fontSize = 12.sp, textAlign = TextAlign.Center)

        Spacer(modifier = Modifier.height(30.dp))
        Card(
            modifier = Modifier
                .size(200.dp)
                .border(2.dp, AegisPrimary.copy(alpha = 0.5f), RoundedCornerShape(16.dp)),
            colors = CardDefaults.cardColors(containerColor = AegisSurface),
            shape = RoundedCornerShape(16.dp)
        ) {
            Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                Icon(Icons.Default.QrCode2, contentDescription = "QR Code", tint = AegisTextPrimary, modifier = Modifier.size(150.dp))
            }
        }

        Spacer(modifier = Modifier.height(24.dp))
        Text("One-Time Cryptographic Code", color = AegisTextSecondary, fontSize = 12.sp)
        Text(
            text = "${pairingCode.substring(0, 3)} ${pairingCode.substring(3)}",
            fontSize = 36.sp,
            fontWeight = FontWeight.Bold,
            color = AegisAccent,
            fontFamily = FontFamily.Monospace
        )
        Text("Expires in ${secondsRemaining / 60}m ${secondsRemaining % 60}s", color = AegisWarning, fontSize = 12.sp)

        Spacer(modifier = Modifier.height(32.dp))
        Button(
            onClick = onPairSuccess,
            modifier = Modifier.fillMaxWidth().height(48.dp),
            colors = ButtonDefaults.buttonColors(containerColor = AegisPrimary),
            shape = RoundedCornerShape(8.dp)
        ) {
            Text("Simulate Target Confirmation")
        }
    }
}

// 6. Device Details Screen
@Composable
fun DeviceDetailsScreen(deviceId: String, onRevoke: () -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisDarkBg)
            .padding(16.dp)
    ) {
        Text("Device Details", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = AegisTextPrimary)
        Text("ID: $deviceId", color = AegisTextSecondary, fontSize = 12.sp, fontFamily = FontFamily.Monospace)

        Spacer(modifier = Modifier.height(16.dp))
        Card(
            colors = CardDefaults.cardColors(containerColor = AegisSurface),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                DetailRow("Hardware Model", "Google Pixel 8 Pro (shiba)")
                DetailRow("Operating System", "Android 14 (API Level 34)")
                DetailRow("App Version", "1.0.0-prod (Release)")
                DetailRow("Hardware Key", "EC P-256 (AndroidKeyStore)")
                DetailRow("Status", "Online (WiFi 5GHz)")
                DetailRow("Last Connected", "Just now")
            }
        }

        Spacer(modifier = Modifier.height(20.dp))
        Text("Authorized Permissions", fontWeight = FontWeight.SemiBold, color = AegisTextPrimary, fontSize = 14.sp)
        Spacer(modifier = Modifier.height(8.dp))
        PermissionToggleRow("MediaProjection Screen Share", true)
        PermissionToggleRow("Accessibility Touch Gestures", true)
        PermissionToggleRow("Storage File Transfer", true)
        PermissionToggleRow("Microphone Audio Capture", false)

        Spacer(modifier = Modifier.weight(1f))
        Button(
            onClick = onRevoke,
            colors = ButtonDefaults.buttonColors(containerColor = AegisDanger),
            shape = RoundedCornerShape(8.dp),
            modifier = Modifier.fillMaxWidth().height(48.dp)
        ) {
            Icon(Icons.Default.Block, contentDescription = null, modifier = Modifier.size(18.dp))
            Spacer(modifier = Modifier.width(6.dp))
            Text("Revoke Device Authorization")
        }
    }
}

@Composable
fun DetailRow(label: String, value: String) {
    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
        Text(label, color = AegisTextSecondary, fontSize = 12.sp)
        Text(value, color = AegisTextPrimary, fontSize = 12.sp, fontWeight = FontWeight.Medium)
    }
}

@Composable
fun PermissionToggleRow(title: String, initialValue: Boolean) {
    var isChecked by remember { mutableStateOf(initialValue) }
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
            .clip(RoundedCornerShape(8.dp))
            .background(AegisSurface)
            .padding(horizontal = 12.dp, vertical = 6.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(title, color = AegisTextPrimary, fontSize = 13.sp)
        Switch(
            checked = isChecked,
            onCheckedChange = { isChecked = it },
            colors = SwitchDefaults.colors(checkedThumbColor = AegisAccent, checkedTrackColor = AegisSurfaceElevated)
        )
    }
}

// 7. Live Screen Stream Screen
@Composable
fun LiveScreen(onStop: () -> Unit) {
    var isPaused by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisDarkBg)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text("Live Stream", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = AegisTextPrimary)
                Text("Pixel 8 Pro • WebRTC P2P (30 FPS, 1080p)", color = AegisTextSecondary, fontSize = 12.sp)
            }
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                Button(
                    onClick = { isPaused = !isPaused },
                    colors = ButtonDefaults.buttonColors(containerColor = AegisSurfaceElevated),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text(if (isPaused) "Resume" else "Pause", fontSize = 12.sp)
                }
                Button(
                    onClick = onStop,
                    colors = ButtonDefaults.buttonColors(containerColor = AegisDanger),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Stop", fontSize = 12.sp)
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))
        Box(
            modifier = Modifier
                .weight(1f)
                .fillMaxWidth()
                .clip(RoundedCornerShape(12.dp))
                .background(Color.Black)
                .border(1.dp, AegisBorder, RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center
        ) {
            if (isPaused) {
                Text("Stream Paused by User", color = AegisWarning, fontWeight = FontWeight.SemiBold)
            } else {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Icon(Icons.Default.ScreenShare, contentDescription = null, tint = AegisAccent, modifier = Modifier.size(64.dp))
                    Spacer(modifier = Modifier.height(12.dp))
                    Text("MediaProjection Live Feed Active", color = AegisTextPrimary, fontWeight = FontWeight.SemiBold)
                    Text("Touch and drag inside this canvas to dispatch gestures", color = AegisTextSecondary, fontSize = 12.sp)
                }
            }
        }
    }
}

// 8. File Transfer Screen
@Composable
fun FileTransferScreen() {
    var transferStatus by remember { mutableStateOf("Idle") }
    var progress by remember { mutableStateOf(0f) }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisDarkBg)
            .padding(16.dp)
    ) {
        Text("Secure File Transfer", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = AegisTextPrimary)
        Text("Transfer files via encrypted WebRTC DataChannel (100MB limit).", color = AegisTextSecondary, fontSize = 12.sp)

        Spacer(modifier = Modifier.height(20.dp))
        Card(
            colors = CardDefaults.cardColors(containerColor = AegisSurface),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(16.dp), horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.UploadFile, contentDescription = null, tint = AegisPrimary, modifier = Modifier.size(48.dp))
                Spacer(modifier = Modifier.height(10.dp))
                Text("Select file to transfer", fontWeight = FontWeight.SemiBold, color = AegisTextPrimary)
                Text("Only explicitly selected files are ever transmitted.", color = AegisTextSecondary, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(16.dp))
                Button(
                    onClick = {
                        transferStatus = "Transferring system_logs.txt (2.4 MB)"
                        progress = 0.65f
                    },
                    colors = ButtonDefaults.buttonColors(containerColor = AegisPrimary),
                    shape = RoundedCornerShape(8.dp)
                ) {
                    Text("Choose File via SAF")
                }
            }
        }

        if (transferStatus != "Idle") {
            Spacer(modifier = Modifier.height(16.dp))
            Card(
                colors = CardDefaults.cardColors(containerColor = AegisSurface),
                shape = RoundedCornerShape(10.dp),
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(modifier = Modifier.padding(14.dp)) {
                    Text(transferStatus, fontWeight = FontWeight.SemiBold, color = AegisTextPrimary, fontSize = 13.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    LinearProgressIndicator(
                        progress = { progress },
                        modifier = Modifier.fillMaxWidth().height(6.dp),
                        color = AegisAccent,
                        trackColor = AegisSurfaceElevated
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("SHA-256: 4e82b7931ac89... (Verified)", color = AegisTextSecondary, fontSize = 11.sp, fontFamily = FontFamily.Monospace)
                }
            }
        }
    }
}

// 9. Active Sessions Screen
@Composable
fun ActiveSessionsScreen(onTerminateSession: (String) -> Unit) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisDarkBg)
            .padding(16.dp)
    ) {
        Text("Active Sessions", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = AegisTextPrimary)
        Text("Real-time management sessions with authenticated peers.", color = AegisTextSecondary, fontSize = 12.sp)

        Spacer(modifier = Modifier.height(16.dp))
        Card(
            colors = CardDefaults.cardColors(containerColor = AegisSurface),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column {
                        Text("Session ses-a82f", fontWeight = FontWeight.Bold, color = AegisTextPrimary)
                        Text("Web Console (Chrome / Linux)", color = AegisTextSecondary, fontSize = 12.sp)
                    }
                    Button(
                        onClick = { onTerminateSession("ses-a82f") },
                        colors = ButtonDefaults.buttonColors(containerColor = AegisDanger),
                        shape = RoundedCornerShape(6.dp)
                    ) {
                        Text("Terminate", fontSize = 12.sp)
                    }
                }
                Spacer(modifier = Modifier.height(10.dp))
                Text("Duration: 14m 20s • Bandwidth: 142 MB • Status: Active", color = AegisAccent, fontSize = 11.sp)
            }
        }
    }
}

// 10. Connection History Screen
@Composable
fun HistoryScreen() {
    val history = listOf(
        Triple("Oct 25, 08:30", "Pixel 8 Pro", "Duration: 22 mins • Disconnected by user"),
        Triple("Oct 24, 19:15", "Galaxy S24 Ultra", "Duration: 8 mins • Disconnected by user"),
        Triple("Oct 23, 14:02", "Pixel 8 Pro", "Duration: 45 mins • Clean session end")
    )

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisDarkBg)
            .padding(16.dp)
    ) {
        Text("Connection History", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = AegisTextPrimary)
        Text("Auditable metadata of past sessions (no screen capture storage).", color = AegisTextSecondary, fontSize = 12.sp)

        Spacer(modifier = Modifier.height(16.dp))
        LazyColumn(verticalArrangement = Arrangement.spacedBy(8.dp)) {
            items(history) { item ->
                Card(
                    colors = CardDefaults.cardColors(containerColor = AegisSurface),
                    shape = RoundedCornerShape(8.dp),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(modifier = Modifier.padding(12.dp)) {
                        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                            Text(item.second, fontWeight = FontWeight.SemiBold, color = AegisTextPrimary, fontSize = 13.sp)
                            Text(item.first, color = AegisTextSecondary, fontSize = 11.sp)
                        }
                        Text(item.third, color = AegisTextSecondary, fontSize = 12.sp)
                    }
                }
            }
        }
    }
}

// 11. Security Center Screen
@Composable
fun SecurityCenterScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisDarkBg)
            .padding(16.dp)
    ) {
        Text("Security Center", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = AegisTextPrimary)
        Text("Cryptographic audit trail and zero-trust security postures.", color = AegisTextSecondary, fontSize = 12.sp)

        Spacer(modifier = Modifier.height(16.dp))
        Card(
            colors = CardDefaults.cardColors(containerColor = AegisSurface),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Zero-Trust Security Checklist", fontWeight = FontWeight.Bold, color = AegisAccent, fontSize = 13.sp)
                Text("✔ Mutual cryptographic pairing verification", color = AegisTextPrimary, fontSize = 12.sp)
                Text("✔ Android Keystore hardware-backed keys", color = AegisTextPrimary, fontSize = 12.sp)
                Text("✔ Explicit runtime MediaProjection consent dialog", color = AegisTextPrimary, fontSize = 12.sp)
                Text("✔ Strict AccessibilityService without window snooping", color = AegisTextPrimary, fontSize = 12.sp)
                Text("✔ WebRTC DTLS-SRTP 256-bit encryption", color = AegisTextPrimary, fontSize = 12.sp)
                Text("✔ Rate limiting against brute force pairing attempts", color = AegisTextPrimary, fontSize = 12.sp)
            }
        }
    }
}

// 12. Settings Screen
@Composable
fun SettingsScreen() {
    var signalingUrl by remember { mutableStateOf("https://aegis-remote.run.app") }
    var stunServer by remember { mutableStateOf("stun:stun.l.google.com:19302") }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisDarkBg)
            .padding(16.dp)
    ) {
        Text("Settings", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = AegisTextPrimary)
        Text("Signaling server and network configuration.", color = AegisTextSecondary, fontSize = 12.sp)

        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = signalingUrl,
            onValueChange = { signalingUrl = it },
            label = { Text("Signaling Server URL") },
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = AegisTextPrimary,
                unfocusedTextColor = AegisTextPrimary,
                focusedBorderColor = AegisPrimary,
                unfocusedBorderColor = AegisBorder
            )
        )

        Spacer(modifier = Modifier.height(12.dp))
        OutlinedTextField(
            value = stunServer,
            onValueChange = { stunServer = it },
            label = { Text("STUN Server") },
            modifier = Modifier.fillMaxWidth(),
            colors = OutlinedTextFieldDefaults.colors(
                focusedTextColor = AegisTextPrimary,
                unfocusedTextColor = AegisTextPrimary,
                focusedBorderColor = AegisPrimary,
                unfocusedBorderColor = AegisBorder
            )
        )
    }
}

// 13. Help and Troubleshooting Screen
@Composable
fun HelpScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisDarkBg)
            .padding(16.dp)
    ) {
        Text("Help & Troubleshooting", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = AegisTextPrimary)
        Text("Common questions, permission guidelines, and setup steps.", color = AegisTextSecondary, fontSize = 12.sp)

        Spacer(modifier = Modifier.height(16.dp))
        Card(
            colors = CardDefaults.cardColors(containerColor = AegisSurface),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(8.dp)) {
                Text("1. MediaProjection Permission", fontWeight = FontWeight.Bold, color = AegisPrimary, fontSize = 13.sp)
                Text("Android requires an explicit system confirmation dialog before screen capture begins. You must tap 'Start Now' on each session start.", color = AegisTextSecondary, fontSize = 12.sp)

                Text("2. Remote Accessibility Gestures", fontWeight = FontWeight.Bold, color = AegisPrimary, fontSize = 13.sp)
                Text("Navigate to Android Settings > Accessibility > AegisRemote and enable the service to permit authorized touch gesture injection.", color = AegisTextSecondary, fontSize = 12.sp)

                Text("3. WebRTC Peer-to-Peer Connectivity", fontWeight = FontWeight.Bold, color = AegisPrimary, fontSize = 13.sp)
                Text("Direct STUN works on most home/office networks. For symmetric NATs or restrictive cellular firewalls, configure a TURN relay server in Settings.", color = AegisTextSecondary, fontSize = 12.sp)
            }
        }
    }
}

// 14. About Developer Screen
@Composable
fun AboutScreen() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .background(AegisDarkBg)
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Box(
            modifier = Modifier
                .size(64.dp)
                .clip(CircleShape)
                .background(AegisPrimary.copy(alpha = 0.2f)),
            contentAlignment = Alignment.Center
        ) {
            Icon(Icons.Default.VerifiedUser, contentDescription = null, tint = AegisPrimary, modifier = Modifier.size(36.dp))
        }
        Spacer(modifier = Modifier.height(12.dp))
        Text("AegisRemote System", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold, color = AegisTextPrimary)
        Text("Version 1.0.0 (Build 100)", color = AegisTextSecondary, fontSize = 12.sp)

        Spacer(modifier = Modifier.height(20.dp))
        Card(
            colors = CardDefaults.cardColors(containerColor = AegisSurface),
            shape = RoundedCornerShape(10.dp),
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(modifier = Modifier.padding(14.dp), verticalArrangement = Arrangement.spacedBy(6.dp)) {
                Text("Security Pledge & Ethics", fontWeight = FontWeight.Bold, color = AegisAccent, fontSize = 13.sp)
                Text("AegisRemote is built strictly for authorized device management of devices you own or have explicit legal consent to manage.", color = AegisTextPrimary, fontSize = 12.sp)
                Spacer(modifier = Modifier.height(4.dp))
                Text("• Zero silent background surveillance\n• Zero password capture\n• Revocable access at all times\n• Pure WebRTC DTLS-SRTP end-to-end encryption", color = AegisTextSecondary, fontSize = 12.sp)
            }
        }
    }
}
