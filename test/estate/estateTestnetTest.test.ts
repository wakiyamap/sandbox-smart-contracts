import {setupEstate} from './fixtures';
import {expectEventWithArgs, waitFor} from '../utils';
import {expect} from '../chai-setup';
import {ethers} from 'hardhat';
import {supplyAssets} from '../Game/assets';
import {BigNumber, Contract} from 'ethers';
import {getNewGame} from './utils';
import {Address} from 'hardhat-deploy/types';

const emptyBytes = Buffer.from('');

type LandMintingData = {
  beneficiary: string;
  size: number;
  x: number;
  y: number;
};
async function mintLands(
  landContractAsMinter: Contract,
  mintingData: LandMintingData[]
): Promise<BigNumber[]> {
  const landIds: BigNumber[] = [];
  for (const data of mintingData) {
    const receipt = await waitFor(
      landContractAsMinter.mintQuad(
        data.beneficiary,
        data.size,
        data.x,
        data.y,
        emptyBytes
      )
    );
    const events = await expectEventWithArgs(
      landContractAsMinter,
      receipt,
      'Transfer'
    );
    const landId = events.args[2];
    landIds.push(landId);
  }
  return landIds;
}
async function mintGames(
  gameTokenContract: Contract,
  creator: Address,
  supplies: number[],
  nextId: number
): Promise<{gameIds: BigNumber[]; lastId: number}> {
  const gameIds: BigNumber[] = [];
  const assets = await supplyAssets(creator, supplies);
  for (let i = 0; i < assets.length; i++) {
    const gameId = await getNewGame(
      gameTokenContract,
      creator,
      creator,
      [assets[i]],
      [supplies[i]],
      i + nextId
    );
    gameIds.push(gameId);
  }
  return {gameIds, lastId: nextId + assets.length};
}
describe('EstateTestNet', function () {
  it.only('start and updateV2', async function () {
    const {
      estateContract,
      landContractAsMinter,
      landContractAsUser0,
      user0,
      gameToken,
      gameTokenAsUser0,
    } = await setupEstate();
    const uri =
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const mintingData: LandMintingData[] = [
      {beneficiary: user0, size: 1, x: 4, y: 12},
      {beneficiary: user0, size: 1, x: 5, y: 12},
      {beneficiary: user0, size: 1, x: 6, y: 12},
      {beneficiary: user0, size: 1, x: 7, y: 12},
      {beneficiary: user0, size: 1, x: 8, y: 12},
      {beneficiary: user0, size: 1, x: 9, y: 12},
    ];
    const landIds = await mintLands(landContractAsMinter, mintingData);
    const mintGameRes = await mintGames(
      gameToken,
      user0,
      [1, 1, 1, 1, 1, 1],
      0
    );
    let gameIds = mintGameRes.gameIds;
    gameIds = [
      gameIds[0],
      gameIds[1],
      gameIds[2],
      gameIds[3],
      gameIds[4],
      gameIds[5],
    ];

    for (let i = 0; i < landIds.length; i++) {
      await landContractAsUser0.approve(estateContract.address, landIds[i]);
      await gameTokenAsUser0.approve(estateContract.address, gameIds[i]);
    }
    //await gameTokenAsUser0.approve(estateContract.address, gameIds[0]);

    await waitFor(
      estateContract
        .connect(ethers.provider.getSigner(user0))
        .createEstate(user0, user0, {
          landIds: [landIds[0], landIds[1], landIds[2]],
          gameIds: [gameIds[0], gameIds[1], gameIds[2]],
          uri,
        })
    );

    const estateCreationEvents = await estateContract.queryFilter(
      estateContract.filters.EstateTokenUpdated()
    );
    const estateCreationEvent = estateCreationEvents.filter(
      (e) => e.event === 'EstateTokenUpdated'
    );
    expect(estateCreationEvent[0].args).not.be.equal(null);
    let estateId;
    if (estateCreationEvent[0].args) {
      expect(estateCreationEvent[0].args[2].gameIds).to.be.eql([
        gameIds[0],
        gameIds[1],
        gameIds[2],
      ]);
      expect(estateCreationEvent[0].args[2].landIds).to.be.eql([
        landIds[0],
        landIds[1],
        landIds[2],
      ]);
      expect(estateCreationEvent[0].args[2].uri).to.be.equal(uri);
      estateId = estateCreationEvent[0].args[1];
      const estateData = await estateContract.callStatic.getEstateData(
        estateId
      );
      expect(estateData.landIds).to.be.eql([
        landIds[0],
        landIds[1],
        landIds[2],
      ]);

      await waitFor(
        estateContract
          .connect(ethers.provider.getSigner(user0))
          .updateEstateV2(user0, user0, estateId, {
            landAndGameAssociationsToAdd: [
              [landIds[3], landIds[4], landIds[5]],
              [gameIds[3], gameIds[4], gameIds[5]],
            ],
            landAndGameAssociationsToRemove: [
              [landIds[0], landIds[1], landIds[2]],
              [gameIds[0], gameIds[1], gameIds[2]],
            ],
            gameIdsToReuse: [],
            landIdsToAdd: [landIds[3], landIds[4], landIds[5]],
            landIdsToRemove: [landIds[0], landIds[1], landIds[2]],
            uri,
          })
      );

      const estateCreationEvents2 = await estateContract.queryFilter(
        estateContract.filters.EstateTokenUpdatedII()
      );
      const estateCreationEvent2 = estateCreationEvents2.filter(
        (e) => e.event === 'EstateTokenUpdatedII'
      );

      if (estateCreationEvent2[0].args) {
        const newIdStr = estateCreationEvent2[0].args[1];
        const estateData2 = await estateContract.callStatic.getEstateData(
          newIdStr
        );
        console.log(estateData2.landIds);
      }
    }
  });
});
