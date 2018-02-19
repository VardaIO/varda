const Account = require('./account')
const Transaction = require('./transaction')
const {
    prepareStar
} = require('./addStar')

class Wallet {
    async pay(recpient, amount) {
        const tx = new Transaction()
        const sk = 'f9ec5ccb42e3c976a027a5ba74a0ed636b35d93bacde225dbe85aed8dfbb00b4f2e4942768671e46faf596f2bdf73c665a5a7c26e768eca1cf6935620e17d1ba'
        const pk = 'f2e4942768671e46faf596f2bdf73c665a5a7c26e768eca1cf6935620e17d1ba'
        const address = 'VLRAJEAFXJBVYZQYT67YUQ3KJV53A'
        const transaction = tx.newTransaction({
            type: 1,
            sender: address,
            amount: amount,
            recpient: recpient,
            senderPublicKey: pk,
            sk: sk
        })
        let star = await prepareStar(transaction)
        console.log(star)
    }
}

let wallet = new Wallet()
wallet.pay('VCRAJEAFXJBVYZQYT67YUQ3KJV53A', 10)