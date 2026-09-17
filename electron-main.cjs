const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadURL('http://localhost:3000');

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  // Set NODE_ENV to production
  process.env.NODE_ENV = 'production';
  // Tell server.ts where the app root is
  process.env.APP_ROOT = __dirname;
  
  // Start the backend server in the same process
  require('./dist/server.cjs');

  setTimeout(() => {
    createWindow();
  }, 1000); // reduced timeout since it's in the same process
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
