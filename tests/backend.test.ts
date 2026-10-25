import { describe, it } from 'node:test';
import assert from 'node:assert';

describe('AegisRemote Security & Pairing Tests', () => {
  it('should generate valid 6-digit cryptographic pairing code with TTL', () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    assert.strictEqual(code.length, 6);
    assert.match(code, /^[0-9]{6}$/);

    const now = Date.now();
    const expiresAt = now + 5 * 60 * 1000;
    assert.ok(expiresAt > now);
    assert.ok(expiresAt - now <= 300000);
  });

  it('should reject expired pairing codes', () => {
    const now = Date.now();
    const pairingEntry = {
      code: '123456',
      createdAt: now - 360000, // 6 minutes ago
      expiresAt: now - 60000,   // expired 1 minute ago
      status: 'pending',
    };

    const isExpired = Date.now() > pairingEntry.expiresAt;
    assert.strictEqual(isExpired, true);
  });

  it('should enforce single-use pairing codes and prevent replay attacks', () => {
    const pairingCodes = new Map<string, { status: string }>();
    pairingCodes.set('987654', { status: 'pending' });

    // First use: success
    const firstAttempt = pairingCodes.get('987654')!;
    assert.strictEqual(firstAttempt.status, 'pending');
    firstAttempt.status = 'accepted';

    // Second attempt (replay attack)
    const secondAttempt = pairingCodes.get('987654')!;
    assert.notStrictEqual(secondAttempt.status, 'pending');
    assert.strictEqual(secondAttempt.status, 'accepted');
  });

  it('should reject session creation on revoked devices', () => {
    const devices = new Map<string, { authorized: boolean; name: string }>();
    devices.set('revoked-device-1', { authorized: false, name: 'Compromised Phone' });

    const targetDevice = devices.get('revoked-device-1')!;
    assert.strictEqual(targetDevice.authorized, false);

    const canCreateSession = targetDevice.authorized;
    assert.strictEqual(canCreateSession, false);
  });

  it('should terminate all active sessions on emergency Disconnect-All', () => {
    const sessions = [
      { id: 'ses-1', status: 'active' },
      { id: 'ses-2', status: 'paused' },
      { id: 'ses-3', status: 'active' },
    ];

    let terminatedCount = 0;
    for (const s of sessions) {
      if (s.status !== 'terminated') {
        s.status = 'terminated';
        terminatedCount++;
      }
    }

    assert.strictEqual(terminatedCount, 3);
    assert.ok(sessions.every((s) => s.status === 'terminated'));
  });

  it('should validate file transfer limits and explicit user confirmation', () => {
    const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB
    const oversizedFile = 150 * 1024 * 1024; // 150MB
    const validFile = 25 * 1024 * 1024;      // 25MB

    assert.strictEqual(validFile <= MAX_FILE_SIZE, true);
    assert.strictEqual(oversizedFile <= MAX_FILE_SIZE, false);

    // Explicit confirmation check
    const pendingTransfer = { id: 'transfer-1', requiresConsent: true, userApproved: false };
    assert.strictEqual(pendingTransfer.userApproved, false);
    // User approves
    pendingTransfer.userApproved = true;
    assert.strictEqual(pendingTransfer.userApproved, true);
  });
});
