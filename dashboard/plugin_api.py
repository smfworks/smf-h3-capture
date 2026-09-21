"""SMF H3 Capture pane — optional local Vite reachability for Hermes Desktop.

The pack builder lives in the existing Vite/React SPA
(``smfworks/aigc-production-flow``, formerly ``smfworks/h3-longform-capture``).
This backend does **not** read, write, or invent capture packs. It only
reports embed URLs and probes the known loopback Vite ports
(``127.0.0.1:5173`` then ``:4173``).

``GET /status`` — live / local / preview URLs plus an honest local probe.
``GET /health`` — ``{ status: ok, plugin }``.
"""
from __future__ import annotations

from typing import Any, Callable, Dict, Optional, Tuple
from urllib.error import HTTPError, URLError
from urllib.parse import urlparse
from urllib.request import Request, urlopen

try:
    from fastapi import APIRouter
    from fastapi.responses import JSONResponse

    router = APIRouter()
except ImportError:  # tests / hosts without FastAPI still import the helpers
    APIRouter = None  # type: ignore[misc, assignment]
    JSONResponse = None  # type: ignore[misc, assignment]
    router = None

PLUGIN = "smf-h3-capture"
USER_AGENT = "SMF-H3-Capture/1.0 (+https://github.com/smfworks/smf-h3-capture)"
PROBE_TIMEOUT = 2.0

LIVE_URL = "https://aigc-production-flow.vercel.app"
LOCAL_DEV_URL = "http://127.0.0.1:5173/"
LOCAL_PREVIEW_URL = "http://127.0.0.1:4173/"
GITHUB_URL = "https://github.com/smfworks/aigc-production-flow"
BIBLE_URL = "https://www.smfclearinghouse.com/blog/2026-09-17-h3-longform-capture-bible"
PACK_KEY = "smf.h3-longform-capture.pack.v2"
PACK_NOTE = (
    "Packs stay in the SPA browser localStorage key "
    "smf.h3-longform-capture.pack.v2 as shipped by aigc-production-flow. "
    "This pane does not read or sync them."
)

HttpGetter = Callable[[str, Optional[Dict[str, str]]], Tuple[int, str, Dict[str, str]]]


def local_url_allowed(url: str) -> bool:
    """Only the known Vite loopback ports. No scan, no remote hosts."""
    try:
        parsed = urlparse(url)
    except ValueError:
        return False
    host = (parsed.hostname or "").lower()
    if host not in {"127.0.0.1", "localhost"}:
        return False
    if parsed.scheme not in {"http", "https"}:
        return False
    if parsed.username or parsed.password:
        return False
    return parsed.port in {5173, 4173}


def default_http_get(
    url: str,
    headers: Optional[Dict[str, str]] = None,
    timeout: Optional[float] = None,
) -> Tuple[int, str, Dict[str, str]]:
    hdrs = {"User-Agent": USER_AGENT, "Accept": "text/html, */*"}
    if headers:
        hdrs.update(headers)
    req = Request(url, headers=hdrs, method="GET")
    wait = PROBE_TIMEOUT if timeout is None else timeout
    try:
        with urlopen(req, timeout=wait) as resp:
            body = resp.read()
            charset = resp.headers.get_content_charset() or "utf-8"
            text = body.decode(charset, errors="replace")
            info = {k.lower(): v for k, v in resp.headers.items()}
            return int(getattr(resp, "status", 200) or 200), text, info
    except HTTPError as exc:
        code = int(exc.code)
        try:
            err_body = exc.read().decode("utf-8", errors="replace")
        except Exception:
            err_body = ""
        return code, err_body, {}
    except URLError as exc:
        raise OSError(str(exc.reason or exc)) from exc


def probe_one(url: str, getter: HttpGetter) -> bool:
    if not local_url_allowed(url):
        return False
    try:
        status, _body, _ = getter(url, {"Accept": "text/html, */*"})
        return 200 <= int(status) < 500
    except Exception:
        return False


def default_status(
    *,
    reachable: Optional[bool] = None,
    reachable_url: Optional[str] = None,
    dev_reachable: Optional[bool] = None,
    preview_reachable: Optional[bool] = None,
) -> Dict[str, Any]:
    return {
        "ok": True,
        "plugin": PLUGIN,
        "live_url": LIVE_URL,
        "local_dev_url": LOCAL_DEV_URL,
        "local_preview_url": LOCAL_PREVIEW_URL,
        "github_url": GITHUB_URL,
        "bible_url": BIBLE_URL,
        "pack_key": PACK_KEY,
        "pack_note": PACK_NOTE,
        "local": {
            "reachable": reachable,
            "reachable_url": reachable_url,
            "dev_reachable": dev_reachable,
            "preview_reachable": preview_reachable,
        },
    }


def collect_status(*, getter: Optional[HttpGetter] = None, probe: bool = True) -> Dict[str, Any]:
    """Report embed URLs. Probe loopback Vite only when asked. Never invent packs."""
    if not probe:
        return default_status()
    getter = getter or default_http_get
    dev_up = probe_one(LOCAL_DEV_URL, getter)
    preview_up = probe_one(LOCAL_PREVIEW_URL, getter)
    if dev_up:
        reachable_url = LOCAL_DEV_URL
    elif preview_up:
        reachable_url = LOCAL_PREVIEW_URL
    else:
        reachable_url = None
    return default_status(
        reachable=bool(dev_up or preview_up),
        reachable_url=reachable_url,
        dev_reachable=dev_up,
        preview_reachable=preview_up,
    )


def _json(payload: Dict[str, Any], status: int = 200):
    if JSONResponse is None:
        return payload
    return JSONResponse(payload, status_code=status)


if router is not None:

    @router.get("/status")
    def status():
        try:
            return _json(collect_status(probe=True))
        except Exception as exc:  # pragma: no cover - defensive mount
            payload = default_status(reachable=False, reachable_url=None)
            payload["ok"] = False
            payload["error"] = str(exc)
            return _json(payload)

    @router.get("/health")
    def health() -> dict:
        return {"status": "ok", "plugin": PLUGIN}
