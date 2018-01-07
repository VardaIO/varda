const Server = require('./lib/server').default
const path = require('path')

console.info('starting RPC Service')
const server = new Server('0.0.0.0', 50051)
server.autoRun(path.join(__dirname, './protosAndMethods'))