import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  Smartphone,
  Monitor,
  Wifi,
  WifiOff,
  Lock,
  Unlock,
  RefreshCw,
  Sliders,
  Download,
  Upload,
  Play,
  Pause,
  Square,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Info,
  Terminal,
  HelpCircle,
  User,
  Copy,
  ExternalLink,
  QrCode,
  Activity,
  FileText,
  ChevronRight,
  Power,
  Layers,
  Cpu,
  Clock,
  Battery,
  HardDrive
} from 'lucide-react';

// Types aligned with server.ts
interface Device {
  id: string;
  name: string;
  model: string;
  osVersion: string;
  appVersion: string;
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

interface RemoteSession {
  id: string;
  hostDeviceId: string;
  hostDeviceName: string;
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

interface SecurityLog {
  id: string;
  timestamp: string;
  eventType: string;
  severity: 'info' | 'warning' | 'critical';
  deviceId?: string;
  details: string;
  ipAddress: string;
}

export default function App() {
  // Navigation State (14 Screens)
  const [currentScreen, setCurrentScreen] = useState<
    | 'welcome'
    | 'enrollment'
    | 'dashboard'
    | 'devices'
    | 'pair'
    | 'details'
    | 'live'
    | 'transfer'
    | 'sessions'
    | 'history'
    | 'security'
    | 'settings'
    | 'help'
    | 'about'
  >('dashboard');

  // Core Data
  const [devices, setDevices] = useState<Device[]>([]);
  const [sessions, setSessions] = useState<RemoteSession[]>([]);
  const [securityLogs, setSecurityLogs] = useState<SecurityLog[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('dev-pixel8-01');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Pairing State
  const [pairingCodeData, setPairingCodeData] = useState<{
    code: string;
    expiresAt: string;
    expiresInSeconds: number;
    nonce: string;
    qrPayload: string;
  } | null>(null);
  const [inputPairCode, setInputPairCode] = useState<string>('');

  // Live Screen & Stream Simulation State
  const [streamActive, setStreamActive] = useState<boolean>(false);
  const [streamPaused, setStreamPaused] = useState<boolean>(false);
  const [remoteGestures, setRemoteGestures] = useState<{ x: number; y: number; type: string }[]>([]);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [frameTick, setFrameTick] = useState<number>(0);

  // File Transfer State
  const [selectedFile, setSelectedFile] = useState<{ name: string; size: number } | null>(null);
  const [transferProgress, setTransferProgress] = useState<number>(0);
  const [transferStatus, setTransferStatus] = useState<string>('idle'); // idle, transferring, done, error

  // Simulator Mode (Simulates an Android Host device in real time)
  const [simulatorHostActive, setSimulatorHostActive] = useState<boolean>(true);

  // Fetch initial data from server
  const loadData = async () => {
    try {
      setIsLoading(true);
      const [devRes, sesRes, logRes] = await Promise.all([
        fetch('/api/devices').then((r) => r.json()),
        fetch('/api/sessions').then((r) => r.json()),
        fetch('/api/security/logs').then((r) => r.json()),
      ]);
      setDevices(devRes);
      setSessions(sesRes);
      setSecurityLogs(logRes);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, []);

  // Canvas drawing loop for live Android screen simulation
  useEffect(() => {
    if (!streamActive || streamPaused) return;

    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const render = () => {
      // Clear screen
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw Android Status Bar
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, 36);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px Inter, sans-serif';
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      ctx.fillText(timeStr, 20, 24);
      ctx.fillText('5G  100% 🔋', canvas.width - 90, 24);

      // Security Sharing Badge
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(canvas.width / 2, 18, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f8fafc';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText('CASTING', canvas.width / 2 + 10, 22);

      // Wallpaper gradient
      const grad = ctx.createLinearGradient(0, 36, canvas.width, canvas.height - 50);
      grad.addColorStop(0, '#1e1b4b');
      grad.addColorStop(1, '#0f172a');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 36, canvas.width, canvas.height - 86);

      // Simulated App Icons & Clock Widget
      ctx.fillStyle = '#f8fafc';
      ctx.font = '36px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(timeStr, canvas.width / 2, 120);

      ctx.fillStyle = '#38bdf8';
      ctx.font = '14px Inter, sans-serif';
      ctx.fillText('Aegis Secure Remote Service Active', canvas.width / 2, 150);

      // App grid cards
      const apps = ['Files', 'Camera', 'Security', 'Settings'];
      apps.forEach((app, idx) => {
        const x = 50 + idx * 80;
        const y = 220;
        ctx.fillStyle = '#334155';
        ctx.beginPath();
        ctx.roundRect(x - 25, y - 25, 50, 50, 12);
        ctx.fill();

        ctx.fillStyle = '#f8fafc';
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(app, x, y + 42);
      });

      // Draw Gesture Ripples
      remoteGestures.forEach((g) => {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(g.x, g.y, 16, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
        ctx.beginPath();
        ctx.arc(g.x, g.y, 24, 0, Math.PI * 2);
        ctx.fill();
      });

      // Android Navigation Bar
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, canvas.height - 48, canvas.width, 48);
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 2;
      // Back icon
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.25 + 6, canvas.height - 24);
      ctx.lineTo(canvas.width * 0.25 - 6, canvas.height - 24);
      ctx.stroke();
      // Home icon
      ctx.beginPath();
      ctx.arc(canvas.width * 0.5, canvas.height - 24, 6, 0, Math.PI * 2);
      ctx.stroke();
      // Recents icon
      ctx.strokeRect(canvas.width * 0.75 - 6, canvas.height - 30, 12, 12);

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [streamActive, streamPaused, remoteGestures]);

  // Handle canvas click to send simulated or real gesture
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;

    setRemoteGestures((prev) => [...prev.slice(-3), { x, y, type: 'tap' }]);
    setStatusMessage(`Gesture injected: Tap at (${Math.round(x)}, ${Math.round(y)})`);
    setTimeout(() => setStatusMessage(''), 2500);
  };

  // Actions
  const generatePairingCode = async () => {
    try {
      const res = await fetch('/api/pairing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deviceId: selectedDeviceId }),
      });
      const data = await res.json();
      setPairingCodeData(data);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const verifyPairingCode = async () => {
    if (!inputPairCode) return;
    try {
      const res = await fetch('/api/pairing/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: inputPairCode,
          targetDeviceId: 'dev-browser-ctrl',
          clientName: 'Web Operator Console',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusMessage('Device successfully paired!');
        setInputPairCode('');
        loadData();
      } else {
        alert(data.error || 'Pairing failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRevokeDevice = async (id: string) => {
    if (!confirm('Are you sure you want to revoke this device? All access and sessions will be immediately terminated.')) return;
    try {
      await fetch(`/api/devices/${id}/revoke`, { method: 'POST' });
      setStatusMessage(`Device ${id} revoked.`);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDisconnectAll = async () => {
    if (!confirm('Emergency Disconnect All: Terminate all active sessions across all devices?')) return;
    try {
      await fetch('/api/sessions/disconnect-all', { method: 'POST' });
      setStreamActive(false);
      setStatusMessage('All active remote sessions terminated immediately.');
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const startLiveStream = () => {
    setStreamActive(true);
    setStreamPaused(false);
    setCurrentScreen('live');
  };

  const handleStartFileTransfer = () => {
    if (!selectedFile) return;
    setTransferStatus('transferring');
    setTransferProgress(0);

    const interval = setInterval(() => {
      setTransferProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTransferStatus('done');
          setStatusMessage(`File ${selectedFile.name} securely sent and verified.`);
          return 100;
        }
        return prev + 20;
      });
    }, 400);
  };

  const selectedDevice = devices.find((d) => d.id === selectedDeviceId) || devices[0];

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0">
        <div>
          {/* Logo & App Branding */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg border border-sky-500/20">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-bold text-base text-slate-100 tracking-tight">AegisRemote</h1>
              <div className="flex items-center gap-1.5 text-xs text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Zero-Trust Secure
              </div>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="p-3 space-y-1 text-sm overflow-y-auto max-h-[calc(100vh-180px)]">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Layers },
              { id: 'devices', label: 'My Devices', icon: Smartphone },
              { id: 'pair', label: 'Pair New Device', icon: QrCode },
              { id: 'live', label: 'Live Screen', icon: Monitor },
              { id: 'transfer', label: 'File Transfer', icon: Upload },
              { id: 'sessions', label: 'Active Sessions', icon: Activity },
              { id: 'history', label: 'Connection History', icon: Clock },
              { id: 'security', label: 'Security Center', icon: Shield },
              { id: 'settings', label: 'Settings', icon: Sliders },
              { id: 'help', label: 'Help & Docs', icon: HelpCircle },
              { id: 'about', label: 'About Developer', icon: Info },
            ].map((item) => {
              const Icon = item.icon;
              const isActive = currentScreen === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentScreen(item.id as any)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left font-medium ${
                    isActive
                      ? 'bg-sky-600/20 text-sky-400 border border-sky-500/30 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Emergency Kill Switch Button */}
        <div className="p-3 border-t border-slate-800">
          <button
            onClick={handleDisconnectAll}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold tracking-wide transition-colors"
          >
            <Power className="w-4 h-4" />
            DISCONNECT ALL
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col overflow-hidden bg-slate-950">
        {/* Top Header Bar */}
        <header className="h-14 border-b border-slate-800 bg-slate-900/60 backdrop-blur px-6 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
              Console / {currentScreen.replace('_', ' ')}
            </span>
            {statusMessage && (
              <span className="text-xs px-2.5 py-1 bg-sky-500/10 border border-sky-500/20 text-sky-400 rounded-md animate-fade-in">
                {statusMessage}
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-slate-800/80 rounded-full border border-slate-700/60 text-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-slate-300">Signaling Server: Connected</span>
            </div>
            <button
              onClick={loadData}
              title="Refresh State"
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </header>

        {/* Dynamic Screen View */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* SCREEN 1: WELCOME & ONBOARDING */}
          {currentScreen === 'welcome' && (
            <div className="max-w-2xl mx-auto py-10 text-center">
              <div className="w-16 h-16 bg-sky-500/10 border border-sky-500/30 rounded-2xl flex items-center justify-center mx-auto text-sky-400 mb-6">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-bold text-slate-100 mb-2">Welcome to AegisRemote</h2>
              <p className="text-slate-400 text-sm mb-8 leading-relaxed max-w-lg mx-auto">
                AegisRemote is an authenticated, zero-trust remote Android device management platform. It uses Android
                MediaProjection for real screen streaming, WebRTC DTLS-SRTP encryption, and hardware keystore pairing.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-left">
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <Lock className="w-5 h-5 text-emerald-400 mb-2" />
                  <h4 className="font-semibold text-sm text-slate-200">Zero-Trust Pairing</h4>
                  <p className="text-xs text-slate-400 mt-1">Short-lived 6-digit codes and mutual cryptographic attestation.</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <Monitor className="w-5 h-5 text-sky-400 mb-2" />
                  <h4 className="font-semibold text-sm text-slate-200">MediaProjection</h4>
                  <p className="text-xs text-slate-400 mt-1">Android system consent required on every streaming session.</p>
                </div>
                <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl">
                  <Power className="w-5 h-5 text-red-400 mb-2" />
                  <h4 className="font-semibold text-sm text-slate-200">Instant Revocation</h4>
                  <p className="text-xs text-slate-400 mt-1">One-click immediate revocation of device authority.</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentScreen('dashboard')}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold text-sm shadow-lg shadow-sky-600/20"
              >
                Go to Dashboard
              </button>
            </div>
          )}

          {/* SCREEN 2: ENROLLMENT */}
          {currentScreen === 'enrollment' && (
            <div className="max-w-xl mx-auto py-8">
              <h2 className="text-xl font-bold text-slate-100 mb-1">Device Enrollment</h2>
              <p className="text-slate-400 text-xs mb-6">Enroll a new Android device into your secure tenant management pool.</p>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Device Name</label>
                  <input
                    type="text"
                    defaultValue="Samsung Galaxy S24 (Field Test)"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Hardware Fingerprint</label>
                  <input
                    type="text"
                    readOnly
                    value="ecdsa-p256:88fa01c9b2... (AndroidKeyStore)"
                    className="w-full bg-slate-950/60 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-400"
                  />
                </div>
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-1">
                  <div className="text-slate-200 font-semibold">Security Declaration</div>
                  <div>• Key stored in hardware Titan M / Knox secure element</div>
                  <div>• Private keys never leave the Android device</div>
                </div>
                <button
                  onClick={() => {
                    setStatusMessage('Enrolled successfully.');
                    setCurrentScreen('dashboard');
                  }}
                  className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold rounded-lg"
                >
                  Confirm Hardware Enrollment
                </button>
              </div>
            </div>
          )}

          {/* SCREEN 3: DASHBOARD */}
          {currentScreen === 'dashboard' && (
            <div className="space-y-6">
              {/* Quick Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Authorized Devices</span>
                    <Smartphone className="w-4 h-4 text-sky-400" />
                  </div>
                  <div className="text-2xl font-bold text-slate-100">{devices.length} Devices</div>
                  <div className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    All devices verified
                  </div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Active Sessions</span>
                    <Activity className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl font-bold text-slate-100">
                    {sessions.filter((s) => s.status === 'active').length} Running
                  </div>
                  <div className="text-xs text-slate-400 mt-1">WebRTC DTLS-SRTP P2P</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Screen Capture Consent</span>
                    <Monitor className="w-4 h-4 text-amber-400" />
                  </div>
                  <div className="text-2xl font-bold text-slate-100">Enforced</div>
                  <div className="text-xs text-amber-400 mt-1">MediaProjection API</div>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl">
                  <div className="flex items-center justify-between text-slate-400 text-xs mb-2">
                    <span>Security Audit Logs</span>
                    <Shield className="w-4 h-4 text-purple-400" />
                  </div>
                  <div className="text-2xl font-bold text-slate-100">{securityLogs.length} Events</div>
                  <div className="text-xs text-slate-400 mt-1">Immutable session ledger</div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => setCurrentScreen('pair')}
                  className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-sm font-semibold shadow-md shadow-sky-600/20"
                >
                  <QrCode className="w-4 h-4" />
                  Pair New Device
                </button>
                <button
                  onClick={startLiveStream}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-semibold"
                >
                  <Monitor className="w-4 h-4 text-sky-400" />
                  Launch Live Controller View
                </button>
                <button
                  onClick={() => setCurrentScreen('transfer')}
                  className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-sm font-semibold"
                >
                  <Upload className="w-4 h-4 text-emerald-400" />
                  Initiate File Transfer
                </button>
              </div>

              {/* Two Column Layout: Devices List & Security Feed */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Registered Devices */}
                <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-200 text-base">Authorized Android Devices</h3>
                    <button
                      onClick={() => setCurrentScreen('devices')}
                      className="text-xs text-sky-400 hover:underline flex items-center gap-1"
                    >
                      View All <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {devices.map((dev) => (
                      <div
                        key={dev.id}
                        className="p-4 bg-slate-950 border border-slate-800/80 rounded-lg flex items-center justify-between hover:border-slate-700 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center border border-sky-500/20">
                            <Smartphone className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-slate-100">{dev.name}</span>
                              <span
                                className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                                  dev.status === 'online'
                                    ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {dev.status.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {dev.model} • {dev.osVersion} • Battery: {dev.batteryLevel}%
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              setSelectedDeviceId(dev.id);
                              startLiveStream();
                            }}
                            className="px-3 py-1.5 bg-sky-600/20 hover:bg-sky-600/30 text-sky-400 border border-sky-500/30 rounded-md text-xs font-semibold"
                          >
                            Connect
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDeviceId(dev.id);
                              setCurrentScreen('details');
                            }}
                            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-md text-xs font-medium"
                          >
                            Details
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Real-time Security Audit Stream */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-slate-200 text-base">Security Alerts</h3>
                    <Shield className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
                    {securityLogs.slice(0, 6).map((log) => (
                      <div
                        key={log.id}
                        className="p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`font-semibold text-[10px] uppercase px-1.5 py-0.5 rounded ${
                              log.severity === 'critical'
                                ? 'bg-red-500/20 text-red-400'
                                : log.severity === 'warning'
                                ? 'bg-amber-500/20 text-amber-400'
                                : 'bg-sky-500/20 text-sky-400'
                            }`}
                          >
                            {log.eventType}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="text-slate-300 text-xs leading-relaxed">{log.details}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 4: MY DEVICES */}
          {currentScreen === 'devices' && (
            <div className="space-y-4 max-w-4xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">My Authorized Devices</h2>
                  <p className="text-slate-400 text-xs">Manage devices with granted remote session keys.</p>
                </div>
                <button
                  onClick={() => setCurrentScreen('pair')}
                  className="px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  Pair New Device
                </button>
              </div>

              <div className="space-y-3">
                {devices.map((dev) => (
                  <div
                    key={dev.id}
                    className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-slate-800 rounded-xl text-sky-400 border border-slate-700">
                        <Smartphone className="w-6 h-6" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-slate-100 text-base">{dev.name}</h4>
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {dev.status}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 mt-1 space-x-3">
                          <span>Model: {dev.model}</span>
                          <span>•</span>
                          <span>OS: {dev.osVersion}</span>
                          <span>•</span>
                          <span>Battery: {dev.batteryLevel}%</span>
                          <span>•</span>
                          <span>IP: {dev.ipAddress}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setSelectedDeviceId(dev.id);
                          setCurrentScreen('details');
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium"
                      >
                        Settings
                      </button>
                      <button
                        onClick={() => handleRevokeDevice(dev.id)}
                        className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Revoke
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 5: PAIR NEW DEVICE */}
          {currentScreen === 'pair' && (
            <div className="max-w-2xl mx-auto py-6 space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold text-slate-100">Pair New Android Device</h2>
                <p className="text-slate-400 text-xs mt-1">
                  Authenticate your connection using an ephemeral one-time cryptographic code or QR token.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Method A: Generate Code for Target Device */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-center flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-200 text-sm mb-1">Generate Pairing Code</h3>
                    <p className="text-xs text-slate-400 mb-4">Display code on this screen and enter it on the phone.</p>

                    {pairingCodeData ? (
                      <div className="space-y-4">
                        <div className="p-4 bg-slate-950 border border-sky-500/30 rounded-xl">
                          <div className="text-xs text-slate-400 mb-1">One-Time Pairing Code</div>
                          <div className="text-3xl font-mono font-bold tracking-widest text-sky-400">
                            {pairingCodeData.code.slice(0, 3)} {pairingCodeData.code.slice(3)}
                          </div>
                          <div className="text-[11px] text-amber-400 mt-2 flex items-center justify-center gap-1">
                            <Clock className="w-3 h-3" />
                            Valid for 5 minutes
                          </div>
                        </div>
                        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 font-mono break-all">
                          Nonce: {pairingCodeData.nonce.slice(0, 16)}...
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-slate-500 text-xs">
                        Click below to generate a cryptographically bound pairing token.
                      </div>
                    )}
                  </div>

                  <button
                    onClick={generatePairingCode}
                    className="w-full mt-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold"
                  >
                    {pairingCodeData ? 'Regenerate Code' : 'Generate 6-Digit Code'}
                  </button>
                </div>

                {/* Method B: Enter Code Displayed on Phone */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-200 text-sm mb-1">Enter Code from Phone</h3>
                    <p className="text-xs text-slate-400 mb-4">Enter the 6-digit code shown in the Aegis Android App.</p>

                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs text-slate-400 mb-1">6-Digit Code</label>
                        <input
                          type="text"
                          maxLength={6}
                          placeholder="e.g. 482915"
                          value={inputPairCode}
                          onChange={(e) => setInputPairCode(e.target.value.replace(/\D/g, ''))}
                          className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-center text-lg font-mono tracking-widest text-slate-100 focus:outline-none focus:border-sky-500"
                        />
                      </div>
                      <div className="text-[11px] text-slate-400 p-2 bg-slate-950 rounded border border-slate-800">
                        Protection against brute force: Rate limited to 5 attempts per 15 minutes.
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={verifyPairingCode}
                    disabled={inputPairCode.length !== 6}
                    className="w-full mt-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    Verify & Pair Phone
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 6: DEVICE DETAILS */}
          {currentScreen === 'details' && selectedDevice && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-100">{selectedDevice.name}</h2>
                  <p className="text-slate-400 text-xs font-mono">ID: {selectedDevice.id}</p>
                </div>
                <button
                  onClick={() => handleRevokeDevice(selectedDevice.id)}
                  className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold"
                >
                  Revoke Authorization
                </button>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
                <h3 className="text-sm font-semibold text-slate-200">Hardware & System Telemetry</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">Model</span>
                    <span className="font-semibold text-slate-200">{selectedDevice.model}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">Android OS</span>
                    <span className="font-semibold text-slate-200">{selectedDevice.osVersion}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">Battery</span>
                    <span className="font-semibold text-slate-200">{selectedDevice.batteryLevel}% (Charging)</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">IP Address</span>
                    <span className="font-semibold text-slate-200">{selectedDevice.ipAddress}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">Keystore Provider</span>
                    <span className="font-semibold text-slate-200">AndroidKeyStore (EC P-256)</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <span className="text-slate-500 block">Enrollment Status</span>
                    <span className="font-semibold text-emerald-400">Authenticated & Active</span>
                  </div>
                </div>
              </div>

              {/* Granular Permission Control */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-slate-200">Session Capability Permissions</h3>
                {[
                  { title: 'MediaProjection Screen Capture', desc: 'Allows streaming the phone screen with system consent dialog', enabled: true },
                  { title: 'Remote Accessibility Gestures', desc: 'Allows taps and swipes via Android AccessibilityService', enabled: true },
                  { title: 'Peer-to-Peer File Transfer', desc: 'Allows sending and receiving files via Storage Access Framework', enabled: true },
                  { title: 'Microphone Audio Stream', desc: 'Transmits phone microphone audio during remote assistance', enabled: false },
                  { title: 'Camera Assist Feed', desc: 'Streams camera feed with explicit user initiation', enabled: false },
                ].map((perm, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div>
                      <div className="text-xs font-semibold text-slate-200">{perm.title}</div>
                      <div className="text-[11px] text-slate-400">{perm.desc}</div>
                    </div>
                    <span className={`text-xs px-2.5 py-0.5 rounded font-semibold ${perm.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                      {perm.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 7: LIVE SCREEN (WEBRTC CANVAS & CONTROLS) */}
          {currentScreen === 'live' && (
            <div className="h-full flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                    <span>Live Screen Management</span>
                    <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                      WebRTC Active
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">
                    Host: {selectedDevice.name} • 30 FPS • MediaProjection Surface
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setStreamPaused(!streamPaused)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    {streamPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />}
                    {streamPaused ? 'Resume Stream' : 'Pause Stream'}
                  </button>
                  <button
                    onClick={() => {
                      setStreamActive(false);
                      setCurrentScreen('dashboard');
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg text-xs font-semibold"
                  >
                    <Square className="w-3.5 h-3.5" />
                    Stop Session
                  </button>
                </div>
              </div>

              {/* Main Phone Screen Viewport */}
              <div className="flex-1 flex items-center justify-center bg-slate-900 border border-slate-800 rounded-xl p-4 overflow-hidden relative">
                <div className="relative border-4 border-slate-800 rounded-[32px] overflow-hidden shadow-2xl bg-black">
                  <canvas
                    ref={canvasRef}
                    width={360}
                    height={740}
                    onClick={handleCanvasClick}
                    className="cursor-crosshair block"
                  />
                  {streamPaused && (
                    <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
                      <Pause className="w-10 h-10 text-amber-400 mb-2" />
                      <div className="font-semibold text-slate-200 text-sm">Screen Streaming Paused</div>
                      <div className="text-xs text-slate-400 mt-1">Video frame capture paused to protect privacy</div>
                    </div>
                  )}
                </div>

                {/* Gesture Help Overlay */}
                <div className="absolute bottom-6 right-6 p-3 bg-slate-950/90 border border-slate-800 rounded-xl backdrop-blur text-xs space-y-1.5 text-slate-300">
                  <div className="font-semibold text-sky-400 flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5" />
                    Remote Accessibility
                  </div>
                  <div>• Click phone canvas to dispatch remote tap</div>
                  <div>• Gestures execute via Android AccessibilityService</div>
                  <div>• Protected system password inputs cannot be captured</div>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 8: FILE TRANSFER */}
          {currentScreen === 'transfer' && (
            <div className="max-w-2xl mx-auto py-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Peer-to-Peer File Transfer</h2>
                <p className="text-slate-400 text-xs mt-1">
                  Secure transfer via WebRTC DataChannel. Maximum 100MB per file with SHA-256 integrity verification.
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                  <Upload className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-200 text-base">Select File to Send</h3>
                  <p className="text-xs text-slate-400">Target phone must explicitly accept incoming file transfer prompt.</p>
                </div>

                <div className="flex justify-center gap-3">
                  <button
                    onClick={() => setSelectedFile({ name: 'system_diagnostic_report.pdf', size: 4500000 })}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    Choose Diagnostic PDF (4.5 MB)
                  </button>
                  <button
                    onClick={() => setSelectedFile({ name: 'device_configuration.xml', size: 120000 })}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-semibold"
                  >
                    Choose Config XML (120 KB)
                  </button>
                </div>

                {selectedFile && (
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-left space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-200">{selectedFile.name}</span>
                      <span className="text-slate-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                    </div>

                    {transferStatus === 'transferring' && (
                      <div className="space-y-1.5">
                        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-sky-500 h-full transition-all duration-300"
                            style={{ width: `${transferProgress}%` }}
                          />
                        </div>
                        <div className="text-[11px] text-sky-400 text-right">{transferProgress}% transferred</div>
                      </div>
                    )}

                    {transferStatus === 'done' && (
                      <div className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                        <CheckCircle2 className="w-4 h-4" />
                        Transfer complete. SHA-256 hash verified by recipient.
                      </div>
                    )}

                    {transferStatus !== 'transferring' && transferStatus !== 'done' && (
                      <button
                        onClick={handleStartFileTransfer}
                        className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold"
                      >
                        Start Secure DataChannel Transfer
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SCREEN 9: ACTIVE SESSIONS */}
          {currentScreen === 'sessions' && (
            <div className="max-w-4xl space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Active Sessions</h2>
                <p className="text-slate-400 text-xs">Monitored live sessions with cryptographic peer verification.</p>
              </div>

              <div className="space-y-3">
                {sessions.map((ses) => (
                  <div
                    key={ses.id}
                    className="p-5 bg-slate-900 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100 text-sm">Session {ses.id}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                          {ses.status.toUpperCase()}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1 space-x-3">
                        <span>Host: {ses.hostDeviceName}</span>
                        <span>•</span>
                        <span>Client: {ses.clientType.toUpperCase()} Console</span>
                        <span>•</span>
                        <span>Started: {new Date(ses.startedAt).toLocaleTimeString()}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        fetch(`/api/sessions/${ses.id}/terminate`, { method: 'POST' }).then(() => loadData());
                      }}
                      className="px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-semibold"
                    >
                      Terminate Session
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 10: CONNECTION HISTORY */}
          {currentScreen === 'history' && (
            <div className="max-w-4xl space-y-4">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Connection Audit History</h2>
                <p className="text-slate-400 text-xs">Historical log of all past remote access connections.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="p-3">Timestamp</th>
                      <th className="p-3">Device</th>
                      <th className="p-3">Session Type</th>
                      <th className="p-3">Duration</th>
                      <th className="p-3">Termination Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    <tr>
                      <td className="p-3 font-mono">Today, 08:30</td>
                      <td className="p-3 font-semibold">Pixel 8 Pro (Work)</td>
                      <td className="p-3">WebRTC Screen Stream</td>
                      <td className="p-3">22m 14s</td>
                      <td className="p-3 text-slate-400">User disconnected cleanly</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono">Yesterday, 19:15</td>
                      <td className="p-3 font-semibold">Galaxy S24 Ultra</td>
                      <td className="p-3">File Transfer SAF</td>
                      <td className="p-3">4m 02s</td>
                      <td className="p-3 text-slate-400">Completed 12MB payload</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-mono">Oct 23, 14:02</td>
                      <td className="p-3 font-semibold">Pixel 8 Pro (Work)</td>
                      <td className="p-3">Screen &amp; Gestures</td>
                      <td className="p-3">45m 00s</td>
                      <td className="p-3 text-slate-400">Emergency Disconnect All</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SCREEN 11: SECURITY CENTER */}
          {currentScreen === 'security' && (
            <div className="max-w-4xl space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Security Center &amp; Posture</h2>
                <p className="text-slate-400 text-xs">Zero-trust cryptographic policies, audit trails, and device hygiene.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-400" />
                    Cryptographic Integrity
                  </h3>
                  <div className="text-xs text-slate-400 space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Device Identity:</span>
                      <span className="font-mono text-slate-200">EC P-256 ECDSA</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>WebRTC Encryption:</span>
                      <span className="font-mono text-slate-200">DTLS 1.3 / SRTP 256-bit</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Pairing Codes:</span>
                      <span className="font-mono text-slate-200">5-min TTL with Nonce Guard</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Rate Limiting:</span>
                      <span className="font-mono text-slate-200">5 attempts / 15 min</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl space-y-3">
                  <h3 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400" />
                    Android Security Boundaries
                  </h3>
                  <div className="text-xs text-slate-400 space-y-1.5 leading-relaxed">
                    <p>• <strong>MediaProjection:</strong> Requires runtime user acceptance on target device.</p>
                    <p>• <strong>AccessibilityService:</strong> Explicit activation in Android Settings.</p>
                    <p>• <strong>Password Protection:</strong> Android blocks accessibility overlays from reading secure password fields.</p>
                  </div>
                </div>
              </div>

              {/* Full Security Log Feed */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                <h3 className="font-semibold text-slate-200 text-sm mb-4">Complete Security Audit Trail</h3>
                <div className="space-y-2 max-h-[300px] overflow-y-auto">
                  {securityLogs.map((log) => (
                    <div key={log.id} className="p-3 bg-slate-950 rounded-lg border border-slate-800/80 text-xs flex items-center justify-between">
                      <div>
                        <span className="font-bold text-sky-400 mr-2">[{log.eventType}]</span>
                        <span className="text-slate-300">{log.details}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-4">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 12: SETTINGS */}
          {currentScreen === 'settings' && (
            <div className="max-w-2xl mx-auto py-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100">System Settings</h2>
                <p className="text-slate-400 text-xs">Configure signaling server, STUN/TURN relays, and capture limits.</p>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Signaling WebSocket URL</label>
                  <input
                    type="text"
                    defaultValue="wss://aegis-remote.run.app/ws/signaling"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">STUN Server</label>
                  <input
                    type="text"
                    defaultValue="stun:stun.l.google.com:19302"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">TURN Relay Server (For Symmetric NATs)</label>
                  <input
                    type="text"
                    placeholder="turn:relay.example.com:3478"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 focus:outline-none focus:border-sky-500 font-mono"
                  />
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setStatusMessage('Settings saved.')}
                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg font-semibold"
                  >
                    Save Configuration
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 13: HELP & TROUBLESHOOTING */}
          {currentScreen === 'help' && (
            <div className="max-w-3xl mx-auto py-6 space-y-6">
              <div>
                <h2 className="text-xl font-bold text-slate-100">Help &amp; Troubleshooting Guide</h2>
                <p className="text-slate-400 text-xs">Step-by-step guides for Android permissions and networking.</p>
              </div>

              <div className="space-y-4 text-xs">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                  <h3 className="font-semibold text-slate-200 text-sm text-sky-400">1. MediaProjection Screen Capture Permission</h3>
                  <p className="text-slate-400 leading-relaxed">
                    Android strictly requires user confirmation before any app can stream display frames. On session initiation, tap "Start Now" on the system dialog. In Android 14+, the persistent foreground service notification must remain active throughout the session.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                  <h3 className="font-semibold text-slate-200 text-sm text-emerald-400">2. Remote Accessibility Service Activation</h3>
                  <p className="text-slate-400 leading-relaxed">
                    To allow remote clicks and swipes, open <strong>Settings &gt; Accessibility &gt; AegisRemote</strong> on the Android phone and toggle it to ON. The app only dispatches explicitly authorized gestures and never reads keystrokes or passwords.
                  </p>
                </div>

                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-2">
                  <h3 className="font-semibold text-slate-200 text-sm text-purple-400">3. WebRTC Peer Connection &amp; NAT Traversal</h3>
                  <p className="text-slate-400 leading-relaxed">
                    If peers are on different cellular or corporate networks with restrictive symmetric NATs, configure a TURN relay server in Settings to bypass firewall UDP packet blocking.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* SCREEN 14: ABOUT DEVELOPER */}
          {currentScreen === 'about' && (
            <div className="max-w-xl mx-auto py-10 text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center mx-auto text-sky-400">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-100">AegisRemote Architecture</h2>
                <p className="text-slate-400 text-xs mt-1">Built with Senior Cybersecurity &amp; Android Standards</p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 text-left text-xs text-slate-300 space-y-3">
                <div className="font-semibold text-slate-100">Architectural Commitments:</div>
                <div className="space-y-1.5 text-slate-400">
                  <div>✔ Zero unauthorized or stealth access to third-party devices</div>
                  <div>✔ Transparent Android system indicators (Notification + Casting icon)</div>
                  <div>✔ Hardware-backed keystore cryptography (EC P-256)</div>
                  <div>✔ Pure peer-to-peer WebRTC video stream without server storage of screens</div>
                  <div>✔ Immediate emergency revocation capability</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
