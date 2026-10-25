# Backend Deployment Guide — AegisRemote

The AegisRemote backend is an authenticated Express and WebSocket signaling server built with TypeScript, Node.js, and WebRTC signaling primitives.

---

## 1. System Requirements
- Node.js: v20.x or v22.x LTS
- Memory: 512 MB minimum (1 GB recommended)
- Ports:
  - `3000` (or `PORT` environment variable) for HTTP REST API and WebSocket (`/ws/signaling`)
  - Outbound UDP `19302` for Google STUN or custom STUN/TURN relays

---

## 2. Environment Variables Configuration

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Key environment parameters:

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `PORT` | Listening port for Express & WebSockets | `3000` |
| `JWT_SECRET` | 32+ character random secret for signing session tokens | `aegis-remote-super-secure-production-key-change-me-32b` |
| `STUN_SERVER_URL` | Public STUN server for ICE candidate discovery | `stun:stun.l.google.com:19302` |
| `TURN_SERVER_URL` | Optional TURN relay for restrictive symmetric NATs | `turn:relay.yourdomain.com:3478` |
| `TURN_SERVER_USERNAME`| TURN auth username | `aegis-user` |
| `TURN_SERVER_CREDENTIAL`| TURN auth password/secret | `aegis-turn-secret` |
| `MAX_FILE_TRANSFER_BYTES` | Maximum allowed file size for peer data transfers | `104857600` (100 MB) |

---

## 3. Local & Production Execution

### Local Development:
```bash
npm install
npm run dev
```

### Running Automated Test Suite:
```bash
npm test
```

### Production Build:
```bash
npm run build
npm start
```

---

## 4. Container Deployment (Docker)

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t aegis-remote-backend:latest .
docker run -d -p 3000:3000 --env-file .env --name aegis-backend aegis-remote-backend:latest
```

---

## 5. TURN Server Setup (Coturn for Symmetric NAT Traversal)

Direct WebRTC P2P works when at least one peer has a non-symmetric NAT. For restrictive corporate firewalls or symmetric mobile carrier NATs, deploy an open-source Coturn instance:

```bash
sudo apt-get install coturn
sudo systemctl enable coturn
```

Edit `/etc/turnserver.conf`:
```ini
listening-port=3478
tls-listening-port=5349
realm=yourdomain.com
fingerprint
lt-cred-mech
user=aegis-user:aegis-turn-secret
total-quota=100
bps-capacity=0
stale-nonce
no-loopback-peers
no-multicast-peers
```

Point `TURN_SERVER_URL="turn:yourdomain.com:3478"` in your AegisRemote `.env`.

---

## 6. Health Check Endpoint

Query `/api/health` to verify server availability and WebRTC ICE configuration:

```bash
curl http://localhost:3000/api/health
```

Expected JSON:
```json
{
  "status": "healthy",
  "uptimeSeconds": 1420,
  "devicesCount": 2,
  "activeSessionsCount": 1,
  "version": "1.0.0",
  "webrtc": {
    "stun": "stun:stun.l.google.com:19302",
    "turnConfigured": false
  }
}
```
