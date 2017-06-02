# ILP Plugin Shared
> Utility functions for integrating a ledger plugin

## Util

### safeEmit (that, ...rest)

- `that` - The current plugin (this)
- `...rest` - Parameters to emit

All plugin events should be emitted with this function, to prevent errors in
the handler from leaking back into the plugin.

Example:

```
shared.Util.safeEmit(this, 'incoming_transfer', transfer)
```

### base64url (buf)

- `buf` - Buffer to convert to base64url

Conditions, packets, fulfillments, and other binary data in ILP are represented
with base64url. Use this function when serializing those fields. To parse
base64url, you can use `Buffer.from(base64urlString, 'base64')`.

Example:

```
buf = crypto.randomBytes(32)
base64urlString = shared.Util.base64url(buf)
```
