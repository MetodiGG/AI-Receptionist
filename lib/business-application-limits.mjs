// Forty full service descriptions plus optional team biographies must fit,
// without silently dropping price conditions. Photo/total multipart limits
// remain independently enforced by the existing image upload path.
export const APPLICATION_JSON_CHAR_LIMIT = 200000
export const APPLICATION_JSON_BYTE_LIMIT = APPLICATION_JSON_CHAR_LIMIT * 4

export async function readBoundedApplicationText(request) {
  if (Number(request.headers.get('content-length')) > APPLICATION_JSON_BYTE_LIMIT || !request.body) throw Error('VALIDATION_ERROR')
  const reader = request.body.getReader(), decoder = new TextDecoder('utf-8', { fatal: true })
  let bytes = 0, text = ''
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      bytes += value.byteLength
      if (bytes > APPLICATION_JSON_BYTE_LIMIT) { await reader.cancel(); throw Error('VALIDATION_ERROR') }
      text += decoder.decode(value, { stream: true })
      if (text.length > APPLICATION_JSON_CHAR_LIMIT) { await reader.cancel(); throw Error('VALIDATION_ERROR') }
    }
    text += decoder.decode()
    if (text.length > APPLICATION_JSON_CHAR_LIMIT) throw Error('VALIDATION_ERROR')
    return text
  } finally { reader.releaseLock() }
}
