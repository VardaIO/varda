const Transaction = require('./transaction')
const Utils = require('./utils')
const utils = new Utils()

class Vailidate {
    vailidateTransaction(transaction) {
        return new Transaction().check(transaction)
    }

    vailidateStarWithoutTransaction(star) {
        const transaction = star.transaction
        const checkSignature = utils.sigVerify(star.star_hash, star.signature, transaction.senderPublicKey)

        if (!checkSignature) {
            return false
        }

        const address = utils.genAddress(transaction.senderPublicKey)

        if (address !== star.authorAddress || address !== transaction.sender) {
            return false
        }

        return true
    }

    async vailidateStar(star) {

        if(!this.vailidateStarWithoutTransaction(star)) {
            return false
        }

        const checkTransaction = await this.vailidateTransaction(transaction)

        if (!checkTransaction) {
            return false
        }

        return true
    }
}

module.exports = Vailidate