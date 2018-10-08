const io = require('socket.io')()
const portfinder = require('portfinder')
const ioClient = require('socket.io-client')
const { createInitialBlock, 
        newBlockFromLedger, 
        proofOfWork,
        checkLedger } = require('./blockchain')
const { randomNumb } = require('./util')
const { format } = require('date-fns')

let ledger = [
  createInitialBlock()
]

let balance = randomNumb(0, 100)
let votes = new Map()
let connectedNodes = new Map()

const logConnectedNodes = () => {
  let connPorts = []
  for(let [port, _] of connectedNodes.entries()) {
    connPorts.push(port)
  }

  console.log('[CONNECTION STATUS] Connected nodes: ' + connPorts.join(', '))
}

portfinder
    .getPortPromise()
    .then((port) => {
      console.log('Initializing Node on port: ' + port)
      io.on('connect', client => {
        console.log('Client connected')
        const host = client.handshake.headers.host
        const [ _, portStr ] = host.split(':')
        
        connectedNodes.set(portStr, client)
        logConnectedNodes()

        client.on('connect_to', (msg) => {
            const dst = JSON.parse(msg).data
            console.log('Connecting to ' + dst)
            const socket = ioClient("http://localhost:" + dst)
            
            socket.on('connect', () => {
              console.log('Connected ' + port + '->' + dst)
              connectedNodes.set(dst, socket)
              console.warn('Connected Nodes: ' + connectedNodes.size)

            })

            socket.on('declareLedger', (msg) => {
              const newLedger = [ ...ledger, JSON.stringify(msg) ]
              ledger = newLedger
              console.log('UPDATED LEDGER')
              console.warn('==== BLOCKCHAIN ====')
              console.warn(ledger)
              console.warn('==== ========== ====')
              console.warn('MY WALLET: ', balance)
              console.warn('==== ========== ====')
            })

            socket.on('disconnect', () => {
              connectedNodes.delete(dst)
            })
          })

          client.on('transfer', (msg) => {
            console.warn('Transfer ', msg)
            const { amount, to } = JSON.parse(msg).data
            // console.warn('Sending messages to nodes: ' + connectedNodes.length)
            
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
              if (checkLedger(possibleLedger)) {
              //if (true) {
                return possibleLedger
              }

              return false
            }

            const newLedger = resolveLedger()

            if (newLedger) {
              logConnectedNodes()
              connectedNodes.forEach((s) => {
                s.emit('declareLedger', JSON.stringify(newLedger))
                const newLedger = [ ...ledger, JSON.stringify(msg) ]
                ledger = newLedger
                console.log('UPDATED LEDGER')
                console.warn('==== BLOCKCHAIN ====')
                console.warn(ledger)
                console.warn('==== ========== ====')
                console.warn('MY WALLET: ', balance)
                console.warn('==== ========== ====')
              })
            }
          })

          client.on('declareLedger', (msg) => {
            console.log('CONNECTED: ' + connectedNodes.size)
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

            console.log('[PROOF OF WORK] Started proof of work ' + format(new Date(), 'mm:ss'))
            const [ nonce, hash ] = proofOfWork(block)
            
            console.log('[PROOF OF WORK] Client ' + port + ': Got it!')
            console.log('[PROOF OF WORK] Broadcast solution: ' + nonce)

            const completeBlock = Object.assign({}, block, { nonce, hash })
            const message = { completeBlock }

            connectedNodes.forEach(s => s.emit('newBlock', JSON.stringify(message)))
          })

          client.on('disconnect', () => {
            connectedNodes.delete(portStr)
          })
      })

      console.warn('==== BLOCKCHAIN ====')
      console.warn(ledger)
      console.warn('==== ========== ====')
      console.warn('MY WALLET: ', balance)
      console.warn('==== ========== ====')
      io.listen(port)
    })
