const rpc = require('grpc')
const fs = require('fs')
const path = require('path')
const _ = require('lodash')

class Server {
    constructor(ip, port) {
        Object.assign(this, { ip, port })
        this.services = {}
        this.functions = {}
    }

    autoRun(protoDir) {
        fs.readdir(protoDir, (err, files) => {
            if(err) {
                return console.error(err)
            }
            files.forEach((file) => {
                const filePart = path.parse(file)
                const serviceName = filePart.name
                const packageName = filePart.name
                const extName = filePart.ext
                const filePath = path.join(protoDir, file)
                if (extName === '.js') {
                    const functions = require(filePath).default
                    this.functions[serviceName] = Object.assign({}, functions)
                } else if (extName === '.proto') {
                    this.services[serviceName] = rpc.load(filePath)[packageName][serviceName].service
                }
            }, files)
            return this.runServer()
        })
    }

    runServer() {
        const server = new rpc.Server()

        _.forEach(_.keys(this.services),(serviceName) => {
            const service = this.services[serviceName]
            server.addService(service, this.functions[serviceName])
        })
        server.bind(`${this.ip}:${this.port}`, rpc.ServerCredentials.createInsecure())
        server.start()
    }
}
 
exports.default = Server;