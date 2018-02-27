const nacl = require('tweetnacl')
const createKeccakHash = require('keccak')
const base32 = require('base32.js')
const crc = require('crc')
const _ = require('lodash')

class Utils {
  constructor() {}
  genKeys() {
    const keys = nacl.sign.keyPair()
    const secretKey = Buffer.from(keys.secretKey).toString('hex')
    const publicKey = Buffer.from(keys.publicKey).toString('hex')
    return {
      secretKey: secretKey,
      publicKey: publicKey
    }
  }

  fromSeed(seed) {
    // seed can be a random 32 bytes uint8Array value
    const keys = nacl.sign.keyPair.fromSeed(seed)
    const secretKey = Buffer.from(keys.secretKey).toString('hex')
    const publicKey = Buffer.from(keys.publicKey).toString('hex')
    return {
      secretKey: secretKey,
      publicKey: publicKey
    }
  }

  getPub(sk) {
    const secretKey = new Uint8Array(Buffer.from(sk, 'hex'))

    return Buffer.from(
      nacl.sign.keyPair.fromSecretKey(secretKey).publicKey
    ).toString('hex')
  }

  sign(msg, sk) {
    msg = new Uint8Array(Buffer.from(msg))
    sk = new Uint8Array(Buffer.from(sk, 'hex'))
    return Buffer.from(nacl.sign.detached(msg, sk)).toString('hex')
  }

  sigVerify(msg, sig, pk) {
    msg = new Uint8Array(Buffer.from(msg))
    sig = new Uint8Array(Buffer.from(sig, 'hex'))
    pk = new Uint8Array(Buffer.from(pk, 'hex'))
    const result = nacl.sign.detached.verify(msg, sig, pk)
    if (!result) {
      return false
    }
    return true
  }

  genAddress(pk) {
    pk = Buffer.from(pk, 'hex')
    const afterHash = createKeccakHash('sha3-256')
      .update(pk)
      .digest()
      .slice(0, 15)
    const checksum = this.checksum(afterHash)
    const unencodedAddress = Buffer.concat([afterHash, checksum])
    // the V is prefix
    return 'V' + base32.encode(unencodedAddress)
  }

  checksum(hash) {
    // hash should be a buffer
    const checksum = Buffer.alloc(2)
    checksum.writeUInt16LE(crc.crc16xmodem(hash), 0)
    return checksum
  }

  addressVerify(address) {
    address = base32.decode(address.substr(1))

    const originalChecksum = address.slice(-2)
    const pkHash = address.slice(0, -2)
    const newChecksum = this.checksum(pkHash)

    if (_.isEqual(newChecksum, originalChecksum)) {
      return true
    } else {
      return false
    }
  }
}

module.exports = Utils
