package com.aegisremote.android.ui.theme

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.runtime.Composable

private val DarkColorScheme = darkColorScheme(
    primary = AegisPrimary,
    secondary = AegisAccent,
    background = AegisDarkBg,
    surface = AegisSurface,
    onPrimary = AegisTextPrimary,
    onSecondary = AegisTextPrimary,
    onBackground = AegisTextPrimary,
    onSurface = AegisTextPrimary,
    error = AegisDanger
)

@Composable
fun AegisRemoteTheme(
    darkTheme: Boolean = true, // AegisRemote defaults to dark security cockpit mode
    content: @Composable () -> Unit
) {
    MaterialTheme(
        colorScheme = DarkColorScheme,
        content = content
    )
}
