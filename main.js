const path = require('path')
const electron = require('electron')
const app = electron.app
const Menu = electron.Menu
const Tray = electron.Tray
const BrowserWindow = electron.BrowserWindow
const Notification = electron.Notification
const fs = require("fs")
var logger = require('./lib/helpers').logger()
app.commandLine.appendSwitch('ignore-certificate-errors')
process.on('uncaughtException', function (error) {
  logger.error(error)
});
if (handleSquirrelEvent(app)) {
  // squirrel event handled and app will exit in 1000ms, so don't do anything else
  return;
}
var env_path = path.join(__dirname, '../.env');
if (!fs.existsSync(env_path)) {
  logger.info("creating env at:" + env_path)

  data = `DEBUG=true
ENCRYPTION_KEY=UQvqa7UQvqa7UQvUQvqa7qa7
ENCRYPTION_PATH=C:\\watcher
`
  fs.writeFileSync(env_path, data)
} else {
  logger.info("env file exists at:" + env_path)
}
var helpers = require('./lib/helpers')
let server = require('./lib/server')
let watcher = require("./lib/file_watcher")
server.start()
watcher.start()
const {
  ipcRenderer
} = electron;
const {
  is
} = require('electron-util')

let tray = null
let win = null
let quitting = false
// create main menue bar
const createMenu = (mainWindow) => {

  var template = [
    {
      label: 'Settings',
      click: () => {
        mainWindow.loadURL(`file://${__dirname}/app/index.html`)
      }
    },
    {
      label: 'View',
      submenu: [{
        role: 'reload'
      },
      {
        role: 'forcereload'
      },
      {
        role: 'togglefullscreen'
      }
      ]
    },
    {
      label: 'Help',
    },
  ]
  if (is.development) {
    template[1].submenu.push({
      label: 'Dev',
      role: 'toggledevtools'
    })
  }
  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)
}

const createTray = () => {
  const iconPath = path.resolve(__dirname, './logo.png')

  tray = new Tray(iconPath)

  const trayMenu = Menu.buildFromTemplate(
    [{
      label: 'Settings',
      click: () => {
        win.show()
      }
    },
    {
      label: 'Browse',
      click: () => {
        require('electron').shell.openExternalSync('https://localhost:4000')
      }
    },
    {
      type: 'separator'
    },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      }
    }
    ])
  tray.setContextMenu(trayMenu)
}
const createWindow = () => {
  const iconPath = path.resolve(__dirname, './logo.png')
  const winUrl = `file://${__dirname}/app/index.html`
  win = new BrowserWindow({
    width: 700,
    alwaysOnTop: true,
    height: 500,
    show: false,
    center: true,
    icon: iconPath,
    backgroundColor: '#e2e2e2',
    webPreferences: {
      plugins: true,
      webSecurity: false,
      webviewTag: true,
      nativeWindowOpen: true,
      nodeIntegration: true,
      contextIsolation: false,
      devTools: true,
      scrollBounce: true
    }
  })
  win.setResizable(true)
  createMenu(win);
  win.loadURL(winUrl)
  win.on('close', (evt) => {
    if (quitting) {
      return
    }

    evt.preventDefault()
    win.hide()
  })
  win.on('closed', () => {
    tray = null
    win = null
  })
}

app.on('before-quit', () => {
  showNotification("Active-E", "Quiting...");
  quitting = true
})
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
app.on('ready', () => {
  helpers.get_active_interface(function (err, localhost) {
    logger.debug(localhost.mac_address)
    createTray()
    createWindow()
    showNotification("Active-E", "App is running");
  })
})

app.on('activate', function () {
  if (mainWindow === null) createWindow()
})

function showNotification(title, body) {
  const notification = {
    title: title,
    body: body
  }
  new Notification(notification).show()
}


function handleSquirrelEvent(application) {
  if (process.argv.length === 1) {
    return false;
  }

  const ChildProcess = require('child_process');
  const path = require('path');

  const appFolder = path.resolve(process.execPath, '..');
  const rootAtomFolder = path.resolve(appFolder, '..');
  const updateDotExe = path.resolve(path.join(rootAtomFolder, 'Update.exe'));
  const exeName = path.basename(process.execPath);

  const spawn = function (command, args) {
    let spawnedProcess, error;

    try {
      spawnedProcess = ChildProcess.spawn(command, args, {
        detached: true
      });
    } catch (error) { }

    return spawnedProcess;
  };

  const spawnUpdate = function (args) {
    return spawn(updateDotExe, args);
  };

  const squirrelEvent = process.argv[1];
  switch (squirrelEvent) {
    case '--squirrel-install':
      spawnUpdate(['--createShortcut', exeName]);
      setTimeout(application.quit, 1000);
      return true;
    case '--squirrel-updated':
      // Optionally do things such as:
      // - Add your .exe to the PATH
      // - Write to the registry for things like file associations and
      //   explorer context menus

      // Install desktop and start menu shortcuts
      spawnUpdate(['--createShortcut', exeName]);

      setTimeout(application.quit, 1000);
      return true;

    case '--squirrel-uninstall':
      // Undo anything you did in the --squirrel-install and
      // --squirrel-updated handlers

      // Remove desktop and start menu shortcuts
      spawnUpdate(['--removeShortcut', exeName]);

      setTimeout(application.quit, 1000);
      return true;

    case '--squirrel-obsolete':
      // This is called on the outgoing version of your app before
      // we update to the new version - it's the opposite of
      // --squirrel-updated

      application.quit();
      return true;
  }
};