const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'server', 'sshConfigService.ts');
let content = fs.readFileSync(file, 'utf8');

const newConfig = `\`Host github.com
  AddKeysToAgent yes
  IdentityFile ~/.ssh/id_ed25519

Host *
HostkeyAlgorithms +ssh-rsa
PubkeyAcceptedKeyTypes +ssh-rsa

Host cxweb 113.201.72.202
    HostName 113.201.72.202
    User cx
    Port 22
    IdentityFile ~/.ssh/id_ed25519_1
    IdentitiesOnly yes

Host mec_xiany 113.200.185.26
    HostName 113.200.185.26
    User root
    Port 22
    IdentityFile ~/.ssh/id_ed25519_4
    IdentitiesOnly yes

Host zjk 47.92.133.81
    HostName 47.92.133.81
    User root
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes

Host wein 14.18.248.25
    HostName 14.18.248.25
    User li
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    IdentitiesOnly yes\``;

content = content.replace(/let inMemoryConfig = `[^`]*`;/, 'let inMemoryConfig = ' + newConfig + ';');
fs.writeFileSync(file, content);
