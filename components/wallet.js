const Account = require('./account')
const Transaction = require('./transaction')
const {
    prepareStar,
    broadcastStar
} = require('./addStar')

const Utils = require('./utils')
const utils = new Utils()

class Wallet {
    async pay(recpient, amount, sk) {
        const tx = new Transaction()
        const pk = utils.getPub(sk)
        const address = utils.genAddress(pk)

        const transaction = tx.newTransaction({
            type: 1,
            sender: address,
            amount: amount,
            recpient: recpient,
            senderPublicKey: pk,
            sk: sk
        })
        let star = await prepareStar(transaction)
        // console.log(star)
        // broadcastStar()
    }
}

let wallet = new Wallet()
const sk = 'f9ec5ccb42e3c976a027a5ba74a0ed636b35d93bacde225dbe85aed8dfbb00b4f2e4942768671e46faf596f2bdf73c665a5a7c26e768eca1cf6935620e17d1ba'

wallet.pay('VCRAJEAFXJBVYZQYT67YUQ3KJV53A', 10, sk)