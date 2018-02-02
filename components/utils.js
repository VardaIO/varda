const nacl = require("tweetnacl")
nacl.util = require('tweetnacl-util')
const createKeccakHash = require('keccak')
const base32 = require('base32.js')
const crc = require('crc')
const _ = require('lodash')

const encode = nacl.util.encodeBase64
const decode = nacl.util.decodeBase64

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

    getPub(sk) {
        const secretKey = new Uint8Array(Buffer.from(sk, 'hex'))

        return Buffer.from(nacl.sign.keyPair.fromSecretKey(secretKey).publicKey).toString('hex')
    }

    sign(msg, sk) {
        msg = new Uint8Array(Buffer.from(msg))
        sk = new Uint8Array(Buffer.from(sk, 'hex'))
        return Buffer.from(nacl.sign(msg, sk)).toString('hex')
    }

    sigVerify(sig, pk) {
        sig = new Uint8Array(Buffer.from(sig, 'hex'))
        pk = new Uint8Array(Buffer.from(pk, 'hex'))
        const result = nacl.sign.open(sig, pk)
        if (!result) {
            return false
        }
        return true
    }

    genAddress(pk) {
        pk = Buffer.from(pk, 'hex')
        const pkHash = createKeccakHash('sha3-256').update(pk).digest()
        const checksum = this.checksum(pkHash)
        const unencodedAddress = Buffer.concat([pkHash, checksum])
        return base32.encode(unencodedAddress)
    }

    checksum(hash) {
        // hash should be a buffer
        const checksum = Buffer.alloc(2)
        checksum.writeUInt16LE(crc.crc16xmodem(hash), 0)
        return checksum
    }

    addressVerify(address) {
        address = base32.decode(address)

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

