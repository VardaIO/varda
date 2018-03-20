const router = require('koa-router')()
const appRoot = require('app-root-path')

const Wallet = require('../../components/wallet')
const Utils = require('../../components/utils')
const Account = require(`${appRoot}/components/account`)
const utils = new Utils()

const fs = require('fs')
const pb = require('protocol-buffers')
const starProto = pb(fs.readFileSync(`${appRoot}/network/protos/star.proto`))
const sync = require('../../components/sync/sync')
const HD = require('../../components/hd-wallet')

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
  if (amount <= 0 ) {
    ctx.body = {
      message: "amount is wrong"
    }
    return
  }
  
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

router.post('/skToAddress', async ctx => {
  const sk = ctx.request.body.sk
  ctx.body = utils.getAddressFromSk(sk)
})

router.post('/getBalance', async ctx => {
  const sk = ctx.request.body.sk
  const pk = utils.getPub(sk)
  const address = utils.genAddress(pk)
  const account = new Account(address)
  const balance = await account.getBalance()

  ctx.body = { balance }
})

router.post('/getStar', async ctx => {
  const index = ctx.request.body.index
  const stars = await sync.buildStarsForSync(index)
  ctx.body = {
    stars
  }
})

router.get('/genMnemonic', async ctx => {
  ctx.body = new HD().genMnemonic()
})

router.post('/mnemonicToSk', async ctx => {
  const mnemonic = ctx.request.body.mnemonic
  const hd = new HD()
  const seed = hd.getSeed(mnemonic)
  const sk = hd.genKeypair(0, seed).secretKey
  ctx.body = sk
})

router.post('/verifyMnemonic', async ctx => {
  const mnemonic = ctx.request.body.mnemonic
  const hd = new HD()
  ctx.body = hd.validateMnemonic(mnemonic)
})

module.exports = router
