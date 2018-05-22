import time

def wait_for_tx(tx_hash, web3, delay=5, wait_message=None):
    while True:
        try:
            reciept = web3.eth.getTransactionReceipt(tx_hash)
            if reciept == None: raise Exception('Transaction still pending')
            break
        except:
            if wait_message:
                print(wait_message)
            time.sleep(delay)
            continue
    return reciept