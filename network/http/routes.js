const router = require('koa-router')()
const appRoot = require('app-root-path')

const Wallet = require(`${appRoot}/components/wallet`)
const wallet = new Wallet()
const fs = require('fs')
const pb = require('protocol-buffers')
const starProto = pb(fs.readFileSync(`${appRoot}/network/protos/star.proto`))
// const C = require(`${appRoot}/components/commission`)
// const c = new C()

router.get('/', (ctx, next) => {
  ctx.body = 'Hello World!'
})

router.post('/sendStar', async ctx => {
  const request = ctx.request.body
  const sk = request.sk
  const to = request.to
  const amount = request.amount
  let star = await wallet.pay(to, amount, sk)
  // c.preparePool[starProto.star.decode(star).star_hash] = starProto.star.decode(
  //   star
  // )
  global.n.pubsub.publish(
    'sendStar',
    Buffer.from(star.toString('hex')),
    error => {
      if (error) {
        return Promise.reject(error)
      }
    }
  )
  // console.log(c.preparePool)

  ctx.body = starProto.star.decode(star)
})

module.exports = router
