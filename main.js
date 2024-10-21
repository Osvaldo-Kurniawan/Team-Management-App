const { app, BrowserWindow } = require('electron');
const path = require('path');

function createWindow() {
    console.log('Creating window...'); // Log when creating a window
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    mainWindow.loadURL('http://localhost:3000');
    mainWindow.on('closed', () => {
        console.log('Window closed');
    });
}

app.whenReady().then(() => {
    console.log('App is ready');
    createWindow();
});

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
