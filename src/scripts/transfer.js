const ioClient = require('socket.io-client')

const [ src, dst, amount ] = process.argv.splice(2)

const sock = ioClient('http://localhost:' + src)

sock.emit('transfer', JSON.stringify({
    name: 'remote',
    data: {
        amount,
        to: dst
    }
}))




