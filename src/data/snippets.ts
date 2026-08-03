import { QuickSnippet } from '../types';

export const DEFAULT_SNIPPETS: QuickSnippet[] = [
  {
    id: 'snp-1',
    label: 'System Overview',
    command: 'uname -a && uptime && free -h',
    category: 'system',
    description: 'OS kernel, uptime, and memory usage summary',
  },
  {
    id: 'snp-2',
    label: 'Disk Space (df)',
    command: 'df -h',
    category: 'system',
    description: 'Disk space usage in human-readable format',
  },
  {
    id: 'snp-3',
    label: 'CPU & Top Processes',
    command: 'top -b -n 1 | head -n 20',
    category: 'system',
    description: 'Top 20 process CPU & memory consumers',
  },
  {
    id: 'snp-4',
    label: 'Docker Containers',
    command: 'docker ps -a --format "table {{.Names}}\\t{{.Status}}\\t{{.Ports}}"',
    category: 'docker',
    description: 'List all docker containers with ports',
  },
  {
    id: 'snp-5',
    label: 'Docker Logs (Tail)',
    command: 'docker logs --tail 50 -f ',
    category: 'docker',
    description: 'Tail last 50 lines of container log',
  },
  {
    id: 'snp-6',
    label: 'Active Network Ports',
    command: 'netstat -tulnp || ss -tulnp',
    category: 'network',
    description: 'Show listening TCP/UDP ports and active sockets',
  },
  {
    id: 'snp-7',
    label: 'System Logs (Journalctl)',
    command: 'journalctl -n 50 -u ',
    category: 'logs',
    description: 'View systemd service logs',
  },
  {
    id: 'snp-8',
    label: 'SSH Key Permissions Check',
    command: 'ls -la ~/.ssh && chmod 700 ~/.ssh && chmod 600 ~/.ssh/authorized_keys',
    category: 'system',
    description: 'Check and fix ~/.ssh file permissions',
  },
  {
    id: 'snp-9',
    label: 'Git Status & Branch',
    command: 'git status && git branch -v',
    category: 'git',
    description: 'Current Git repository status and branch',
  },
  {
    id: 'snp-10',
    label: 'Public IP Check',
    command: 'curl -s https://ifconfig.me || curl -s https://api.ipify.org',
    category: 'network',
    description: 'Fetch public IP address of remote server',
  },
];
