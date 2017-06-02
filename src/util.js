// don't throw errors even if the event handler throws
// this is especially important in plugin virtual because
// errors can prevent the balance from being updated correctly
function safeEmit (that, ...rest) {
  try {
    that.emit.apply(that, rest)
  } catch (err) {
    console.error('error in handler for event', rest, err)
  }
}

function base64url (buf) {
  return buf
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
}

module.exports = {
  safeEmit,
  base64url
}
