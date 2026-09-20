"""Smoke + honesty tests for the H3 Capture Hermes pane.

Fixture-safe: no network, no invented pack JSON, no Vite process.
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "dashboard"))

import plugin_api as api


def test_plugin_yaml_identity():
    yaml = (ROOT / "plugin.yaml").read_text(encoding="utf-8")
    assert "name: smf-h3-capture" in yaml
    assert "author: SMF Works" in yaml
    assert "kind: standalone" in yaml
    assert "H3 Capture" in yaml


def test_desktop_plugin_embeds_live_and_local_urls():
    js = (ROOT / "desktop" / "plugin.js").read_text(encoding="utf-8")
    assert "id: 'smf-h3-capture-frame'" in js or "id: \"smf-h3-capture-frame\"" in js
    assert "PANES_AREA" in js
    assert "SIDEBAR_NAV_AREA" in js
    assert "PALETTE_AREA" in js
    assert "ROUTES_AREA" in js
    assert "placement: 'right'" in js
    assert "Open H3 Capture" in js
    assert "Open H3 Capture pane" in js
    assert "https://h3-longform-capture.vercel.app" in js
    assert "http://127.0.0.1:5173/" in js
    assert "http://127.0.0.1:4173/" in js
    assert "https://github.com/smfworks/h3-longform-capture" in js
    assert "smf.h3-longform-capture.pack.v2" in js
    assert "H3 Capture Pack" in js
    assert "from 'react/jsx-runtime'" in js
    assert "from '@hermes/plugin-sdk'" in js
    assert "jsx" in js and "jsxs" in js
    assert "iframe" in js
    assert "Live" in js and "Local" in js
    assert "does not sync" in js or "does not invent" in js
    assert ".$iframeNonce.get(" not in js
    assert ".$source.get(" not in js


def test_desktop_plugin_local_does_not_block_on_backend_unread():
    js = (ROOT / "desktop" / "plugin.js").read_text(encoding="utf-8")
    assert "if (localMode && !forceEmbed && (backendDown || localDown))" not in js
    assert "if (localMode && !forceEmbed && localDown)" in js
    assert "if (localMode && isLoading && !forceEmbed && !backendDown)" in js
    assert "Local probe offline" in js
    assert "embedding 5173 anyway" in js
    assert "Local Vite is not reachable" in js
    assert "Backend not reachable" not in js
    assert "Embed 5173 anyway" in js
    assert "Use Live" in js
    assert "Retry" in js
    assert "embedUrl = LOCAL_DEV_URL" in js
    assert "ctx.rest('/status')" in js


def test_desktop_plugin_does_not_port_nine_gates():
    js = (ROOT / "desktop" / "plugin.js").read_text(encoding="utf-8")
    for forbidden in (
        "evaluateGates",
        "sigilsSample",
        "MiniMaxH3",
        "comfy",
        "spark-56bc",
    ):
        assert forbidden not in js


def test_install_sh_copies_desktop_plugins():
    sh = (ROOT / "install.sh").read_text(encoding="utf-8")
    assert "desktop-plugins/$NAME" in sh
    assert "HERMES_HOME" in sh
    assert "profiles/*/plugins" in sh
    assert "smf-h3-capture" in sh
    assert "copied JS" in sh


def test_local_url_allowlist():
    assert api.local_url_allowed("http://127.0.0.1:5173/") is True
    assert api.local_url_allowed("http://127.0.0.1:4173/") is True
    assert api.local_url_allowed("http://localhost:5173/") is True
    assert api.local_url_allowed("http://127.0.0.1:3000/") is False
    assert api.local_url_allowed("https://h3-longform-capture.vercel.app") is False
    assert api.local_url_allowed("http://evil.example:5173/") is False
    assert api.local_url_allowed("http://user:pass@127.0.0.1:5173/") is False
    assert api.local_url_allowed("file:///etc/passwd") is False


def test_probe_prefers_dev_over_preview():
    calls = []

    def getter(url, headers=None):
        calls.append(url)
        return 200, "<html></html>", {}

    payload = api.collect_status(getter=getter, probe=True)
    assert payload["ok"] is True
    assert payload["plugin"] == "smf-h3-capture"
    assert payload["live_url"] == "https://h3-longform-capture.vercel.app"
    assert payload["local"]["reachable"] is True
    assert payload["local"]["reachable_url"] == "http://127.0.0.1:5173/"
    assert payload["local"]["dev_reachable"] is True
    assert payload["local"]["preview_reachable"] is True
    assert api.LOCAL_DEV_URL in calls
    assert api.LOCAL_PREVIEW_URL in calls
    assert "pack" not in payload
    assert "gates" not in payload


def test_probe_falls_back_to_preview_when_dev_down():
    def getter(url, headers=None):
        if "5173" in url:
            raise OSError("connection refused")
        return 200, "<html>preview</html>", {}

    payload = api.collect_status(getter=getter, probe=True)
    assert payload["local"]["reachable"] is True
    assert payload["local"]["reachable_url"] == "http://127.0.0.1:4173/"
    assert payload["local"]["dev_reachable"] is False
    assert payload["local"]["preview_reachable"] is True


def test_probe_unreachable_is_honest():
    def getter(url, headers=None):
        raise OSError("connection refused")

    payload = api.collect_status(getter=getter, probe=True)
    assert payload["ok"] is True
    assert payload["local"]["reachable"] is False
    assert payload["local"]["reachable_url"] is None
    assert payload["local"]["dev_reachable"] is False
    assert payload["local"]["preview_reachable"] is False
    blob = json.dumps(payload)
    assert "title" not in blob or '"title"' not in blob
    assert "logLine" not in blob
    assert "editList" not in blob


def test_probe_skipped_does_not_claim_local_up():
    payload = api.collect_status(probe=False)
    assert payload["local"]["reachable"] is None
    assert payload["local"]["reachable_url"] is None
    assert payload["pack_key"] == "smf.h3-longform-capture.pack.v2"
    assert "does not read or sync" in payload["pack_note"]


def test_health_payload():
    if api.router is None:
        assert api.PLUGIN == "smf-h3-capture"
        return
    body = api.health()
    assert body == {"status": "ok", "plugin": "smf-h3-capture"}


def test_status_route_uses_injected_getter(monkeypatch):
    def getter(url, headers=None):
        raise OSError("offline fixture")

    monkeypatch.setattr(api, "default_http_get", getter)
    payload = api.collect_status(probe=True)
    assert payload["local"]["reachable"] is False


def test_license_is_mit():
    text = (ROOT / "LICENSE").read_text(encoding="utf-8")
    assert text.startswith("MIT License")
    assert "SMF Works" in text


def test_readme_has_install_oneliner():
    md = (ROOT / "README.md").read_text(encoding="utf-8")
    assert "git clone https://github.com/smfworks/smf-h3-capture.git ~/.hermes/plugins/smf-h3-capture" in md
    assert "bash ~/.hermes/plugins/smf-h3-capture/install.sh" in md
    assert "MIT" in md
    assert "http://127.0.0.1:5173/" in md
    assert "http://127.0.0.1:4173/" in md
    assert "https://h3-longform-capture.vercel.app" in md
