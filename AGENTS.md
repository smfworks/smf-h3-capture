# SMF H3 Capture pane — agent notes

For Hermes/OpenClaw installing this repo on a user's machine.

Plugin id stays `smf-h3-capture`. The product SPA is **AIGC Production Flow** at `smfworks/aigc-production-flow` (formerly `smfworks/h3-longform-capture`). Do not rename this plugin checkout.

## Do

1. Clone to `$HOME/.hermes/plugins/smf-h3-capture` (or `hermes plugins install smfworks/smf-h3-capture --enable`).
2. Run `bash install.sh` from that tree. It enables the plugin on `$HOME/.hermes` **and** every `profiles/*/plugins` home, then copies `desktop/plugin.js` to `$HOME/.hermes/desktop-plugins/smf-h3-capture/`.
3. Tell the user to **quit Hermes Desktop and relaunch from the menu**. The Python API (`plugin_api.py`) mounts only on the next `hermes serve`.

## Do not

- Do not treat ⌘K → Reload desktop plugins as a backend remount. That is JS only. Local still embeds `http://127.0.0.1:5173/` when `/status` is unread. Quit/relaunch is only for the optional probe badge — do not treat a missing backend as a reason to invent a pack.
- Do not run `hermes desktop` to relaunch if a packaged Electron binary already exists (`…/linux-unpacked/Hermes --no-sandbox`). `hermes desktop` rewrites the `.desktop` `Exec=` and can prompt for `chrome-sandbox` sudo.
- Do not `hermes serve --stop` (kills every serve on the box). Do not kill this chat from inside the same Desktop window unless the user asked for a relaunch.
- Do not port the nine-gate pack builder into `plugin.js`. Embed the existing SPA (`https://aigc-production-flow.vercel.app` or local Vite).
- Do not invent pack fields, gates, stills, or MP4s. If Live fails or Local Vite is down, show an error. Empty is empty.
- Do not call Spark / Comfy / MiniMax APIs. Do not publish likeness stills or generated MP4s.
- Do not read or sync SPA packs (`localStorage` key `smf.h3-longform-capture.pack.v2` as shipped by aigc-production-flow). Do not invent a key migration. Point the user at the iframe.
- Do not add this as a launcher-only row in `smf-app-launcher`. This is a first-class pane.
- Do not `git reset --hard` an existing plugin checkout.

## After relaunch

Sidebar **AIGC Flow**, the right-of-chat pane, or ⌘K → **Open AIGC Production Flow** / **Open AIGC Production Flow pane**. Default embed is the live app. **Local** probes `http://127.0.0.1:5173/` (`npm run dev`) then `http://127.0.0.1:4173/` (`npm run preview`) in `aigc-production-flow/app`.
