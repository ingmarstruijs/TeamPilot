/** Light default — fits mid-range devices and browser storage quotas better. */
export const DEFAULT_LOCAL_MODEL_ID = 'Qwen2.5-0.5B-Instruct-q4f16_1-MLC'

/** Larger optional model (~1.2 GB+). */
export const LARGE_LOCAL_MODEL_ID = 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC'

/** Approx packed size for the default 0.5B q4 model (download + unpack headroom). */
export const DEFAULT_MODEL_BYTES = 600 * 1024 * 1024

export const AI_PREFS_KEY = 'teampilot_ai_v1'

const CACHE_NAME_RE = /webllm|mlc|tvm|huggingface|wasm-cache|model/i
const IDB_NAME_RE = /webllm|mlc|tvm|wasm|huggingface/i
const OPFS_NAME_RE = /tvmjs-opfs|webllm|mlc|tvm|huggingface|model/i

/**
 * @typedef {object} AiPreferences
 * @property {boolean} preferLocalLlm
 * @property {string} modelId
 * @property {number|null} downloadAcceptedAt
 */

/**
 * @returns {AiPreferences}
 */
export function defaultAiPreferences() {
  return {
    preferLocalLlm: false,
    modelId: DEFAULT_LOCAL_MODEL_ID,
    downloadAcceptedAt: null,
  }
}

/**
 * @param {string} rawModelId
 * @returns {string}
 */
function normalizeModelId(rawModelId) {
  if (!rawModelId) return DEFAULT_LOCAL_MODEL_ID
  const withMlc = rawModelId.endsWith('-MLC') ? rawModelId : `${rawModelId}-MLC`
  // Old PR C drafts defaulted to 1.5B; keep if user already chose it, else prefer compact.
  if (withMlc === 'Qwen2.5-1.5B-Instruct-q4f16_1-MLC') return withMlc
  if (withMlc.includes('Qwen2.5')) return withMlc
  return DEFAULT_LOCAL_MODEL_ID
}

/**
 * @returns {AiPreferences}
 */
export function readAiPreferences() {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(AI_PREFS_KEY) : null
    if (!raw) return defaultAiPreferences()
    const parsed = JSON.parse(raw)
    return {
      preferLocalLlm: Boolean(parsed.preferLocalLlm),
      modelId: normalizeModelId(typeof parsed.modelId === 'string' ? parsed.modelId : ''),
      downloadAcceptedAt: typeof parsed.downloadAcceptedAt === 'number'
        ? parsed.downloadAcceptedAt
        : null,
    }
  } catch {
    return defaultAiPreferences()
  }
}

/**
 * @param {Partial<AiPreferences>} patch
 * @returns {AiPreferences}
 */
export function writeAiPreferences(patch) {
  const next = { ...readAiPreferences(), ...patch }
  if (patch.modelId) next.modelId = normalizeModelId(patch.modelId)
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(AI_PREFS_KEY, JSON.stringify(next))
    }
  } catch {
    // ignore quota / private mode
  }
  return next
}

/**
 * @param {string} name
 * @returns {boolean}
 */
export function isWebLlmCacheName(name) {
  return CACHE_NAME_RE.test(String(name || ''))
}

/**
 * Best-effort wipe of WebLLM / MLC browser storage (OPFS + Cache + IndexedDB).
 * Default: only WebLLM-related caches. Pass `{ aggressive: true }` to delete
 * all origin caches (quota recovery / "wis cache en probeer opnieuw").
 *
 * @param {{ aggressive?: boolean }} [options]
 * @returns {Promise<{ clearedCaches: number, clearedOpfs: boolean }>}
 */
