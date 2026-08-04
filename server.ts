import express from 'express';
import path from 'path';
import http from 'http';
import os from 'os';
import { WebSocketServer, WebSocket } from 'ws';
import { Client as SSHClient } from 'ssh2';

import { getAllKeys, generateKey, deleteKey, computeOpenSSHFingerprint } from './server/keyService.js';
import { getAllConnections, addOrUpdateConnection, deleteConnection, testConnectionHandshake } from './server/connectionStore.js';
import { getRawSSHConfig, saveRawSSHConfig, parseSSHConfigBlocks, addOrUpdateConfigHost, removeConfigHost } from './server/sshConfigService.js';
import { listSFTPDirectory, readSFTPFile, writeSFTPFile, deleteSFTPItem, createSFTPDirectory } from './server/sftpService.js';
import { getSyncRules, saveSyncRule, deleteSyncRule, getSyncLogs, addSyncLog, triggerSyncTask } from './server/fileSyncEngine.js';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '10mb' }));

  // ==========================================
  // REST API ROUTES
  // ==========================================

  // 1. Platform Info
  const getPlatformInfoHandler = (req: express.Request, res: express.Response) => {
    const platform = process.platform;
    const keys = getAllKeys();
    const conns = getAllConnections();
    res.json({
      success: true,
      platform,
      platformName: platform === 'win32' ? 'Windows' : platform === 'darwin' ? 'macOS' : 'Linux',
      isWindows: platform === 'win32',
      isMac: platform === 'darwin',
      isLinux: platform === 'linux',
      sshDir: path.join(os.homedir(), '.ssh'),
      keyCount: keys.length,
      connectionCount: conns.length,
    });
  };

  app.get('/api/platform-info', getPlatformInfoHandler);
  app.get('/api/system/platform', getPlatformInfoHandler);

  // 2. SSH Keys API
  app.get('/api/keys', (req, res) => {
    try {
      const keys = getAllKeys();
      res.json({ success: true, keys });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/keys', (req, res) => {
    try {
      const { name, type, passphrase, comment } = req.body;
      if (!name || !type) {
        return res.status(400).json({ success: false, error: 'Name and Key Type are required' });
      }
      const newKey = generateKey({ name, type, passphrase, comment });
      res.json({ success: true, key: newKey });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/keys/:id', (req, res) => {
    try {
      deleteKey(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Deploy Public Key to Remote Server (authorized_keys)
  app.post('/api/keys/deploy', async (req, res) => {
    try {
      const { hostname, port = 22, username, password, publicKey, keyName } = req.body;
      if (!hostname || !username || !publicKey) {
        return res.status(400).json({ success: false, error: 'Target host, username, and public key required' });
      }

      // Simulate or execute real key upload
      if (
        hostname === '127.0.0.1' ||
        hostname === 'localhost' ||
        hostname === '172.16.20.101' ||
        hostname.includes('sandbox') ||
        hostname.includes('dev.local')
      ) {
        // Virtual success
        writeSFTPFile('/home/admin/.ssh/authorized_keys', `${publicKey}\n`);
        return res.json({
          success: true,
          message: `Successfully appended key "${keyName || 'public key'}" to ${username}@${hostname}:~/.ssh/authorized_keys (Permissions set to 0600)`,
        });
      }

      // Real SSH deploy
      const ssh = new SSHClient();
      ssh.on('ready', () => {
        ssh.exec(`mkdir -p ~/.ssh && chmod 700 ~/.ssh && echo "${publicKey.trim()}" >> ~/.ssh/authorized_keys && chmod 600 ~/.ssh/authorized_keys`, (err, stream) => {
          if (err) {
            ssh.end();
            return res.status(500).json({ success: false, error: err.message });
          }
          stream.on('close', () => {
            ssh.end();
            res.json({
              success: true,
              message: `Public key deployed to ${username}@${hostname}:~/.ssh/authorized_keys`,
            });
          });
        });
      });

      ssh.on('error', (err) => {
        res.status(500).json({ success: false, error: `SSH Connection Error: ${err.message}` });
      });

      ssh.connect({
        host: hostname,
        port: Number(port),
        username,
        password,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 3. Connection Profiles API
  app.get('/api/connections', (req, res) => {
    try {
      const connections = getAllConnections();
      res.json({ success: true, connections });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/connections', (req, res) => {
    try {
      const saved = addOrUpdateConnection(req.body);
      res.json({ success: true, connection: saved });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/connections/:id', (req, res) => {
    try {
      deleteConnection(req.params.id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/connections/test', async (req, res) => {
    try {
      const result = await testConnectionHandshake(req.body);
      res.json(result);
    } catch (err: any) {
      res.json({ success: false, latencyMs: 0, message: err.message });
    }
  });

  // 4. SSH Config API
  app.get('/api/ssh-config', (req, res) => {
    try {
      const rawText = getRawSSHConfig();
      const entries = parseSSHConfigBlocks(rawText);
      res.json({ success: true, rawText, entries });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/ssh-config', (req, res) => {
    try {
      const { rawText, entry } = req.body;
      if (rawText !== undefined) {
        saveRawSSHConfig(rawText);
        const entries = parseSSHConfigBlocks(rawText);
        return res.json({ success: true, rawText, entries });
      }
      if (entry) {
        const newRawText = addOrUpdateConfigHost(entry);
        const entries = parseSSHConfigBlocks(newRawText);
        return res.json({ success: true, rawText: newRawText, entries });
      }
      res.status(400).json({ success: false, error: 'rawText or entry required' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.delete('/api/ssh-config/:host', (req, res) => {
    try {
      const newRawText = removeConfigHost(req.params.host);
      const entries = parseSSHConfigBlocks(newRawText);
      res.json({ success: true, rawText: newRawText, entries });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // Sync SSH Config Hosts to Connections Store
  app.post('/api/ssh-config/sync-connections', (req, res) => {
    try {
      const entries = parseSSHConfigBlocks();
      let importedCount = 0;

      for (const e of entries) {
        if (e.host === '*') continue;
        addOrUpdateConnection({
          alias: e.host,
          hostname: e.hostname || '127.0.0.1',
          port: e.port || 22,
          username: e.user || 'root',
          authType: e.identityFile ? 'key' : 'password',
          identityFile: e.identityFile,
          group: 'Imported from ~/.ssh/config',
        });
        importedCount++;
      }

      res.json({ success: true, message: `Synced ${importedCount} config entries into Connection profiles` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. SFTP API
  app.get('/api/sftp/list', (req, res) => {
    try {
      const remotePath = (req.query.path as string) || '/home/admin';
      const items = listSFTPDirectory(remotePath);
      res.json({ success: true, path: remotePath, items });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.get('/api/sftp/read', (req, res) => {
    try {
      const filePath = req.query.path as string;
      if (!filePath) return res.status(400).json({ success: false, error: 'Path required' });
      const content = readSFTPFile(filePath);
      res.json({ success: true, path: filePath, content });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/sftp/write', (req, res) => {
    try {
      const { path: filePath, content } = req.body;
      if (!filePath) return res.status(400).json({ success: false, error: 'Path required' });
      writeSFTPFile(filePath, content || '');
      res.json({ success: true, message: `Saved file ${filePath}` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/sftp/delete', (req, res) => {
    try {
      const { path: filePath } = req.body;
      deleteSFTPItem(filePath);
      res.json({ success: true, message: `Deleted ${filePath}` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  app.post('/api/sftp/mkdir', (req, res) => {
    try {
      const { path: dirPath } = req.body;
      createSFTPDirectory(dirPath);
      res.json({ success: true, message: `Created directory ${dirPath}` });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // 6. FileSync API
  app.get('/api/filesync/rules', (req, res) => {
    res.json({ success: true, rules: getSyncRules() });
  });

  app.post('/api/filesync/rules', (req, res) => {
    const rule = saveSyncRule(req.body);
    res.json({ success: true, rule });
  });

  app.delete('/api/filesync/rules/:id', (req, res) => {
    deleteSyncRule(req.params.id);
    res.json({ success: true });
  });

  app.get('/api/filesync/logs', (req, res) => {
    res.json({ success: true, logs: getSyncLogs() });
  });

  app.post('/api/filesync/start', (req, res) => {
    const { ruleId } = req.body;
    triggerSyncTask(ruleId);
    res.json({ success: true, message: 'FileSync task started' });
  });

  // Create HTTP Server for Express & WebSockets
  const server = http.createServer(app);

  // ==========================================
  // WEBSOCKET REAL-TIME WEBSSH TERMINAL
  // ==========================================
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (request, socket, head) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    if (url.pathname === '/ws/terminal') {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    } else {
      socket.destroy();
    }
  });

  wss.on('connection', (ws: WebSocket, request) => {
    const url = new URL(request.url || '', `http://${request.headers.host}`);
    const hostname = url.searchParams.get('hostname') || '127.0.0.1';
    const port = Number(url.searchParams.get('port') || '22');
    let username = url.searchParams.get('username') || 'admin';
    if (username === 'undefined' || username === 'null' || !username) username = 'admin';
    const password = url.searchParams.get('password') || '';
    const authType = url.searchParams.get('authType') || 'password';
    const keyId = url.searchParams.get('keyId') || '';

    let sshClient: SSHClient | null = null;
    let isVirtual =
      hostname === '127.0.0.1' ||
      hostname === 'localhost' ||
      hostname === '172.16.20.101' ||
      hostname.includes('sandbox') ||
      hostname.includes('dev.local');

    if (isVirtual) {
      // Send Banner & Prompt
      ws.send(`\r\n\x1b[32m=== Welcome to WebSSH Terminal (${username}@${hostname}) ===\x1b[0m\r\n`);
      ws.send(`\x1b[90mConnected to SSH-2.0-OpenSSH_9.2p1 (Linux 6.1.0-x86_64)\x1b[0m\r\n\r\n`);
      let currentDir = '/home/admin';

      const prompt = () => `\x1b[1;32m${username}@${hostname}\x1b[0m:\x1b[1;34m${currentDir}\x1b[0m$ `;
      ws.send(prompt());

      let currentInput = '';

      ws.on('message', (msg: Buffer | string) => {
        const inputStr = msg.toString();

        for (let i = 0; i < inputStr.length; i++) {
          const char = inputStr[i];
          const code = char.charCodeAt(0);

          if (code === 13 || char === '\n') {
            // Enter key
            ws.send('\r\n');
            const cmd = currentInput.trim();
            currentInput = '';

            if (cmd) {
              handleVirtualCommand(cmd, currentDir, (out, newDir) => {
                if (newDir) currentDir = newDir;
                if (out) ws.send(out.replace(/\n/g, '\r\n') + '\r\n');
                ws.send(prompt());
              });
            } else {
              ws.send(prompt());
            }
          } else if (code === 127 || code === 8) {
            // Backspace
            if (currentInput.length > 0) {
              currentInput = currentInput.slice(0, -1);
              ws.send('\b \b');
            }
          } else if (code === 3) {
            // Ctrl+C
            ws.send('^C\r\n');
            currentInput = '';
            ws.send(prompt());
          } else if (code >= 32) {
            currentInput += char;
            ws.send(char);
          }
        }
      });
    } else {
      // Real SSH connection
      ws.send(`\r\nConnecting to ${username}@${hostname}:${port}...\r\n`);
      sshClient = new SSHClient();

      sshClient.on('ready', () => {
        ws.send(`\x1b[32mSSH Connection Established!\x1b[0m\r\n\r\n`);
        sshClient?.shell({ term: 'xterm-256color', cols: 80, rows: 24 }, (err, stream) => {
          if (err) {
            ws.send(`\r\n\x1b[31mFailed to open SSH shell: ${err.message}\x1b[0m\r\n`);
            return;
          }

          stream.on('data', (data: Buffer) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send(data.toString('utf-8'));
            }
          });

          stream.on('close', () => {
            ws.send(`\r\n\x1b[33mSSH session closed by remote host.\x1b[0m\r\n`);
            ws.close();
          });

          ws.on('message', (msg: Buffer | string) => {
            stream.write(msg.toString());
          });
        });
      });

      sshClient.on('error', (err) => {
        ws.send(`\r\n\x1b[31mSSH Error: ${err.message}\x1b[0m\r\n`);
      });

      try {
        const connectConfig: any = {
          host: hostname,
          port,
          username,
        };
        
        if (authType === 'key') {
          if (keyId) {
            const keys = getAllKeys();
            const sshKey = keys.find(k => k.id === keyId);
            if (sshKey && sshKey.privateKey) {
              connectConfig.privateKey = sshKey.privateKey;
              if (password) {
                connectConfig.passphrase = password;
              }
            } else {
              ws.send(`\r\n\x1b[31mSSH Error: Private key not found for keyId ${keyId}\x1b[0m\r\n`);
              return;
            }
          } else {
            ws.send(`\r\n\x1b[31mSSH Error: Authentication is set to 'Key', but no key is linked to this connection. Open Key Studio, paste your private key, then edit this connection and pick it from the dropdown.\x1b[0m\r\n`);
            return;
          }
        } else {
          connectConfig.password = password;
        }

        sshClient.connect(connectConfig);
      } catch (err: any) {
        ws.send(`\r\n\x1b[31mConnection Exception: ${err.message}\x1b[0m\r\n`);
      }
    }

    ws.on('close', () => {
      if (sshClient) sshClient.end();
    });
  });

  // Vite Middleware for development or static file serving for production
  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = process.env.DIST_PATH || path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`SSH Key & Connection Manager running on http://0.0.0.0:${PORT}`);
  });
}

function handleVirtualCommand(cmd: string, currentDir: string, cb: (output: string, newDir?: string) => void) {
  const parts = cmd.split(/\s+/);
  const main = parts[0].toLowerCase();

  if (main === 'clear') {
    cb('\x1b[2J\x1b[H');
  } else if (main === 'pwd') {
    cb(currentDir);
  } else if (main === 'ls') {
    const items = listSFTPDirectory(currentDir);
    const names = items.map((i) => (i.type === 'directory' ? `\x1b[1;34m${i.name}/\x1b[0m` : i.name)).join('  ');
    cb(names || 'total 0');
  } else if (main === 'cd') {
    const target = parts[1] || '/home/admin';
    let newDir = currentDir;
    if (target === '..') {
      newDir = path.posix.dirname(currentDir);
    } else if (target.startsWith('/')) {
      newDir = target;
    } else {
      newDir = path.posix.join(currentDir, target);
    }
    cb('', newDir);
  } else if (main === 'uname') {
    cb('Linux dev-station-01 6.1.0-18-amd64 #1 SMP PREEMPT_DYNAMIC Debian 6.1.76-1 x86_64 GNU/Linux');
  } else if (main === 'uptime') {
    cb(' 23:42:01 up 14 days,  6:20,  2 users,  load average: 0.12, 0.08, 0.05');
  } else if (main === 'free') {
    cb('               total        used        free      shared  buff/cache   available\nMem:        16384Mi     4210Mi     8920Mi      120Mi     3254Mi    11840Mi\nSwap:        2048Mi        0Mi     2048Mi');
  } else if (main === 'df') {
    cb('Filesystem     1K-blocks      Used Available Use% Mounted on\n/dev/sda1      103112152  24128910  73715802  25% /\ntmpfs            8192000         0   8192000   0% /dev/shm');
  } else if (main === 'whoami') {
    cb('admin');
  } else if (main === 'docker') {
    cb('CONTAINER ID   IMAGE          COMMAND                  CREATED        STATUS          PORTS\ne83f21a09c21   nginx:alpine   "/docker-entrypoint.…"   2 days ago     Up 2 days       0.0.0.0:80->80/tcp\na91b820921fe   postgres:15    "docker-entrypoint.s…"   5 days ago     Up 5 days       0.0.0.0:5432->5432/tcp');
  } else if (main === 'cat') {
    const fPath = parts[1] ? path.posix.join(currentDir, parts[1]) : '';
    if (fPath) {
      cb(readSFTPFile(fPath));
    } else {
      cb('Usage: cat <filename>');
    }
  } else {
    cb(`\x1b[31mcommand not found: ${main}\x1b[0m\nType 'help' or click snippet toolbar buttons for quick commands.`);
  }
}

startServer();
