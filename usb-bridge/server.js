/**
 * usb-bridge/server.js
 *
 * Zero Trust USB Monitoring Bridge — Windows Edition
 * ---------------------------------------------------
 * Polls Windows WMI via PowerShell every 2 seconds to detect
 * USB device connect / disconnect events.
 *
 * Endpoints:
 *   GET /api/usb/devices     — current list of connected USB devices (JSON)
 *   GET /events              — Server-Sent Events stream (real-time push)
 *
 * Events emitted over SSE:
 *   { type: 'usb-connect',    device: UsbDeviceInfo }
 *   { type: 'usb-disconnect', instanceId: string, deviceName: string }
 *   { type: 'snapshot',       devices: UsbDeviceInfo[] }   (on first connect)
 *
 * Run: node usb-bridge/server.js
 * Port: 3579 (chosen to not clash with Vite's 5173)
 */

'use strict';

const { execSync } = require('child_process');
const express = require('express');
const cors = require('cors');

const PORT = 3579;
const POLL_INTERVAL_MS = 2000;

// ── PowerShell query ───────────────────────────────────────────────────────────
// Queries Win32_PnPEntity for all USB class devices that are present (not ghost).
// We filter: Class = USB / AndroidUsbDeviceClass / DiskDrive / HIDClass /
//            Ports / Bluetooth / WPD / Image / Media / Net / PrintQueue
// and Status = 'OK' or 'Degraded' (i.e., physically present).
const PS_QUERY = `
  Get-WmiObject Win32_PnPEntity |
  Where-Object {
    ($_.DeviceID -like 'USB\\*' -or $_.DeviceID -like 'USBSTOR\\*') -and
    ($_.Status -eq 'OK' -or $_.Status -eq 'Degraded')
  } |
  Select-Object Name, Description, Manufacturer, DeviceID, PNPClass, Status |
  ConvertTo-Json -Compress
`.trim();

// ── Helpers ────────────────────────────────────────────────────────────────────

/** Classify a device type from PNPClass / DeviceID / Name */
function classifyDevice(pnpClass, deviceId, name) {
  const id = (deviceId || '').toUpperCase();
  const cls = (pnpClass || '').toLowerCase();
  const nm = (name || '').toLowerCase();

  if (cls === 'diskdrive' || id.includes('USBSTOR') || nm.includes('usb mass storage') || nm.includes('flash')) {
    return 'Mass Storage (USB Drive)';
  }
  if (nm.includes('android') || nm.includes('adb') || cls === 'androidusbdeviceclass') {
    return 'Android Device';
  }
  if (nm.includes('iphone') || nm.includes('ipad') || nm.includes('apple')) {
    return 'Apple iOS Device';
  }
  if (cls === 'camera' || nm.includes('camera') || nm.includes('webcam')) {
    return 'Camera / Webcam';
  }
  if (cls === 'net' || nm.includes('ethernet') || nm.includes('rndis') || nm.includes('network')) {
    return 'USB Network Adapter';
  }
  if (cls === 'hidclass' || nm.includes('mouse') || nm.includes('keyboard') || nm.includes('hid')) {
    return 'HID (Mouse/Keyboard)';
  }
  if (cls === 'media' || cls === 'audio' || nm.includes('audio') || nm.includes('sound')) {
    return 'Audio Device';
  }
  if (cls === 'bluetooth' || nm.includes('bluetooth')) {
    return 'Bluetooth Adapter';
  }
  if (cls === 'wpd' || nm.includes('mtp') || nm.includes('portable')) {
    return 'Portable Device (MTP)';
  }
  if (cls === 'usbhub' || nm.includes('hub')) {
    return 'USB Hub';
  }
  if (nm.includes('printer') || cls === 'printqueue') {
    return 'Printer';
  }
  return 'USB Device';
}

/** Extract a serial number from a Windows DeviceID string */
function extractSerial(deviceId) {
  if (!deviceId) return '';
  // DeviceIDs look like: USB\VID_04E8&PID_6860\ABC123456
  // or USBSTOR\DISK&VEN_SANDISK&PROD_ULTRA\0123456789ABCDEF&0
  const parts = deviceId.split('\\');
  if (parts.length >= 3) {
    const candidate = parts[parts.length - 1];
    // If the last segment doesn't look like a pure instance counter, treat as serial
    if (candidate && !/^\d+$/.test(candidate) && candidate.length > 2) {
      return candidate.replace(/&\d+$/, ''); // strip trailing &0, &1 etc.
    }
  }
  return '';
}

