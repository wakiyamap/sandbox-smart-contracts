import {setupEstate} from './fixtures';
import {
  expectEventWithArgs,
  waitFor,
  expectEventWithArgsFromReceipt,
} from '../utils';
import {expect} from '../chai-setup';
import {ethers} from 'hardhat';
import {supplyAssets} from '../Game/assets';
import {BigNumber, Contract} from 'ethers';
import {getNewGame} from './utils';
import {Address} from 'hardhat-deploy/types';

const emptyBytes = Buffer.from('');

describe('EstateTestNet', function () {
  it('start and updateV2', async function () {
    const {
      estateContract,
      landContract,
      landContractAsMinter,
      landContractAsUser0,
      user0,
      gameToken,
      gameTokenAsUser0,
      gameTokenAsAdmin,
      minter,
      gameTokenAsMinter,
    } = await setupEstate();
    const uri =
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const bytes = '0x3333';

    const mnemonic =
      'daughter enough rather length soon mad image repeat crisp tortoise float know';
    const mnemonicWallet = ethers.Wallet.fromMnemonic(mnemonic);
    console.log('private key:');
    console.log(mnemonicWallet.privateKey);

    console.log(user0);
    console.log(landContractAsMinter.address);

    await waitFor(
      landContract
        .connect(ethers.provider.getSigner(minter))
        .mintQuad(user0, 12, 0, 0, bytes)
    );

    await waitFor(
      landContract
        .connect(ethers.provider.getSigner(user0))
        .approve(estateContract.address, 0)
    );

    const minerAdd = await gameToken
      .connect(ethers.provider.getSigner(minter))
      .getMinter();

    console.log('game miner');
    console.log(minerAdd);
    console.log('add 0');
    console.log(gameTokenAsUser0.address);
    console.log('add 1');
    console.log(gameTokenAsMinter.address);
    console.log('add 2');
    console.log(minter);

    const receipt = await gameToken
      .connect(ethers.provider.getSigner(minerAdd))
      .createGame(
        user0,
        user0,
        {
          assetIdsToRemove: [],
          assetAmountsToRemove: [],
          assetIdsToAdd: [],
          assetAmountsToAdd: [],
          uri: uri,
          exactNumOfLandsRequired: 12,
        },
        user0,
        12
      );

    const event = await expectEventWithArgsFromReceipt(
      gameToken,
      receipt,
      'GameTokenUpdated'
    );

    const gameId = event.args[1];
    //console.log(event.args[1]);

    await waitFor(
      gameToken
        .connect(ethers.provider.getSigner(user0))
        .approve(estateContract.address, gameId)
    );

    await waitFor(
      estateContract
        .connect(ethers.provider.getSigner(user0))
        .createEstate(user0, user0, {
          landIds: [0],
          gameIds: [gameId],
          uri,
        })
    );
  });
});
