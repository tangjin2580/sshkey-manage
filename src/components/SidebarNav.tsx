import React from 'react';
import {
  Server,
  Key,
  Terminal,
  FolderTree,
  FileCode,
  RefreshCw,
  Sliders,
  Shield,
  Layers,
} from 'lucide-react';
import { useLanguage } from '../i18n/LanguageContext';

interface SidebarNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  connectionsCount: number;
  keysCount: number;
  activeTerminalsCount: number;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({
  activeTab,
  setActiveTab,
  connectionsCount,
  keysCount,
  activeTerminalsCount,
}) => {
  const { t } = useLanguage();

  const navItems = [
    {
      id: 'connections',
      label: t.connections,
      icon: Server,
      badge: connectionsCount,
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      description: t.connectionsDesc,
    },
    {
      id: 'keys',
      label: t.keyStudio,
      icon: Key,
      badge: keysCount,
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      description: t.keyStudioDesc,
    },
    {
      id: 'terminal',
      label: t.terminal,
      icon: Terminal,
      badge: activeTerminalsCount > 0 ? `${activeTerminalsCount} Live` : undefined,
      badgeColor: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      description: t.terminalDesc,
    },
    {
      id: 'sftp',
      label: t.sftp,
      icon: FolderTree,
      description: t.sftpDesc,
    },
    {
      id: 'sshconfig',
      label: t.sshConfig,
      icon: FileCode,
      description: t.sshConfigDesc,
    },
    {
      id: 'filesync',
      label: t.fileSync,
      icon: RefreshCw,
      description: t.fileSyncDesc,
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800/80 flex flex-col justify-between shrink-0 select-none">
      <div className="p-3 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          {t.navTitle}
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 border border-transparent'
              }`}
            >
              <div className="flex items-center space-x-3 text-left min-w-0">
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <div className="truncate">
                  <div className="truncate text-slate-200">{item.label}</div>
                  <div className="text-[10px] text-slate-500 font-normal truncate">{item.description}</div>
                </div>
              </div>

              {item.badge !== undefined && (
                <span
                  className={`ml-2 px-1.5 py-0.5 text-[10px] font-semibold border rounded-md shrink-0 ${
                    item.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Info Card */}
      <div className="p-3 m-3 bg-slate-800/50 border border-slate-800 rounded-xl space-y-2">
        <div className="flex items-center space-x-2 text-slate-300 text-xs font-medium">
          <Shield className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{t.localEnv}</span>
        </div>
        <p className="text-[11px] text-slate-400 leading-relaxed">
          {t.localEnvDesc}
        </p>
      </div>
    </aside>
  );
};