/** Run the PowerShell query and return parsed device objects */
function queryUsbDevices() {
  try {
    const raw = execSync(
      `powershell -NoProfile -NonInteractive -Command "${PS_QUERY.replace(/\n/g, ' ')}"`,
      { timeout: 5000, encoding: 'utf8' }
    ).trim();

    if (!raw || raw === 'null') return [];

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return [];
    }

    // PowerShell returns an object (not array) when only 1 result
    const items = Array.isArray(parsed) ? parsed : [parsed];

    return items
      .filter((d) => d && d.Name && d.DeviceID)
      .map((d) => {
        const serial = extractSerial(d.DeviceID);
        return {
          instanceId: d.DeviceID,
          deviceName: d.Name || d.Description || 'Unknown USB Device',
          deviceType: classifyDevice(d.PNPClass, d.DeviceID, d.Name),
          manufacturer: d.Manufacturer || '',
          deviceId: d.DeviceID || '',
          serialNumber: serial,
          connectedAt: new Date().toISOString(),
        };
      });
  } catch (err) {
    // PowerShell not available or query failed — return empty
    console.error('[usb-bridge] PowerShell query failed:', err.message);
    return [];
  }
}

// ── State ──────────────────────────────────────────────────────────────────────

/** Map of instanceId → device info (currently connected) */
let currentDevices = new Map();

/** Set of SSE response objects for active clients */
const sseClients = new Set();

/** Broadcast an SSE event to all connected clients */
function broadcast(eventType, data) {
  const payload = `event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`;
  sseClients.forEach((res) => {
    try {
      res.write(payload);
    } catch {
      sseClients.delete(res);
    }
  });
}

// ── Polling loop ───────────────────────────────────────────────────────────────

function poll() {
  const discovered = queryUsbDevices();
  const discoveredMap = new Map(discovered.map((d) => [d.instanceId, d]));

  // Detect new connects
  for (const [id, device] of discoveredMap) {
    if (!currentDevices.has(id)) {
      console.log(`[usb-bridge] CONNECT  → ${device.deviceName} (${device.deviceType})`);
      broadcast('usb-connect', device);
    }
  }

  // Detect disconnects
  for (const [id, device] of currentDevices) {
    if (!discoveredMap.has(id)) {
      console.log(`[usb-bridge] DISCONNECT → ${device.deviceName}`);
      broadcast('usb-disconnect', { instanceId: id, deviceName: device.deviceName });
    }
  }

  currentDevices = discoveredMap;
}

// ── Express app ────────────────────────────────────────────────────────────────

const app = express();

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:4173'],
  credentials: true,
}));

app.use(express.json());

/** REST endpoint: get snapshot of currently connected USB devices */
app.get('/api/usb/devices', (_req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
    devices: Array.from(currentDevices.values()),
  });
});

/** SSE endpoint: real-time USB events */
app.get('/events', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  // Send current snapshot immediately on connect
  const snapshot = Array.from(currentDevices.values());
  res.write(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`);

  sseClients.add(res);
  console.log(`[usb-bridge] SSE client connected (total: ${sseClients.size})`);

  // Heartbeat every 20s to keep connection alive
  const hb = setInterval(() => {
    try {
      res.write(': heartbeat\n\n');
    } catch {
      clearInterval(hb);
    }
  }, 20000);

  req.on('close', () => {
    clearInterval(hb);
    sseClients.delete(res);
    console.log(`[usb-bridge] SSE client disconnected (total: ${sseClients.size})`);
  });
});

/** Health check */
app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime(), clients: sseClients.size });
});

// ── Start ──────────────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log('');
  console.log('  ╔══════════════════════════════════════════════╗');
  console.log('  ║  Zero Trust USB Bridge  —  port ' + PORT + '         ║');
  console.log('  ║  Real Windows USB detection via PowerShell   ║');
  console.log('  ╚══════════════════════════════════════════════╝');
  console.log('');

  // Initial scan
  const initial = queryUsbDevices();
  currentDevices = new Map(initial.map((d) => [d.instanceId, d]));
  console.log(`[usb-bridge] Initial scan: ${currentDevices.size} USB device(s) found`);
  currentDevices.forEach((d) => {
    console.log(`             • ${d.deviceName}  [${d.deviceType}]`);
  });

  // Start polling
  setInterval(poll, POLL_INTERVAL_MS);
  console.log(`[usb-bridge] Polling every ${POLL_INTERVAL_MS}ms for USB changes...`);
  console.log('');
});
