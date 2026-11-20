/**
 * Race a promise against a timeout. Rejects with Error('timeout') when overdue.
 * Does not cancel the underlying work unless the caller also uses AbortSignal.
 *
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms
 * @param {string} [label]
 * @returns {Promise<T>}
 */
export function withTimeout(promise, ms, label = 'timeout') {
  if (!ms || ms <= 0) return promise
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(label))
    }, ms)
    promise.then(
      (value) => {
        clearTimeout(timer)
        resolve(value)
      },
      (err) => {
        clearTimeout(timer)
        reject(err)
      },
    )
  })
}
