const test = require('ava')
const Utils = require('../components/utils')
const utils = new Utils()


test('utils testing', t => {
    
    const sk = 'f9ec5ccb42e3c976a027a5ba74a0ed636b35d93bacde225dbe85aed8dfbb00b4f2e4942768671e46faf596f2bdf73c665a5a7c26e768eca1cf6935620e17d1ba'
    const pk = 'f2e4942768671e46faf596f2bdf73c665a5a7c26e768eca1cf6935620e17d1ba'
    const address = 'VLRAJEAFXJBVYZQYT67YUQ3KJ7XZVL5LU3ADTZX4YEWT4K44455QVRJY'
    const msg = 'Varda is awesome!'
    const sig = 'da153675d5ced50634df64d339aa9845302809539603c959298ea5a88f0eb2f042f13a348e9ae8bbca0fe3ba003d1f8ae7b13c55a4d6b860c901ea2fa491f107566172646120697320617765736f6d6521'

    t.is(utils.genAddress(pk), address)

    t.true(utils.addressVerify(address))

    t.is(utils.getPub(sk), pk)

    t.is(utils.sign(msg, sk), sig)

    t.true(utils.sigVerify(sig, pk))
})