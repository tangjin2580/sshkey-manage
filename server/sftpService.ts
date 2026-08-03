import path from 'path';
import fs from 'fs';
import { SFTPFileItem } from '../src/types.js';

// Simulated virtual file tree for sandbox host / local container preview
const virtualFilesystem: Record<string, SFTPFileItem[]> = {
  '/home/admin': [
    { name: '.ssh', path: '/home/admin/.ssh', size: 4096, type: 'directory', mode: 'drwx------', modifyTime: '2026-08-01 10:30', owner: 'admin', group: 'admin' },
    { name: 'projects', path: '/home/admin/projects', size: 4096, type: 'directory', mode: 'drwxr-xr-x', modifyTime: '2026-08-02 14:15', owner: 'admin', group: 'admin' },
    { name: 'deploy.sh', path: '/home/admin/deploy.sh', size: 1240, type: 'file', mode: '-rwxr-xr-x', modifyTime: '2026-08-02 18:45', owner: 'admin', group: 'admin' },
    { name: 'app.env', path: '/home/admin/app.env', size: 340, type: 'file', mode: '-rw-------', modifyTime: '2026-08-02 21:10', owner: 'admin', group: 'admin' },
    { name: 'server.log', path: '/home/admin/server.log', size: 84920, type: 'file', mode: '-rw-r--r--', modifyTime: '2026-08-02 23:25', owner: 'admin', group: 'admin' },
  ],
  '/home/admin/.ssh': [
    { name: 'authorized_keys', path: '/home/admin/.ssh/authorized_keys', size: 920, type: 'file', mode: '-rw-------', modifyTime: '2026-08-02 22:00', owner: 'admin', group: 'admin' },
    { name: 'id_ed25519', path: '/home/admin/.ssh/id_ed25519', size: 411, type: 'file', mode: '-rw-------', modifyTime: '2026-08-01 10:30', owner: 'admin', group: 'admin' },
    { name: 'id_ed25519.pub', path: '/home/admin/.ssh/id_ed25519.pub', size: 104, type: 'file', mode: '-rw-r--r--', modifyTime: '2026-08-01 10:30', owner: 'admin', group: 'admin' },
    { name: 'config', path: '/home/admin/.ssh/config', size: 520, type: 'file', mode: '-rw-r--r--', modifyTime: '2026-08-01 11:20', owner: 'admin', group: 'admin' },
  ],
  '/home/admin/projects': [
    { name: 'nginx.conf', path: '/home/admin/projects/nginx.conf', size: 2450, type: 'file', mode: '-rw-r--r--', modifyTime: '2026-07-28 09:12', owner: 'admin', group: 'admin' },
    { name: 'docker-compose.yml', path: '/home/admin/projects/docker-compose.yml', size: 890, type: 'file', mode: '-rw-r--r--', modifyTime: '2026-07-29 16:40', owner: 'admin', group: 'admin' },
    { name: 'src', path: '/home/admin/projects/src', size: 4096, type: 'directory', mode: 'drwxr-xr-x', modifyTime: '2026-08-02 12:00', owner: 'admin', group: 'admin' },
  ],
};

const virtualFileContents: Record<string, string> = {
  '/home/admin/deploy.sh': `#!/bin/bash
# Production Deployment Script
echo "[BUILD] Pulling latest git updates..."
git pull origin main
echo "[BUILD] Building application bundle..."
npm run build
echo "[SYSTEM] Restarting systemd service..."
sudo systemctl restart webapp.service
echo "[SUCCESS] Deployment completed successfully!"
`,
  '/home/admin/app.env': `# Remote Environment Variables
PORT=3000
NODE_ENV=production
DATABASE_URL=postgres://user:secret@10.0.4.55:2222/appdb
LOG_LEVEL=info
SECRET_KEY=e83f920d02a941bf9c103a0a45f928a
`,
  '/home/admin/projects/nginx.conf': `server {
    listen 80;
    server_name example.com www.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
`,
  '/home/admin/projects/docker-compose.yml': `version: '3.8'
services:
  web:
    image: node:20-alpine
    restart: always
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
    volumes:
      - .:/app
`,
  '/home/admin/.ssh/authorized_keys': `# Authorized SSH Public Keys
ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIIn71m3Kq9mX5bV8nY0rZ2wE4tY5uI6oO7pA8sD9fG0h admin@dev-station
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQD...[PROD KEY]... prod-server@cloud
`,
};

