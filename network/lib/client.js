const rpc = require('grpc')
const fs = require('fs-extra')
const path = require('path')

class Client {
    constructor(ip, port) {
        Object.assign(this, { ip, port })
        this.services = {}
        this.clients = {}
    }
    autoRun(protoDir) {
        fs.readdir(protoDir).then(
            (files) => {
                return files.forEach((file) => {
                    const filePart = path.parse(file)
                    const serviceName = filePart.name
                    const packageName = filePart.name
                    const extName = filePart.ext
                    const filePath = path.join(protoDir, file)
                    if (extName === '.proto') {
                        const proto = rpc.load(filePath)
                        const Service = proto[packageName][serviceName]
                        this.services[serviceName] = Service
                        this.clients[serviceName] = new Service(`${this.ip}:${this.port}`,
                            rpc.credentials.createInsecure())
                    }
                }, files)
            }
        ).catch((err) => {
            console.error(err)
        })
    }

    async invoke(serviceName, name, params) {
        return new Promise((resolve, reject) => {

            function callback(error, response) {
                if (error) {
                    reject(error)
                } else {
                    resolve(response)
                }
            }
            // params can send message to server 
            // useage: {'name': 'varda'}
            params = params || {}
            if (this.clients[serviceName] && this.clients[serviceName][name]) {
                this.clients[serviceName][name](params, callback)
            } else {
                const error = new Error(`RPC endpoint: "${serviceName}.${name}" does not exists.`)
                reject(error)
            }
        })
    }
}

exports.default = Client

