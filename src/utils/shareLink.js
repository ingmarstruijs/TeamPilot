/**
 * Share a URL via Web Share API, with clipboard fallback.
 * @returns {Promise<'shared'|'copied'|'aborted'|'failed'>}
 */
export async function shareLink({ title, text, url }) {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({ title, text, url })
      return 'shared'
    } catch (err) {
      if (err?.name === 'AbortError') return 'aborted'
      // Fall through to clipboard for other share failures.
    }
  }

  try {
    await navigator.clipboard.writeText(url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