export function listSFTPDirectory(remotePath: string): SFTPFileItem[] {
  const normPath = path.posix.normalize(remotePath || '/home/admin');

  if (virtualFilesystem[normPath]) {
    return virtualFilesystem[normPath];
  }

  // If path is a subpath or unknown, return default folder structure
  return [
    { name: '..', path: path.posix.dirname(normPath), size: 0, type: 'directory', mode: 'drwxr-xr-x', modifyTime: new Date().toISOString() },
    { name: 'README.md', path: path.posix.join(normPath, 'README.md'), size: 1024, type: 'file', mode: '-rw-r--r--', modifyTime: new Date().toISOString(), owner: 'admin' },
    { name: 'config.json', path: path.posix.join(normPath, 'config.json'), size: 512, type: 'file', mode: '-rw-r--r--', modifyTime: new Date().toISOString(), owner: 'admin' },
    { name: 'logs', path: path.posix.join(normPath, 'logs'), size: 4096, type: 'directory', mode: 'drwxr-xr-x', modifyTime: new Date().toISOString(), owner: 'admin' },
  ];
}

export function readSFTPFile(filePath: string): string {
  const normPath = path.posix.normalize(filePath);
  if (virtualFileContents[normPath] !== undefined) {
    return virtualFileContents[normPath];
  }
  return `# Content of ${path.posix.basename(normPath)}\n# Created on ${new Date().toISOString()}\n\nLOG_LEVEL=debug\nSTATUS=active\n`;
}

export function writeSFTPFile(filePath: string, content: string): boolean {
  const normPath = path.posix.normalize(filePath);
  virtualFileContents[normPath] = content;

  // Ensure item exists in parent dir listing
  const parentDir = path.posix.dirname(normPath);
  const fileName = path.posix.basename(normPath);

  if (!virtualFilesystem[parentDir]) {
    virtualFilesystem[parentDir] = [];
  }

  const existingIdx = virtualFilesystem[parentDir].findIndex((f) => f.name === fileName);
  const fileItem: SFTPFileItem = {
    name: fileName,
    path: normPath,
    size: Buffer.byteLength(content, 'utf8'),
    type: 'file',
    mode: '-rw-r--r--',
    modifyTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
    owner: 'admin',
    group: 'admin',
  };

  if (existingIdx >= 0) {
    virtualFilesystem[parentDir][existingIdx] = fileItem;
  } else {
    virtualFilesystem[parentDir].push(fileItem);
  }

  return true;
}

export function deleteSFTPItem(filePath: string): boolean {
  const normPath = path.posix.normalize(filePath);
  delete virtualFileContents[normPath];

  const parentDir = path.posix.dirname(normPath);
  const fileName = path.posix.basename(normPath);

  if (virtualFilesystem[parentDir]) {
    virtualFilesystem[parentDir] = virtualFilesystem[parentDir].filter((f) => f.name !== fileName);
  }

  return true;
}

export function createSFTPDirectory(dirPath: string): boolean {
  const normPath = path.posix.normalize(dirPath);
  virtualFilesystem[normPath] = [];

  const parentDir = path.posix.dirname(normPath);
  const dirName = path.posix.basename(normPath);

  if (!virtualFilesystem[parentDir]) {
    virtualFilesystem[parentDir] = [];
  }

  virtualFilesystem[parentDir].push({
    name: dirName,
    path: normPath,
    size: 4096,
    type: 'directory',
    mode: 'drwxr-xr-x',
    modifyTime: new Date().toISOString().replace('T', ' ').slice(0, 16),
    owner: 'admin',
    group: 'admin',
  });

  return true;
}
