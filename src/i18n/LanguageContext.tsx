import React, { createContext, useContext, useState } from 'react';

export type Language = 'en' | 'zh';

export const translations = {
  en: {
    // Header
    appTitle: 'SSH Key & Connection Manager',
    appSubtitle: 'Desktop-Class WebSSH Terminal • SFTP Code Editor • SSH Config Sync',
    hosts: 'Hosts',
    keys: 'Keys',
    terminals: 'Terminals',
    refreshState: 'Refresh system state',

    // Sidebar
    navTitle: 'Navigation Modules',
    connections: 'Connections',
    connectionsDesc: 'Host profiles & latency monitor',
    keyStudio: 'SSH Key Studio',
    keyStudioDesc: 'Key pairs & remote uploader',
    terminal: 'WebSSH Terminal',
    terminalDesc: 'Multi-tab interactive PTY xterm.js',
    sftp: 'SFTP & Code Editor',
    sftpDesc: 'Remote file manager & text editor',
    sshConfig: 'SSH Config Inspector',
    sshConfigDesc: 'Parse & edit ~/.ssh/config syntax',
    fileSync: 'FileSync Engine',
    fileSyncDesc: 'Automated remote directory sync',
    localEnv: 'Local Environment',
    localEnvDesc: 'Keys & configs stored securely in ~/.ssh/. Supports RSA, Ed25519 & ECDSA.',

    // Connections
    connTitle: 'Host Connection Profiles',
    connSubtitle: 'Manage SSH connection profiles, test connectivity, and quickly launch WebSSH sessions',
    searchConnections: 'Search connections...',
    allGroups: 'All Groups',
    addConnection: 'Add Connection',
    exportConfig: 'Export JSON',
    importConfig: 'Import JSON',
    totalConnections: 'Total Connections',
    activeGroups: 'Active Groups',
    configSynced: 'Config Synced',
    keysBound: 'Keys Bound',
    noConnections: 'No Connection Profiles Found',
    noConnectionsDesc: 'Click "Add Connection" above or sync your local ~/.ssh/config file to get started.',
    addFirstConnection: 'Add Your First Connection',
    testConn: 'Test',
    testing: 'Testing...',
    openTerm: 'Terminal',
    openSFTP: 'SFTP',
    edit: 'Edit',
    delete: 'Delete',
    alias: 'Alias / Name',
    hostname: 'Hostname / IP',
    username: 'Username',
    port: 'Port',
    group: 'Group',
    authMethod: 'Auth Method',
    password: 'Password',
    privateKey: 'SSH Private Key',
    noneKey: 'None (Password Auth)',
    tags: 'Tags (comma separated)',
    cancel: 'Cancel',
    saveConnection: 'Save Connection',
    editConnection: 'Edit Connection',
    newConnectionModalTitle: 'Create Connection Profile',

    // Key Studio
    keyStudioTitle: 'SSH Key Pair Studio',
    keyStudioSubtitle: 'Generate, inspect, convert, and deploy SSH public/private keypairs to remote servers',
    generateKeyPair: 'Generate Key Pair',
    deployPublicKey: 'Deploy Public Key',
    noKeysFound: 'No SSH Keys Found',
    noKeysDesc: 'Generate a new Ed25519 or RSA key pair or import existing keys to manage credentials.',
    generateKeyModalTitle: 'Generate New SSH Keypair',
    keyName: 'Key Name',
    keyType: 'Algorithm / Type',
    passphrase: 'Passphrase (Optional)',
    comment: 'Comment / Identifier',
    generating: 'Generating...',
    generate: 'Generate Key Pair',
    deployKeyModalTitle: 'Deploy SSH Public Key to Remote Host',
    deployTargetMode: 'Target Selection Mode',
    existingConn: 'Existing Connection Profile',
    customHost: 'Custom Host Details',
    selectConn: 'Select Remote Connection',
    deploying: 'Deploying...',
    deployKey: 'Deploy Key to ~/.ssh/authorized_keys',
    copyPublic: 'Copy Public Key',
    downloadPrivate: 'Download Private Key',

    // WebSSH Terminal
    newTerminal: 'New Terminal',
    theme: 'Theme',
    fontSize: 'Font Size',
    clearScreen: 'Clear Screen',
    toggleFullscreen: 'Fullscreen',
    snippets: 'Snippets:',
    noSessions: 'No Active Terminal Sessions',
    noSessionsDesc: 'Click "New Terminal" above or launch WebSSH from Connection Manager to open a session.',
    openDefaultTerm: 'Open Default Terminal',
    launchNewTerminalTitle: 'Launch New WebSSH Terminal',
    selectRemoteHost: 'Select Remote Connection Host',
    openSession: 'Open Session',

    // SFTP
    sftpTitle: 'SFTP Remote Explorer & Editor',
    sftpSubtitle: 'Browse remote filesystems, upload/download, and edit code files in real time',
    uploadFile: 'Upload File',
    newFolder: 'New Folder',
    newFile: 'New File',
    filterFiles: 'Filter files...',
    noFileSelected: 'No File Selected for Editing',
    noFileSelectedDesc: 'Click on any text or code file in the left SFTP explorer to view and modify content.',
    saveRemoteFile: 'Save Remote File',
    saved: 'Saved!',
    createDirTitle: 'Create New Directory',
    folderName: 'Folder Name',
    createFolder: 'Create Folder',
    createRemoteFileTitle: 'Create New Remote File',
    fileName: 'File Name',
    createFile: 'Create File',
    uploadModalTitle: 'Upload File to Remote Directory',

    // SSH Config
    sshConfigTitle: 'SSH Config Inspector (~/.ssh/config)',
    sshConfigSubtitle: 'Parse, edit, and automatically synchronize OpenSSH client configuration directives',
    syncToStore: 'Sync Config Hosts to Connection Profiles',
    addHostDirective: 'Add Host Directive',
    rawEditor: 'Raw Config Editor',
    visualDirectives: 'Visual Host Directives',
    saveSshConfig: 'Save ~/.ssh/config',
    addHostDirectiveTitle: 'Add Host Directive to ~/.ssh/config',
    hostAlias: 'Host Alias',
    hostnameOrIp: 'HostName / IP',

    // FileSync
    fileSyncTitle: 'FileSync Directory Sync Engine',
    fileSyncSubtitle: 'Automate real-time or task-based file directory synchronization over SFTP',
    newSyncRule: 'New Sync Rule',
    syncTaskRules: 'Sync Task Rules',
    startSync: 'Start Sync',
    syncing: 'Syncing...',
    syncExecutionLogs: 'Sync Execution Logs',
    taskName: 'Task Name',
    targetRemoteHost: 'Target Remote Host',
    localPath: 'Local Path',
    remotePath: 'Remote Path',
    createRule: 'Create Rule',
    createSyncRuleTitle: 'Create New FileSync Task Rule',
  },
  zh: {
    // Header
    appTitle: 'SSH 密钥与连接管理器',
    appSubtitle: '桌面级 WebSSH 终端 • SFTP 代码编辑器 • SSH 配置同步',
    hosts: '主机数',
    keys: '密钥数',
    terminals: '终端数',
    refreshState: '刷新系统状态',

    // Sidebar
    navTitle: '导航模块',
    connections: '主机连接',
    connectionsDesc: '主机配置与延迟监控',
    keyStudio: 'SSH 密钥工作台',
    keyStudioDesc: '密钥对管理与远程部署',
    terminal: 'WebSSH 终端',
    terminalDesc: '多标签页交互式 PTY 终端',
    sftp: 'SFTP 与代码编辑器',
    sftpDesc: '远程文件管理器与文本编辑器',
    sshConfig: 'SSH 配置检查器',
    sshConfigDesc: '解析与编辑 ~/.ssh/config 语法',
    fileSync: 'FileSync 同步引擎',
    fileSyncDesc: '自动化远程目录同步',
    localEnv: '本地环境',
    localEnvDesc: '密钥与配置安全保存在 ~/.ssh/ 目录。支持 RSA, Ed25519 & ECDSA。',

    // Connections
    connTitle: '主机连接配置',
    connSubtitle: '管理 SSH 连接配置，测试连通性，快速启动 WebSSH 终端会话',
    searchConnections: '搜索连接配置...',
    allGroups: '全部分组',
    addConnection: '添加连接',
    exportConfig: '导出 JSON',
    importConfig: '导入 JSON',
    totalConnections: '总连接数',
    activeGroups: '关联分组数',
    configSynced: '已同步配置',
    keysBound: '已绑定密钥',
    noConnections: '暂未找到连接配置',
    noConnectionsDesc: '点击上方的"添加连接"或同步本地 ~/.ssh/config 文件以开始使用。',
    addFirstConnection: '添加您的第一个连接',
    testConn: '测试',
    testing: '测试中...',
    openTerm: '终端',
    openSFTP: 'SFTP',
    edit: '编辑',
    delete: '删除',
    alias: '连接别名 / 名称',
    hostname: '主机地址 / IP',
    username: '用户名',
    port: '端口',
    group: '分组',
    authMethod: '认证方式',
    password: '密码',
    privateKey: 'SSH 私钥',
    noneKey: '无 (密码认证)',
    tags: '标签 (用逗号分隔)',
    cancel: '取消',
    saveConnection: '保存连接',
    editConnection: '编辑连接',
    newConnectionModalTitle: '创建连接配置',

    // Key Studio
    keyStudioTitle: 'SSH 密钥工作台',
    keyStudioSubtitle: '生成、检查、转换并将 SSH 公私钥对部署到远程服务器',
    generateKeyPair: '生成密钥对',
    deployPublicKey: '部署公钥',
    noKeysFound: '未找到 SSH 密钥',
    noKeysDesc: '生成新的 Ed25519 或 RSA 密钥对，或导入现有密钥以管理凭据。',
    generateKeyModalTitle: '生成新 SSH 密钥对',
    keyName: '密钥名称',
    keyType: '密钥算法 / 类型',
    passphrase: '密码短语 (可选)',
    comment: '注释 / 标识符',
    generating: '生成中...',
    generate: '生成密钥对',
    deployKeyModalTitle: '部署 SSH 公钥至远程主机',
    deployTargetMode: '目标选择模式',
    existingConn: '使用已有连接配置',
    customHost: '自定义主机信息',
    selectConn: '选择远程连接',
    deploying: '部署中...',
    deployKey: '部署公钥至 ~/.ssh/authorized_keys',
    copyPublic: '复制公钥',
    downloadPrivate: '下载私钥',

    // WebSSH Terminal
    newTerminal: '新建终端',
    theme: '主题',
    fontSize: '字体大小',
    clearScreen: '清空屏幕',
    toggleFullscreen: '全屏',
    snippets: '快捷指令：',
    noSessions: '无活动终端会话',
    noSessionsDesc: '点击上方"新建终端"或从连接管理器中启动 WebSSH 以开启新会话。',
    openDefaultTerm: '打开默认终端',
    launchNewTerminalTitle: '启动新 WebSSH 终端',
    selectRemoteHost: '选择远程连接主机',
    openSession: '打开会话',

    // SFTP
    sftpTitle: 'SFTP 远程资源管理器与编辑器',
    sftpSubtitle: '浏览远程文件系统，上传/下载，并实时编辑代码文件',
    uploadFile: '上传文件',
    newFolder: '新建文件夹',
    newFile: '新建文件',
    filterFiles: '过滤文件...',
    noFileSelected: '未选择要编辑的文件',
    noFileSelectedDesc: '点击左侧 SFTP 浏览器中的任何文本或代码文件以实时查看和修改。',
    saveRemoteFile: '保存远程文件',
    saved: '已保存！',
    createDirTitle: '创建新目录',
    folderName: '文件夹名称',
    createFolder: '创建文件夹',
    createRemoteFileTitle: '创建新远程文件',
    fileName: '文件名称',
    createFile: '创建文件',
    uploadModalTitle: '上传文件至远程目录',

    // SSH Config
    sshConfigTitle: 'SSH 配置检查器 (~/.ssh/config)',
    sshConfigSubtitle: '解析、编辑并自动同步 OpenSSH 客户端配置指令',
    syncToStore: '同步配置主机到连接列表',
    addHostDirective: '添加 Host 指令',
    rawEditor: 'Raw 配置编辑器',
    visualDirectives: '可视化主机指令',
    saveSshConfig: '保存 ~/.ssh/config',
    addHostDirectiveTitle: '添加 Host 指令至 ~/.ssh/config',
    hostAlias: '主机别名',
    hostnameOrIp: '主机地址 / IP',

    // FileSync
    fileSyncTitle: 'FileSync 目录同步引擎',
    fileSyncSubtitle: '通过 SFTP 自动执行实时或任务式文件目录同步',
    newSyncRule: '新建同步规则',
    syncTaskRules: '同步任务规则',
    startSync: '开始同步',
    syncing: '同步中...',
    syncExecutionLogs: '同步执行日志',
    taskName: '任务名称',
    targetRemoteHost: '目标远程主机',
    localPath: '本地路径',
    remotePath: '远程路径',
    createRule: '创建规则',
    createSyncRuleTitle: '创建新 FileSync 任务规则',
  },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: typeof translations.en;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'zh' || saved === 'en') ? saved : 'zh';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('app_language', lang);
  };

  const t = translations[language];

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
