from hashlib import sha256

class Block(object):
    def __init__(self, id, nonce, data, prev, hash):
        self.id = id
        self.nonce = nonce
        self.data = data
        self.prev = prev
        self.hash = hash

    def __str__(self):
        return str({
            "nonce": self.nonce,
            "prev": self.prev,
            "hash": self.hash
        }) + '\n'

INITIAL_PREV = '0000000000000000000000000000000000000000000000000000000000000000'
PROBLEM = '0000'

def proof_of_work(data=''):
    hash = ''
    for n in range(0, 10000000000):
        hash = sha256((data + str(n)).encode('utf-8'))

        if hash.hexdigest().startswith(PROBLEM):
            return n, hash.hexdigest()

def add_block(prev_block, data):
    prev_block_data = prev_block.hash + data
    #print(prev_block_data)
    nonce, hash = proof_of_work(prev_block_data)

    return Block(id=prev_block.id + 1, nonce=nonce, 
        data=data, prev=prev_block.hash, hash=hash)


def check_blockchain(blockchain):
    altered = False
    for i, b in enumerate(blockchain):
        #print(b.prev + b.data + str(b.nonce))
        hash = sha256((b.prev + b.data + str(b.nonce)).encode('utf-8'))
        hash_hex = hash.hexdigest()
        #print(hash_hex)
        try:
            hash_next = sha256((hash_hex +
                blockchain[i + 1].data + str(blockchain[i + 1].nonce)).encode('utf-8'))
            hash_next_digest = hash_next.hexdigest()
            if not blockchain[ i + 1 ].hash == hash_next_digest or altered:
                print('Blockchain Alterada!! {} -> {}'.format(i, i + 1))
                altered = True
            else:
                print('Blockchain OK {} -> {}'.format(i, i + 1))
            continue
        except Exception as e: 
            print(e)
            continue

    #print('Blockchain OK')

nonce, hash = proof_of_work(INITIAL_PREV)

blockchain = [
    Block(id=1, nonce=nonce, data='', prev=INITIAL_PREV, hash=hash)
]

blockchain.append(add_block(blockchain[-1], ''))
blockchain.append(add_block(blockchain[-1], ''))
blockchain.append(add_block(blockchain[-1], ''))

print([ str(b) for b in blockchain ])

check_blockchain(blockchain)

blockchain[1] = Block(id=1, nonce=blockchain[1].nonce, data='asjdhjhas', prev=blockchain[1].prev, hash=blockchain[1].hash)

print(20 * '=')
check_blockchain(blockchain)
