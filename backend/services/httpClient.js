import https from 'node:https'

export async function getJson(url, headers = {}, options = {}) {
  const timeoutMs = options.timeoutMs || 4000
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, { headers, signal: controller.signal })
    const responseText = await response.text()

    return buildHttpResult(response.status, response.headers, responseText, response.ok)
  } catch (fetchError) {
    if (fetchError.name === 'AbortError') {
      const timeoutError = new Error(`Request timed out after ${timeoutMs}ms`)
      timeoutError.code = 'ETIMEDOUT'
      throw timeoutError
    }

    return getJsonWithHttps(url, headers, fetchError, timeoutMs)
  } finally {
    clearTimeout(timeoutId)
  }
}

function getJsonWithHttps(url, headers, fetchError, timeoutMs) {
  return new Promise((resolve, reject) => {
    const request = https.get(url, { headers }, (response) => {
      let responseText = ''

      response.on('data', (chunk) => {
        responseText += chunk
      })
      response.on('end', () => {
        resolve(buildHttpResult(response.statusCode, response.headers, responseText, response.statusCode < 400))
      })
    })

    request.on('error', (httpsError) => {
      httpsError.cause = fetchError.cause || fetchError
      reject(httpsError)
    })
    request.setTimeout(timeoutMs, () => {
      request.destroy(new Error(`Request timed out after ${timeoutMs}ms`))
    })
    request.end()
  })
}

function buildHttpResult(status, headers, responseText, ok) {
  let body = {}

  try {
    body = responseText ? JSON.parse(responseText) : {}
  } catch {
    body = { message: responseText }
  }

  return {
    ok,
    status,
    headers: normalizeHeaders(headers),
    body,
  }
}

function normalizeHeaders(headers) {
  if (typeof headers?.get === 'function') return headers

  return {
    get(name) {
      const value = headers?.[name.toLowerCase()] || headers?.[name]
      return Array.isArray(value) ? value.join(',') : value || null
    },
  }
}
