import {BigNumber} from 'ethers';
import {toWei} from '../../test/utils';
import {avatarSaleSignature} from '../../test/common/signatures';
import {ethers, getNamedAccounts} from 'hardhat';
import {getArgParser} from '../utils/utils';
import {ifNotMumbaiThrow} from '../utils/matic';

async function main() {
  ifNotMumbaiThrow();

  const backendPk = process.env.BACKEND_PK;
  if (!backendPk) {
    throw new Error(`Set the env var BACKEND_PK`);
  }
  const pk = process.env.USER_PK;
  if (!pk) {
    throw new Error(`Set the env var USER_PK`);
  }
  const parser = getArgParser({
    description: `RUN WITH: yarn execute mumbai ${process.argv[0]}`,
  });
  parser.addArgument(['token'], {help: 'token id'});
  parser.addArgument(['price'], {help: 'price', defaultValue: '5'});
  const processArgs = parser.parseArgs();

  const backendAuthEtherWallet = new ethers.Wallet(backendPk);
  const wallet = new ethers.Wallet(pk, ethers.provider);
  const tokenId = BigNumber.from(processArgs.token);
  const price = toWei(processArgs.price);
  const {sandboxAccount} = await getNamedAccounts();

  const avatarSaleContract = await ethers.getContract(
    'PolygonAvatarSale',
    wallet
  );

  const {v, r, s} = await avatarSaleSignature(
    avatarSaleContract,
    backendAuthEtherWallet.address,
    wallet.address,
    tokenId,
    sandboxAccount,
    price,
    backendAuthEtherWallet.privateKey
  );
  console.log({
    signer: backendAuthEtherWallet.address,
    buyer: wallet.address,
    tokenId: tokenId.toHexString(),
    seller: sandboxAccount,
    price,
    signature: {v, r, s},
  });
}

if (require.main === module) {
  main().catch((err) => console.error(err.message));
}
