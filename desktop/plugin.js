/**
 * SMF H3 Capture pane — embed the existing pack-builder SPA.
 * Disk plugin: jsx/jsxs only. Never invent pack content.
 */
import {
  Badge,
  Button,
  Codicon,
  EmptyState,
  ErrorState,
  GlyphSpinner,
  Separator,
  atom,
  cn,
  haptic,
  host,
  PALETTE_AREA,
  PANES_AREA,
  ROUTES_AREA,
  SIDEBAR_NAV_AREA,
  useQuery,
  useValue,
} from '@hermes/plugin-sdk'
import { jsx, jsxs } from 'react/jsx-runtime'

const ID = 'smf-h3-capture'
const ROUTE = '/h3-capture'

const LIVE_URL = 'https://h3-longform-capture.vercel.app'
const LOCAL_DEV_URL = 'http://127.0.0.1:5173/'
const LOCAL_PREVIEW_URL = 'http://127.0.0.1:4173/'
const GITHUB_URL = 'https://github.com/smfworks/h3-longform-capture'
const BIBLE_URL = 'https://www.smfclearinghouse.com/blog/2026-09-17-h3-longform-capture-bible'
const PACK_KEY = 'smf.h3-longform-capture.pack.v2'
const PACK_NOTE =
  'Packs stay in the SPA’s localStorage (smf.h3-longform-capture.pack.v2). This pane does not sync them.'

const SOURCE_KEY = 'smf-h3-capture.source'
const IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-forms allow-popups allow-downloads'

const $source = atom(readStoredSource())
const $iframeError = atom(false)
const $iframeNonce = atom(0)
const $forceEmbed = atom(false)
let iframeNonce = 0

function remountFrame() {
  iframeNonce += 1
  $iframeError.set(false)
  $iframeNonce.set(iframeNonce)
}

function readStoredSource() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return 'live'
    const raw = window.localStorage.getItem(SOURCE_KEY)
    return raw === 'local' ? 'local' : 'live'
  } catch {
    return 'live'
  }
}

function persistSource(next) {
  $source.set(next)
  $forceEmbed.set(false)
  remountFrame()
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(SOURCE_KEY, next)
    }
  } catch {
    /* private mode */
  }
}

function openExternal(url) {
  if (!url) return
  const tryRequest = (method, params) => {
    try {
      const p = host.request(method, params)
      if (p && typeof p.then === 'function') return p
      return Promise.resolve(p)
    } catch (err) {
      return Promise.reject(err)
    }
  }
  const fallback = () => {
    try {
      if (typeof window !== 'undefined' && typeof window.open === 'function') {
        window.open(url, '_blank', 'noopener,noreferrer')
      }
    } catch {
      /* host blocked popups */
    }
  }
  try {
    if (typeof host.openExternal === 'function') {
      void Promise.resolve(host.openExternal(url)).catch(fallback)
      return
    }
    if (typeof host.open === 'function') {
      void Promise.resolve(host.open(url)).catch(fallback)
      return
    }
  } catch {
    /* continue */
  }
  void tryRequest('os.openExternal', { url })
    .catch(() => tryRequest('os.open', { url }))
    .catch(() => tryRequest('shell.openExternal', { url }))
    .catch(fallback)
}

function asStatus(data) {
  if (!data || typeof data !== 'object') return null
  return data
}

function localTarget(data) {
  const local = data && data.local
  const url = local && local.reachable_url
  if (typeof url === 'string' && (url === LOCAL_DEV_URL || url === LOCAL_PREVIEW_URL)) {
    return url
  }
  if (local && local.dev_reachable) return LOCAL_DEV_URL
  if (local && local.preview_reachable) return LOCAL_PREVIEW_URL
  return null
}

function SourceToggle({ source }) {
  return jsxs('div', {
    className: 'inline-flex items-center gap-1 rounded-md border border-(--ui-stroke-secondary) p-0.5',
    children: [
      jsx(Button, {
        variant: source === 'live' ? 'default' : 'ghost',
        size: 'sm',
        className: 'h-7 text-xs',
        onClick: () => {
          haptic('tap')
          persistSource('live')
        },
        children: 'Live',
      }),
      jsx(Button, {
        variant: source === 'local' ? 'default' : 'ghost',
        size: 'sm',
        className: 'h-7 text-xs',
        onClick: () => {
          haptic('tap')
          persistSource('local')
        },
        children: 'Local',
      }),
    ],
  })
}

