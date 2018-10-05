const ioClient = require('socket.io-client')

const [ src, dst, ..._ ] = process.argv.splice(2)

const sock = ioClient('http://localhost:' + src)

sock.emit('connect_to', JSON.stringify({ 
    name: 'remote',
    data: parseInt(dst),
}), () => {
    sock.close()
})



