import React, { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { SidebarNav } from './components/SidebarNav';
import { ConnectionManager } from './components/connections/ConnectionManager';
import { KeyStudio } from './components/keys/KeyStudio';
import { WebSSHManager } from './components/terminal/WebSSHManager';
import { SFTPManager } from './components/sftp/SFTPManager';
import { SSHConfigManager } from './components/sshconfig/SSHConfigManager';
import { FileSyncManager } from './components/filesync/FileSyncManager';
import { ConnectionProfile, SSHKey, SystemPlatformInfo } from './types';
import { LanguageProvider } from './i18n/LanguageContext';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('connections');
  const [connections, setConnections] = useState<ConnectionProfile[]>([]);
  const [keys, setKeys] = useState<SSHKey[]>([]);
  const [keysCount, setKeysCount] = useState<number>(0);
  const [platformInfo, setPlatformInfo] = useState<SystemPlatformInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected Connection for Terminal / SFTP tabs
  const [activeConnForTerminal, setActiveConnForTerminal] = useState<ConnectionProfile | null>(null);
  const [activeConnForSftp, setActiveConnForSftp] = useState<ConnectionProfile | null>(null);

  useEffect(() => {
    fetchConnections();
    fetchKeys();
    fetchPlatformInfo();
  }, []);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/connections');
      const data = await res.json();
      if (data.success) {
        setConnections(data.connections || []);
      }
    } catch (err) {
      console.error('Failed to load connection profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchKeys = async () => {
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      if (data.success) {
        const fetchedKeys = data.keys || [];
        setKeys(fetchedKeys);
        setKeysCount(fetchedKeys.length);
      }
    } catch (err) {
      console.error('Failed to fetch keys:', err);
    }
  };

  const fetchPlatformInfo = async () => {
    try {
      const res = await fetch('/api/system/platform');
      if (!res.ok) return;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await res.json();
        if (data.success || data.platform) {
          setPlatformInfo(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch platform info:', err);
    }
  };

  const handleRefreshAll = () => {
    fetchConnections();
    fetchKeys();
    fetchPlatformInfo();
  };

  const handleLaunchTerminal = (conn: ConnectionProfile) => {
    setActiveConnForTerminal(conn);
    setActiveTab('terminal');
  };

  const handleLaunchSftp = (conn: ConnectionProfile) => {
    setActiveConnForSftp(conn);
    setActiveTab('sftp');
  };

  const handleSyncSSHConfig = async () => {
    try {
      const res = await fetch('/api/ssh-config/sync-to-store', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        await fetchConnections();
        setActiveTab('connections');
      }
    } catch (err) {
      console.error('Failed to sync SSH config:', err);
    }
  };

  return (
    <LanguageProvider>
      <div className="min-h-screen bg-[#000000] text-zinc-100 flex flex-col font-sans selection:bg-blue-500/30 selection:text-blue-300">
        {/* Global Application Top Header */}
        <Header
          platformInfo={platformInfo}
          activeTab={activeTab}
          onRefreshAll={handleRefreshAll}
          activeSessionsCount={0}
        />

        {/* Main Body with Sidebar Navigation & Viewport */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Sidebar Nav */}
          <SidebarNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            connectionsCount={connections.length}
            keysCount={keysCount}
            activeTerminalsCount={0}
          />

          {/* Dynamic Viewport */}
          <main className="flex-1 overflow-y-auto bg-[#000000] p-2 sm:p-6">
            {activeTab === 'connections' && (
              <ConnectionManager
                connections={connections}
                keys={keys}
                onConnectionsChange={fetchConnections}
                onLaunchTerminal={handleLaunchTerminal}
                onLaunchSftp={handleLaunchSftp}
              />
            )}

            {activeTab === 'keys' && (
              <KeyStudio
                keys={keys}
                connections={connections}
                onKeysChange={fetchKeys}
              />
            )}

            {activeTab === 'terminal' && (
              <WebSSHManager
                connections={connections}
                initialActiveConn={activeConnForTerminal}
              />
            )}

            {activeTab === 'sftp' && (
              <SFTPManager
                connections={connections}
                initialConn={activeConnForSftp}
              />
            )}

            {activeTab === 'sshconfig' && (
              <SSHConfigManager onSyncConnections={handleSyncSSHConfig} />
            )}

            {activeTab === 'filesync' && <FileSyncManager connections={connections} />}
          </main>
        </div>
      </div>
    </LanguageProvider>
  );
}
