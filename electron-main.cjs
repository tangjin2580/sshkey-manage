const { app, BrowserWindow } = require('electron');
const path = require('path');

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
    // In production, we require the built server to run it in the main process
    require(path.join(__dirname, 'dist', 'server.cjs'));
    
    // Wait for the server to spin up
    setTimeout(() => {
      mainWindow.loadURL('http://localhost:3000');
    }, 1000);
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
