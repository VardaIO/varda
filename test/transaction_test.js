const test = require('ava')
const Tx = require('../components/transaction')
const tx = new Tx()


test('transaction testing', t => {
    const sk = 'f9ec5ccb42e3c976a027a5ba74a0ed636b35d93bacde225dbe85aed8dfbb00b4f2e4942768671e46faf596f2bdf73c665a5a7c26e768eca1cf6935620e17d1ba'
    const pk = 'f2e4942768671e46faf596f2bdf73c665a5a7c26e768eca1cf6935620e17d1ba'
    const address = 'VLRAJEAFXJBVYZQYT67YUQ3KJV53A'
    let newTx = tx.newTransaction({
        type: 0,
        sender: address,
        amount: 10,
        recpient: 'VCRAJEAFXJBVYZQYT67YUQ3KJV53A',
        senderPublicKey: pk
    }, sk)
    t.is(newTx.payload_hash, '1ca9b04f4891c7c09e5fd601379cb6e6d8c32c71abc28ff8a8826538d42f350f')

    t.is(newTx.signature, 'd3a4ab0792646fb933b7806c12a54a315b61530bd2edfe580b83f6b510bd51a9ce460962dbfcbda0b3aa40c6a11706223f79280921b88fe05a78c41c14256a09')

    t.true(tx.check(newTx))
})