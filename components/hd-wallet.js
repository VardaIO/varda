const bip39 = require('bip39')
const hd = require('ed25519-hd-key')
const {
  derivePath,
  getMasterKeyFromSeed,
  getPublicKey
} = require('ed25519-hd-key')
const _ = require('lodash')

const Utils = require('./utils')
const utils = new Utils()

class HDWallet {
  constructor() {
    this.seed = null
  }

  // fromMnemonic(mnemonic, password = undefined) {
  //   return new HDWallet(this.seed = this.getSeed(mnemonic, password))
  // }

  // fromSeed(seed) {
  //   if (!_.isString(seed)) {
  //     throw new TypeError('seed should be a hex string')
  //   }
  //   return (this.seed = seed)
  // }

  genMnemonic({ bits = 128, language = 'english', rng = undefined } = {}) {
    // if you wanna get a 24 mnemonic word, you ca set bits with 256
    if (language && !bip39.wordlists.hasOwnProperty(language)) {
      throw new TypeError('Language should be include in bip39 wordlist')
    }

    return bip39.generateMnemonic(bits, rng, bip39.wordlists[language])
  }

  validateMnemonic(mnemonic) {
    return bip39.validateMnemonic(mnemonic)
  }

  getSeed(mnemonic, password = undefined) {
    return bip39.mnemonicToSeedHex(mnemonic, password)
  }

  genKeypair(index, seed) {
    const path = `m/44'/233'/${index}'`
    seed = seed ? seed : this.seed
    const key = derivePath(path, seed).key
    const keys = utils.fromSeed(new Uint8Array(key))

    return keys
  }
}

module.exports = HDWallet
// let Hd = new HDWallet()
// let m ='warrior paper net nice differ return use robust dirt credit way foil'
//   // 'gift puppy enforce violin rapid rare dance judge renew damp life giant common siege screen length scrub door risk run scatter reward penuncle'
// // // Hd.genMnemonic()
// const seed = Hd.getSeed(m, '1234567')
// console.log(Hd.validateMnemonic(m))
// console.log(seed)
// // console.log(Hd.genMnemonic())
// // // const path = "m/44'/233'/0'"
// // const m = Hd.genMnemonic()
// // let w  =Hd.fromMnemonic(m)
// const keys = Hd.genKeypair(0, seed)
// console.log(keys)
