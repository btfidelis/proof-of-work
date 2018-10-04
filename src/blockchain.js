const {sha256} = require('sha.js')

const initialBlock = {
    id: 1,
    nonce: 0,
    data: '',
    prev: '0000000000000000000000000000000000000000000000000000000000000000',
    hash: ''
}


const calcHash = (data, nonce) => new sha256().update(data + nonce.toString()).digest('hex')

const proofOfWork = (blockData) => {
    for (let i = 0; i < 100000000; i++) {
        let hash = calcHash(blockData, i)
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

module.exports = {
    createInitialBlock,
    proofOfWork,
    newBlockFromLedger
}