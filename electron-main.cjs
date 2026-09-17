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

  // mainWindow.webContents.openDevTools();

  mainWindow.on('closed', function () {
    mainWindow = null;
  });
}

app.on('ready', async () => {
  try {
    process.env.NODE_ENV = 'production';
    process.env.APP_ROOT = __dirname;
    
    // Instead of hoping port 3000 is open, ask the OS for a free port starting at 8080
    const port = await findFreePort(8080);
    process.env.PORT = port.toString();
    
    console.log(`Starting backend server on port ${port}...`);
    require('./dist/server.cjs');

    // Give the server time to boot up before the first request
    setTimeout(() => {
      createWindow(port);
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
