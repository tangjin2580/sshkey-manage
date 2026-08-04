const { app, BrowserWindow } = require('electron');
const path = require('path');
const net = require('net');

let mainWindow;

function getAvailablePort(startingAt = 3000) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    server.listen(startingAt, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        getAvailablePort(startingAt + 1).then(resolve).catch(reject);
      } else {
        reject(err);
      }
    });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true
    }
  });

  if (app.isPackaged) {
    process.env.DIST_PATH = path.join(__dirname, 'dist');
    process.env.NODE_ENV = 'production';
    
    getAvailablePort(3000).then(port => {
      process.env.PORT = port;
      // In production, we require the built server to run it in the main process
      require(path.join(__dirname, 'dist', 'server.cjs'));
      
      // Wait for the server to spin up
      setTimeout(() => {
        mainWindow.loadURL(`http://localhost:${port}`);
      }, 1000);
    }).catch(err => {
      console.error('Failed to find open port', err);
    });
  } else {
    // In dev mode, assume npm run dev is running on port 3000
    mainWindow.loadURL('http://localhost:3000');
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
