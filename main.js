const { app, BrowserWindow, ipcMain } = require('electron');
const { APIDriver } = require('./api');
const { CONFIG } = require("./settings");
const Sentry = require('@sentry/electron');

let mainWindow;

Sentry.init({
    dsn: CONFIG.sentry_dsn,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    integrations: [
        // Specify your integrations here if needed.
    ],
});

module.exports.Sentry = Sentry;


const PLAYLIST_UPDATE_INTERVAL = 60 * 1000 * 10; // 10 mins
const PLAYED_VIDEOS_REPORT_INTERVAL = 1000 * 60 * 60; // 60 mins

let apiDriver = new APIDriver();
apiDriver.preparePlays().catch((reason) => {
    console.log(reason);
    Sentry.captureException(reason);
})
setInterval(() => {
    console.log('Updating playlist by interval');
    apiDriver.preparePlays().catch((reason) => {
        console.log(reason);
        Sentry.captureException(reason);
    })
}, PLAYLIST_UPDATE_INTERVAL);

setInterval(() => {
    apiDriver.sendReport().catch(console.log);
}, PLAYED_VIDEOS_REPORT_INTERVAL);

async function createWindow() {

    if (CONFIG.PRODUCTION_MODE) {
        mainWindow = new BrowserWindow({
            width: CONFIG.WIDTH,
            height: CONFIG.HEIGHT,
            kiosk: true,
            webPreferences: {
                allowRunningInsecureContent: true,
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        mainWindow.setMenu(null);
        mainWindow.loadFile('./renderer/views/player.html');
    }

    else {
        mainWindow = new BrowserWindow({
            width: CONFIG.WIDTH,
            height: CONFIG.HEIGHT,
            webPreferences: {
                allowRunningInsecureContent: true,
                nodeIntegration: true,
                contextIsolation: false
            }
        });
        mainWindow.loadFile('./renderer/views/player.html');
        switchWindowToNextPlay().catch((reason) => {
            console.log(reason);
        })
    }

    
}

app.whenReady().then(() => {
    createWindow();
}).catch((reason) => {
    console.log(reason);
    Sentry.captureException(reason);
})

app.on('window-all-closed', function() {
    app.quit()
})


// IPC Calls
async function switchWindowToNextPlay() {
    console.log('Quering next play')
    // let next_play = await apiDriver.getNextPlay();
    let next_play = {"id":"f8616b91-3196-461e-9c4c-eb16493b4be5","type":"Currency","video":null,"start_time":"17:21:40.599984"} // currency
    // let next_play = {"id":"ac1042cd-f7e8-4284-8f24-604420ed8d14","type":"Weather","video":null,"start_time":"17:19:38.466652"}  // weather
    console.log('Got next play data')
    console.log(`Next play: ${JSON.stringify(next_play)}`)
    switch (next_play.type) {
        case 'Weather':
            console.log('Loading weather window');
            mainWindow.webContents.send('setWindow', next_play)
            break;
        case 'Currency':
            console.log('Loading currency window');
            mainWindow.webContents.send('setWindow', next_play)
            break;
        case 'ClientVideo':
            console.log('Loading player window');
            mainWindow.webContents.send('setWindow', next_play)
            break;
        case 'MediabazaVideo':
            console.log('Loading player window');
            mainWindow.webContents.send('setWindow', next_play)
            break;
        default:
            console.log('Loading blank window');
            mainWindow.webContents.send('setWindow', {})
    }

}

ipcMain.on('videoFinishedPlaying', function(event, args) {
    switchWindowToNextPlay().catch((reason) => {
        console.log(reason);
        Sentry.captureException(reason);
    })
});