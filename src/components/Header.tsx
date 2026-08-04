import React from 'react';
import { Key, Server, Terminal, FolderSync, Shield, Monitor, RefreshCw, Languages } from 'lucide-react';
import { SystemPlatformInfo } from '../types';
import { useLanguage } from '../i18n/LanguageContext';

interface HeaderProps {
  platformInfo: SystemPlatformInfo | null;
  activeTab: string;
  onRefreshAll: () => void;
  activeSessionsCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  platformInfo,
  onRefreshAll,
  activeSessionsCount,
}) => {
  const { language, setLanguage, t } = useLanguage();

  return (
    <header className="bg-[#0a0a0a] border-b border-white/10 text-zinc-100 px-6 py-3.5 flex items-center justify-between ">
      {/* App Branding */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-blue-600 rounded-md shadow-sm text-white">
          <Key className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-semibold text-base tracking-tight text-white">{t.appTitle}</h1>
            <span className="px-2 py-0.5 text-[10px] font-medium tracking-wide bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
              v2.4.0 Qt-GUI
            </span>
          </div>
          <p className="text-xs text-zinc-400 font-normal">
            {t.appSubtitle}
          </p>
        </div>
      </div>

      {/* Global Status Counters & Controls */}
      <div className="flex items-center space-x-4">
        {/* Platform Badge */}
        {platformInfo && (
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-[#141414]/80 border border-zinc-700/60 rounded-md text-xs text-zinc-300">
            <Monitor className="w-3.5 h-3.5 text-zinc-400" />
            <span>{platformInfo.platformName} OS</span>
            <span className="text-zinc-500">•</span>
            <span className="font-mono text-[11px] text-zinc-400">{platformInfo.sshDir}</span>
          </div>
        )}

        {/* Quick Counters */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 bg-[#141414]/60 px-2.5 py-1.5 rounded-md border border-zinc-700/40 text-zinc-300">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium text-white">{platformInfo?.connectionCount ?? 0}</span>
            <span className="text-zinc-400">{t.hosts}</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#141414]/60 px-2.5 py-1.5 rounded-md border border-zinc-700/40 text-zinc-300">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium text-white">{platformInfo?.keyCount ?? 0}</span>
            <span className="text-zinc-400">{t.keys}</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-[#141414]/60 px-2.5 py-1.5 rounded-md border border-zinc-700/40 text-zinc-300">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium text-white">{activeSessionsCount}</span>
            <span className="text-zinc-400">{t.terminals}</span>
          </div>
        </div>

        {/* Language Switcher Button */}
        <button
          onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
          title="切换语言 / Switch Language"
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#141414] hover:bg-zinc-700 text-zinc-200 text-xs font-medium rounded-md border border-zinc-700 transition-colors shadow-sm"
        >
          <Languages className="w-3.5 h-3.5 text-blue-400" />
          <span>{language === 'zh' ? '中文 / EN' : 'EN / 中文'}</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefreshAll}
          title={t.refreshState}
          className="p-2 hover:bg-[#141414] text-zinc-400 hover:text-zinc-200 transition-colors rounded-md border border-white/10 hover:border-zinc-700"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