function Chrome({ source, embedUrl, badge }) {
  return jsxs('div', {
    className: 'flex flex-col gap-2 px-4 pt-4 pb-2',
    children: [
      jsxs('div', {
        className: 'flex items-center gap-2',
        children: [
          jsx(Codicon, { name: 'device-camera', size: 16 }),
          jsx('div', {
            className: 'min-w-0 flex-1 truncate text-sm font-medium tracking-wide',
            children: 'H3 Capture Pack',
          }),
          badge
            ? jsx(Badge, { className: 'shrink-0 text-[0.625rem]', children: badge })
            : null,
          jsx(SourceToggle, { source }),
        ],
      }),
      jsx('div', {
        className: 'text-[0.6875rem] leading-relaxed text-(--ui-text-tertiary)',
        children: PACK_NOTE,
      }),
      jsxs('div', {
        className: 'flex flex-wrap items-center gap-2',
        children: [
          embedUrl
            ? jsx(Button, {
                variant: 'ghost',
                size: 'sm',
                className: 'h-7 text-xs',
                onClick: () => {
                  haptic('tap')
                  openExternal(embedUrl)
                },
                children: jsxs('span', {
                  className: 'inline-flex items-center gap-1.5',
                  children: [jsx(Codicon, { name: 'link-external', size: 14 }), 'Open in browser'],
                }),
              })
            : null,
          jsx(Button, {
            variant: 'ghost',
            size: 'sm',
            className: 'h-7 text-xs',
            onClick: () => {
              haptic('tap')
              openExternal(GITHUB_URL)
            },
            children: jsxs('span', {
              className: 'inline-flex items-center gap-1.5',
              children: [jsx(Codicon, { name: 'github', size: 14 }), 'GitHub'],
            }),
          }),
          jsx(Button, {
            variant: 'ghost',
            size: 'sm',
            className: 'h-7 text-xs',
            onClick: () => {
              haptic('tap')
              openExternal(BIBLE_URL)
            },
            children: jsxs('span', {
              className: 'inline-flex items-center gap-1.5',
              children: [jsx(Codicon, { name: 'book', size: 14 }), 'Bible'],
            }),
          }),
        ],
      }),
    ],
  })
}

function EmbedFrame({ url, title }) {
  const nonce = useValue($iframeNonce)
  const failed = useValue($iframeError)
  if (!url) {
    return jsx(EmptyState, {
      title: 'No embed URL',
      description: 'Nothing to load. This pane does not invent pack content.',
    })
  }
  if (failed) {
    return jsxs('div', {
      className: 'flex h-full flex-col items-center justify-center gap-3 p-8',
      children: [
        jsx(ErrorState, {
          title: 'Could not load H3 Capture',
          description:
            'The iframe did not load ' +
            url +
            '. Packs were not invented. Use Live for the Vercel app, or start local Vite.',
        }),
        jsxs('div', {
          className: 'flex flex-wrap items-center justify-center gap-2',
          children: [
            jsx(Button, {
              variant: 'ghost',
              size: 'sm',
              onClick: () => {
                haptic('tap')
                remountFrame()
              },
              children: 'Retry',
            }),
            jsx(Button, {
              variant: 'ghost',
              size: 'sm',
              onClick: () => {
                haptic('tap')
                persistSource('live')
              },
              children: 'Use Live',
            }),
          ],
        }),
      ],
    })
  }
  return jsx('iframe', {
    key: String(nonce) + ':' + url,
    id: 'smf-h3-capture-frame',
    src: url,
    title: title || 'H3 Capture Pack',
    className: 'min-h-0 w-full flex-1 border-0 bg-(--ui-bg)',
    sandbox: IFRAME_SANDBOX,
    allow: 'clipboard-read; clipboard-write',
    referrerPolicy: 'no-referrer',
    onError: () => {
      $iframeError.set(true)
    },
  })
}

function LocalMissing({ backendDown, onRetry }) {
  const title = backendDown ? 'Backend not reachable' : 'Local Vite is not reachable'
  const description = backendDown
    ? 'Enable H3 Capture in Settings → Plugins, then quit Hermes Desktop and relaunch from the menu. Reload desktop plugins is JS only. This pane cannot invent a pack while the backend is unread.'
    : 'Nothing is listening on http://127.0.0.1:5173/ (npm run dev) or http://127.0.0.1:4173/ (npm run preview) in h3-longform-capture/app. Start Vite there, or switch to Live. This pane does not invent pack content.'
  return jsxs('div', {
    className: 'flex h-full flex-col items-center justify-center gap-3 p-8',
    children: [
      jsx(ErrorState, { title, description }),
      jsxs('div', {
        className: 'flex flex-wrap items-center justify-center gap-2',
        children: [
          jsx(Button, {
            variant: 'ghost',
            size: 'sm',
            onClick: () => {
              haptic('tap')
              onRetry()
            },
            children: 'Retry',
          }),
          jsx(Button, {
            variant: 'ghost',
            size: 'sm',
            onClick: () => {
              haptic('tap')
              persistSource('live')
            },
            children: 'Use Live',
          }),
            jsx(Button, {
              variant: 'ghost',
              size: 'sm',
              onClick: () => {
                haptic('tap')
                $forceEmbed.set(true)
                remountFrame()
              },
              children: 'Embed 5173 anyway',
            }),
        ],
      }),
    ],
  })
}

