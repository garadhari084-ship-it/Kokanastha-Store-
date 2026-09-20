process.env.NODE_ENV = 'production';
process.env.APP_ROOT = __dirname;

const { app, BrowserWindow, dialog } = require('electron');
const path = require('path');

let mainWindow;

async function createWindow(port) {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    title: 'Kokanastha Store',
    autoHideMenuBar: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.webContents.on('did-fail-load', (e, code, desc, validatedURL) => {
    console.error('Failed to load:', desc, validatedURL);
    dialog.showErrorBox('Load Error', `Failed to load application at ${validatedURL}:\n\n${desc}`);
  });

  // Open DevTools for diagnostics
  mainWindow.webContents.openDevTools();

  try {
    // Explicitly use 127.0.0.1 to avoid Windows localhost IPv6 (::1) ERR_CONNECTION_REFUSED
    await mainWindow.loadURL(`http://127.0.0.1:${port}`);
  } catch (err) {
    dialog.showErrorBox('Connection Error', `Failed to connect to internal server at http://127.0.0.1:${port}:\n\n${err.message}`);
  }

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  try {
    process.env.NODE_ENV = 'production';
    process.env.APP_ROOT = __dirname;
    
    console.log(`Starting backend server...`);
    let serverModule;
    try {
      serverModule = require('./dist/server.cjs');
    } catch (serverErr) {
      dialog.showErrorBox('Backend Crash', `Failed to load internal server module:\n\n${serverErr.message}\n\n${serverErr.stack}`);
      return;
    }

    if (!serverModule || typeof serverModule.startServer !== 'function') {
      dialog.showErrorBox('Server Error', 'Internal server module did not export startServer function.');
      return;
    }

    // Await server port - completely eliminates timing race conditions
    const actualPort = await serverModule.startServer();
    console.log(`Server started successfully on port ${actualPort}. Opening window...`);
    await createWindow(actualPort);
  } catch (err) {
    dialog.showErrorBox('Startup Error', err.stack || err.message);
  }
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
