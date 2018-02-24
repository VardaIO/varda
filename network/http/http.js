const { values } = require('lodash')
const Koa = require('koa')
const app = new Koa()

const httpServer = node => {
  app.use(async (ctx, next) => {
    this.node = node
    await next()
  })

  app.use(async (ctx, next) => {
    this.node = node
    values(node.peerBook.getAll()).forEach(peer => {
      console.log(peer)
    })
    await next()
  })

  app.use(async ctx => {
    ctx.body = 'Hello World'
  })

  app.listen(3000)
  console.log('Http Server listening on port 3000')
  return Promise.resolve()
}

module.exports = httpServer
