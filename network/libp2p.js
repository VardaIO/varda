const PeerInfo = require('peer-info')
const Node = require('./node-bundle')

const config

function createNode(callback) {
    PeerInfo.create((err, peerInfo) => {
        if (err) {
            return callback(err)
        }
        // peerid 
        // peerInfo
        //  peerInfo add multiaddr
        const node = new Node(peerInfo, config)
        callback(null, node)
    })
}

