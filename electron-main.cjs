const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');
const net = require('net');

let mainWindow;

function findFreePort(startPort) {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.listen(startPort, () => {
      const port = server.address().port;
      server.close(() => resolve(port));
    });
    server.on('error', () => {
      resolve(findFreePort(0));
    });
  });
}

async function createWindow(port) {
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
    dialog.showErrorBox('Load Error', `Failed to load application: ${desc}`);
  });

  try {
    await mainWindow.loadURL(`http://localhost:${port}`);
  } catch (err) {
    dialog.showErrorBox('URL Error', err.message);
  }

  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  try {
    process.env.NODE_ENV = 'production';
    process.env.APP_ROOT = __dirname;
    
    // Find a free port in case 3000 is occupied
    const port = await findFreePort(3000);
    process.env.PORT = port.toString();
    
    require('./dist/server.cjs');

    setTimeout(() => {
      createWindow(port);
    }, 1000);
  } catch (err) {
    dialog.showErrorBox('Startup Error', err.stack || err.message);
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
