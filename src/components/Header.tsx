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
    <header className="bg-slate-900 border-b border-slate-800 text-slate-100 px-6 py-3.5 flex items-center justify-between shadow-md">
      {/* App Branding */}
      <div className="flex items-center space-x-3">
        <div className="p-2 bg-gradient-to-tr from-emerald-500 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/20 text-white">
          <Key className="w-5 h-5" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="font-semibold text-base tracking-tight text-white">{t.appTitle}</h1>
            <span className="px-2 py-0.5 text-[10px] font-medium tracking-wide bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
              v2.4.0 Qt-GUI
            </span>
          </div>
          <p className="text-xs text-slate-400 font-normal">
            {t.appSubtitle}
          </p>
        </div>
      </div>

      {/* Global Status Counters & Controls */}
      <div className="flex items-center space-x-4">
        {/* Platform Badge */}
        {platformInfo && (
          <div className="hidden sm:flex items-center space-x-2 px-3 py-1.5 bg-slate-800/80 border border-slate-700/60 rounded-lg text-xs text-slate-300">
            <Monitor className="w-3.5 h-3.5 text-slate-400" />
            <span>{platformInfo.platformName} OS</span>
            <span className="text-slate-500">•</span>
            <span className="font-mono text-[11px] text-slate-400">{platformInfo.sshDir}</span>
          </div>
        )}

        {/* Quick Counters */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5 bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-700/40 text-slate-300">
            <Server className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium text-white">{platformInfo?.connectionCount ?? 0}</span>
            <span className="text-slate-400">{t.hosts}</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-700/40 text-slate-300">
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="font-medium text-white">{platformInfo?.keyCount ?? 0}</span>
            <span className="text-slate-400">{t.keys}</span>
          </div>

          <div className="flex items-center space-x-1.5 bg-slate-800/60 px-2.5 py-1.5 rounded-lg border border-slate-700/40 text-slate-300">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-medium text-white">{activeSessionsCount}</span>
            <span className="text-slate-400">{t.terminals}</span>
          </div>
        </div>

        {/* Language Switcher Button */}
        <button
          onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
          title="切换语言 / Switch Language"
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg border border-slate-700 transition-colors shadow-sm"
        >
          <Languages className="w-3.5 h-3.5 text-emerald-400" />
          <span>{language === 'zh' ? '中文 / EN' : 'EN / 中文'}</span>
        </button>

        {/* Refresh Button */}
        <button
          onClick={onRefreshAll}
          title={t.refreshState}
          className="p-2 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors rounded-lg border border-slate-800 hover:border-slate-700"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
