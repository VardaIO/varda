const fs = require('fs')
const rootPath = require('app-root-path')
const pb = require('protocol-buffers')
const starProto = pb(fs.readFileSync(`${rootPath}/network/protos/star.proto`))

let star = {
  star_hash: 'CObTKEEZnyVOcAUbz8slgb/kwK7LWQKWkzoLC6Rm7q8=',
  mci: 1,
  timestamp: 1519782730,
  payload_hash:
    '6f795bf16de0bbb747a5bcccf3592b98f5c5c5a292bca5bcdfb613725f402937',
  authorAddress: 'VLRAJEAFXJBVYZQYT67YUQ3KJV53A',
  signature:
    'a0ede8e436acaca7fbf812fc62690eeb252d7e742b5768a64bff3afb528f10ea25210cbfe8a3200ebe010d53b54ab0dd8a5c1bd897d8b2e3fccfab620514890f',
  parentStars: ['dYixChMfNFnkpGCyaqQLYjcpq2Cxw5RAhgfqh+jKKYA='],
  transaction: {
    type: 1,
    sender: 'VLRAJEAFXJBVYZQYT67YUQ3KJV53A',
    amount: 1,
    recpient: 'VCRAJEAFXJBVYZQYT67YUQ3KJV53C',
    senderPublicKey:
      'f2e4942768671e46faf596f2bdf73c665a5a7c26e768eca1cf6935620e17d1ba',
    payload_hash:
      '6f795bf16de0bbb747a5bcccf3592b98f5c5c5a292bca5bcdfb613725f402937'
  }
}

let encode1 = starProto.star.encode(star)
let encode2 = starProto.stars.encode({
  stars: [star]
})
// console.log(starProto.star.decode(encode1))
console.log(starProto.stars.decode(encode2).stars)
