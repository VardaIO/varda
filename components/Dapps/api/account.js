const Utils = require('../../utils')
const Wallet = require('../../hd-wallet')
const accountFromComponent = require('../../account')

class Account extends accountFromComponent {
  newAccount() {
    const utils = new Utils()
    const wallet = new Wallet()
    const mnemonic = wallet.genMnemonic()
    const seed = wallet.getSeed(mnemonic)
    const keypair = wallet.genKeypair(0, seed)
    const sk = keypair.secretKey
    const pk = keypair.publicKey
    const address = utils.genAddress(pk)

    return { mnemonic, address, sk, pk }
  }
}

module.exports = Account
