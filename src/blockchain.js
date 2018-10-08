const {sha256} = require('sha.js')

const initialBlock = {
    id: 1,
    nonce: 0,
    data: '',
    prev: '0000000000000000000000000000000000000000000000000000000000000000',
    hash: ''
}


const calcHash = (data, nonce) => new sha256().update(data + nonce.toString()).digest('hex')

const proofOfWork = (block) => {
    const solveData = (data) => {
        if (typeof data === 'object') {
            return JSON.stringify(data)
        }

        return data
    }

    for (let i = 0; i < 100000000; i++) {
        let hash = calcHash(block.prev + solveData, i)
        if (/^0000/.test(hash)) {
            return [i, hash]
        }
    }
}

const createInitialBlock = () => {
    const [ nonce, hash ] = proofOfWork(JSON.stringify(initialBlock))

    return Object.assign({}, initialBlock, { nonce, hash })
}

const newBlockFromLedger = (ledger) => {
    const id = ledger.length + 1
    const prev = ledger[ledger.length - 1].hash
    const nonce = 0
    const data = ''
    const hash = ''

    return {
        id,
        nonce, 
        data,
        prev,
        hash
    }
}


const checkLedger = ledger => {
    let altered = false
    console.log('Checkin Ledger >>> ', ledger)
    for (let i in ledger) {
        let hash = calcHash(ledger[i].prev + JSON.stringify(ledger[i].data), ledger[i].nonce)

        try {
            let hashNext = calcHash(
                hash + JSON.stringify(ledger[i + 1].data), 
                ledger[i + 1].nonce
            )

            if (!(ledger[i + 1].hash === hashNext) || altered) {
                altered = true
            }
            

        }
        catch (err) {
            console.warn(err)
        }

        return !altered
        
    }
}

module.exports = {
    createInitialBlock,
    proofOfWork,
    newBlockFromLedger,
    checkLedger
}