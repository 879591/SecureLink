import express, { Request, Response } from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = http.createServer(app);
const port = parseInt(process.env.PORT || '3000', 10);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Security Types
export interface Device {
  id: string;
  name: string;
  model: string;
  osVersion: string;
  appVersion: string;
  publicKey?: string;
  deviceFingerprint: string;
  status: 'online' | 'offline' | 'busy';
  enrolledAt: string;
  lastSeen: string;
  batteryLevel: number;
  isCharging: boolean;
  ipAddress: string;
  authorized: boolean;
  capabilities: {
    screenShare: boolean;
    remoteInput: boolean;
    fileTransfer: boolean;
    audio: boolean;
    camera: boolean;
  };
}

export interface PairingCode {
  code: string;
  deviceId: string;
  deviceName: string;
  targetDeviceId?: string;
  createdAt: number;
  expiresAt: number;
  nonce: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  initiatorIp: string;
}

export interface RemoteSession {
  id: string;
  hostDeviceId: string;
  hostDeviceName: string;
  clientDeviceId?: string;
  clientType: 'web' | 'android';
  startedAt: string;
  lastActivity: string;
  status: 'active' | 'paused' | 'terminated';
  permissions: {
    screenShare: boolean;
    remoteInput: boolean;
    fileTransfer: boolean;
    audio: boolean;
    camera: boolean;
  };
  durationSeconds: number;
  bytesTransferred: number;
}

export interface SecurityLog {
  id: string;
  timestamp: string;
  eventType: 
    | 'PAIRING_REQUEST'
    | 'PAIRING_SUCCESS'
    | 'PAIRING_REJECTED'
    | 'SESSION_START'
    | 'SESSION_PAUSE'
    | 'SESSION_RESUME'
    | 'SESSION_TERMINATED'
    | 'DEVICE_REVOCATION'
    | 'ACCESS_DENIED'
    | 'RATE_LIMIT_EXCEEDED'
    | 'FILE_TRANSFER_REQUEST'
    | 'FILE_TRANSFER_COMPLETED'
    | 'SUSPICIOUS_ACTIVITY';
  severity: 'info' | 'warning' | 'critical';
  deviceId?: string;
  targetDeviceId?: string;
  ipAddress: string;
  details: string;
}

// In-Memory Secure State Store with Seed Data
const devices = new Map<string, Device>();
const pairingCodes = new Map<string, PairingCode>();
const sessions = new Map<string, RemoteSession>();
const securityLogs: SecurityLog[] = [];
const rateLimitMap = new Map<string, { attempts: number; windowStart: number }>();

// Seed a couple of initial devices for immediate testing and verification
const seedDevice1: Device = {
  id: 'dev-pixel8-01',
  name: 'Pixel 8 Pro (Work)',
  model: 'Google Pixel 8 Pro',
  osVersion: 'Android 14 (API 34)',
  appVersion: '1.0.0-prod',
  deviceFingerprint: 'a8f1903c7e42d99b801a243ef0b81',
  status: 'online',
  enrolledAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  lastSeen: new Date().toISOString(),
  batteryLevel: 88,
  isCharging: true,
  ipAddress: '192.168.1.142',
  authorized: true,
  capabilities: {
    screenShare: true,
    remoteInput: true,
    fileTransfer: true,
    audio: true,
    camera: true,
  },
};

const seedDevice2: Device = {
  id: 'dev-galaxy-s24',
  name: 'Samsung Galaxy S24 Ultra',
  model: 'SM-S928B',
  osVersion: 'Android 14 (OneUI 6.1)',
  appVersion: '1.0.0-prod',
  deviceFingerprint: 'ff098c117b901e6628dc43bb22998',
  status: 'online',
  enrolledAt: new Date(Date.now() - 86400000 * 7).toISOString(),
  lastSeen: new Date().toISOString(),
  batteryLevel: 64,
  isCharging: false,
  ipAddress: '192.168.1.189',
  authorized: true,
  capabilities: {
    screenShare: true,
    remoteInput: true,
    fileTransfer: true,
    audio: false,
    camera: false,
  },
};

devices.set(seedDevice1.id, seedDevice1);
devices.set(seedDevice2.id, seedDevice2);

