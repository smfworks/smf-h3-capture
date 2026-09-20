# SMF H3 Capture — Hermes Desktop Plugin

A [Hermes Agent](https://github.com/NousResearch/hermes-agent) desktop plugin that puts the **H3 Capture Pack Builder** in a wide column to the right of chat. It **embeds** the existing Vite/React SPA — it does not rewrite the nine-gate UI into `plugin.js`, and it does not invent packs.

App: [h3-longform-capture](https://github.com/smfworks/h3-longform-capture) · live [h3-longform-capture.vercel.app](https://h3-longform-capture.vercel.app) · bible [Lock the bible before the GPU](https://www.smfclearinghouse.com/blog/2026-09-17-h3-longform-capture-bible)

## What it does

- **Right pane** — H3 Capture Pack, docked to the right of the workspace (`720px`)
- **Sidebar + palette** — H3 Capture, plus ⌘K → **Open H3 Capture** / **Open H3 Capture pane**
- **Live** — iframe `https://h3-longform-capture.vercel.app` (default)
- **Local** — iframe `http://127.0.0.1:5173/` (`npm run dev` in `h3-longform-capture/app`). If that port is down, the optional backend probe also checks Vite preview at `http://127.0.0.1:4173/` (`npm run preview`)
- **GitHub / Bible** — repo and Clearinghouse writeup
- **Honesty** — if the iframe fails or local Vite is unreachable, the pane shows an error. Packs are never invented
- **Packs stay in the SPA** — autosave is the app's `localStorage` key `smf.h3-longform-capture.pack.v2`. This pane does not read or sync them into Hermes

Not in scope: Spark / Comfy / MiniMax calls, publishing likeness stills or MP4s, or adding a launcher-only row to `smf-app-launcher`.

## Install

One shot (covers profiles + Desktop JS + enable):

```bash
git clone https://github.com/smfworks/smf-h3-capture.git ~/.hermes/plugins/smf-h3-capture
bash ~/.hermes/plugins/smf-h3-capture/install.sh
```

Or, if Hermes is already on PATH:

```bash
hermes plugins install smfworks/smf-h3-capture --enable
bash "${HERMES_HOME:-$HOME/.hermes}/plugins/smf-h3-capture/install.sh"
```

`install.sh` enables the plugin on `$HOME/.hermes` **and** every `profiles/*/plugins` home Desktop may spawn, copies `desktop/plugin.js` into `$HOME/.hermes/desktop-plugins/smf-h3-capture/` (what packaged Electron actually loads), and tells you to **quit and relaunch Desktop**.

**⌘K → Reload desktop plugins is JS only.** It does not mount `plugin_api.py`. Local still iframes `http://127.0.0.1:5173/` when that probe is unread — a failed `GET /status` is not a hard gate. Quit Desktop and relaunch from the menu only if you want the optional `:5173` / `:4173` probe badge. Live already embeds Vercel without the backend.

Do **not** run `hermes desktop` to relaunch if you already have the packaged Linux binary. That command rewrites the `.desktop` `Exec=` and can prompt for `chrome-sandbox` sudo. Use the menu entry / `…/linux-unpacked/Hermes --no-sandbox`.

Then:

1. Settings → Plugins → H3 Capture → on
2. The **H3 Capture Pack** pane on the right of chat, or Sidebar → **H3 Capture**, or ⌘K → Open H3 Capture pane

### Give this to a Hermes agent

```
Install SMF H3 Capture from https://github.com/smfworks/smf-h3-capture
Run bash ~/.hermes/plugins/smf-h3-capture/install.sh (clone first if missing).
Enable on $HOME/.hermes and every profiles/*/ that already has a plugins dir.
Copy desktop/plugin.js to $HOME/.hermes/desktop-plugins/smf-h3-capture/.
Do not run hermes desktop. Do not kill this chat from inside it.
Tell me to quit Hermes Desktop and relaunch from the menu so plugin_api.py mounts.
```

## Live vs Local

| Button | Embed | When to use |
|--------|--------|-------------|
| **Live** | `https://h3-longform-capture.vercel.app` | Default. Hosted pack builder. |
| **Local** | `http://127.0.0.1:5173/` | Checkout [h3-longform-capture](https://github.com/smfworks/h3-longform-capture), then `cd app && npm i && npm run dev`. |
| Local fallback | `http://127.0.0.1:4173/` | After `npm run build && npm run preview` in `app/`. Used only if `:5173` is down and preview answers. |

Local Vite is not started by this plugin. If both loopback ports are closed, the pane says so — it does not fabricate a pack.

## Architecture

```
smf-h3-capture/
├── install.sh
├── AGENTS.md
├── plugin.yaml
├── __init__.py
├── dashboard/
│   ├── manifest.json        # api: plugin_api.py
│   └── plugin_api.py        # GET /status  GET /health
├── desktop/
│   └── plugin.js            # copy to ~/.hermes/desktop-plugins/smf-h3-capture/
└── tests/
    └── test_plugin.py
```

| Route | What it does |
|-------|----------------|
| `GET /status` | Report live / local / preview URLs. Probe `127.0.0.1:5173` then `:4173` only. No pack JSON. |
| `GET /health` | `{ status: ok, plugin }` |

The iframe uses the same sandbox as SMF App Launcher (`allow-scripts allow-same-origin allow-forms allow-popups allow-downloads`) so the SPA can keep `localStorage` and export a zip.

## Tests

```bash
python3 -m pytest tests/ -q
```

Network is not required. URL allowlisting, probe honesty, and `plugin.js` ID/URL smoke checks run against fixtures.

## License

MIT — SMF Works
