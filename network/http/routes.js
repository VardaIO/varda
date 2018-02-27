const router = require('koa-router')()
const appRoot = require('app-root-path')

const Wallet = require(`${appRoot}/components/wallet`)
const HD = require(`${appRoot}/components/hd-wallet`)
const Utils = require(`${appRoot}/components/utils`)
const Account = require(`${appRoot}/components/account`)
const utils = new Utils()


const fs = require('fs')
const pb = require('protocol-buffers')
const starProto = pb(fs.readFileSync(`${appRoot}/network/protos/star.proto`))

router.get('/createAccount', ctx => {
  const hd = new HD()
  ctx.body = hd.genMnemonic()
})

router.post('/sendStar', async ctx => {
  const request = ctx.request.body
  const sk = request.sk
  const to = request.to
  const amount = request.amount
  const wallet = new Wallet()
  let star = await wallet.pay(to, amount, sk)

  global.n.pubsub.publish(
    'sendStar',
    Buffer.from(star.toString('hex')),
    error => {
      if (error) {
        return Promise.reject(error)
      }
    }
  )

  ctx.body = starProto.star.decode(star)
})

router.post('/getBalance', async (ctx) => {
  const sk = ctx.request.body.sk
  const pk = utils.getPub(sk)
  const address = utils.genAddress(pk)
  const account = new Account(address)
  const balance = await account.getBalance()

  ctx.body = { balance }
})

module.exports = router
