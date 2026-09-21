# SMF H3 Capture — Hermes Desktop Plugin

A [Hermes Agent](https://github.com/NousResearch/hermes-agent) desktop plugin that puts **AIGC Production Flow** in a wide column to the right of chat. It **embeds** the existing Vite/React SPA — it does not rewrite the nine-gate UI into `plugin.js`, and it does not invent packs.

App: [aigc-production-flow](https://github.com/smfworks/aigc-production-flow) · live [aigc-production-flow.vercel.app](https://aigc-production-flow.vercel.app) · bible (historical companion) [Lock the bible before the GPU](https://www.smfclearinghouse.com/blog/2026-09-17-h3-longform-capture-bible)

Plugin id remains `smf-h3-capture` (this Hermes plugin repo is not renamed). The product SPA moved from `smfworks/h3-longform-capture` to `smfworks/aigc-production-flow`.

## What it does

- **Right pane** — AIGC Production Flow, docked to the right of the workspace (`720px`)
- **Sidebar + palette** — AIGC Flow, plus ⌘K → **Open AIGC Production Flow** / **Open AIGC Production Flow pane**
- **Live** — iframe `https://aigc-production-flow.vercel.app` (default)
- **Local** — iframe `http://127.0.0.1:5173/` (`npm run dev` in `aigc-production-flow/app`). If that port is down, the optional backend probe also checks Vite preview at `http://127.0.0.1:4173/` (`npm run preview`)
- **GitHub / Bible** — product repo and Clearinghouse writeup (bible URL is the historical companion; that blog is not rewritten here)
- **Honesty** — if the iframe fails or local Vite is unreachable, the pane shows an error. Packs are never invented
- **Packs stay in the SPA** — autosave is still the app's `localStorage` key `smf.h3-longform-capture.pack.v2` as shipped by aigc-production-flow. This pane does not read, migrate, or sync them into Hermes

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

1. Settings → Plugins → AIGC Flow → on
2. The **AIGC Production Flow** pane on the right of chat, or Sidebar → **AIGC Flow**, or ⌘K → Open AIGC Production Flow pane

### Give this to a Hermes agent

```
Install SMF H3 Capture from https://github.com/smfworks/smf-h3-capture
Run bash ~/.hermes/plugins/smf-h3-capture/install.sh (clone first if missing).
Enable on $HOME/.hermes and every profiles/*/ that already has a plugins dir.
Copy desktop/plugin.js to $HOME/.hermes/desktop-plugins/smf-h3-capture/.
Do not run hermes desktop. Do not kill this chat from inside it.
Tell me to quit Hermes Desktop and relaunch from the menu so plugin_api.py mounts.
Embed Live https://aigc-production-flow.vercel.app or Local Vite from aigc-production-flow/app. Do not port the pack builder.
```

## Live vs Local

| Button | Embed | When to use |
|--------|--------|-------------|
| **Live** | `https://aigc-production-flow.vercel.app` | Default. Hosted pack builder. |
| **Local** | `http://127.0.0.1:5173/` | Checkout [aigc-production-flow](https://github.com/smfworks/aigc-production-flow), then `cd app && npm i && npm run dev`. |
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

The iframe sandbox is `allow-scripts allow-same-origin allow-forms allow-popups allow-downloads allow-modals` (the SMF App Launcher set, plus `allow-modals`) so the SPA can keep `localStorage`, export a zip, and open native `confirm` / `alert` / `prompt` dialogs.

## Tests

```bash
python3 -m pytest tests/ -q
```

Network is not required. URL allowlisting, probe honesty, and `plugin.js` ID/URL smoke checks run against fixtures.

## License

MIT — SMF Works
