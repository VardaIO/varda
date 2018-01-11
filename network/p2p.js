
// init
// init()
const crypto = require('crypto')
const Cache = require('cache-base')
const _ = require('lodash')
const server = require('./server')
const client = require('./client')

const cache = new Cache()

const addPeer = (ip, port) => {
    const md5 = crypto.createHash('md5')
    md5.update(ip + port.toString())
    cache.set(md5.digest('hex'), { ip: ip, port: port });
}
addPeer('192.168.0.0.1', 23333)
addPeer('192.168.0.1', 23333)
// _.forIn(cache, (value, key) => {
//     console.log(value)
// })
console.log(cache)
// _.mapValues(cache, (e)=>console.log)
return
const peers = async () => {
    return new Promise((resolve, reject) => {
        Peer.find({}, (error, docs) => {
            if (error) {
                reject(error)
            } else {
                resolve(docs)
            }
        })
    })
}
const bootstrap = (peerList) => {
    // const ip = peerList[0].ip
    // const port = peerList[0].port
    // client.checkServerState(ip, port)
}

const init = async (peersList) => {
    server.run()
    bootstrap(peersList)
}
const peerList = [{ 'ip': '106.75.148.236', 'port': 50051 }]

init(peerList)
/*
// add peer
add()

//remove peer
remove()

// check peer state

check()

//send message

send()

*/