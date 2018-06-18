import csv
import argparse
import getpass
import math
import time

from web3 import Web3, HTTPProvider
from solc import compile_files

from utils import wait_for_tx

ADDRESSES_PER_TX = 125

w3 = Web3(HTTPProvider('https://rinkeby.infura.io/ukF8hAZE8Qa0fJIMRCRj'))


def get_token_instance(compiled_source, token_address):
    token_interface = compiled_source['../contracts/Opet_coin.sol:OpetToken']
    token_contract = w3.eth.contract(
        abi=token_interface['abi'],
        bytecode=token_interface['bin'])
    token_instance = token_contract(token_address)
    return token_instance


def deploy_contract(compiled_source, account):
    token_interface = compiled_source['../contracts/Opet_coin.sol:OpetToken']
    token_contract = w3.eth.contract(
        abi=token_interface['abi'],
        bytecode=token_interface['bin'])
    construct_txn = token_contract.constructor().buildTransaction({
        'from': account.address,
        'nonce': w3.eth.getTransactionCount(account.address),
        'gasPrice': w3.eth.gasPrice})

    signed = acct.signTransaction(construct_txn)
    tx_hash = w3.eth.sendRawTransaction(signed.rawTransaction)
    reciept = wait_for_tx(tx_hash, w3, wait_message="Wait for contract deploy")
    print(reciept['contractAddress'])

def add_address_to_whitelist(token_instance, account, address):
    transaction = token_instance.functions.addWhitelistedTransfer(
        address
    ).buildTransaction({'from': account.address,
                        'nonce': w3.eth.getTransactionCount(account.address),
                        'gasPrice': w3.eth.gasPrice})
    signed = account.signTransaction(transaction)
    tx_hash = w3.eth.sendRawTransaction(signed.rawTransaction)
    wait_for_tx(tx_hash, w3, wait_message='Wait for address to be added to whitelist')



ap = argparse.ArgumentParser()

ap.add_argument('command', type=str, choices=['deploy_token', 'whitelist_address'], help='Command to do')
ap.add_argument('--address', '-a', type=str, help='address to process')
ap.add_argument('--token', '-t', type=str, help='token address')

if __name__ == '__main__':
    args = vars(ap.parse_args())
    command = args['command']
    address = args['address']
    token_address = args['token']

    private_key = getpass.getpass('Private key:')
    acct = w3.eth.account.privateKeyToAccount(private_key)

    compiled_source = compile_files(["../contracts/Opet_coin.sol"], optimize=True)

    if command == 'deploy_token':
        deploy_contract(compiled_source, acct)
    elif command == 'whitelist_address':
        token_instance = get_token_instance(compiled_source, token_address)
        add_address_to_whitelist(token_instance, acct, address)
        print('Address added to whitelist')
