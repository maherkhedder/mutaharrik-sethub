/*
 * The Set Hub desktop app's starter (bundled with sethub.mjs into one file, then into a single program with
 * Node's "single executable application" — no installation, nothing else to download).
 *   • the control screen and icons are read from inside the program;
 *   • the Hub's data lives in the person's app-data folder (not next to the program), so updating the app keeps it.
 */
const os = require('node:os')
const path = require('node:path')
let sea = null
try {
  sea = require('node:sea')
} catch {}
const inApp = !!sea && sea.isSea()

if (!process.env.SETHUB_DATA) {
  const home = os.homedir()
  process.env.SETHUB_DATA =
    process.platform === 'win32'
      ? path.join(process.env.LOCALAPPDATA || path.join(home, 'AppData', 'Local'), 'Mutaharrik Set Hub')
      : process.platform === 'darwin'
        ? path.join(home, 'Library', 'Application Support', 'Mutaharrik Set Hub')
        : path.join(process.env.XDG_DATA_HOME || path.join(home, '.local', 'share'), 'mutaharrik-sethub')
}
globalThis.__SETHUB_APP__ = true
globalThis.__SETHUB_HOME__ = inApp ? path.dirname(process.execPath) : process.env.SETHUB_HOME || path.resolve(__dirname, '..')
if (inApp) {
  globalThis.__SETHUB_ASSET__ = (name, encoding) => {
    try {
      return encoding ? sea.getAsset(name, encoding) : Buffer.from(sea.getAsset(name))
    } catch {
      return undefined
    }
  }
}

// a crash is written down (so it can be sent to us), and the window stays open long enough to read it
process.on('uncaughtException', (e) => {
  try {
    require('node:fs').appendFileSync(path.join(process.env.SETHUB_DATA, 'crash.log'), `${new Date().toISOString()} ${e && e.stack ? e.stack : e}\n`)
  } catch {}
  console.error('\n  The Set Hub stopped because of an error:', e && e.message ? e.message : e, '\n  (written to crash.log in the data folder)\n')
  setTimeout(() => process.exit(1), 15000)
})

require('../sethub.mjs')
