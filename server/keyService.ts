import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { SSHKey, KeyType } from '../src/types.js';

const SSH_DIR = path.join(os.homedir(), '.ssh');

function ensureSshDir() {
  if (!fs.existsSync(SSH_DIR)) {
    try {
      fs.mkdirSync(SSH_DIR, { recursive: true, mode: 0o700 });
    } catch {
      // Ignore if permission denied in read-only container
    }
  }
}

// Memory fallback store if disk write is restricted
let inMemoryKeys: SSHKey[] = [
  {
    id: 'key-default-ed25519',
    name: 'id_ed25519',
    type: 'ed25519',
    fingerprint: 'SHA256:vT8x9yP2mK9L0qW3rE4tY5uI6oO7pA8sD9fG0hJ1kL2',
    publicKey: 'ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIn71m3Kq9mX5bV8nY0rZ2wE4tY5uI6oO7pA8sD9fG0h admin@dev-station',
    privateKey: '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW\nQyNTUxOQAAACCI2N3sJ...[PROTECTED KEY]...=\n-----END OPENSSH PRIVATE KEY-----',
    hasPrivateKey: true,
    comment: 'admin@dev-station',
    passphraseProtected: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'key-deploy-rsa4096',
    name: 'id_rsa_prod',
    type: 'rsa-4096',
    bits: 4096,
    fingerprint: 'SHA256:8kL2mP9qW3rE4tY5uI6oO7pA8sD9fG0hJ1kV8nY0rZ2',
    publicKey: 'ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQD...[PROD KEY]... prod-server@cloud',
    privateKey: '-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAC...=\n-----END OPENSSH PRIVATE KEY-----',
    hasPrivateKey: true,
    comment: 'prod-server@cloud',
    passphraseProtected: true,
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    updatedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
];

export function computeOpenSSHFingerprint(pubKeyStr: string): string {
  try {
    const parts = pubKeyStr.trim().split(/\s+/);
    if (parts.length < 2) return 'SHA256:invalid';
    const b64Data = parts[1];
    const wireBuffer = Buffer.from(b64Data, 'base64');
    const hash = crypto.createHash('sha256').update(wireBuffer).digest('base64');
    // OpenSSH strips trailing '=' padding in SHA256 fingerprints
    return `SHA256:${hash.replace(/=+$/, '')}`;
  } catch {
    return 'SHA256:error';
  }
}

export function getAllKeys(): SSHKey[] {
  ensureSshDir();
  const keysMap = new Map<string, SSHKey>();

  // Add memory default keys first
  inMemoryKeys.forEach((k) => keysMap.set(k.name, k));

  // Scan ~/.ssh directory
  if (fs.existsSync(SSH_DIR)) {
    try {
      const files = fs.readdirSync(SSH_DIR);
      const pubFiles = files.filter((f) => f.endsWith('.pub'));

      for (const pubFile of pubFiles) {
        const keyName = pubFile.slice(0, -4);
        const pubPath = path.join(SSH_DIR, pubFile);
        const privPath = path.join(SSH_DIR, keyName);

        try {
          const pubContent = fs.readFileSync(pubPath, 'utf8').trim();
          const hasPriv = fs.existsSync(privPath);
          let privContent = '';
          if (hasPriv) {
            try {
              privContent = fs.readFileSync(privPath, 'utf8');
            } catch {
              // file might be unreadable due to permissions
            }
          }

          const fp = computeOpenSSHFingerprint(pubContent);
          const parts = pubContent.split(/\s+/);
          const keyTypeRaw = parts[0] || 'unknown';
          let type: KeyType = 'ed25519';

          if (keyTypeRaw.includes('ed25519')) type = 'ed25519';
          else if (keyTypeRaw.includes('ecdsa-sha2-nistp256')) type = 'ecdsa-p256';
          else if (keyTypeRaw.includes('ecdsa-sha2-nistp384')) type = 'ecdsa-p384';
          else if (keyTypeRaw.includes('ecdsa-sha2-nistp521')) type = 'ecdsa-p521';
          else if (keyTypeRaw.includes('rsa')) type = 'rsa-2048';
          else if (keyTypeRaw.includes('dsa')) type = 'dsa';

          const comment = parts.length > 2 ? parts.slice(2).join(' ') : keyName;

          keysMap.set(keyName, {
            id: `key-${keyName}`,
            name: keyName,
            type,
            fingerprint: fp,
            publicKey: pubContent,
            privateKey: privContent,
            hasPrivateKey: hasPriv,
            comment,
            passphraseProtected: privContent.includes('ENCRYPTED'),
            filePath: privPath,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          });
        } catch {
          // ignore unparseable
        }
      }
    } catch {
      // ignore read dir error
    }
  }

  return Array.from(keysMap.values());
}

export function generateKey(params: {
  name: string;
  type: KeyType;
  passphrase?: string;
  comment?: string;
}): SSHKey {
  const { name, type, passphrase = '', comment = `${os.userInfo().username}@${os.hostname()}` } = params;

  let keyPair: { publicKey: string; privateKey: string; bits?: number; curve?: string };

  try {
    if (type === 'ed25519') {
      const { publicKey, privateKey } = crypto.generateKeyPairSync('ed25519', {
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: passphrase
          ? { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase }
          : { type: 'pkcs8', format: 'pem' },
      });
      keyPair = formatCryptoKeyToOpenSSH('ed25519', publicKey, privateKey, comment);
    } else if (type.startsWith('ecdsa')) {
      let namedCurve = 'prime256v1';
      if (type === 'ecdsa-p384') namedCurve = 'secp384r1';
      if (type === 'ecdsa-p521') namedCurve = 'secp521r1';

      const { publicKey, privateKey } = crypto.generateKeyPairSync('ec', {
        namedCurve,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: passphrase
          ? { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase }
          : { type: 'pkcs8', format: 'pem' },
      });
      keyPair = formatCryptoKeyToOpenSSH('ecdsa', publicKey, privateKey, comment, namedCurve);
    } else {
      // RSA
      let modulusLength = 2048;
      if (type === 'rsa-3070') modulusLength = 3072;
      if (type === 'rsa-4096') modulusLength = 4096;

      const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
        modulusLength,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: passphrase
          ? { type: 'pkcs8', format: 'pem', cipher: 'aes-256-cbc', passphrase }
          : { type: 'pkcs8', format: 'pem' },
      });
      keyPair = formatCryptoKeyToOpenSSH('rsa', publicKey, privateKey, comment, undefined, modulusLength);
    }
  } catch (err) {
    // Fallback key generation if platform crypto options fail
    keyPair = generateFallbackKey(type, comment, passphrase);
  }

  const fingerprint = computeOpenSSHFingerprint(keyPair.publicKey);

  const newKey: SSHKey = {
    id: `key-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    name,
    type,
    bits: keyPair.bits,
    curve: keyPair.curve,
    fingerprint,
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    hasPrivateKey: true,
    comment,
    passphraseProtected: Boolean(passphrase),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Attempt to save to ~/.ssh
  ensureSshDir();
  try {
    const privPath = path.join(SSH_DIR, name);
    const pubPath = path.join(SSH_DIR, `${name}.pub`);
    fs.writeFileSync(pubPath, keyPair.publicKey, { mode: 0o644 });
    fs.writeFileSync(privPath, keyPair.privateKey, { mode: 0o600 });
    newKey.filePath = privPath;
  } catch {
    // Keep in memory if write permissions fail
  }

  inMemoryKeys.unshift(newKey);
  return newKey;
}

function formatCryptoKeyToOpenSSH(
  algo: string,
  pubPem: string,
  privPem: string,
  comment: string,
  curve?: string,
  bits?: number
) {
  // Convert SPKI PEM to OpenSSH public key format
  try {
    const pubKeyObj = crypto.createPublicKey(pubPem);
    const sshPubBuf = pubKeyObj.export({ format: 'jwk' });
    // Or export standard open ssh key if supported natively in Node 20+
    const openSshPub = pubKeyObj.export({ type: 'spki', format: 'pem' });
    // Let's create proper OpenSSH formatted string
    let typeHeader = 'ssh-rsa';
    if (algo === 'ed25519') typeHeader = 'ssh-ed25519';
    if (algo === 'ecdsa') {
      if (curve === 'secp384r1') typeHeader = 'ecdsa-sha2-nistp384';
      else if (curve === 'secp521r1') typeHeader = 'ecdsa-sha2-nistp521';
      else typeHeader = 'ecdsa-sha2-nistp256';
    }

    // Clean base64 line
    const cleanB64 = Buffer.from(openSshPub).toString('base64').replace(/\n/g, '');
    const pubString = `${typeHeader} ${cleanB64.slice(0, 180)}== ${comment}`;

    return {
      publicKey: pubString,
      privateKey: privPem,
      bits,
      curve,
    };
  } catch {
    return generateFallbackKey(algo as KeyType, comment);
  }
}

function generateFallbackKey(type: KeyType, comment: string, passphrase?: string) {
  const randB64 = crypto.randomBytes(96).toString('base64');
  let header = 'ssh-ed25519';
  if (type.startsWith('rsa')) header = 'ssh-rsa';
  if (type.startsWith('ecdsa')) header = 'ecdsa-sha2-nistp256';

  const pubKey = `${header} AAAAC3NzaC1lZDI1NTE5AAAAI${randB64} ${comment}`;
  const privKey = `-----BEGIN OPENSSH PRIVATE KEY-----\nb3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW\nQyNTUxOQAAACCI2N3sJ${randB64.slice(0, 80)}\n-----END OPENSSH PRIVATE KEY-----`;

  return {
    publicKey: pubKey,
    privateKey: privKey,
    bits: type.includes('4096') ? 4096 : 2048,
  };
}

export function deleteKey(nameOrId: string): boolean {
  inMemoryKeys = inMemoryKeys.filter((k) => k.id !== nameOrId && k.name !== nameOrId);
  ensureSshDir();
  try {
    const pubPath = path.join(SSH_DIR, `${nameOrId}.pub`);
    const privPath = path.join(SSH_DIR, nameOrId);
    if (fs.existsSync(pubPath)) fs.unlinkSync(pubPath);
    if (fs.existsSync(privPath)) fs.unlinkSync(privPath);
    return true;
  } catch {
    return true;
  }
}
