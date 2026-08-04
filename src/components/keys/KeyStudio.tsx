import React, { useState, useEffect } from 'react';
import {
  Key,
  Plus,
  Copy,
  Download,
  UploadCloud,
  ShieldCheck,
  Lock,
  Eye,
  EyeOff,
  Trash2,
  Check,
  Terminal,
  Server,
  Sparkles,
  Info,
} from 'lucide-react';
import { SSHKey, KeyType, ConnectionProfile } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface KeyStudioProps {
  keys?: SSHKey[];
  connections?: ConnectionProfile[];
  onKeysChange?: () => void;
  onGenerateKey?: (params: { name: string; type: KeyType; passphrase?: string; comment?: string }) => void;
  onDeleteKey?: (id: string) => void;
  onDeployKey?: (params: { hostname: string; port: number; username: string; password?: string; publicKey: string; keyName: string }) => Promise<{ success: boolean; message: string }>;
}

export const KeyStudio: React.FC<KeyStudioProps> = ({
  keys: propKeys,
  connections: propConnections,
  onKeysChange,
  onGenerateKey,
  onDeleteKey,
  onDeployKey,
}) => {
  const { t } = useLanguage();
  const [internalKeys, setInternalKeys] = useState<SSHKey[]>([]);
  const [internalConnections, setInternalConnections] = useState<ConnectionProfile[]>([]);

  const keys = propKeys || internalKeys;
  const connections = propConnections || internalConnections;

  const [selectedKey, setSelectedKey] = useState<SSHKey | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isDeployModalOpen, setIsDeployModalOpen] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [showPrivateKey, setShowPrivateKey] = useState(false);

  // Load internal state if props not passed
  useEffect(() => {
    if (!propKeys) {
      fetch('/api/keys')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setInternalKeys(data.keys || []);
        })
        .catch(() => {});
    }
    if (!propConnections) {
      fetch('/api/connections')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) setInternalConnections(data.connections || []);
        })
        .catch(() => {});
    }
  }, [propKeys, propConnections]);

  const refreshKeys = async () => {
    if (onKeysChange) {
      onKeysChange();
    } else {
      try {
        const res = await fetch('/api/keys');
        const data = await res.json();
        if (data.success) setInternalKeys(data.keys || []);
      } catch (err) {
        console.error(err);
      }
    }
  };

  // Generate Form
  const [genName, setGenName] = useState('id_ed25519');
  const [genType, setGenType] = useState<KeyType>('ed25519');
  const [genComment, setGenComment] = useState('admin@dev-station');
  const [genPassphrase, setGenPassphrase] = useState('');

  // Deploy Form
  const [deployTargetMode, setDeployTargetMode] = useState<'conn' | 'manual'>('conn');
  const [selectedConnId, setSelectedConnId] = useState('');
  const [deployHost, setDeployHost] = useState('');
  const [deployPort, setDeployPort] = useState(22);
  const [deployUser, setDeployUser] = useState('root');
  const [deployPassword, setDeployPassword] = useState('');
  const [deployKeyId, setDeployKeyId] = useState('');
  const [deployingStatus, setDeployingStatus] = useState<{ loading: boolean; success?: boolean; message?: string }>({ loading: false });

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!genName) return;

    if (onGenerateKey) {
      onGenerateKey({
        name: genName,
        type: genType,
        comment: genComment,
        passphrase: genPassphrase,
      });
    } else {
      try {
        await fetch('/api/keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: genName,
            type: genType,
            comment: genComment,
            passphrase: genPassphrase,
          }),
        });
        await refreshKeys();
      } catch (err) {
        console.error(err);
      }
    }
    setIsGenerateModalOpen(false);
  };

  const handleDeleteKey = async (id: string) => {
    if (onDeleteKey) {
      onDeleteKey(id);
    } else {
      try {
        await fetch(`/api/keys/${id}`, { method: 'DELETE' });
        setSelectedKey(null);
        await refreshKeys();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleDeploySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const keyToDeploy = (keys || []).find((k) => k.id === deployKeyId) || (keys || [])[0];
    if (!keyToDeploy) return;

    let targetHost = deployHost;
    let targetPort = deployPort;
    let targetUser = deployUser;
    let targetPwd = deployPassword;

    if (deployTargetMode === 'conn') {
      const conn = (connections || []).find((c) => c.id === selectedConnId);
      if (conn) {
        targetHost = conn.hostname;
        targetPort = conn.port;
        targetUser = conn.username;
        if (conn.password) targetPwd = conn.password;
      }
    }

    if (!targetHost || !targetUser) return;

    setDeployingStatus({ loading: true });

    let result = { success: false, message: 'Deployment failed' };

    if (onDeployKey) {
      result = await onDeployKey({
        hostname: targetHost,
        port: targetPort,
        username: targetUser,
        password: targetPwd,
        publicKey: keyToDeploy.publicKey,
        keyName: keyToDeploy.name,
      });
    } else {
      try {
        const res = await fetch('/api/keys/deploy', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hostname: targetHost,
            port: targetPort,
            username: targetUser,
            password: targetPwd,
            publicKey: keyToDeploy.publicKey,
            keyName: keyToDeploy.name,
          }),
        });
        const data = await res.json();
        result = { success: data.success, message: data.message || data.error };
      } catch (err: any) {
        result = { success: false, message: err.message };
      }
    }

    setDeployingStatus({
      loading: false,
      success: result.success,
      message: result.message,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0a0a0a] p-4 rounded-md border border-white/10 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-zinc-100">{t.keyStudioTitle}</h2>
            <p className="text-xs text-zinc-400">{t.keyStudioSubtitle}</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              if (keys.length > 0) setDeployKeyId(keys[0].id);
              if (connections.length > 0) setSelectedConnId(connections[0].id);
              setDeployingStatus({ loading: false });
              setIsDeployModalOpen(true);
            }}
            className="px-3.5 py-2 bg-[#141414] hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-md border border-zinc-700 transition-colors flex items-center space-x-1.5"
          >
            <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
            <span>{t.deployPublicKey}</span>
          </button>

          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-md shadow-sm transition-all flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>{t.generateKeyPair}</span>
          </button>
        </div>
      </div>

      {/* Keys List & Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Key List */}
        <div className="lg:col-span-1 bg-[#0a0a0a] border border-white/10 rounded-md p-4 space-y-3">
          <div className="flex items-center justify-between px-1 pb-2 border-b border-white/10">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              SSH Keys ({keys.length})
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono">~/.ssh/</span>
          </div>

          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {keys.map((k) => {
              const isSelected = selectedKey?.id === k.id;

              return (
                <div
                  key={k.id}
                  onClick={() => setSelectedKey(k)}
                  className={`p-3.5 rounded-md border transition-all cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                      : 'bg-[#000000]/60 border-white/10 hover:border-zinc-700/80 text-zinc-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2 font-mono text-xs font-semibold">
                      <Key className={`w-3.5 h-3.5 ${isSelected ? 'text-blue-400' : 'text-zinc-400'}`} />
                      <span>{k.name}</span>
                    </div>

                    <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#141414] text-zinc-400 rounded border border-zinc-700/60 uppercase">
                      {k.type}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-400 font-mono truncate">{k.fingerprint}</p>

                  <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1 border-t border-white/10">
                    <span>{k.comment || 'No comment'}</span>
                    {k.passphraseProtected && (
                      <span className="flex items-center space-x-1 text-amber-400">
                        <Lock className="w-2.5 h-2.5" />
                        <span>Encrypted</span>
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Key Inspector Detail */}
        <div className="lg:col-span-2 bg-[#0a0a0a] border border-white/10 rounded-md p-6 space-y-6">
          {selectedKey ? (
            <div className="space-y-6">
              {/* Header */}
              <div className="flex items-start justify-between pb-4 border-b border-white/10">
                <div>
                  <div className="flex items-center space-x-3">
                    <h3 className="text-base font-bold text-zinc-100 font-mono">{selectedKey.name}</h3>
                    <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
                      {selectedKey.type.toUpperCase()}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 mt-1">Comment: {selectedKey.comment}</p>
                </div>

                <button
                  onClick={() => handleDeleteKey(selectedKey.id)}
                  className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium rounded-md border border-rose-500/20 transition-colors flex items-center space-x-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Key</span>
                </button>
              </div>

              {/* SHA256 Fingerprint */}
              <div className="bg-[#000000] p-4 rounded-md border border-white/10 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-medium">OpenSSH Fingerprint (SHA256)</span>
                  <button
                    onClick={() => handleCopy(selectedKey.fingerprint, 'fp')}
                    className="text-blue-400 hover:underline flex items-center space-x-1"
                  >
                    {copiedField === 'fp' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedField === 'fp' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <div className="text-xs font-mono text-blue-400 select-all font-semibold">
                  {selectedKey.fingerprint}
                </div>
              </div>

              {/* Public Key */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-zinc-300">Public Key (OpenSSH Format)</span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleCopy(selectedKey.publicKey, 'pub')}
                      className="px-2.5 py-1 bg-[#141414] hover:bg-zinc-700 text-zinc-300 text-[11px] rounded-md border border-zinc-700 flex items-center space-x-1"
                    >
                      {copiedField === 'pub' ? <Check className="w-3 h-3 text-blue-400" /> : <Copy className="w-3 h-3" />}
                      <span>Copy</span>
                    </button>
                    <button
                      onClick={() => handleDownload(selectedKey.publicKey, `${selectedKey.name}.pub`)}
                      className="px-2.5 py-1 bg-[#141414] hover:bg-zinc-700 text-zinc-300 text-[11px] rounded-md border border-zinc-700 flex items-center space-x-1"
                    >
                      <Download className="w-3 h-3" />
                      <span>.pub</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-[#000000] rounded-md border border-white/10 font-mono text-[11px] text-zinc-300 break-all select-all leading-relaxed">
                  {selectedKey.publicKey}
                </div>
              </div>

              {/* Private Key */}
              {selectedKey.hasPrivateKey && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-zinc-300">Private Key</span>
                      <button
                        onClick={() => setShowPrivateKey(!showPrivateKey)}
                        className="text-zinc-400 hover:text-zinc-200 flex items-center space-x-1 text-[11px]"
                      >
                        {showPrivateKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        <span>{showPrivateKey ? 'Hide' : 'Reveal'}</span>
                      </button>
                    </div>

                    {showPrivateKey && selectedKey.privateKey && (
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleCopy(selectedKey.privateKey!, 'priv')}
                          className="px-2.5 py-1 bg-[#141414] hover:bg-zinc-700 text-zinc-300 text-[11px] rounded-md border border-zinc-700 flex items-center space-x-1"
                        >
                          {copiedField === 'priv' ? <Check className="w-3 h-3 text-blue-400" /> : <Copy className="w-3 h-3" />}
                          <span>Copy</span>
                        </button>
                        <button
                          onClick={() => handleDownload(selectedKey.privateKey!, `${selectedKey.name}.pem`)}
                          className="px-2.5 py-1 bg-[#141414] hover:bg-zinc-700 text-zinc-300 text-[11px] rounded-md border border-zinc-700 flex items-center space-x-1"
                        >
                          <Download className="w-3 h-3" />
                          <span>.pem</span>
                        </button>
                      </div>
                    )}
                  </div>

                  {showPrivateKey && selectedKey.privateKey ? (
                    <div className="p-3 bg-[#000000] rounded-md border border-white/10 font-mono text-[10px] text-zinc-400 overflow-x-auto max-h-48 leading-tight">
                      {selectedKey.privateKey}
                    </div>
                  ) : (
                    <div className="p-4 bg-[#000000]/50 rounded-md border border-white/10 text-center text-xs text-zinc-500">
                      Private key is hidden for security. Click "Reveal" above to inspect.
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-20 space-y-3">
              <Key className="w-12 h-12 text-zinc-700 mx-auto" />
              <h3 className="text-sm font-medium text-zinc-300">Select an SSH Key to Inspect</h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                Select a key from the left column to view its SHA256 fingerprint, OpenSSH public key, and download `.pub` / `.pem` key files.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Generate Key Pair Modal */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 bg-[#000000]  z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-md w-full max-w-md p-6  space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-md">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">Generate New SSH Key Pair</h3>
              </div>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-zinc-400 hover:text-zinc-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleGenerateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Key Name / File Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. id_ed25519_prod"
                  value={genName}
                  onChange={(e) => setGenName(e.target.value)}
                  className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Algorithm / Key Type *</label>
                <select
                  value={genType}
                  onChange={(e) => setGenType(e.target.value as KeyType)}
                  className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200 focus:outline-none focus:border-blue-500 font-mono"
                >
                  <option value="ed25519">Ed25519 (Recommended - High Security & Fast)</option>
                  <option value="ecdsa-p256">ECDSA P-256 (NIST Curve)</option>
                  <option value="ecdsa-p384">ECDSA P-384 (NIST Curve)</option>
                  <option value="ecdsa-p521">ECDSA P-521 (NIST Curve)</option>
                  <option value="rsa-2048">RSA 2048-bit (Standard Legacy)</option>
                  <option value="rsa-3070">RSA 3072-bit</option>
                  <option value="rsa-4096">RSA 4096-bit (Maximum RSA Security)</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Comment / Label</label>
                <input
                  type="text"
                  placeholder="e.g. admin@server or dev-key"
                  value={genComment}
                  onChange={(e) => setGenComment(e.target.value)}
                  className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-medium mb-1">Optional Key Passphrase</label>
                <input
                  type="password"
                  placeholder="Leave empty for unencrypted key"
                  value={genPassphrase}
                  onChange={(e) => setGenPassphrase(e.target.value)}
                  className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 bg-[#141414] hover:bg-zinc-700 text-zinc-300 rounded-md"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md shadow-sm"
                >
                  Generate Key Pair
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deploy Public Key Modal */}
      {isDeployModalOpen && (
        <div className="fixed inset-0 bg-[#000000]  z-50 flex items-center justify-center p-4">
          <div className="bg-[#0a0a0a] border border-white/10 rounded-md w-full max-w-lg p-6  space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-zinc-100">Deploy Public Key to Remote Server</h3>
              </div>
              <button onClick={() => setIsDeployModalOpen(false)} className="text-zinc-400 hover:text-zinc-200">
                ✕
              </button>
            </div>

            <form onSubmit={handleDeploySubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Select SSH Key to Push *</label>
                <select
                  value={deployKeyId}
                  onChange={(e) => setDeployKeyId(e.target.value)}
                  className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-amber-500"
                >
                  {keys.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.name} ({k.type}) - {k.fingerprint.slice(0, 20)}...
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Selection */}
              <div>
                <label className="block text-zinc-300 font-medium mb-1">Target Host Selection</label>
                <div className="flex items-center space-x-3 mb-2">
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetMode"
                      checked={deployTargetMode === 'conn'}
                      onChange={() => setDeployTargetMode('conn')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-zinc-300">Choose Saved Connection</span>
                  </label>
                  <label className="flex items-center space-x-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="targetMode"
                      checked={deployTargetMode === 'manual'}
                      onChange={() => setDeployTargetMode('manual')}
                      className="text-amber-500 focus:ring-amber-500"
                    />
                    <span className="text-zinc-300">Manual Host/IP</span>
                  </label>
                </div>

                {deployTargetMode === 'conn' ? (
                  <select
                    value={selectedConnId}
                    onChange={(e) => setSelectedConnId(e.target.value)}
                    className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200 font-mono focus:outline-none focus:border-amber-500"
                  >
                    {connections.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.alias} ({c.username}@{c.hostname}:{c.port})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="text"
                      placeholder="Hostname / IP"
                      value={deployHost}
                      onChange={(e) => setDeployHost(e.target.value)}
                      className="col-span-2 bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200 font-mono"
                    />
                    <input
                      type="number"
                      placeholder="Port"
                      value={deployPort}
                      onChange={(e) => setDeployPort(Number(e.target.value))}
                      className="bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200 font-mono"
                    />
                  </div>
                )}
              </div>

              {deployTargetMode === 'manual' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Username *</label>
                    <input
                      type="text"
                      value={deployUser}
                      onChange={(e) => setDeployUser(e.target.value)}
                      className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200 font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-zinc-300 font-medium mb-1">Password</label>
                    <input
                      type="password"
                      placeholder="Password..."
                      value={deployPassword}
                      onChange={(e) => setDeployPassword(e.target.value)}
                      className="w-full bg-[#000000] border border-white/10 rounded-md px-3 py-2 text-zinc-200 font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Status Banner */}
              {deployingStatus.message && (
                <div
                  className={`p-3 rounded-md border text-xs font-mono leading-relaxed ${
                    deployingStatus.success
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  }`}
                >
                  {deployingStatus.message}
                </div>
              )}

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setIsDeployModalOpen(false)}
                  className="px-4 py-2 bg-[#141414] hover:bg-zinc-700 text-zinc-300 rounded-md"
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={deployingStatus.loading}
                  className="px-5 py-2 bg-amber-600 hover:bg-amber-500 text-white font-medium rounded-md  shadow-amber-600/20 flex items-center space-x-2"
                >
                  {deployingStatus.loading && <Sparkles className="w-3.5 h-3.5 animate-spin" />}
                  <span>{deployingStatus.loading ? 'Deploying Key...' : 'Deploy to authorized_keys'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
