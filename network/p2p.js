
// init
// init()
const models = require('../database/models')
const server = require('./server')

const Peer = models.Peer


const addPeer = (ip, port) => {
    models.Peer.insert({ 'ip': ip, port: port }, (error) => {
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

const init = (peersList) => {
    server.run()
}

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