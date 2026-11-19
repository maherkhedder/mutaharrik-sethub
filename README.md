# Set Hub — by Mutaharrik

One laptop on the set's Wi-Fi keeps every crew phone in sync, **with no internet**: call sheet, slate, continuity,
sound reports and more, from [mutaharrik.ca](https://mutaharrik.ca/set-hub).

## Download
Get the newest version from **[Releases](../../releases/latest)** — one program, nothing to install:

| System | File |
|---|---|
| Windows 10/11 | `Mutaharrik-Set-Hub-Windows.exe` — first time: *More info → Run anyway* |
| Mac (Apple M1–M4) | `Mutaharrik-Set-Hub-Mac-Apple.zip` — unzip, move to Applications, right-click → *Open* the first time |
| Mac (Intel) | `Mutaharrik-Set-Hub-Mac-Intel.zip` |
| Linux | `Mutaharrik-Set-Hub-Linux-x64.tar.gz` — `tar -xzf …` then `./mutaharrik-sethub` |

`SHA256SUMS.txt` in each release lists every file's fingerprint.

## How to use it
See [mutaharrik.ca/set-hub](https://mutaharrik.ca/set-hub).

## About this repository
This repository only holds the scripts that turn the Set Hub into a program for each system on GitHub's machines
(`app/build.mjs`, `.github/workflows/build.yml`). The Set Hub itself is taken from mutaharrik.ca each time; the
programs are built from it bundled, minified and pre-compiled. A new version is built automatically the day after it
goes live on the website (or at once from *Actions → Build Set Hub → Run workflow*).

© Mutaharrik. All rights reserved. You may download and use the released programs; copying or redistributing the
code is not permitted.
