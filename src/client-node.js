const io = require('socket.io')()
const portfinder = require('portfinder')
const ioClient = require('socket.io-client')
const { createInitialBlock, 
        newBlockFromLedger, 
        proofOfWork } = require('./blockchain')
const { randomNumb } = require('./util')
const { format } = require('date-fns')

const ledger = [
    createInitialBlock()
]

let balance = randomNumb(0, 100)

portfinder
    .getPortPromise()
    .then((port) => {
        console.log('Initializing Node on port: ' + port)
        io.on('connect', client => {
            console.log('Client connected')
        
            client.on('connect_to', (msg) => {
                const dst = JSON.parse(msg).data
                console.log('Connecting to ' + dst)
                const socket = ioClient("http://localhost:" + dst)
    
                socket.on('connect', () => {
                    console.log('Connected ' + port + '->' + dst)
                })
            })

            client.on('transfer', (msg) => {
                const { amount, to } = JSON.parse(msg).data
                client.broadcast.emit('mine', JSON.stringify({ data: {
                    from: port,
                    to,
                    amount
                }}))
            })

            client.on('mine', (msg) => {
                const { from, amount, to } = JSON.parse(msg).data

                const block = Object.assign({}, newBlockFromLedger(ledger), { 
                    data: { type: 'transfer', from, amount, to }
                })

                console.log('Started proof of work ' + format(new Date(), 'mm:SS'))
                const [ nonce, hash ] = proofOfWork(block)
                
                console.log('[PROOF OF WORK] Client ' + port + ': Got it!')
                console.log('[PROOF OF WORK] Broadcast solution: ' + nonce)

            })

            client.on('disconnect', () => {
                console.log('Client disconnected')
            })
        })

        console.warn('==== BLOCKCHAIN ====')
        console.warn(ledger)
        console.warn('==== ========== ====')
        console.warn('MY WALLET: ', balance)
        console.warn('==== ========== ====')
        io.listen(port)
    })