// Security Log Helper
function addSecurityLog(
  eventType: SecurityLog['eventType'],
  severity: SecurityLog['severity'],
  details: string,
  ipAddress: string,
  deviceId?: string,
  targetDeviceId?: string
) {
  const log: SecurityLog = {
    id: 'log-' + crypto.randomUUID().slice(0, 8),
    timestamp: new Date().toISOString(),
    eventType,
    severity,
    details,
    ipAddress,
    deviceId,
    targetDeviceId,
  };
  securityLogs.unshift(log);
  if (securityLogs.length > 500) {
    securityLogs.pop();
  }
}

// Initial audit logs
addSecurityLog('PAIRING_SUCCESS', 'info', 'Pixel 8 Pro (Work) enrolled securely with hardware key certificate.', '192.168.1.142', seedDevice1.id);
addSecurityLog('PAIRING_SUCCESS', 'info', 'Samsung Galaxy S24 Ultra enrolled securely via 2FA QR exchange.', '192.168.1.189', seedDevice2.id);

// Rate Limiter Middleware for Auth & Pairing Endpoints
function rateLimiter(maxAttempts = 10, windowMs = 60000) {
  return (req: Request, res: Response, next: () => void) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    const current = rateLimitMap.get(ip) || { attempts: 0, windowStart: now };

    if (now - current.windowStart > windowMs) {
      current.attempts = 1;
      current.windowStart = now;
    } else {
      current.attempts++;
    }
    rateLimitMap.set(ip, current);

    if (current.attempts > maxAttempts) {
      addSecurityLog('RATE_LIMIT_EXCEEDED', 'warning', `Rate limit exceeded from IP ${ip}`, ip);
      res.status(429).json({ error: 'Too many requests. Please wait a moment.' });
      return;
    }
    next();
  };
}

// REST API Endpoints

// 1. Health & Status
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    uptimeSeconds: Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    devicesCount: devices.size,
    activeSessionsCount: Array.from(sessions.values()).filter((s) => s.status === 'active').length,
    version: '1.0.0',
    webrtc: {
      stun: process.env.STUN_SERVER_URL || 'stun:stun.l.google.com:19302',
      turnConfigured: !!process.env.TURN_SERVER_URL,
    },
  });
});

// 2. Devices
app.get('/api/devices', (req: Request, res: Response) => {
  res.json(Array.from(devices.values()));
});

app.get('/api/devices/:id', (req: Request, res: Response) => {
  const device = devices.get(req.params.id);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }
  res.json(device);
});

app.post('/api/devices/register', (req: Request, res: Response) => {
  const { name, model, osVersion, appVersion, deviceFingerprint, capabilities, batteryLevel, isCharging } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  if (!name || !model || !deviceFingerprint) {
    res.status(400).json({ error: 'Missing required device information' });
    return;
  }

  const id = 'dev-' + crypto.randomBytes(4).toString('hex');
  const newDevice: Device = {
    id,
    name,
    model,
    osVersion: osVersion || 'Android 14',
    appVersion: appVersion || '1.0.0',
    deviceFingerprint,
    status: 'online',
    enrolledAt: new Date().toISOString(),
    lastSeen: new Date().toISOString(),
    batteryLevel: batteryLevel ?? 100,
    isCharging: isCharging ?? false,
    ipAddress: ip,
    authorized: true,
    capabilities: capabilities || {
      screenShare: true,
      remoteInput: true,
      fileTransfer: true,
      audio: true,
      camera: false,
    },
  };

  devices.set(id, newDevice);
  addSecurityLog('PAIRING_SUCCESS', 'info', `Device registered: ${name} (${model})`, ip, id);
  res.status(201).json(newDevice);
});

// Revoke Device Access
app.post('/api/devices/:id/revoke', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const device = devices.get(req.params.id);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  device.authorized = false;
  device.status = 'offline';
  devices.set(device.id, device);

  // Terminate all sessions involving this device
  for (const session of sessions.values()) {
    if (session.hostDeviceId === device.id || session.clientDeviceId === device.id) {
      session.status = 'terminated';
      notifySessionEvent(session.id, 'session_terminated', { reason: 'Device revoked by administrator' });
    }
  }

  addSecurityLog('DEVICE_REVOCATION', 'critical', `Access revoked for device: ${device.name} (${device.id})`, ip, device.id);
  res.json({ success: true, message: `Device ${device.name} access revoked successfully.` });
});

// Delete Device
app.delete('/api/devices/:id', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const device = devices.get(req.params.id);
  if (!device) {
    res.status(404).json({ error: 'Device not found' });
    return;
  }

  devices.delete(device.id);
  addSecurityLog('DEVICE_REVOCATION', 'warning', `Device removed from management: ${device.name}`, ip, device.id);
  res.json({ success: true, message: 'Device removed successfully.' });
});

