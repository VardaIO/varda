// const cp = require('child_process');
const spawn = require('child_process').spawn
const Check = require('./check')
const DappPrepare = require('./dappPrepare')
// const Star = require('./api/stars')

/**
 * star,
 * account,
 * utils,
 * commission,
 * verify
 * db
 */

class Container {
  constructor(path) {
    this.path = path
    this.apis = [
      'star',
      'account',
      'broadcast',
      'sync',
      'commission',
      'db',
      'model',
      'utils'
    ]
    this.api = {
      star: require('./api/stars'),
      account: require('./api/account'),
      broadcast: require('./api/broadcast'),
      sync: require('./api/sync'),
      commission: require('./api/commission'),
      model: require('./api/model'),
      utils: require('./api/utils')
    }
  }

  _dealMessage(message) {
    return new Promise((resolve, reject) => {
      const apiName = message.api
      const methodName = message.method
      const args = message.args

      if (
        apiName === undefined ||
        methodName === undefined ||
        args === undefined
      ) {
        reject('message is wrong')
      }

      if (!this.apis.includes(apiName)) {
        reject(`the is no api named ${apiName}`)
      }
      const api = this.api[message.api]
      // console.log('api is ', api)
      const method = message.method
      // console.log('method is ', method)
      let a = new api()[method]()
      // console.log(new api().newAccount())
      console.log(a)
      // todo: check method
    })
  }

  async newContainer() {
    const check = new Check(this.path)
    const dappPrepare = new DappPrepare(this.path)
    const dbExist = await check.checkDb()
    console.log('lodaing dapp:', this.path)
    console.log('dbExist',dbExist)
    if (!dbExist) {
      await dappPrepare.prepareDbFile()
      await dappPrepare.prepareDb()
    }

    let container = spawn('node', [`${this.path}/index.js`], {
      stdio: ['inherit', 'inherit', 'inherit', 'ipc']
    })

    container.on('message', message => {
      /**
       * message style:
       *
       * {
       *  api: <api name>,
       *  method: <method name>,
       *  args: <method arg>
       * }
       */
      console.log('father client receive message ', message)
      this._dealMessage(message)
    })

    container.send({ hello: 'world' })
    return container
  }
}

module.exports = Container

// let c = new Container(`${require('app-root-path')}/Dapps/test`)
// c.newContainer()
// c._parseMessage({})
