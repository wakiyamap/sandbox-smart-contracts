require('dotenv').config();
const {MaticPOSClient} = require('@maticnetwork/maticjs');
const Web3 = require('web3');

async function main() {
  const pk = process.env.USER_PK;
  if (!pk) {
    throw new Error('Set the USER_PK');
  }
  const from = new Web3().eth.accounts.privateKeyToAccount(pk).address;
  console.log('From addr:', from);
  // Create sdk instance
  const maticPOSClient = new MaticPOSClient({
    network: 'testnet', // For mainnet change this to mainnet
    version: 'mumbai', // For mainnet change this to v1
    parentDefaultOptions: {from},
    // maticDefaultOptions: {from: userAddress},
    maticProvider: new Web3.providers.HttpProvider(
      process.env.ETH_NODE_URI_MUMBAI
    ),
    parentProvider: new Web3.providers.HttpProvider(
      process.env.ETH_NODE_URI_GOERLI
    ),
  });
  maticPOSClient.setWallet(pk);
  const burnTxHash = process.argv[2]; //"0x8698e12b1e732615b1e3daf77dcf6df45c0d76b8cda7e868dabd845b3fb1cc6f";
  console.log('Calling exitERC721 for', burnTxHash);
  const tx = await maticPOSClient.exitERC721(burnTxHash);
  console.log(tx);
}

main().catch((err) => console.error(err));
