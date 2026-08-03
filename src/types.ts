export type KeyType =
  | 'ed25519'
  | 'ecdsa-p256'
  | 'ecdsa-p384'
  | 'ecdsa-p521'
  | 'rsa-2048'
  | 'rsa-3070'
  | 'rsa-4096'
  | 'dsa';

export interface SSHKey {
  id: string;
  name: string;
  type: KeyType;
  bits?: number;
  curve?: string;
  fingerprint: string;
  publicKey: string;
  privateKey?: string;
  hasPrivateKey: boolean;
  comment: string;
  passphraseProtected: boolean;
  passphrase?: string;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

export type AuthType = 'password' | 'key';

export interface ConnectionProfile {
  id: string;
  alias: string;
  hostname: string;
  port: number;
  username: string;
  authType: AuthType;
  password?: string;
  keyId?: string;
  identityFile?: string;
  group?: string;
  tags?: string[];
  description?: string;
  status?: 'online' | 'offline' | 'testing' | 'unknown';
  latency?: number;
  lastConnectedAt?: string;
  createdAt: string;
}

export interface SSHConfigEntry {
  host: string;
  hostname?: string;
  user?: string;
  port?: number;
  identityFile?: string;
  preferredAuthentications?: string;
  proxyCommand?: string;
  forwardAgent?: string;
  customOptions?: Record<string, string>;
  rawBlock?: string;
}

export interface SFTPFileItem {
  name: string;
  path: string;
  size: number;
  type: 'file' | 'directory' | 'symlink';
  mode: string;
  permissions?: string;
  modifyTime: string;
  accessTime?: string;
  owner?: string;
  group?: string;
}

export interface FileSyncRule {
  id: string;
  name: string;
  connectionId: string;
  connectionAlias?: string;
  localPath: string;
  remotePath: string;
  ignorePatterns: string[];
  overwritePolicy: 'newer' | 'always' | 'never';
  preserveTimestamp: boolean;
  status: 'idle' | 'syncing' | 'completed' | 'error';
  lastSyncAt?: string;
  totalFiles?: number;
  syncedFiles?: number;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
  file?: string;
}

export interface TerminalSessionInfo {
  id: string;
  connectionId: string;
  title: string;
  status: 'connecting' | 'connected' | 'disconnected' | 'error';
  theme: 'dracula' | 'monokai' | 'nord' | 'onedark' | 'tokyonight' | 'light';
  fontSize: number;
  createdAt: string;
}

export interface QuickSnippet {
  id: string;
  label: string;
  command: string;
  category: 'system' | 'docker' | 'network' | 'logs' | 'git' | 'custom';
  description?: string;
}

export interface SystemPlatformInfo {
  platform: string;
  platformName: string;
  isWindows: boolean;
  isMac: boolean;
  isLinux: boolean;
  version?: string;
  sshDir: string;
  keyCount: number;
  connectionCount: number;
}
