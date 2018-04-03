import { resolve } from 'path'

// const cp = require('child_process');
const spawn = require('child_process').spawn

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
    this.apis = ['star', 'account', 'broadcast', 'sync', 'commission', 'db', 'model', 'utils']
    this.api = {
      star: require('./api/stars'),
      account: require('./api/account'),
      broadcast: require('./api/broadcast'),
      sync: require('./api/sync'),
      commission: require('./api/commission'),
      db: require('./api/db'),
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

      if(this.apis.indexOf(apiName) === -1) {
        reject(`the is no api named ${apiName}`)
      }

      // todo: check method
    })
  }

  newContainer() {
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
    })

    container.send({ hello: 'world' })
  }
}

let c = new Container(`${require('app-root-path')}/Dapps/test`)
// c.newContainer()
c._parseMessage({})
