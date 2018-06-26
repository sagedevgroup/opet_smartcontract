# Scripts instraction

## Requirements

Use python3 (tested with python3.6).

Install necessary packages with
```commandline
pip3 install -r requirements.txt
```

Also, the solc compiler is required. Install it with:

```commandline
sudo add-apt-repository ppa:ethereum/ethereum
sudo apt-get update
sudo apt-get install solc
```


## Deploy contract

To deploy contract run scrip
```commandline
python3 manage.py deploy_token
```
It will request the private key for tx sign with a silent command promt.

Then wait until script will be deployed. After that - the script shows an address of created contract.

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

## Run Airdrop

To run airdrop script use command:
```commandline
python3 manage.py -f /path_to_csv_file/ -t /token_address/ send_airdrop
```

Csv file should format of:

```
/address/,/amount of ether/
...
0x6635F83421Bf059cd8111f180f0727128685BaE4, 1
```

Amount of ether - should be number of sent tokens in weis.