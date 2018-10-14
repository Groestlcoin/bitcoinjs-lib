var Buffer = require('safe-buffer').Buffer
var bs58grscheck = require('bs58grscheck')
var bscript = require('./script')
var networks = require('./networks')
var typeforce = require('typeforce')
var types = require('./types')

function fromBase58GrsCheck (address) {
  var payload = bs58grscheck.decode(address)
  if (payload.length < 21) throw new TypeError(address + ' is too short')
  if (payload.length > 21) throw new TypeError(address + ' is too long')

  var version = payload.readUInt8(0)
  var hash = payload.slice(1)

  return { hash: hash, version: version }
}

function toBase58GrsCheck (hash, version) {
  typeforce(types.tuple(types.Hash160bit, types.UInt8), arguments)

  var payload = Buffer.allocUnsafe(21)
  payload.writeUInt8(version, 0)
  hash.copy(payload, 1)

  return bs58grscheck.encode(payload)
}

function fromOutputScript (outputScript, network) {
  network = network || networks.bitcoin

  if (bscript.pubKeyHash.output.check(outputScript)) return toBase58GrsCheck(bscript.compile(outputScript).slice(3, 23), network.pubKeyHash)
  if (bscript.scriptHash.output.check(outputScript)) return toBase58GrsCheck(bscript.compile(outputScript).slice(2, 22), network.scriptHash)

  throw new Error(bscript.toASM(outputScript) + ' has no matching Address')
}

function toOutputScript (address, network) {
  network = network || networks.bitcoin

  var decode = fromBase58GrsCheck(address)
  if (decode.version === network.pubKeyHash) return bscript.pubKeyHash.output.encode(decode.hash)
  if (decode.version === network.scriptHash) return bscript.scriptHash.output.encode(decode.hash)

  throw new Error(address + ' has no matching Script')
}

module.exports = {
  fromBase58GrsCheck: fromBase58GrsCheck,
  fromOutputScript: fromOutputScript,
  toBase58GrsCheck: toBase58GrsCheck,
  toOutputScript: toOutputScript
}
