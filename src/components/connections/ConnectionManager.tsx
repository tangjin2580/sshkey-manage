import React, { useState } from 'react';
import {
  Server,
  Plus,
  Search,
  Terminal,
  FolderTree,
  Activity,
  Edit2,
  Trash2,
  Tag,
  Key,
  Shield,
  Download,
  Upload,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
} from 'lucide-react';
import { ConnectionProfile, SSHKey } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface ConnectionManagerProps {
  connections?: ConnectionProfile[];
  keys?: SSHKey[];
  onConnectionsChange?: () => void;
  onAddConnection?: (conn: Partial<ConnectionProfile>) => void;
  onDeleteConnection?: (id: string) => void;
  onTestConnection?: (conn: ConnectionProfile) => Promise<void>;
  onOpenTerminal?: (conn: ConnectionProfile) => void;
  onOpenSFTP?: (conn: ConnectionProfile) => void;
  onLaunchTerminal?: (conn: ConnectionProfile) => void;
  onLaunchSftp?: (conn: ConnectionProfile) => void;
}

export const ConnectionManager: React.FC<ConnectionManagerProps> = ({
  connections = [],
  keys = [],
  onConnectionsChange,
  onAddConnection,
  onDeleteConnection,
  onTestConnection,
  onOpenTerminal,
  onOpenSFTP,
  onLaunchTerminal,
  onLaunchSftp,
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [testingId, setTestingId] = useState<string | null>(null);

  // Form State
  const [formProfile, setFormProfile] = useState<Partial<ConnectionProfile>>({
    alias: '',
    hostname: '',
    port: 22,
    username: 'root',
    authType: 'password',
    password: '',
    identityFile: '~/.ssh/id_ed25519',
    group: 'Default',
    tags: [],
    description: '',
  });
  const [tagInput, setTagInput] = useState('');

  // Extract Groups
  const groups = Array.from(new Set((connections || []).map((c) => c.group || 'Default'))).filter(Boolean);

  // Filtered Connections
  const filteredConnections = (connections || []).filter((c) => {
    const matchesSearch =
      c.alias.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.tags && c.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));

    const matchesGroup = selectedGroup === 'ALL' || c.group === selectedGroup;

    return matchesSearch && matchesGroup;
  });

  const handleTest = async (conn: ConnectionProfile) => {
    setTestingId(conn.id);
    if (onTestConnection) {
      await onTestConnection(conn);
    } else {
      try {
        await fetch('/api/connections/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(conn),
        });
        if (onConnectionsChange) onConnectionsChange();
      } catch (e) {
        console.error(e);
      }
    }
    setTestingId(null);
  };

  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formProfile.alias || !formProfile.hostname || !formProfile.username) return;

    const newConnData = {
      ...formProfile,
      tags: formProfile.tags || [],
    };

    if (onAddConnection) {
      onAddConnection(newConnData);
    } else {
      try {
        await fetch('/api/connections', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newConnData),
        });
        if (onConnectionsChange) onConnectionsChange();
      } catch (e) {
        console.error(e);
      }
    }

    setIsModalOpen(false);
    setFormProfile({
      alias: '',
      hostname: '',
      port: 22,
      username: 'root',
      authType: 'password',
      password: '',
      identityFile: '~/.ssh/id_ed25519',
      group: 'Default',
      tags: [],
      description: '',
    });
  };

  const handleDelete = async (id: string) => {
    if (onDeleteConnection) {
      onDeleteConnection(id);
    } else {
      try {
        await fetch(`/api/connections/${id}`, { method: 'DELETE' });
        if (onConnectionsChange) onConnectionsChange();
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleExportJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(connections, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', 'ssh_connections.json');
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleAddTag = () => {
    if (!tagInput.trim()) return;
    setFormProfile({
      ...formProfile,
      tags: [...(formProfile.tags || []), tagInput.trim()],
    });
    setTagInput('');
  };

  const handleRemoveTag = (tag: string) => {
    setFormProfile({
      ...formProfile,
      tags: (formProfile.tags || []).filter((t) => t !== tag),
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
            <Server className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">{t.connTitle}</h2>
            <p className="text-xs text-slate-400">{t.connSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportJSON}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t.exportConfig}</span>
          </button>

          <button
            onClick={() => {
              setFormProfile({
                alias: '',
                hostname: '',
                port: 22,
                username: 'root',
                authType: 'password',
                password: '',
                identityFile: '~/.ssh/id_ed25519',
                group: 'Default',
                tags: ['web'],
                description: '',
              });
              setIsModalOpen(true);
            }}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl shadow-md shadow-emerald-600/20 transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addConnection}</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t.searchConnections}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />
        </div>

        {/* Group Filter Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setSelectedGroup('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
              selectedGroup === 'ALL'
                ? 'bg-slate-800 text-white border border-slate-700'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {t.allGroups} ({connections.length})
          </button>

          {groups.map((grp) => (
            <button
              key={grp}
              onClick={() => setSelectedGroup(grp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0 ${
                selectedGroup === grp
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {grp} ({connections.filter((c) => c.group === grp).length})
            </button>
          ))}
        </div>
      </div>

      {/* Connections Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConnections.map((conn) => {
          const isTesting = testingId === conn.id;

          return (
            <div
              key={conn.id}
              className="bg-slate-900/90 border border-slate-800/90 hover:border-slate-700/90 rounded-2xl p-4 transition-all duration-200 shadow-sm hover:shadow-md flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <h3 className="text-sm font-semibold text-slate-100 truncate group-hover:text-emerald-400 transition-colors">
                        {conn.alias}
                      </h3>
                      {conn.group && (
                        <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded-md border border-slate-700/60 font-mono">
                          {conn.group}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {conn.username}@{conn.hostname}:{conn.port}
                    </p>
                  </div>

                  {/* Latency & Status Badge */}
                  <div className="flex items-center space-x-1.5 shrink-0">
                    {conn.status === 'online' ? (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1 animate-pulse" />
                        {conn.latency ? `${conn.latency}ms` : 'Online'}
                      </span>
                    ) : conn.status === 'offline' ? (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 rounded-full">
                        Offline
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700 rounded-full">
                        Untested
                      </span>
                    )}
                  </div>
                </div>

                {/* Description & Auth Info */}
                <p className="text-xs text-slate-400 line-clamp-2 min-h-[32px]">
                  {conn.description || 'No description provided.'}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-800/80">
                  <div className="flex items-center space-x-1.5">
                    {conn.authType === 'key' ? (
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Shield className="w-3.5 h-3.5 text-blue-400" />
                    )}
                    <span className="capitalize">{conn.authType} Auth</span>
                    {conn.identityFile && (
                      <span className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                        ({conn.identityFile.split('/').pop()})
                      </span>
                    )}
                  </div>

                  {/* Tags */}
                  {conn.tags && conn.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      {conn.tags.slice(0, 2).map((t) => (
                        <span key={t} className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded">
                          #{t}
                        </span>
                      ))}
                      {conn.tags.length > 2 && (
                        <span className="text-[10px] text-slate-500">+{conn.tags.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center justify-between gap-1 border-t border-slate-800">
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => handleTest(conn)}
                    disabled={isTesting}
                    title="Test SSH Connection Handshake"
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 hover:border-slate-700 text-xs flex items-center space-x-1 transition-colors"
                  >
                    <Activity className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-amber-400' : ''}`} />
                  </button>

                  <button
                    onClick={() => {
                      setFormProfile(conn);
                      setIsModalOpen(true);
                    }}
                    title="Edit Connection Profile"
                    className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800 hover:border-slate-700 text-xs transition-colors"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDelete(conn.id)}
                    title="Delete Connection"
                    className="p-1.5 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 rounded-lg border border-slate-800 hover:border-rose-500/20 text-xs transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => (onOpenSFTP ? onOpenSFTP(conn) : onLaunchSftp?.(conn))}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 transition-colors flex items-center space-x-1.5"
                  >
                    <FolderTree className="w-3.5 h-3.5 text-blue-400" />
                    <span>SFTP</span>
                  </button>

                  <button
                    onClick={() => (onOpenTerminal ? onOpenTerminal(conn) : onLaunchTerminal?.(conn))}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                  >
                    <Terminal className="w-3.5 h-3.5" />
                    <span>WebSSH</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredConnections.length === 0 && (
        <div className="text-center py-12 bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-3">
          <Server className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-sm font-medium text-slate-300">{t.noConnections}</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {t.noConnectionsDesc}
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl"
          >
            {t.addFirstConnection}
          </button>
        </div>
      )}

      {/* Add / Edit Connection Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                  <Server className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-semibold text-slate-100">
                  {formProfile.id ? t.editConnection : t.newConnectionModalTitle}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveModal} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">{t.alias} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Production Web 01"
                    value={formProfile.alias || ''}
                    onChange={(e) => setFormProfile({ ...formProfile, alias: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">{t.group}</label>
                  <input
                    type="text"
                    placeholder="e.g. Production, Staging, Dev"
                    value={formProfile.group || ''}
                    onChange={(e) => setFormProfile({ ...formProfile, group: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-slate-300 font-medium mb-1">{t.hostname} *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 172.16.20.101 or server.example.com"
                    value={formProfile.hostname || ''}
                    onChange={(e) => setFormProfile({ ...formProfile, hostname: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">{t.port} *</label>
                  <input
                    type="number"
                    required
                    value={formProfile.port || 22}
                    onChange={(e) => setFormProfile({ ...formProfile, port: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">{t.username} *</label>
                  <input
                    type="text"
                    required
                    placeholder="root / admin / ubuntu"
                    value={formProfile.username || ''}
                    onChange={(e) => setFormProfile({ ...formProfile, username: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">{t.authMethod}</label>
                  <select
                    value={formProfile.authType || 'password'}
                    onChange={(e) => setFormProfile({ ...formProfile, authType: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                  >
                    <option value="password">{t.password}</option>
                    <option value="key">{t.privateKey}</option>
                  </select>
                </div>
              </div>

              {formProfile.authType === 'password' ? (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">{t.password}</label>
                  <input
                    type="password"
                    placeholder="Enter password..."
                    value={formProfile.password || ''}
                    onChange={(e) => setFormProfile({ ...formProfile, password: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-slate-300 font-medium mb-1">{t.privateKey}</label>
                  <select
                    value={formProfile.identityFile || ''}
                    onChange={(e) => setFormProfile({ ...formProfile, identityFile: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500 font-mono"
                  >
                    <option value="">{t.noneKey}</option>
                    {keys.map((k) => (
                      <option key={k.id} value={`~/.ssh/${k.name}`}>
                        ~/.ssh/{k.name} ({k.type})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description / Notes</label>
                <textarea
                  rows={2}
                  placeholder="Optional server description..."
                  value={formProfile.description || ''}
                  onChange={(e) => setFormProfile({ ...formProfile, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Tags Input */}
              <div>
                <label className="block text-slate-300 font-medium mb-1">{t.tags}</label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    placeholder="Add tag (e.g. nginx, db, aws)"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddTag();
                      }
                    }}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={handleAddTag}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl border border-slate-700"
                  >
                    Add
                  </button>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-2">
                  {(formProfile.tags || []).map((tVal) => (
                    <span
                      key={tVal}
                      className="inline-flex items-center space-x-1 px-2 py-0.5 bg-slate-800 text-slate-300 text-[11px] rounded-lg border border-slate-700"
                    >
                      <span>#{tVal}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tVal)}
                        className="text-slate-400 hover:text-rose-400 font-bold"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-md shadow-emerald-600/20"
                >
                  {t.saveConnection}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