export async function clearWebLlmStorage(options = {}) {
  const aggressive = Boolean(options.aggressive)
  let clearedCaches = 0
  let clearedOpfs = false

  // 1) Origin Private File System — primary store in recent WebLLM builds
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.getDirectory) {
      const root = await navigator.storage.getDirectory()
      const names = []
      if (typeof root.keys === 'function') {
        for await (const name of root.keys()) names.push(name)
      } else if (typeof root.entries === 'function') {
        for await (const [name] of root.entries()) names.push(name)
      }
      for (const name of names) {
        if (OPFS_NAME_RE.test(name) || name === 'tvmjs-opfs-store') {
          try {
            await root.removeEntry(name, { recursive: true })
            clearedOpfs = true
          } catch {
            // ignore locked entries
          }
        }
      }
      try {
        await root.removeEntry('tvmjs-opfs-store', { recursive: true })
        clearedOpfs = true
      } catch {
        // missing is fine
      }
    }
  } catch {
    // ignore
  }

  // 2) Cache Storage — selective by default; aggressive wipes all origin caches
  try {
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys()
      const targets = aggressive ? keys : keys.filter(isWebLlmCacheName)
      await Promise.all(targets.map(k => caches.delete(k)))
      clearedCaches = targets.length
    }
  } catch {
    // ignore
  }

  // 3) IndexedDB leftovers
  try {
    if (typeof indexedDB !== 'undefined' && typeof indexedDB.databases === 'function') {
      const dbs = await indexedDB.databases()
      await Promise.all(
        (dbs || [])
          .filter(db => IDB_NAME_RE.test(db?.name || ''))
          .map(db => new Promise((resolve) => {
            const req = indexedDB.deleteDatabase(db.name)
            req.onsuccess = req.onerror = req.onblocked = () => resolve()
          })),
      )
    }
  } catch {
    // ignore
  }

  return { clearedCaches, clearedOpfs }
}

/**
 * Probe whether WebLLM artifacts appear present (OPFS and/or Cache API).
 * Preference timestamps alone are not enough after browser data clears.
 *
 * @returns {Promise<boolean>}
 */
export async function probeWebLlmStoragePresent() {
  try {
    if (typeof navigator !== 'undefined' && navigator.storage?.getDirectory) {
      const root = await navigator.storage.getDirectory()
      if (typeof root.getDirectoryHandle === 'function') {
        try {
          await root.getDirectoryHandle('tvmjs-opfs-store')
          return true
        } catch {
          // missing
        }
      }
      if (typeof root.keys === 'function') {
        for await (const name of root.keys()) {
          if (OPFS_NAME_RE.test(name)) return true
        }
      }
    }
  } catch {
    // ignore
  }

  try {
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys()
      if (keys.some(isWebLlmCacheName)) return true
    }
  } catch {
    // ignore
  }

  return false
}

/**
 * Sync preference flag with a live storage probe.
 * Clears a stale `downloadAcceptedAt` when artifacts are gone.
 *
 * @returns {Promise<AiPreferences & { present: boolean }>}
 */
export async function syncDownloadAcceptedWithProbe() {
  const prefs = readAiPreferences()
  const present = await probeWebLlmStoragePresent()
  if (prefs.downloadAcceptedAt && !present) {
    const next = writeAiPreferences({ downloadAcceptedAt: null })
    return { ...next, present: false }
  }
  return { ...prefs, present: Boolean(prefs.downloadAcceptedAt && present) || present }
}

/**
 * @returns {Promise<{ usage: number, quota: number, usageLabel: string, freeLabel: string, free: number }|null>}
 */
export async function estimateBrowserStorage() {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.estimate) return null
    const { usage = 0, quota = 0 } = await navigator.storage.estimate()
    const free = Math.max(0, quota - usage)
    const fmt = (n) => {
      if (n >= 1e9) return `${(n / 1e9).toFixed(1)} GB`
      if (n >= 1e6) return `${Math.round(n / 1e6)} MB`
      return `${Math.round(n / 1e3)} KB`
    }
    return {
      usage,
      quota,
      free,
      usageLabel: fmt(usage),
      freeLabel: fmt(free),
    }
  } catch {
    return null
  }
}

/**
 * Ask the browser for persistent storage (can raise effective quota).
 * @returns {Promise<boolean>}
 */
export async function requestPersistentStorage() {
  try {
    if (typeof navigator === 'undefined' || !navigator.storage?.persist) return false
    return Boolean(await navigator.storage.persist())
  } catch {
    return false
  }
}

/**
 * @param {unknown} err
 * @returns {boolean}
 */
export function isStorageQuotaError(err) {
  const msg = String(err?.message || err || '').toLowerCase()
  const name = String(err?.name || '').toLowerCase()
  return (
    name.includes('quota')
    || msg.includes('quota')
    || (msg.includes('storage') && msg.includes('exceed'))
    || (msg.includes('disk') && msg.includes('space'))
    || msg.includes('opfs')
  )
}
