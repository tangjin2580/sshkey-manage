import React, { useEffect, useState } from 'react';
import {
  FolderTree,
  File,
  Folder,
  ArrowLeft,
  RefreshCw,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit,
  Save,
  Check,
  Search,
  ChevronRight,
  ShieldAlert,
  FileText,
  Code,
  FileCode,
  Sparkles,
} from 'lucide-react';
import { ConnectionProfile, SFTPFileItem } from '../../types';
import { useLanguage } from '../../i18n/LanguageContext';

interface SFTPManagerProps {
  connections: ConnectionProfile[];
  initialConn?: ConnectionProfile | null;
}

export const SFTPManager: React.FC<SFTPManagerProps> = ({ connections, initialConn }) => {
  const { t } = useLanguage();
  const [selectedConnId, setSelectedConnId] = useState<string>(initialConn?.id || connections[0]?.id || '');
  const [currentPath, setCurrentPath] = useState<string>('/home/admin');
  const [fileItems, setFileItems] = useState<SFTPFileItem[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Editor State
  const [activeEditorFile, setActiveEditorFile] = useState<{ path: string; content: string; isDirty: boolean } | null>(null);
  const [savingFile, setSavingFile] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // New Item Modals
  const [isNewFolderOpen, setIsNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isNewFileOpen, setIsNewFileOpen] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  // Upload Simulation Modal
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadFileName, setUploadFileName] = useState('app-config.json');
  const [uploadFileContent, setUploadFileContent] = useState('{\n  "version": "1.0.0",\n  "status": "active"\n}');

  useEffect(() => {
    fetchDirectory(currentPath);
  }, [currentPath, selectedConnId]);

  const fetchDirectory = async (dirPath: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sftp/list?path=${encodeURIComponent(dirPath)}`);
      const data = await res.json();
      if (data.success) {
        setFileItems(data.items || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  const handleOpenFile = async (item: SFTPFileItem) => {
    if (item.type === 'directory') {
      setCurrentPath(item.path);
      return;
    }

    try {
      const res = await fetch(`/api/sftp/read?path=${encodeURIComponent(item.path)}`);
      const data = await res.json();
      if (data.success) {
        setActiveEditorFile({
          path: item.path,
          content: data.content || '',
          isDirty: false,
        });
      }
    } catch {
      // ignore
    }
  };

  const handleSaveEditorFile = async () => {
    if (!activeEditorFile) return;
    setSavingFile(true);

    try {
      const res = await fetch('/api/sftp/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: activeEditorFile.path,
          content: activeEditorFile.content,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setActiveEditorFile({ ...activeEditorFile, isDirty: false });
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
        fetchDirectory(currentPath);
      }
    } catch {
      // ignore
    } finally {
      setSavingFile(false);
    }
  };

  const handleDeleteItem = async (itemPath: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${itemPath}?`)) return;

    try {
      await fetch('/api/sftp/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: itemPath }),
      });
      if (activeEditorFile?.path === itemPath) {
        setActiveEditorFile(null);
      }
      fetchDirectory(currentPath);
    } catch {
      // ignore
    }
  };

  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName) return;
    const fullPath = `${currentPath}/${newFolderName}`.replace(/\/+/g, '/');

    try {
      await fetch('/api/sftp/mkdir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fullPath }),
      });
      setIsNewFolderOpen(false);
      setNewFolderName('');
      fetchDirectory(currentPath);
    } catch {
      // ignore
    }
  };

  const handleCreateFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFileName) return;
    const fullPath = `${currentPath}/${newFileName}`.replace(/\/+/g, '/');

    try {
      await fetch('/api/sftp/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fullPath, content: '# New File\n' }),
      });
      setIsNewFileOpen(false);
      setNewFileName('');
      fetchDirectory(currentPath);
      setActiveEditorFile({ path: fullPath, content: '# New File\n', isDirty: false });
    } catch {
      // ignore
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName) return;
    const fullPath = `${currentPath}/${uploadFileName}`.replace(/\/+/g, '/');

    try {
      await fetch('/api/sftp/write', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: fullPath, content: uploadFileContent }),
      });
      setIsUploadOpen(false);
      fetchDirectory(currentPath);
    } catch {
      // ignore
    }
  };

  // Breadcrumbs
  const pathParts = currentPath.split('/').filter(Boolean);

  const filteredItems = fileItems.filter((i) =>
    i.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-4 rounded-2xl border border-slate-800 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-xl">
            <FolderTree className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">{t.sftpTitle}</h2>
            <p className="text-xs text-slate-400">{t.sftpSubtitle}</p>
          </div>
        </div>

        {/* Server Selector & Quick Actions */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedConnId}
            onChange={(e) => setSelectedConnId(e.target.value)}
            className="bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
          >
            {connections.map((c) => (
              <option key={c.id} value={c.id}>
                {c.alias} ({c.username}@{c.hostname})
              </option>
            ))}
          </select>

          <button
            onClick={() => setIsUploadOpen(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <Upload className="w-3.5 h-3.5 text-blue-400" />
            <span>{t.uploadFile}</span>
          </button>

          <button
            onClick={() => setIsNewFolderOpen(true)}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-xl border border-slate-700 flex items-center space-x-1.5 transition-colors"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            <span>{t.newFolder}</span>
          </button>
        </div>
      </div>

      {/* Main SFTP Dual Pane Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[580px]">
        {/* Left Pane: File Directory Browser */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3">
          {/* Path Breadcrumbs Bar */}
          <div className="flex items-center space-x-1 bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs font-mono text-slate-300 overflow-x-auto">
            <button
              onClick={() => setCurrentPath('/')}
              className="hover:text-emerald-400 font-bold px-1"
            >
              /
            </button>
            {pathParts.map((part, idx) => {
              const subPath = '/' + pathParts.slice(0, idx + 1).join('/');
              return (
                <React.Fragment key={subPath}>
                  <ChevronRight className="w-3 h-3 text-slate-600 shrink-0" />
                  <button
                    onClick={() => setCurrentPath(subPath)}
                    className="hover:text-emerald-400 truncate max-w-[100px]"
                  >
                    {part}
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Search & Refresh */}
          <div className="flex items-center space-x-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="Filter files..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none"
              />
            </div>

            <button
              onClick={() => fetchDirectory(currentPath)}
              title="Reload Directory"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-400' : ''}`} />
            </button>

            <button
              onClick={() => setIsNewFileOpen(true)}
              title="Create New File"
              className="p-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 rounded-xl border border-slate-700"
            >
              <FileCode className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Directory Items List */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 max-h-[480px]">
            {filteredItems.map((item) => {
              const isDirectory = item.type === 'directory';
              const isSelectedForEdit = activeEditorFile?.path === item.path;

              return (
                <div
                  key={item.path}
                  onClick={() => handleOpenFile(item)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-mono transition-all cursor-pointer group ${
                    isSelectedForEdit
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    {isDirectory ? (
                      <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <FileCode className="w-4 h-4 text-blue-400 shrink-0" />
                    )}
                    <span className="truncate">{item.name}</span>
                  </div>

                  <div className="flex items-center space-x-3 shrink-0">
                    <span className="text-[10px] text-slate-500 font-mono">
                      {isDirectory ? 'DIR' : `${(item.size / 1024).toFixed(1)} KB`}
                    </span>

                    <button
                      onClick={(e) => handleDeleteItem(item.path, e)}
                      title="Delete Item"
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/10 text-slate-500 hover:text-rose-400 rounded transition-all"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Pane: Remote File Code Editor */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col space-y-3">
          {activeEditorFile ? (
            <>
              {/* Editor Header Bar */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center space-x-2 truncate">
                  <FileCode className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-mono text-xs text-slate-200 font-semibold truncate">
                    {activeEditorFile.path}
                  </span>
                  {activeEditorFile.isDirty && (
                    <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleSaveEditorFile}
                    disabled={savingFile}
                    className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                  >
                    {saveSuccess ? (
                      <Check className="w-3.5 h-3.5 text-emerald-200" />
                    ) : (
                      <Save className="w-3.5 h-3.5" />
                    )}
                    <span>{saveSuccess ? 'Saved!' : 'Save Remote File'}</span>
                  </button>
                </div>
              </div>

              {/* Code Editor Textarea */}
              <div className="flex-1 bg-slate-950 rounded-xl border border-slate-800 p-3 font-mono text-xs text-slate-200 leading-relaxed shadow-inner">
                <textarea
                  value={activeEditorFile.content}
                  onChange={(e) =>
                    setActiveEditorFile({
                      ...activeEditorFile,
                      content: e.target.value,
                      isDirty: true,
                    })
                  }
                  className="w-full h-full min-h-[420px] bg-transparent resize-none focus:outline-none font-mono text-xs leading-relaxed text-slate-200"
                  spellCheck={false}
                />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-20">
              <Code className="w-12 h-12 text-slate-700" />
              <h3 className="text-sm font-medium text-slate-300">No File Selected for Editing</h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Click on any text or code file in the left SFTP explorer to view and modify its content in real time.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* New Folder Modal */}
      {isNewFolderOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Create New Directory</h3>
            <form onSubmit={handleCreateFolder} className="space-y-4 text-xs">
              <input
                type="text"
                required
                placeholder="Folder name (e.g. config)"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewFolderOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl">
                  Create Folder
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New File Modal */}
      {isNewFileOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Create New Remote File</h3>
            <form onSubmit={handleCreateFile} className="space-y-4 text-xs">
              <input
                type="text"
                required
                placeholder="File name (e.g. server.env)"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
              />
              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsNewFileOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white rounded-xl">
                  Create File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload File Modal */}
      {isUploadOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Upload File to Remote Directory</h3>
            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Target Filename *</label>
                <input
                  type="text"
                  required
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">File Content</label>
                <textarea
                  rows={6}
                  value={uploadFileContent}
                  onChange={(e) => setUploadFileContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-slate-200 font-mono text-xs"
                />
              </div>

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-xl">
                  Upload to {currentPath}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
