import React, { useEffect, useRef, useState } from 'react';
import { Terminal as XTerminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import {
  Terminal,
  Plus,
  X,
  Maximize2,
  Minimize2,
  Trash2,
  Type,
  Palette,
  Sparkles,
  Play,
} from 'lucide-react';
import { ConnectionProfile, TerminalSessionInfo } from '../../types';
import { DEFAULT_SNIPPETS } from '../../data/snippets';
import { useLanguage } from '../../i18n/LanguageContext';

interface WebSSHManagerProps {
  connections: ConnectionProfile[];
  initialActiveConn?: ConnectionProfile | null;
}

const TERMINAL_THEMES: Record<string, any> = {
  dracula: {
    background: '#282a36',
    foreground: '#f8f8f2',
    cursor: '#f8f8f2',
    selectionBackground: '#44475a',
    black: '#21222c',
    red: '#ff5555',
    green: '#50fa7b',
    yellow: '#f1fa8c',
    blue: '#bd93f9',
    magenta: '#ff79c6',
    cyan: '#8be9fd',
    white: '#f8f8f2',
  },
  monokai: {
    background: '#272822',
    foreground: '#f8f8f2',
    cursor: '#f8f8f0',
    selectionBackground: '#49483e',
    black: '#272822',
    red: '#f92672',
    green: '#a6e22e',
    yellow: '#e6db74',
    blue: '#66d9ef',
    magenta: '#ae81ff',
    cyan: '#a6e22e',
    white: '#f8f8f2',
  },
  nord: {
    background: '#2e3440',
    foreground: '#d8dee9',
    cursor: '#d8dee9',
    selectionBackground: '#434c5e',
    black: '#3b4252',
    red: '#bf616a',
    green: '#a3be8c',
    yellow: '#ebcb8b',
    blue: '#81a1c1',
    magenta: '#b48ead',
    cyan: '#88c0d0',
    white: '#e5e9f0',
  },
  onedark: {
    background: '#1e222a',
    foreground: '#abb2bf',
    cursor: '#528bff',
    selectionBackground: '#3e4451',
    black: '#1e222a',
    red: '#e06c75',
    green: '#98c379',
    yellow: '#d19a66',
    blue: '#61afef',
    magenta: '#c678dd',
    cyan: '#56b6c2',
    white: '#abb2bf',
  },
};

export const WebSSHManager: React.FC<WebSSHManagerProps> = ({ connections, initialActiveConn }) => {
  const { t } = useLanguage();
  const [sessions, setSessions] = useState<TerminalSessionInfo[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');
  const [fontSize, setFontSize] = useState<number>(13);
  const [currentTheme, setCurrentTheme] = useState<string>('dracula');
  const [isFullScreen, setIsFullScreen] = useState<boolean>(false);
  const [selectedConnForNewTab, setSelectedConnForNewTab] = useState<string>('');
  const [isNewTabModalOpen, setIsNewTabModalOpen] = useState<boolean>(false);

  const termContainersRef = useRef<Record<string, HTMLDivElement | null>>({});
  const xtermInstancesRef = useRef<Record<string, XTerminal>>({});
  const fitAddonsRef = useRef<Record<string, FitAddon>>({});
  const wsInstancesRef = useRef<Record<string, WebSocket>>({});

  useEffect(() => {
    if (sessions.length === 0) {
      const conn = initialActiveConn || connections[0];
      if (conn) {
        createNewSession(conn);
      }
    }
  }, []);

  const createNewSession = (conn: ConnectionProfile) => {
    const newSession: TerminalSessionInfo = {
      id: `session-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      connectionId: conn.id,
      title: `${conn.alias} (${conn.username}@${conn.hostname})`,
      status: 'connecting',
      theme: currentTheme as any,
      fontSize,
      createdAt: new Date().toISOString(),
    };

    setSessions((prev) => [...prev, newSession]);
    setActiveSessionId(newSession.id);
  };

  const closeSession = (sessionId: string) => {
    if (wsInstancesRef.current[sessionId]) {
      wsInstancesRef.current[sessionId].close();
      delete wsInstancesRef.current[sessionId];
    }
    if (xtermInstancesRef.current[sessionId]) {
      xtermInstancesRef.current[sessionId].dispose();
      delete xtermInstancesRef.current[sessionId];
    }
    delete fitAddonsRef.current[sessionId];

    const remaining = sessions.filter((s) => s.id !== sessionId);
    setSessions(remaining);
    if (remaining.length > 0 && activeSessionId === sessionId) {
      setActiveSessionId(remaining[remaining.length - 1].id);
    }
  };

  useEffect(() => {
    sessions.forEach((sess) => {
      const container = termContainersRef.current[sess.id];
      if (container && !xtermInstancesRef.current[sess.id]) {
        const term = new XTerminal({
          cursorBlink: true,
          fontFamily: 'Menlo, Monaco, "Courier New", monospace',
          fontSize,
          theme: TERMINAL_THEMES[currentTheme] || TERMINAL_THEMES.dracula,
          allowProposedApi: true,
        });

        const fitAddon = new FitAddon();
        term.loadAddon(fitAddon);
        term.open(container);
        fitAddon.fit();

        xtermInstancesRef.current[sess.id] = term;
        fitAddonsRef.current[sess.id] = fitAddon;

        const conn = connections.find((c) => c.id === sess.connectionId) || {
          hostname: '127.0.0.1',
          port: 22,
          username: 'admin',
          password: '',
        };

        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${wsProtocol}//${window.location.host}/ws/terminal?hostname=${encodeURIComponent(
          conn.hostname
        )}&port=${conn.port}&username=${encodeURIComponent(conn.username)}&password=${encodeURIComponent(
          conn.password || ''
        )}`;

        const ws = new WebSocket(wsUrl);
        wsInstancesRef.current[sess.id] = ws;

        ws.onopen = () => {
          setSessions((prev) =>
            prev.map((s) => (s.id === sess.id ? { ...s, status: 'connected' } : s))
          );
        };

        ws.onmessage = (event) => {
          term.write(event.data);
        };

        ws.onerror = () => {
          setSessions((prev) =>
            prev.map((s) => (s.id === sess.id ? { ...s, status: 'error' } : s))
          );
        };

        ws.onclose = () => {
          setSessions((prev) =>
            prev.map((s) => (s.id === sess.id ? { ...s, status: 'disconnected' } : s))
          );
        };

        term.onData((data) => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(data);
          }
        });
      }
    });

    if (activeSessionId && fitAddonsRef.current[activeSessionId]) {
      setTimeout(() => {
        fitAddonsRef.current[activeSessionId]?.fit();
      }, 50);
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    Object.keys(xtermInstancesRef.current).forEach((sId) => {
      const term = xtermInstancesRef.current[sId];
      if (term) {
        term.options.theme = TERMINAL_THEMES[currentTheme] || TERMINAL_THEMES.dracula;
      }
    });
  }, [currentTheme]);

  useEffect(() => {
    Object.keys(xtermInstancesRef.current).forEach((sId) => {
      const term = xtermInstancesRef.current[sId];
      if (term) {
        term.options.fontSize = fontSize;
      }
      fitAddonsRef.current[sId]?.fit();
    });
  }, [fontSize]);

  const sendCommandToActive = (cmd: string) => {
    if (!activeSessionId) return;
    const ws = wsInstancesRef.current[activeSessionId];
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(cmd + '\r');
    }
  };

  const clearActiveScreen = () => {
    if (!activeSessionId) return;
    const term = xtermInstancesRef.current[activeSessionId];
    if (term) term.clear();
  };

  return (
    <div
      className={`flex flex-col bg-slate-950 text-slate-100 h-full ${
        isFullScreen ? 'fixed inset-0 z-50 p-0' : 'p-6 max-w-7xl mx-auto space-y-4'
      }`}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-2 flex items-center justify-between gap-2 overflow-x-auto select-none">
        <div className="flex items-center space-x-2 overflow-x-auto py-0.5">
          {sessions.map((sess) => {
            const isActive = sess.id === activeSessionId;

            return (
              <div
                key={sess.id}
                onClick={() => setActiveSessionId(sess.id)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs font-mono font-medium transition-all cursor-pointer border shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-emerald-400 border-emerald-500/30 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-slate-200'
                }`}
              >
                <Terminal className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-500'}`} />
                <span className="truncate max-w-[160px]">{sess.title}</span>

                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    sess.status === 'connected'
                      ? 'bg-emerald-400 animate-pulse'
                      : sess.status === 'connecting'
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-rose-500'
                  }`}
                />

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeSession(sess.id);
                  }}
                  className="p-0.5 hover:bg-slate-700 rounded text-slate-400 hover:text-rose-400 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            );
          })}

          <button
            onClick={() => {
              if (connections.length > 0) setSelectedConnForNewTab(connections[0].id);
              setIsNewTabModalOpen(true);
            }}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs transition-colors flex items-center space-x-1 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="text-[11px] font-medium hidden sm:inline">{t.newTerminal}</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="flex items-center space-x-1 bg-slate-800 px-2.5 py-1 rounded-xl border border-slate-700 text-xs">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <select
              value={currentTheme}
              onChange={(e) => setCurrentTheme(e.target.value)}
              className="bg-transparent text-slate-200 focus:outline-none text-xs cursor-pointer font-mono"
            >
              <option value="dracula" className="bg-slate-900">Dracula</option>
              <option value="monokai" className="bg-slate-900">Monokai</option>
              <option value="nord" className="bg-slate-900">Nord</option>
              <option value="onedark" className="bg-slate-900">One Dark</option>
            </select>
          </div>

          <div className="flex items-center space-x-1 bg-slate-800 px-2 py-1 rounded-xl border border-slate-700 text-xs">
            <Type className="w-3.5 h-3.5 text-blue-400" />
            <button
              onClick={() => setFontSize((f) => Math.max(10, f - 1))}
              className="px-1.5 hover:bg-slate-700 rounded font-bold text-slate-300"
            >
              -
            </button>
            <span className="font-mono text-[11px] text-slate-200">{fontSize}px</span>
            <button
              onClick={() => setFontSize((f) => Math.min(24, f + 1))}
              className="px-1.5 hover:bg-slate-700 rounded font-bold text-slate-300"
            >
              +
            </button>
          </div>

          <button
            onClick={clearActiveScreen}
            title={t.clearScreen}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            title={t.toggleFullscreen}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 text-xs transition-colors"
          >
            {isFullScreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-2.5 flex items-center space-x-2 overflow-x-auto text-xs">
        <div className="flex items-center space-x-1.5 text-slate-400 font-medium px-2 shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-[11px] font-semibold uppercase tracking-wider">{t.snippets}</span>
        </div>

        <div className="flex items-center space-x-1.5 overflow-x-auto py-0.5">
          {DEFAULT_SNIPPETS.map((snp) => (
            <button
              key={snp.id}
              onClick={() => sendCommandToActive(snp.command)}
              title={`${snp.description} (${snp.command})`}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-emerald-500/20 hover:text-emerald-300 text-slate-300 rounded-lg border border-slate-700/60 transition-colors text-[11px] font-mono shrink-0 flex items-center space-x-1"
            >
              <Play className="w-2.5 h-2.5 text-emerald-400" />
              <span>{snp.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 bg-slate-900 border border-slate-800 rounded-2xl p-3 relative min-h-[480px] shadow-inner overflow-hidden">
        {sessions.map((sess) => (
          <div
            key={sess.id}
            ref={(el) => (termContainersRef.current[sess.id] = el)}
            className={`w-full h-full absolute inset-0 p-3 ${
              sess.id === activeSessionId ? 'block' : 'hidden'
            }`}
          />
        ))}

        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3">
            <Terminal className="w-12 h-12 text-slate-700" />
            <h3 className="text-sm font-medium text-slate-300">{t.noSessions}</h3>
            <p className="text-xs text-slate-500 max-w-sm">
              {t.noSessionsDesc}
            </p>
            <button
              onClick={() => {
                if (connections.length > 0) createNewSession(connections[0]);
              }}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-xl"
            >
              {t.openDefaultTerm}
            </button>
          </div>
        )}
      </div>

      {isNewTabModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl">
                  <Terminal className="w-4 h-4" />
                </div>
                <h3 className="text-sm font-semibold text-slate-100">{t.launchNewTerminalTitle}</h3>
              </div>
              <button onClick={() => setIsNewTabModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">{t.selectRemoteHost}</label>
                <select
                  value={selectedConnForNewTab}
                  onChange={(e) => setSelectedConnForNewTab(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
                >
                  {connections.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.alias} ({c.username}@{c.hostname}:{c.port})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-800">
                <button
                  onClick={() => setIsNewTabModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={() => {
                    const conn = connections.find((c) => c.id === selectedConnForNewTab);
                    if (conn) createNewSession(conn);
                    setIsNewTabModalOpen(false);
                  }}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-xl shadow-md shadow-emerald-600/20"
                >
                  {t.openSession}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
