// AES-256 Encryption Utilities for GuardianAI

export interface EncryptedData {
  encryptedContent: string;
  iv: string;
}

export async function encryptData(plaintext: string, password: string): Promise<EncryptedData> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plaintext);
  
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['encrypt']
  );
  
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    passwordKey,
    data
  );
  
  return {
    encryptedContent: arrayBufferToBase64(encryptedData),
    iv: arrayBufferToBase64(iv.buffer)
  };
}

export async function decryptData(
  encryptedContent: string,
  iv: string,
  password: string
): Promise<string> {
  const encoder = new TextEncoder();
  
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password.padEnd(32, '0').slice(0, 32)),
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );
  
  const encryptedData = base64ToArrayBuffer(encryptedContent);
  const ivArray = base64ToArrayBuffer(iv);
  
  const decryptedData = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: ivArray },
    passwordKey,
    encryptedData
  );
  
  const decoder = new TextDecoder();
  return decoder.decode(decryptedData);
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function generateDeviceFingerprint(): string {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('GuardianAI', 2, 2);
  }
  
  const fingerprint = {
    userAgent: navigator.userAgent,
    language: navigator.language,
    platform: navigator.platform,
    screenResolution: `${screen.width}x${screen.height}`,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    canvas: canvas.toDataURL(),
    plugins: Array.from(navigator.plugins || []).map(p => p.name).join(',')
  };
  
  return btoa(JSON.stringify(fingerprint)).slice(0, 64);
}
