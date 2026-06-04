import https from 'node:https'

export async function getJson(url, headers = {}) {
  try {
    const response = await fetch(url, { headers })
    const responseText = await response.text()

    return buildHttpResult(response.status, response.headers, responseText, response.ok)
  } catch (fetchError) {
    return getJsonWithHttps(url, headers, fetchError)
  }
}

function getJsonWithHttps(url, headers, fetchError) {
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
