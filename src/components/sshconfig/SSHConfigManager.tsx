import React, { useEffect, useState } from 'react';
import {
  FileCode,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  Check,
  Server,
  Download,
  Info,
  Sliders,
  Sparkles,
} from 'lucide-react';
import { SSHConfigEntry } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface SSHConfigManagerProps {
  onSyncConnections: () => Promise<void>;
}

export const SSHConfigManager: React.FC<SSHConfigManagerProps> = ({ onSyncConnections }) => {
  const { t } = useLanguage();
  const [rawText, setRawText] = useState<string>('');
  const [entries, setEntries] = useState<SSHConfigEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'visualizer'>('editor');

  // New Entry Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newHost, setNewHost] = useState({
    host: 'my-custom-server',
    hostname: '172.16.20.100',
    user: 'ubuntu',
    port: 22,
    identityFile: '~/.ssh/id_ed25519',
    preferredAuthentications: 'publickey',
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ssh-config');
      const data = await res.json();
      if (data.success) {
        setRawText(data.rawText || '');
        setEntries(data.entries || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRaw = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/ssh-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText }),
      });
      const data = await res.json();
      if (data.success) {
        setEntries(data.entries || []);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch {
      // ignore
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteHost = async (host: string) => {
    if (!confirm(`Delete Host "${host}" from ~/.ssh/config?`)) return;
    try {
      const res = await fetch(`/api/ssh-config/${encodeURIComponent(host)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setRawText(data.rawText || '');
        setEntries(data.entries || []);
      }
    } catch {
      // ignore
    }
  };

  const handleAddHostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/ssh-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: newHost }),
      });
      const data = await res.json();
      if (data.success) {
        setRawText(data.rawText || '');
        setEntries(data.entries || []);
        setIsModalOpen(false);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0a0a] p-4 rounded-md border border-white/10 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md">
            <FileCode className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">{t.sshConfigTitle}</h2>
            <p className="text-xs text-zinc-400">{t.sshConfigSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={onSyncConnections}
            className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-semibold rounded-md border border-indigo-500/30 transition-colors flex items-center space-x-1.5"
          >
            <Server className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.syncConfigToProfiles}</span>
          </button>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md shadow-sm transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addHostDirective}</span>
          </button>
        </div>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center space-x-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setActiveTab('editor')}
          className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'editor'
              ? 'bg-[#141414] text-blue-400 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {t.rawConfigEditor}
        </button>

        <button
          onClick={() => setActiveTab('visualizer')}
          className={`px-4 py-2 rounded-md text-xs font-semibold transition-all ${
            activeTab === 'visualizer'
              ? 'bg-[#141414] text-blue-400 border border-zinc-700'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {t.visualHostDirectives} ({entries.length})
        </button>
      </div>

      {activeTab === 'editor' ? (
        <div className="bg-[#0a0a0a] border border-white/10 rounded-md p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400">File: ~/.ssh/config</span>

            <div className="flex items-center space-x-2">
              <button
                onClick={fetchConfig}
                className="p-1.5 bg-[#141414] hover:bg-zinc-700 text-zinc-300 rounded-md border border-zinc-700 text-xs"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>

              <button
                onClick={handleSaveRaw}
                disabled={saving}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-md flex items-center space-x-1.5"
              >
                {saveSuccess ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                <span>{saveSuccess ? 'Saved!' : 'Save ~/.ssh/config'}</span>
              </button>
            </div>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            className="w-full min-h-[460px] bg-[#000000] border border-white/10 rounded-md p-4 font-mono text-xs text-zinc-200 leading-relaxed focus:outline-none focus:border-indigo-500"
            spellCheck={false}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {entries.map((entry) => (
            <div
              key={entry.host}
              className="bg-[#0a0a0a] border border-white/10 hover:border-zinc-700 rounded-md p-4 space-y-3 font-mono text-xs"
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-blue-400">Host</span>
                  <span className="text-xs font-semibold text-zinc-100">{entry.host}</span>
                </div>

                <button
                  onClick={() => handleDeleteHost(entry.host)}
                  className="p-1 hover:bg-rose-500/10 text-zinc-500 hover:text-rose-400 rounded"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 text-[11px] text-zinc-300">
                {entry.hostname && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">HostName:</span>
                    <span className="text-zinc-200">{entry.hostname}</span>
                  </div>
                )}
                {entry.user && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">User:</span>
                    <span className="text-zinc-200">{entry.user}</span>
                  </div>
                )}
                {entry.port && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Port:</span>
                    <span className="text-zinc-200">{entry.port}</span>
                  </div>
                )}
                {entry.identityFile && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">IdentityFile:</span>
                    <span className="text-amber-400 truncate max-w-[140px]">{entry.identityFile}</span>
                  </div>
                )}
                {entry.preferredAuthentications && (
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Auth:</span>
                    <span className="text-zinc-300">{entry.preferredAuthentications}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Host Directive */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#000000]  z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-md w-full max-w-md p-6  space-y-4">
            <h3 className="text-sm font-semibold text-zinc-100">Add Host Directive to ~/.ssh/config</h3>
            <form onSubmit={handleAddHostSubmit} className="space-y-4 text-xs font-mono">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Host Alias *</label>
                <input
                  type="text"
                  required
                  value={newHost.host}
                  onChange={(e) => setNewHost({ ...newHost, host: e.target.value })}
                  className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">HostName / IP *</label>
                <input
                  type="text"
                  required
                  value={newHost.hostname}
                  onChange={(e) => setNewHost({ ...newHost, hostname: e.target.value })}
                  className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">User *</label>
                  <input
                    type="text"
                    required
                    value={newHost.user}
                    onChange={(e) => setNewHost({ ...newHost, user: e.target.value })}
                    className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200"
                  />
                </div>
                <div>
                  <label className="block text-zinc-300 font-medium mb-1">Port</label>
                  <input
                    type="number"
                    value={newHost.port}
                    onChange={(e) => setNewHost({ ...newHost, port: Number(e.target.value) })}
                    className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">IdentityFile</label>
                <input
                  type="text"
                  value={newHost.identityFile}
                  onChange={(e) => setNewHost({ ...newHost, identityFile: e.target.value })}
                  className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-[#141414] text-zinc-300 rounded-md font-sans"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-md font-sans font-medium"
                >
                  Add Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
