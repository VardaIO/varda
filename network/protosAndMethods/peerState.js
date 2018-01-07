const peerState = {
    //method like ping shoud same with method name in proto file service 
    PingPong: (call, callback) => {
        // get client ip
        console.log(call.getPeer())

        //get client message
        console.log(call.request.message)

        //send message to client
        callback(null, {message: 'pong'})
      }
}

exports.default = peerState
