import { FileSyncRule, SyncLogEntry } from '../src/types.js';

let syncRules: FileSyncRule[] = [
  {
    id: 'rule-1',
    name: 'Deploy Web Assets to Prod',
    connectionId: 'conn-sandbox-01',
    connectionAlias: 'Production Web App 01',
    localPath: './dist',
    remotePath: '/var/www/html',
    ignorePatterns: ['.DS_Store', '*.map', '.git'],
    overwritePolicy: 'newer',
    preserveTimestamp: true,
    status: 'idle',
    lastSyncAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    totalFiles: 42,
    syncedFiles: 42,
  },
  {
    id: 'rule-2',
    name: 'Backup Config Files',
    connectionId: 'conn-sandbox-02',
    connectionAlias: 'Staging Database Cluster',
    localPath: './config',
    remotePath: '/etc/postgres/conf.d',
    ignorePatterns: ['*.log', 'tmp/*'],
    overwritePolicy: 'always',
    preserveTimestamp: true,
    status: 'idle',
    lastSyncAt: new Date(Date.now() - 86400000).toISOString(),
    totalFiles: 12,
    syncedFiles: 12,
  },
];

let syncLogs: SyncLogEntry[] = [
  {
    id: 'log-1',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString().slice(11, 19),
    level: 'info',
    message: 'Starting FileSync task: Deploy Web Assets to Prod',
  },
  {
    id: 'log-2',
    timestamp: new Date(Date.now() - 3600000 * 5 + 1000).toISOString().slice(11, 19),
    level: 'info',
    message: 'Connecting to 172.16.20.101:22 via SSH key (id_ed25519)...',
  },
  {
    id: 'log-3',
    timestamp: new Date(Date.now() - 3600000 * 5 + 2000).toISOString().slice(11, 19),
    level: 'success',
    message: 'SFTP session established. Scanning local ./dist directory...',
  },
  {
    id: 'log-4',
    timestamp: new Date(Date.now() - 3600000 * 5 + 3000).toISOString().slice(11, 19),
    level: 'info',
    message: 'Transferred index.html (14.2 KB) -> /var/www/html/index.html [OK]',
  },
  {
    id: 'log-5',
    timestamp: new Date(Date.now() - 3600000 * 5 + 4000).toISOString().slice(11, 19),
    level: 'success',
    message: 'Sync completed. 42 files synchronized, 0 errors.',
  },
];

export function getSyncRules(): FileSyncRule[] {
  return syncRules;
}

export function saveSyncRule(rule: Partial<FileSyncRule>): FileSyncRule {
  if (rule.id) {
    const idx = syncRules.findIndex((r) => r.id === rule.id);
    if (idx >= 0) {
      syncRules[idx] = { ...syncRules[idx], ...rule };
      return syncRules[idx];
    }
  }

  const newRule: FileSyncRule = {
    id: `rule-${Date.now()}`,
    name: rule.name || 'New Sync Rule',
    connectionId: rule.connectionId || 'conn-sandbox-01',
    connectionAlias: rule.connectionAlias || 'Default Connection',
    localPath: rule.localPath || './src',
    remotePath: rule.remotePath || '/home/admin/sync',
    ignorePatterns: rule.ignorePatterns || ['.git', 'node_modules'],
    overwritePolicy: rule.overwritePolicy || 'newer',
    preserveTimestamp: rule.preserveTimestamp ?? true,
    status: 'idle',
    totalFiles: 0,
    syncedFiles: 0,
  };

  syncRules.push(newRule);
  return newRule;
}

export function deleteSyncRule(id: string): boolean {
  syncRules = syncRules.filter((r) => r.id !== id);
  return true;
}

export function getSyncLogs(): SyncLogEntry[] {
  return syncLogs;
}

export function addSyncLog(level: 'info' | 'warn' | 'error' | 'success', message: string, file?: string) {
  const entry: SyncLogEntry = {
    id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString().slice(11, 19),
    level,
    message,
    file,
  };
  syncLogs.unshift(entry);
  if (syncLogs.length > 200) syncLogs = syncLogs.slice(0, 200);
}

export function triggerSyncTask(ruleId: string, onProgress?: (synced: number, total: number) => void) {
  const rule = syncRules.find((r) => r.id === ruleId);
  if (!rule) return;

  rule.status = 'syncing';
  rule.totalFiles = 15;
  rule.syncedFiles = 0;

  addSyncLog('info', `[FileSync] Initiating task "${rule.name}" (${rule.localPath} -> ${rule.remotePath})`);

  let current = 0;
  const interval = setInterval(() => {
    current += 1;
    rule.syncedFiles = current;
    addSyncLog('info', `Transferred item ${current}/${rule.totalFiles}: file_${current}.dat`, `file_${current}.dat`);

    if (onProgress) onProgress(current, rule.totalFiles || 15);

    if (current >= (rule.totalFiles || 15)) {
      clearInterval(interval);
      rule.status = 'idle';
      rule.lastSyncAt = new Date().toISOString();
      addSyncLog('success', `[FileSync] Task "${rule.name}" finished successfully! All files synced.`);
    }
  }, 400);
}