// 3. Pairing Code Generation & Verification
app.post('/api/pairing/generate', rateLimiter(10, 60000), (req: Request, res: Response) => {
  const { deviceId } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  let deviceName = 'Target Device';
  if (deviceId && devices.has(deviceId)) {
    deviceName = devices.get(deviceId)!.name;
  }

  // Generate 6-digit cryptographic pairing code
  const code = Math.floor(100000 + crypto.randomInt(900000)).toString();
  const nonce = crypto.randomBytes(16).toString('hex');
  const now = Date.now();
  const ttlMs = 5 * 60 * 1000; // 5 minutes validity

  const pairingEntry: PairingCode = {
    code,
    deviceId: deviceId || 'pending-enrollment',
    deviceName,
    createdAt: now,
    expiresAt: now + ttlMs,
    nonce,
    status: 'pending',
    initiatorIp: ip,
  };

  pairingCodes.set(code, pairingEntry);

  addSecurityLog('PAIRING_REQUEST', 'info', `Pairing code generated for ${deviceName}. Code valid for 5m.`, ip, deviceId);

  // QR Payload contains server URL, code, nonce, and expiration for offline-to-online validation
  const qrPayload = JSON.stringify({
    server: process.env.APP_URL || 'https://aegis-remote.local',
    code,
    nonce,
    exp: now + ttlMs,
  });

  res.json({
    code,
    expiresAt: new Date(now + ttlMs).toISOString(),
    expiresInSeconds: 300,
    nonce,
    qrPayload,
  });
});

app.post('/api/pairing/verify', rateLimiter(5, 60000), (req: Request, res: Response) => {
  const { code, targetDeviceId, clientName } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  if (!code) {
    res.status(400).json({ error: 'Pairing code is required' });
    return;
  }

  const pairing = pairingCodes.get(code);
  const now = Date.now();

  if (!pairing) {
    addSecurityLog('ACCESS_DENIED', 'warning', `Invalid pairing code attempt: ${code}`, ip);
    res.status(400).json({ error: 'Invalid or non-existent pairing code.' });
    return;
  }

  if (now > pairing.expiresAt) {
    pairing.status = 'expired';
    addSecurityLog('ACCESS_DENIED', 'info', `Expired pairing code attempt: ${code}`, ip);
    res.status(410).json({ error: 'Pairing code has expired. Please generate a new code.' });
    return;
  }

  if (pairing.status !== 'pending') {
    res.status(400).json({ error: `Pairing code is already ${pairing.status}.` });
    return;
  }

  // Authorize
  pairing.status = 'accepted';
  pairing.targetDeviceId = targetDeviceId;

  // Generate an authenticated session token
  const sessionToken = crypto.randomBytes(32).toString('hex');

  addSecurityLog(
    'PAIRING_SUCCESS',
    'info',
    `Pairing confirmed between client "${clientName || 'Controller'}" and "${pairing.deviceName}"`,
    ip,
    pairing.deviceId,
    targetDeviceId
  );

  res.json({
    success: true,
    message: 'Pairing successfully verified and authorized.',
    sessionToken,
    deviceId: pairing.deviceId,
    deviceName: pairing.deviceName,
  });
});

// 4. Session Management
app.get('/api/sessions', (req: Request, res: Response) => {
  res.json(Array.from(sessions.values()));
});

app.post('/api/sessions/create', (req: Request, res: Response) => {
  const { hostDeviceId, clientType = 'web', permissions } = req.body;
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';

  const hostDevice = devices.get(hostDeviceId);
  if (!hostDevice) {
    res.status(404).json({ error: 'Host device not found' });
    return;
  }

  if (!hostDevice.authorized) {
    addSecurityLog('ACCESS_DENIED', 'critical', `Attempted session creation with revoked device ${hostDevice.name}`, ip, hostDeviceId);
    res.status(403).json({ error: 'Device access is revoked' });
    return;
  }

  const sessionId = 'ses-' + crypto.randomUUID().slice(0, 8);
  const newSession: RemoteSession = {
    id: sessionId,
    hostDeviceId,
    hostDeviceName: hostDevice.name,
    clientType: clientType as 'web' | 'android',
    startedAt: new Date().toISOString(),
    lastActivity: new Date().toISOString(),
    status: 'active',
    permissions: permissions || {
      screenShare: true,
      remoteInput: true,
      fileTransfer: true,
      audio: true,
      camera: false,
    },
    durationSeconds: 0,
    bytesTransferred: 0,
  };

  sessions.set(sessionId, newSession);
  hostDevice.status = 'busy';

  addSecurityLog('SESSION_START', 'info', `Session started on device ${hostDevice.name}`, ip, hostDeviceId);
  res.status(201).json(newSession);
});

