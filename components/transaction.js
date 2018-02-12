const createKeccakHash = require('keccak')

const Utils = require('./utils')
const utils = new Utils()

class Transaction {
    constructor() {
        this.payload_hash = null
        this.type = null
        this.sender = null
        this.amount = null
        this.recpient = null
        this.senderPublicKey = null
        this.signature = null
    }

    toHash() {
        return createKeccakHash('sha3-256').update(this.type + this.sender + this.amount + this.recpient + this.senderPublicKey).digest('hex')
    }

    sign(sk) {
        return utils.sign(this.payload_hash, sk)
    }

    newTransaction(tx) {
        let transaction = new Transaction()
        Object.assign(transaction, tx)
        transaction.payload_hash = transaction.toHash()
        
        return transaction
    }

    check() {

        //first check address and signature 
        // 1. get address and vailate address with pubkey
        // 2. get sig , use pubkey to vailate sig
        if (utils.genAddress(this.senderPublicKey) !== this.sender) {
            return {
                msg: 'sender address is wrong'
            }
        }

        if (!utils.sigVerify(this.signature, this.senderPublicKey)) {
            return {
                msg: 'signature is wrong'
            }
        }

        //secound check amount
        // 1.get amount
        // 2. if sender amount > his have, return false 
    }

}
const sk = 'f9ec5ccb42e3c976a027a5ba74a0ed636b35d93bacde225dbe85aed8dfbb00b4f2e4942768671e46faf596f2bdf73c665a5a7c26e768eca1cf6935620e17d1ba'
const pk = 'f2e4942768671e46faf596f2bdf73c665a5a7c26e768eca1cf6935620e17d1ba'

let a = {
    type: 'pay',
    sender: 'me',
    amount: 10,
    recpient: 'you',
    senderPublicKey: pk
}
let b = new Transaction()

console.log(b.newTransaction(a).toHash())
console.log(b.newTransaction(a).sign(sk))
console.log(utils.sigVerify(b.newTransaction(a).sign(sk), pk))

