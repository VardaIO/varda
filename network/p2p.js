
// init
// init()
const models = require('../database/models')
const server = require('./server')
const client = require('./client')

const Peer = models.Peer


const addPeer = (ip, port) => {
    models.Peer.insert({ 'ip': ip, 'port': port }, (error) => {
        if (error) {
            console.log(error)
        }
    })
}

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