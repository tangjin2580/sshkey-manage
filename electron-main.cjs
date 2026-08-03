const { app, BrowserWindow } = require('electron');
const path = require('path');
const http = require('http');

let mainWindow;

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
    // In production, run the built server in the main process.
    // NODE_ENV must be 'production' so server.ts serves the static dist build
    // instead of trying to spin up the Vite dev middleware (which isn't packaged).
    process.env.NODE_ENV = 'production';
    require(path.join(__dirname, 'dist', 'server.cjs'));

    // Poll the server until it's ready, then load the UI (avoids a fragile fixed delay).
    const tryLoad = (attempt) => {
      const req = http.get('http://localhost:3000', (res) => {
        res.destroy();
        mainWindow.loadURL('http://localhost:3000');
      });
      req.on('error', () => {
        if (attempt > 40) {
          mainWindow.loadURL('http://localhost:3000'); // last resort
          return;
        }
        setTimeout(() => tryLoad(attempt + 1), 250);
      });
      req.setTimeout(800, () => {
        req.destroy();
        if (attempt > 40) {
          mainWindow.loadURL('http://localhost:3000');
        } else {
          setTimeout(() => tryLoad(attempt + 1), 250);
        }
      });
    };
    tryLoad(0);
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
