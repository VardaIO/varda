const Koa = require('koa')
const app = new Koa()
const appRoot = require('app-root-path')
const  route = require('koa-route')
const compose = require('koa-compose')
const bodyparser = require('koa-bodyparser')
const json = require('koa-json')
const Wallet = require(`${appRoot}/components/wallet`)
const wallet = new Wallet()
const fs = require('fs')
const pb = require('protocol-buffers')
const starProto = pb(fs.readFileSync(`${appRoot}/network/protos/star.proto`))

const httpServer = node => {
  app.use(async (ctx, next) => {
    this.node = node
    await next()
  })

  app.use(bodyparser({
    enableTypes:['json']
  }))
  app.use(json())

  app.use(async (ctx, next) => {
    const start = new Date()
    await next()
    const ms = new Date() - start
    console.log(`${ctx.method} ${ctx.url} - ${ms}ms`)
  })

  // app.use(async ctx => {
  //   console.log(this)
  //   ctx.body = 'Hello World'
  // })
  const index = route.get('/', ctx => {
    console.log(this)
    ctx.response.body = 'Hello World'
  })

  const p = route.post('/p', async ctx => {
    const request = ctx.request.body
    // let id = request.id || 0
    const sk = request.sk
    const to = request.to
    const amount = request.amount 
    let star = await wallet.pay(to, amount, sk)
    node.pubsub.publish('sendStar', Buffer.from(star.toString('hex')), (error) => {
        if (error) {
          return Promise.reject(error)
        }
      })
    ctx.body = starProto.star.decode(star)
  })

  const middlewares = compose([index, p])
  app.use(middlewares)

  // app.use(router.routes(), router.allowedMethods())
  app.listen(3000)
  console.log('Http Server listening on port 3000')

  return Promise.resolve()
}

// httpServer()
module.exports = httpServer