app.post('/api/sessions/:id/pause', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const session = sessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  session.status = 'paused';
  session.lastActivity = new Date().toISOString();
  notifySessionEvent(session.id, 'stream_state', { state: 'paused' });

  addSecurityLog('SESSION_PAUSE', 'info', `Screen streaming paused for session ${session.id}`, ip, session.hostDeviceId);
  res.json({ success: true, session });
});

app.post('/api/sessions/:id/resume', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const session = sessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  session.status = 'active';
  session.lastActivity = new Date().toISOString();
  notifySessionEvent(session.id, 'stream_state', { state: 'active' });

  addSecurityLog('SESSION_RESUME', 'info', `Screen streaming resumed for session ${session.id}`, ip, session.hostDeviceId);
  res.json({ success: true, session });
});

app.post('/api/sessions/:id/terminate', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const session = sessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: 'Session not found' });
    return;
  }

  session.status = 'terminated';
  session.lastActivity = new Date().toISOString();

  const dev = devices.get(session.hostDeviceId);
  if (dev && dev.status === 'busy') {
    dev.status = 'online';
  }

  notifySessionEvent(session.id, 'session_terminated', { reason: 'User initiated disconnect' });

  addSecurityLog('SESSION_TERMINATED', 'info', `Session ${session.id} terminated cleanly. Resources released.`, ip, session.hostDeviceId);
  res.json({ success: true, message: 'Session terminated successfully.' });
});

// Emergency Disconnect All Sessions
app.post('/api/sessions/disconnect-all', (req: Request, res: Response) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  let terminatedCount = 0;

  for (const session of sessions.values()) {
    if (session.status !== 'terminated') {
      session.status = 'terminated';
      notifySessionEvent(session.id, 'session_terminated', { reason: 'Emergency Disconnect All executed' });
      terminatedCount++;
    }
  }

  for (const device of devices.values()) {
    if (device.status === 'busy') {
      device.status = 'online';
    }
  }

  addSecurityLog('SESSION_TERMINATED', 'critical', `Emergency Disconnect-All triggered. Terminated ${terminatedCount} active sessions.`, ip);
  res.json({ success: true, count: terminatedCount, message: `Terminated ${terminatedCount} sessions.` });
});

// 5. Security Logs
app.get('/api/security/logs', (req: Request, res: Response) => {
  res.json(securityLogs);
});

// 6. WebRTC ICE Configuration
app.get('/api/webrtc/config', (req: Request, res: Response) => {
  const iceServers = [
    {
      urls: [process.env.STUN_SERVER_URL || 'stun:stun.l.google.com:19302', 'stun:stun1.l.google.com:19302'],
    },
  ];

  if (process.env.TURN_SERVER_URL) {
    iceServers.push({
      urls: [process.env.TURN_SERVER_URL],
      // @ts-ignore
      username: process.env.TURN_SERVER_USERNAME || undefined,
      credential: process.env.TURN_SERVER_CREDENTIAL || undefined,
    });
  }

  res.json({
    iceServers,
    maxFileSize: parseInt(process.env.MAX_FILE_TRANSFER_BYTES || '104857600', 10),
  });
});

// ==========================================
// WebSocket WebRTC Signaling Server (/ws/signaling)
// ==========================================
const wss = new WebSocketServer({ server, path: '/ws/signaling' });

interface WSClient {
  ws: WebSocket;
  deviceId?: string;
  role?: 'host' | 'controller';
  sessionId?: string;
  ip: string;
}

const connectedClients = new Map<WebSocket, WSClient>();

function notifySessionEvent(sessionId: string, type: string, payload: any) {
  const message = JSON.stringify({ type, sessionId, ...payload });
  for (const client of connectedClients.values()) {
    if (client.sessionId === sessionId && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(message);
    }
  }
}

