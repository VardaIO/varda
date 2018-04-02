// const cp = require('child_process');
const spawn = require('child_process').spawn

class Container {
  constructor(path) {
      this.path = path
  }

  newContainer() {
    let container = spawn('node', [`${this.path}/index.js`], {
      stdio: ['inherit', 'inherit', 'inherit', 'ipc']
    })

    container.on('message', message => {
      console.log('father client receive message ', message)
    })

    container.send({ hello: 'world' })
  }
}

let c = new Container(`${require('app-root-path')}/Dapps/test`)
c.newContainer()
