const io = require('socket.io')()
const portfinder = require('portfinder')
const ioClient = require('socket.io-client')
const { createInitialBlock, 
        newBlockFromLedger, 
        proofOfWork } = require('./blockchain')
const { randomNumb } = require('./util')
const { format } = require('date-fns')

let ledger = [
    createInitialBlock()
]

let balance = randomNumb(0, 100)
let votes = new Map()
let connectedNodes = []

portfinder
    .getPortPromise()
    .then((port) => {
        console.log('Initializing Node on port: ' + port)
        io.on('connect', client => {
            console.log('Client connected')
            const host = client.handshake.headers.host
            const [ _, portStr ] = host.split(':')

            if (parseInt(portStr) !== port) {
              connectedNodes.push(client)
              console.warn('Connected Nodes: ' + connectedNodes.length)
            }

            client.on('connect_to', (msg) => {
                const dst = JSON.parse(msg).data
                console.log('Connecting to ' + dst)
                const socket = ioClient("http://localhost:" + dst)
                
                socket.on('connect', () => {
                  console.log('Connected ' + port + '->' + dst)
                  connectedNodes.push(socket)
                  console.warn('Connected Nodes: ' + connectedNodes.length)

                })            
            })

            client.on('transfer', (msg) => {
                console.warn('Transfer ', msg)
                const { amount, to } = JSON.parse(msg).data
                console.warn('Sending messages to nodes: ' + connectedNodes.length)
                
                connectedNodes.forEach(s => s.emit('mine', JSON.stringify({
                  data: {
                    from: port,
                    to,
                    amount
                  }
                })))
            })

            client.on('newBlock', (msg) => {
              votes = new Map()
              console.warn('[NEW BLOCK] new block ', msg)
              const { completeBlock } = JSON.parse(msg)
              const resolveLedger = () => {
                const possibleLedger = [...ledger, completeBlock]
                if (true) {
                  return completeBlock.nonce
                }
              }

              console.log(client.server.clients())
              connectedNodes.forEach(s => s.emit('declareLedger', JSON.stringify(resolveLedger)))
            })

            client.on('declareLedger', (msg) => {
              if (votes.length === connectedNodes.length) {
                console.warn(votes)
              }

              votes.set(msg.data, (votes.get(msg.data) || 0) + 1)
            })

            client.on('mine', (msg) => {
                const { from, amount, to } = JSON.parse(msg).data

                const block = Object.assign({}, newBlockFromLedger(ledger), { 
                    data: { type: 'transfer', from, amount, to }
                })

                console.log('[PROOF OF WORK] Started proof of work ' + format(new Date(), 'mm:SS'))
                const [ nonce, hash ] = proofOfWork(block)
                
                console.log('[PROOF OF WORK] Client ' + port + ': Got it!')
                console.log('[PROOF OF WORK] Broadcast solution: ' + nonce)

                const completeBlock = Object.assign({}, block, { nonce, hash })
                const message = { completeBlock }

                connectedNodes.forEach(s => s.emit('newBlock', JSON.stringify(message)))
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
