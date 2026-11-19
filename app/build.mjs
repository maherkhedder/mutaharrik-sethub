// Builds the Set Hub desktop app for the computer this runs on (GitHub Actions runs it on Windows, Mac and Linux).
//   node app/build.mjs        → dist/Mutaharrik-Set-Hub-<os>.(exe|zip|tar.gz)
// Uses Node's single executable applications (https://nodejs.org/api/single-executable-applications.html).
// The program's code is bundled and minified (no comments, short names) and stored pre-compiled (V8 code cache).
import { execFileSync, execSync } from 'node:child_process'
import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..')
// the Set Hub itself: ./src (GitHub's build downloads it from mutaharrik.ca), or this folder's parent when run inside sethub/
const src = fs.existsSync(path.join(root, 'src', 'sethub.mjs')) ? path.join(root, 'src') : root
const rel = (f) => path.relative(root, path.join(src, f)).split(path.sep).join('/')
const dist = path.join(root, 'dist')
fs.rmSync(dist, { recursive: true, force: true })
fs.mkdirSync(dist, { recursive: true })
const run = (cmd) => (console.log('›', cmd), execSync(cmd, { cwd: root, stdio: 'inherit' }))
const version = /const VERSION = '([^']+)'/.exec(fs.readFileSync(path.join(src, 'sethub.mjs'), 'utf8'))[1]
const win = process.platform === 'win32'
const mac = process.platform === 'darwin'
const arch = process.arch === 'arm64' ? 'arm64' : 'x64'
const icon512 = path.join(src, 'assets', 'icon-512.png')

// 0 · the icons each system wants, made from the one PNG
if (win) {
  // an .ico that holds the PNG itself (Windows Vista and later)
  const png = fs.readFileSync(icon512)
  const head = Buffer.alloc(22)
  head.writeUInt16LE(0, 0)
  head.writeUInt16LE(1, 2)
  head.writeUInt16LE(1, 4)
  head.writeUInt8(0, 6) // 256+ px
  head.writeUInt8(0, 7)
  head.writeUInt16LE(1, 10)
  head.writeUInt16LE(32, 12)
  head.writeUInt32LE(png.length, 14)
  head.writeUInt32LE(22, 18)
  fs.writeFileSync(path.join(dist, 'icon.ico'), Buffer.concat([head, png]))
}
if (mac) {
  const set = path.join(dist, 'icon.iconset')
  fs.mkdirSync(set)
  for (const s of [16, 32, 64, 128, 256, 512]) {
    execFileSync('sips', ['-z', String(s), String(s), icon512, '--out', path.join(set, `icon_${s}x${s}.png`)], { stdio: 'ignore' })
    if (s <= 256) execFileSync('sips', ['-z', String(s * 2), String(s * 2), icon512, '--out', path.join(set, `icon_${s}x${s}@2x.png`)], { stdio: 'ignore' })
  }
  execFileSync('iconutil', ['-c', 'icns', set, '-o', path.join(dist, 'icon.icns')], { stdio: 'inherit' })
}

// 1 · one minified script
fs.writeFileSync(path.join(dist, 'entry.cjs'), fs.readFileSync(path.join(root, 'app', 'entry.cjs'), 'utf8').replace("require('../sethub.mjs')", `require(${JSON.stringify('../' + rel('sethub.mjs'))})`))
run('npx --yes esbuild@0.24.0 dist/entry.cjs --bundle --platform=node --format=cjs --target=node22 --minify --charset=utf8 --legal-comments=none --outfile=dist/sethub.cjs --log-level=error')
// 2 · the blob (script + the files it ships with), pre-compiled
fs.writeFileSync(
  path.join(dist, 'sea-config.json'),
  JSON.stringify({
    main: 'dist/sethub.cjs',
    output: 'dist/sea-prep.blob',
    disableExperimentalSEAWarning: true,
    useCodeCache: true,
    assets: { 'hub.html': rel('hub.html'), 'assets/icon.svg': rel('assets/icon.svg'), 'assets/icon-512.png': rel('assets/icon-512.png') },
  }),
)
run('node --experimental-sea-config dist/sea-config.json')

// 3 · a copy of Node with the blob inside
const bin = path.join(dist, win ? 'Mutaharrik-Set-Hub.exe' : 'sethub')
fs.copyFileSync(process.execPath, bin)
if (mac) run(`codesign --remove-signature "${bin}"`)
if (win) {
  // the program's icon and name in Windows (before the blob goes in)
  run(`npx --yes rcedit@4.0.1 "${bin}" --set-icon dist/icon.ico --set-version-string ProductName "Mutaharrik Set Hub" --set-version-string FileDescription "Set Hub by Mutaharrik" --set-version-string CompanyName "Mutaharrik" --set-version-string LegalCopyright "(c) Mutaharrik" --set-version-string OriginalFilename "Mutaharrik-Set-Hub.exe" --set-file-version ${version}.0.0 --set-product-version ${version}.0.0`)
}
run(`npx --yes postject@1.0.0-alpha.6 "${bin}" NODE_SEA_BLOB dist/sea-prep.blob --sentinel-fuse NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2${mac ? ' --macho-segment-name NODE_SEA' : ''}`)

// 4 · package
if (win) {
  fs.renameSync(bin, path.join(dist, 'Mutaharrik-Set-Hub-Windows.exe'))
} else if (mac) {
  run(`codesign --sign - "${bin}"`)
  const app = path.join(dist, 'Mutaharrik Set Hub.app')
  fs.mkdirSync(path.join(app, 'Contents', 'MacOS'), { recursive: true })
  fs.mkdirSync(path.join(app, 'Contents', 'Resources'), { recursive: true })
  fs.renameSync(bin, path.join(app, 'Contents', 'MacOS', 'sethub'))
  fs.copyFileSync(path.join(dist, 'icon.icns'), path.join(app, 'Contents', 'Resources', 'icon.icns'))
  fs.writeFileSync(
    path.join(app, 'Contents', 'Info.plist'),
    `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>CFBundleName</key><string>Set Hub</string>
<key>CFBundleDisplayName</key><string>Mutaharrik Set Hub</string>
<key>CFBundleIdentifier</key><string>ca.mutaharrik.sethub</string>
<key>CFBundleVersion</key><string>${version}</string>
<key>CFBundleShortVersionString</key><string>${version}</string>
<key>CFBundleExecutable</key><string>sethub</string>
<key>CFBundleIconFile</key><string>icon</string>
<key>CFBundlePackageType</key><string>APPL</string>
<key>LSMinimumSystemVersion</key><string>11.0</string>
<key>NSHighResolutionCapable</key><true/>
<key>NSLocalNetworkUsageDescription</key><string>The Set Hub shares the production tools with the crew's phones on this Wi-Fi.</string>
</dict></plist>`,
  )
  run(`codesign --force --deep --sign - "${app}"`)
  execFileSync('ditto', ['-c', '-k', '--keepParent', app, path.join(dist, `Mutaharrik-Set-Hub-Mac-${arch === 'arm64' ? 'Apple' : 'Intel'}.zip`)], { stdio: 'inherit' })
} else {
  fs.renameSync(bin, path.join(dist, 'mutaharrik-sethub'))
  fs.chmodSync(path.join(dist, 'mutaharrik-sethub'), 0o755)
  run(`tar -czf dist/Mutaharrik-Set-Hub-Linux-${arch}.tar.gz -C dist mutaharrik-sethub`)
}
console.log('built:', fs.readdirSync(dist).filter((f) => /\.(exe|zip|tar\.gz)$/.test(f)).join(', '))
