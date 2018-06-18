# Scripts instruction

## Requirements

Use python3 (tested with python3.6).

Install necessary packages with
```
pip3 install -r requirements.txt
```

The `solc` compiler is required. Install it with:

```
sudo add-apt-repository ppa:ethereum/ethereum
sudo apt-get update
sudo apt-get install solc
```


## Deploy contract

To deploy contract run this script

```
python3 manage.py deploy_token
```

It will request the private key to sign the transactions with the silent command prompt.

Then wait till script will be deployed. After that the script will show the
address of the created contract.

Example:
```
python manage.py deploy_token
Private key:
Wait for contract deploy
Wait for contract deploy
Wait for contract deploy
Wait for contract deploy
Wait for contract deploy
Wait for contract deploy
0xb80ecAc8BD237eEd01E2333abe522f3Db6E44F53
```

## Add address to transfer whitelist

To add address to token's transfer whitelist run a command:

```
python3 manage.py -t /token_address/ -a /address should be added/ whitelist_address
```