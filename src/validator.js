'use strict'
const BigNumber = require('bignumber.js')
const InvalidFieldsError = require('./errors').InvalidFieldsError
const util = require('util')

const REGEX_32_BYTES_AS_BASE64URL = /^[A-Za-z0-9_-]{43}$/
const REGEX_INTEGER = /^[1-9][0-9]*$/
const xor = (a, b) => ((a || b) && (!a || !b))
const omitUndefined = (o) => Object.keys(o).reduce((a, e) => {
  if (o[e] !== undefined) a[e] = o[e]
  return a
}, {})

module.exports = class Validator {
  constructor ({ plugin }) {
    this._plugin = plugin
  }

  normalizeOutgoingTransfer (t) {
    this.validateOutgoingTransfer(t)
    return omitUndefined({
      id: t.id,
      to: t.to || t.account,
      amount: t.amount,
      from: this._plugin.getAccount(),
      ledger: this._plugin.getInfo().prefix,
      ilp: t.ilp,
      executionCondition: t.executionCondition,
      expiresAt: t.expiresAt,
      custom: t.custom,
      noteToSelf: t.noteToSelf
    })
  }

  normalizeIncomingTransfer (t) {
    this.validateIncomingTransfer(t)
    return omitUndefined({
      id: t.id,
      amount: t.amount,
      to: t.to,
      from: t.from,
      ledger: this._plugin.getInfo().prefix,
      ilp: t.ilp,
      executionCondition: t.executionCondition,
      expiresAt: t.expiresAt,
      custom: t.custom
    })
  }

  normalizeOutgoingMessage (m) {
    this.validateOutgoingMessage(m)
    return m
  }

  normalizeIncomingMessage (m) {
    this.validateIncomingMessage(m)
    return m
  }

  validateIncomingTransfer (t) {
    this.validateTransfer(t)
    if (t.account) return
    this.assertIncoming(t)
  }

  validateOutgoingTransfer (t) {
    this.validateTransfer(t)
    if (t.account) return
    this.assertOutgoing(t)
  }

  validateTransfer (t) {
    assert(t.id, 'must have an id')
    assert(t.amount, 'must have an amount')

    assertString(t.id, 'id')
    assertNumber(t.amount, 'amount')
    assertObject(t.data, 'data')
    assertObject(t.noteToSelf, 'noteToSelf')
    assertObject(t.custom, 'custom')
    assertConditionOrPreimage(t.executionCondition, 'executionCondition')
    assertString(t.expiresAt, 'expiresAt')

    if (t.ledger) {
      assertPrefix(t.ledger, this._plugin.getInfo().prefix, 'ledger')
    }

    if (xor(t.executionCondition, t.expiresAt)) {
      throw new Error('executionCondition (' + t.executionCondition +
        ') and expiresAt (' + t.expiresAt +
        ') must both be set if either is set')
    }

    if (t.account) {
      util.deprecate(() => {}, 'switch from the "account" field to the "to" and "from" fields!')()
      assertString(t.account, 'account')
      return
    }

    assert(t.to, 'must have a destination (.to)')
  }

  validateIncomingMessage (m) {
    this.validateMessage(m)
    if (m.account) return
    this.assertIncoming(m)
  }

  validateOutgoingMessage (m) {
    this.validateMessage(m)
    if (m.account) return
    this.assertOutgoing(m)
  }

  validateMessage (m) {
    if (m.ilp) {
      assertString(m.ilp, 'message ilp must be a string')
    }

    if (m.ledger) {
      assertPrefix(m.ledger, this._plugin.getInfo().prefix, 'ledger')
    }

    if (m.account) {
      util.deprecate(() => {}, 'switch from the "account" field to the "to" and "from" fields!')()
      assertString(m.account, 'account')
      return
    }

    assert(m.to, 'must have a destination (.to)')
  }

  validateFulfillment (f) {
    assert(f, 'fulfillment must not be "' + f + '"')
    assertConditionOrPreimage(f, 'fulfillment')
  }

  assertIncoming (o) {
    assertAccount(o.to, this._plugin.getAccount(), 'to')
  }

  assertOutgoing (o) {
    if (o.from) assertAccount(o.from, this._plugin.getAccount(), 'from')
  }

}

function assert (cond, msg) {
  if (!cond) throw new InvalidFieldsError(msg)
}

function assertType (value, name, type) {
  assert(!value || typeof (value) === type,
    name + ' (' + value + ') must be a non-empty ' + type)
}

function assertString (value, name) {
  assertType(value, name, 'string')
}

function assertObject (value, name) {
  assertType(value, name, 'object')
}

function assertPrefix (value, prefix, name) {
  assertString(value, name)
  assert(value === prefix,
    name + ' (' + value + ') must match ILP prefix: ' + prefix)
}

function assertAccount (value, account, name) {
  assertString(value, name)
  assert(value === account,
    name + ' (' + value + ') must match account: ' + account)
}

function assertConditionOrPreimage (value, name) {
  if (!value) return
  assertString(value, name)
  if (!REGEX_32_BYTES_AS_BASE64URL.test(value)) {
    throw new InvalidFieldsError(name + ' (' + value + '): Not a valid 32-byte base64url encoded string')
  }
}

function isNumber (number) {
  try {
    return !!(new BigNumber(number))
  } catch (e) {
    return false
  }
}

function assertNumber (value, name) {
  assert(isNumber(value),
    name + ' (' + value + ') must be a number')
  assert((new BigNumber(value)).gt(new BigNumber('0')),
    name + ' (' + value + ') must be positive')
}
