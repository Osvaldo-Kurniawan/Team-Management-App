// main.js
const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

// Konfigurasi path untuk log file
const LOG_FILE_PATH = path.join('C:', 'team-management-logs', 'user-activity.log');

// Memastikan direktori log exists
function ensureLogDirectory() {
    const dir = path.dirname(LOG_FILE_PATH);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
}

// Fungsi untuk menulis log
function writeToLog(message) {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp}: ${message}\n`;
    
    fs.appendFile(LOG_FILE_PATH, logMessage, (err) => {
        if (err) console.error('Error writing to log:', err);
    });
}

function createWindow() {
    // Log aktivitas pembuatan window
    writeToLog('Application window created');
    
    const mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        icon: path.join(__dirname, 'assets', 'icon.ico'),
        webPreferences: {
            nodeIntegration: false, 
            contextIsolation: true, 
            preload: path.join(__dirname, 'preload.js')
        },
    });

    // Handle minimize window request from renderer
    ipcMain.on('minimize-window', () => {
        writeToLog('Window minimized via shortcut');
        mainWindow.minimize();
    });

    mainWindow.loadURL('https://teammanagementbackend-91544.web.app/');
    
    // Log berbagai event window
    mainWindow.on('focus', () => writeToLog('Window focused'));
    mainWindow.on('blur', () => writeToLog('Window lost focus'));
    mainWindow.on('closed', () => writeToLog('Window closed'));
}

app.whenReady().then(() => {
    ensureLogDirectory();
    writeToLog('Application started');
    createWindow();
});

app.on('window-all-closed', () => {
    writeToLog('All windows closed');
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    writeToLog('Application activated');
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Menangani event quit
app.on('quit', () => {
    writeToLog('Application quit');
});

//electronAPI