function CapturePane({ ctx }) {
  const source = useValue($source)
  const forceEmbed = useValue($forceEmbed)
  const localMode = source === 'local'
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: [ID, 'status'],
    queryFn: async () => ctx.rest('/status'),
    enabled: localMode,
    staleTime: 10 * 1000,
    retry: 1,
  })
  const status = asStatus(data)
  const localUrl = localTarget(status)
  const backendDown = Boolean(localMode && error && !data)
  const localDown = Boolean(localMode && status && status.local && status.local.reachable === false)

  let embedUrl = LIVE_URL
  let badge = 'Live'
  if (localMode) {
    if (forceEmbed) {
      embedUrl = LOCAL_DEV_URL
      badge = 'Local'
    } else if (localUrl) {
      embedUrl = localUrl
      badge = localUrl === LOCAL_PREVIEW_URL ? 'Preview' : 'Local'
    } else {
      embedUrl = ''
      badge = 'Local'
    }
  }

  if (localMode && isLoading && !forceEmbed) {
    return jsxs('div', {
      className: 'flex h-full min-h-0 flex-col',
      children: [
        jsx(Chrome, { source, embedUrl: LOCAL_DEV_URL, badge: 'Local' }),
        jsx(Separator, {}),
        jsxs('div', {
          className: 'flex flex-1 flex-col items-center justify-center gap-3',
          children: [
            jsx(GlyphSpinner, { size: 24 }),
            jsx('div', {
              className: 'text-sm text-(--ui-text-secondary)',
              children: 'Checking local Vite…',
            }),
          ],
        }),
      ],
    })
  }

  if (localMode && !forceEmbed && (backendDown || localDown)) {
    return jsxs('div', {
      className: 'flex h-full min-h-0 flex-col',
      children: [
        jsx(Chrome, { source, embedUrl: '', badge: 'Local' }),
        jsx(Separator, {}),
        jsx(LocalMissing, {
          backendDown,
          onRetry: () => {
            $forceEmbed.set(false)
            $iframeError.set(false)
            void refetch()
          },
        }),
      ],
    })
  }

  return jsxs('div', {
    className: cn('flex h-full min-h-0 flex-col'),
    children: [
      jsx(Chrome, { source, embedUrl, badge }),
      isFetching && localMode
        ? jsx('div', {
            className: 'px-4 text-[0.625rem] text-(--ui-text-quaternary)',
            children: 'updating local probe',
          })
        : null,
      jsx(Separator, {}),
      jsx(EmbedFrame, { url: embedUrl, title: 'H3 Capture Pack' }),
    ],
  })
}

export default {
  id: ID,
  name: 'H3 Capture',
  defaultEnabled: true,
  register(ctx) {
    ctx.registerMany([
      {
        id: 'pane',
        area: PANES_AREA,
        title: 'H3 Capture Pack',
        data: {
          placement: 'right',
          width: '720px',
          dock: { pane: 'workspace', pos: 'right' },
        },
        render: () => jsx(CapturePane, { ctx }),
      },
      {
        id: `${ID}-nav`,
        area: SIDEBAR_NAV_AREA,
        data: { path: ROUTE, label: 'H3 Capture', codicon: 'device-camera' },
      },
      {
        id: `${ID}-route`,
        area: ROUTES_AREA,
        data: { path: ROUTE },
        render: () => jsx(CapturePane, { ctx }),
      },
      {
        id: `${ID}-palette`,
        area: PALETTE_AREA,
        data: {
          id: `${ID}-open`,
          label: 'Open H3 Capture',
          keywords: ['h3', 'capture', 'pack', 'minimax', 'bible'],
          run: () => host.navigate(ROUTE),
        },
      },
      {
        id: `${ID}-palette-pane`,
        area: PALETTE_AREA,
        data: {
          id: `${ID}-open-pane`,
          label: 'Open H3 Capture pane',
          keywords: ['h3', 'capture', 'pane', 'pack', 'vite'],
          run: () => host.navigate(ROUTE),
        },
      },
    ])
  },
}
