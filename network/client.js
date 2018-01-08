const Client = require('./lib/client').default
const path = require('path')



// so check peers state is easy. send message to peer, 
// if can't get reply, this peer is offlline
exports.checkServerState = (ip, port) => {
    const meow = async () => {
        try {
            const client = new Client('106.75.148.236', 50051)
            client.autoRun(path.join(__dirname, './protosAndMethods'))
            const reply = await client.invoke('peerState', 'PingPong', { 'message': 'ping' })
            console.log(reply.message)
            setTimeout(meow, 5000)
        } catch (error) {
            /*
            /* todo: delete peer information in database
            */
            return
            console.log(error)
        }
    }
    setImmediate(meow)
}

