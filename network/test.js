const fs = require('fs')
const appRoot = require('app-root-path')
const pb = require('protocol-buffers')

const starProto = pb(fs.readFileSync(`${appRoot}/network/protos/star.proto`))

const star = {
  timestamp: 1519705773,
  parentStars: ['dYixChMfNFnkpGCyaqQLYjcpq2Cxw5RAhgfqh+jKKYA='],
  payload_hash:
    '6f795bf16de0bbb747a5bcccf3592b98f5c5c5a292bca5bcdfb613725f402937',
  transaction: {
    payload_hash:
      '6f795bf16de0bbb747a5bcccf3592b98f5c5c5a292bca5bcdfb613725f402937',
    type: 1,
    sender: 'VLRAJEAFXJBVYZQYT67YUQ3KJV53A',
    amount: 1,
    recpient: 'VCRAJEAFXJBVYZQYT67YUQ3KJV53C',
    senderPublicKey:
      'f2e4942768671e46faf596f2bdf73c665a5a7c26e768eca1cf6935620e17d1ba'
  },
  star_hash: 'kWv5yw0W0RRoEMOgwZDiw/GEd0/E4nnyvXehFq6gb6o=',
  mci: 1,
  authorAddress: 'VLRAJEAFXJBVYZQYT67YUQ3KJV53A',
  signature:
    '787f410a0ea5684fda093929cee3b971482fba6d076c640c5299330ecfa650ad9107454420f0f904da4f5077b22653085e2643ed674a674759c9a8628eb9f002'
}

let a = starProto.commissionStar.encode({
  star,
  commissionAddress: 'VLRAJEAFXJBVYZQYT67YUQ3KJV53A',
  commissionPublicKey:
    'f2e4942768671e46faf596f2bdf73c665a5a7c26e768eca1cf6935620e17d1ba',
  commissionSignature:
    '787f410a0ea5684fda093929cee3b971482fba6d076c640c5299330ecfa650ad9107454420f0f904da4f5077b22653085e2643ed674a674759c9a8628eb9f002'
})

console.log(starProto.star.decode(a))
// console.log(starProto.commissionStar.decode(a))