wss.on('connection', (ws: WebSocket, req) => {
  const ip = req.socket.remoteAddress || '127.0.0.1';
  const clientInfo: WSClient = { ws, ip };
  connectedClients.set(ws, clientInfo);

  ws.on('message', (raw) => {
    try {
      const data = JSON.parse(raw.toString());
      handleSignalingMessage(ws, clientInfo, data);
    } catch (err: any) {
      ws.send(JSON.stringify({ type: 'error', message: 'Malformed JSON payload' }));
    }
  });

  ws.on('close', () => {
    if (clientInfo.deviceId) {
      const dev = devices.get(clientInfo.deviceId);
      if (dev) {
        dev.lastSeen = new Date().toISOString();
        if (dev.status === 'busy') dev.status = 'online';
      }
    }
    connectedClients.delete(ws);
  });

  ws.send(JSON.stringify({ type: 'connected', message: 'AegisRemote Secure Signaling Server ready' }));
});

function handleSignalingMessage(ws: WebSocket, client: WSClient, data: any) {
  const { type, sessionId, targetDeviceId, payload } = data;

  switch (type) {
    case 'join_session': {
      client.sessionId = sessionId;
      client.deviceId = data.deviceId;
      client.role = data.role || 'controller';

      const session = sessions.get(sessionId);
      if (session) {
        session.lastActivity = new Date().toISOString();
      }

      ws.send(JSON.stringify({ type: 'session_joined', sessionId, role: client.role }));
      break;
    }

    case 'webrtc_offer':
    case 'webrtc_answer':
    case 'ice_candidate': {
      // Forward WebRTC SDP and ICE candidates to peers in the same session
      for (const [peerWs, peerClient] of connectedClients.entries()) {
        if (peerWs !== ws && peerClient.sessionId === client.sessionId && peerWs.readyState === WebSocket.OPEN) {
          peerWs.send(JSON.stringify({
            type,
            sessionId: client.sessionId,
            senderDeviceId: client.deviceId,
            payload,
          }));
        }
      }
      break;
    }

    case 'remote_input': {
      // Forward touch/mouse gesture to host device
      const session = sessions.get(client.sessionId || '');
      if (session && !session.permissions.remoteInput) {
        ws.send(JSON.stringify({ type: 'error', message: 'Remote input permission denied by host.' }));
        return;
      }

      for (const [peerWs, peerClient] of connectedClients.entries()) {
        if (peerWs !== ws && peerClient.sessionId === client.sessionId && peerClient.role === 'host' && peerWs.readyState === WebSocket.OPEN) {
          peerWs.send(JSON.stringify({
            type: 'remote_input',
            sessionId: client.sessionId,
            gesture: payload,
          }));
        }
      }
      break;
    }

    case 'stream_state': {
      // Screen share state update: started, paused, stopped
      for (const [peerWs, peerClient] of connectedClients.entries()) {
        if (peerWs !== ws && peerClient.sessionId === client.sessionId && peerWs.readyState === WebSocket.OPEN) {
          peerWs.send(JSON.stringify({
            type: 'stream_state',
            sessionId: client.sessionId,
            state: payload.state,
          }));
        }
      }
      break;
    }

    case 'file_transfer_request': {
      // Forward file transfer request with explicit confirmation required
      for (const [peerWs, peerClient] of connectedClients.entries()) {
        if (peerWs !== ws && peerClient.sessionId === client.sessionId && peerWs.readyState === WebSocket.OPEN) {
          peerWs.send(JSON.stringify({
            type: 'file_transfer_request',
            sessionId: client.sessionId,
            fileMeta: payload,
          }));
        }
      }
      break;
    }

    case 'file_transfer_response': {
      // User consent response: accepted or rejected
      for (const [peerWs, peerClient] of connectedClients.entries()) {
        if (peerWs !== ws && peerClient.sessionId === client.sessionId && peerWs.readyState === WebSocket.OPEN) {
          peerWs.send(JSON.stringify({
            type: 'file_transfer_response',
            sessionId: client.sessionId,
            accepted: payload.accepted,
          }));
        }
      }
      break;
    }

    case 'ping': {
      ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
      break;
    }

    default:
      ws.send(JSON.stringify({ type: 'unknown_message', receivedType: type }));
  }
}

// Full-Stack: mount Vite middleware in development mode
async function startServer() {
  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(port, '0.0.0.0', () => {
    console.log(`[AegisRemote] Server listening on port ${port} in ${isProduction ? 'production' : 'development'} mode`);
    console.log(`[AegisRemote] WebSocket signaling mounted at /ws/signaling`);
  });
}

startServer().catch((err) => {
  console.error('[AegisRemote] Failed to start server:', err);
  process.exit(1);
});
