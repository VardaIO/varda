const Utils = require('../../utils')
const Wallet = require('../../hd-wallet')
const accountFromComponent = require('../../account')

module.exports = class Account extends accountFromComponent {
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

// const a = new Account()

// let ac = a.newAccount()

// console.log(ac.address)
// setImmediate(async () => {
//   setInterval(async () => {
//     let b = await a.getBalance('VLRAJEAFXJBVYZQYT67YUQ3KJV53A')
//     console.log(`balance: ${b}`)
//     console.log(await a.getPk('VLRAJEAFXJBVYZQYT67YUQ3KJV53A'))
//     console.log(await a.checkTransaction('VLRAJEAFXJBVYZQYT67YUQ3KJV53A', 1000))
//   }, 1000)
// })
