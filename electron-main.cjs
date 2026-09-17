const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const net = require('net');

let mainWindow;

function findFreePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, '127.0.0.1', () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      // If startPort is taken, let the OS pick ANY free port (port 0)
      const fallbackServer = net.createServer();
      fallbackServer.listen(0, '127.0.0.1', () => {
        const port = fallbackServer.address().port;
        fallbackServer.close(() => resolve(port));
      });
    });
  });
}

async function createWindow(port, retries = 5) {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.webContents.on('did-fail-load', (e, code, desc) => {
    console.error('Failed to load:', desc);
    if (retries > 0) {
      console.log(`Retrying... (${retries} attempts left)`);
      setTimeout(() => {
        mainWindow.loadURL(`http://localhost:${port}`);
      }, 1000);
      retries--;
    } else {
      dialog.showErrorBox('Load Error', `Failed to load application after multiple attempts.\nCheck if the internal server crashed.\n\nError: ${desc}`);
    }
  });

  try {
    await mainWindow.loadURL(`http://localhost:${port}`);
  } catch (err) {
    if (retries === 0) {
       dialog.showErrorBox('URL Error', err.message);
    }
  }

  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', () => {
  try {
    process.env.NODE_ENV = 'production';
    process.env.APP_ROOT = __dirname;
    
    console.log(`Starting backend server...`);
    try {
      require('./dist/server.cjs');
    } catch (serverErr) {
      dialog.showErrorBox('Backend Crash', `The internal server crashed immediately:\n\n${serverErr.message}\n\n${serverErr.stack}`);
      return;
    }

    // Wait a brief moment for the express server to finish binding to port 0
    setTimeout(() => {
      const actualPort = process.env.ACTUAL_SERVER_PORT || '3000';
      console.log(`Server started. Opening window to port ${actualPort}...`);
      createWindow(actualPort);
    }, 2000);
  } catch (err) {
    dialog.showErrorBox('Startup Error', err.stack || err.message);
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
