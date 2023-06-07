# WNCG Staking Rewards

How to setup dev environment

```
$ node --version
v16.15.0
```

1. Create `.env` file with these keys
```shell
INFURA_API_KEY=     # infura api key
ETHERSCAN_API_KEY=  # ether scan api key
PRI_KEY=            # private key of your metamask
```

2. Install npm packages
```shell
# Install npm packages
npm i
```

3. Compile contracts
```shell
# Compile
npx hardhat compile
```

4. run unit test and coverage report
```shell
npx hardhat test
npx hardhat coverage
```

