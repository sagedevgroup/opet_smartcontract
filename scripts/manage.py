import csv
import argparse
import time
from datetime import datetime
import getpass
import math

from web3 import Web3, HTTPProvider
from solc import compile_files

from utils import CSV_ROWS, get_csv_file_row, wait_for_tx

ADDRESSES_PER_TX = 125

w3 = Web3(HTTPProvider('https://rinkeby.infura.io/ukF8hAZE8Qa0fJIMRCRj'))


def get_token_instance(compiled_source, token_address):
    token_interface = compiled_source['../contracts/Opet_coin.sol:OpetToken']
    token_contract = w3.eth.contract(
        abi=token_interface['abi'],
        bytecode=token_interface['bin'])
    token_instance = token_contract(token_address)
    return token_instance


def send_airdrop(token_instance, account, drop_file_path):
    with open(drop_file_path, 'r') as csv_file:
        addresses, amounts = list(zip(*csv.reader(csv_file)))
        addresses, amounts = list(addresses), list(amounts)
        amounts = [int(am) for am in amounts]

    number_of_iterarions = math.ceil(len(addresses) / ADDRESSES_PER_TX)
    with open('succesfuly_sent.csv', 'w') as csvfile:
        spamwriter = csv.writer(csvfile)
        spamwriter.writerow(['Address'])

        for i in range(number_of_iterarions):
            addresses_batch = addresses[i * ADDRESSES_PER_TX:(i + 1) * ADDRESSES_PER_TX]
            amounts_batch = amounts[i * ADDRESSES_PER_TX:(i + 1) * ADDRESSES_PER_TX]
            transaction = token_instance.functions.sendAirdrops(
                addresses_batch , amounts_batch
            ).buildTransaction({'from': account.address,
                                'nonce': w3.eth.getTransactionCount(account.address),
                                'gasPrice': w3.eth.gasPrice})
            signed=account.signTransaction(transaction)
            tx_hash = w3.eth.sendRawTransaction(signed.rawTransaction)
            wait_for_tx(tx_hash, w3, wait_message="Wait for airdrop send {}".format(i))
            spamwriter.writerow(addresses_batch)

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


ap = argparse.ArgumentParser()

ap.add_argument('command', type=str, choices=['send_airdrop', 'deploy_token'], help='Command to do')
ap.add_argument('--file', '-f', type=str, help='optional path to file')
ap.add_argument('--token', '-t', type=str, help='token address')

if __name__ == '__main__':
    args = vars(ap.parse_args())
    command = args['command']
    file_path = args['file']
    token_address = args['token']

    private_key = getpass.getpass('Private key:')
    acct = w3.eth.account.privateKeyToAccount(private_key)


    compiled_source = compile_files(["../contracts/Opet_coin.sol"], optimize=True)


    if command == 'send_airdrop':
        token_instance = get_token_instance(compiled_source, token_address)
        send_airdrop(token_instance, acct, file_path)
    elif command == 'deploy_token':
        deploy_contract(compiled_source, acct)
