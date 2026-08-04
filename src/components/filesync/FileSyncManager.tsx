import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  Plus,
  Play,
  Trash2,
  Terminal,
} from 'lucide-react';
import { FileSyncRule, SyncLogEntry, ConnectionProfile } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface FileSyncManagerProps {
  connections?: ConnectionProfile[];
}

export const FileSyncManager: React.FC<FileSyncManagerProps> = ({ connections = [] }) => {
  const { t } = useLanguage();
  const [rules, setRules] = useState<FileSyncRule[]>([]);
  const [logs, setLogs] = useState<SyncLogEntry[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [newRule, setNewRule] = useState<Partial<FileSyncRule>>({
    name: 'Deploy Build to Remote',
    connectionId: connections[0]?.id || '',
    localPath: './dist',
    remotePath: '/var/www/html',
    ignorePatterns: ['.git', 'node_modules', '.DS_Store'],
    overwritePolicy: 'newer',
    preserveTimestamp: true,
  });

  useEffect(() => {
    fetchRulesAndLogs();
    const interval = setInterval(fetchRulesAndLogs, 3000);
    return () => clearInterval(interval);
  }, []);

  const fetchRulesAndLogs = async () => {
    try {
      const [resRules, resLogs] = await Promise.all([
        fetch('/api/filesync/rules'),
        fetch('/api/filesync/logs'),
      ]);
      const dataRules = await resRules.json();
      const dataLogs = await resLogs.json();

      if (dataRules.success) setRules(dataRules.rules || []);
      if (dataLogs.success) setLogs(dataLogs.logs || []);
    } catch {
      // ignore
    }
  };

  const handleStartSync = async (ruleId: string) => {
    try {
      await fetch('/api/filesync/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId }),
      });
      fetchRulesAndLogs();
    } catch {
      // ignore
    }
  };

  const handleDeleteRule = async (id: string) => {
    try {
      await fetch(`/api/filesync/rules/${id}`, { method: 'DELETE' });
      fetchRulesAndLogs();
    } catch {
      // ignore
    }
  };

  const handleCreateRule = async (e: React.FormEvent) => {
    e.preventDefault();
    const conn = connections.find((c) => c.id === newRule.connectionId);

    try {
      await fetch('/api/filesync/rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newRule,
          connectionAlias: conn?.alias || 'Target Server',
        }),
      });
      setIsModalOpen(false);
      fetchRulesAndLogs();
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0a0a] p-4 rounded-md border border-white/10 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
            <RefreshCw className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">{t.fileSyncTitle}</h2>
            <p className="text-xs text-zinc-400">{t.fileSyncSubtitle}</p>
          </div>
        </div>

        <button
          onClick={() => {
            if (connections.length > 0) {
              setNewRule((r) => ({ ...r, connectionId: connections[0].id }));
            }
            setIsModalOpen(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md shadow-sm flex items-center space-x-1.5"
        >
          <Plus className="w-4 h-4" />
          <span>{t.newSyncRule}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400 px-1">
            Sync Task Rules ({rules.length})
          </h3>

          <div className="space-y-3">
            {rules.map((rule) => {
              const isSyncing = rule.status === 'syncing';

              return (
                <div
                  key={rule.id}
                  className="bg-[#0a0a0a] border border-white/10 rounded-md p-4 space-y-3 shadow-sm hover:border-zinc-700 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-zinc-100">{rule.name}</h4>
                      <p className="text-xs text-zinc-400 font-mono mt-0.5">
                        Target: {rule.connectionAlias}
                      </p>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleStartSync(rule.id)}
                        disabled={isSyncing}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md flex items-center space-x-1.5 transition-colors shadow-sm"
                      >
                        <Play className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                        <span>{isSyncing ? 'Syncing...' : 'Start Sync'}</span>
                      </button>

                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        className="p-1.5 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded-md"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="bg-[#000000] p-2.5 rounded-md border border-white/10 font-mono text-[11px] space-y-1">
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Local:</span>
                      <span className="text-zinc-200">{rule.localPath}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-400">
                      <span>Remote:</span>
                      <span className="text-amber-400">{rule.remotePath}</span>
                    </div>
                  </div>

                  {isSyncing && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                        <span>Sync Progress</span>
                        <span>
                          {rule.syncedFiles} / {rule.totalFiles} files
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-[#141414] rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-400 transition-all duration-300"
                          style={{
                            width: `${((rule.syncedFiles || 0) / (rule.totalFiles || 1)) * 100}%`,
                          }}
                        />
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 border-t border-white/10 pt-2">
                    <div className="flex items-center space-x-1">
                      {(rule.ignorePatterns || []).slice(0, 3).map((p) => (
                        <span key={p} className="px-1.5 py-0.5 bg-[#141414] rounded">
                          ignore: {p}
                        </span>
                      ))}
                    </div>

                    {rule.lastSyncAt && (
                      <span>Last sync: {new Date(rule.lastSyncAt).toLocaleTimeString()}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="lg:col-span-6 bg-[#0a0a0a] border border-white/10 rounded-md p-4 flex flex-col space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center space-x-2">
              <Terminal className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Sync Execution Logs
              </h3>
            </div>
            <span className="text-[10px] text-zinc-500 font-mono">{logs.length} entries</span>
          </div>

          <div className="flex-1 bg-[#000000] border border-white/10 rounded-md p-3 font-mono text-[11px] space-y-1.5 max-h-[500px] overflow-y-auto leading-relaxed">
            {logs.map((log) => (
              <div key={log.id} className="flex items-start space-x-2">
                <span className="text-zinc-600 shrink-0">[{log.timestamp}]</span>
                <span
                  className={
                    log.level === 'success'
                      ? 'text-blue-400 font-semibold'
                      : log.level === 'warn'
                      ? 'text-amber-400'
                      : log.level === 'error'
                      ? 'text-rose-400 font-semibold'
                      : 'text-zinc-300'
                  }
                >
                  {log.message}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-[#000000]  z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-md w-full max-w-md p-6  space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100">Create New FileSync Task Rule</h3>
            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Task Name *</label>
                <input
                  type="text"
                  required
                  value={newRule.name}
                  onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                  className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Target Remote Host *</label>
                <select
                  value={newRule.connectionId}
                  onChange={(e) => setNewRule({ ...newRule, connectionId: e.target.value })}
                  className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200 font-mono"
                >
                  {connections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.alias} ({c.username}@{c.hostname})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2 font-mono">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Local Path *</label>
                  <input
                    type="text"
                    required
                    value={newRule.localPath}
                    onChange={(e) => setNewRule({ ...newRule, localPath: e.target.value })}
                    className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200"
                  />
                </div>

                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Remote Path *</label>
                  <input
                    type="text"
                    required
                    value={newRule.remotePath}
                    onChange={(e) => setNewRule({ ...newRule, remotePath: e.target.value })}
                    className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#141414] text-zinc-300 rounded-md"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md font-medium">
                  Create Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
