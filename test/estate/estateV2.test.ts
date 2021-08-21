import {setupEstate} from './fixtures';
import {expectEventWithArgs, waitFor} from '../utils';
import {expect} from '../chai-setup';
import {ethers} from 'hardhat';
import {supplyAssets} from '../Game/assets';
import {BigNumber, Contract} from 'ethers';
import {getNewGame} from './utils';
import {Address} from 'hardhat-deploy/types';

const emptyBytes = Buffer.from('');
const GRID_SIZE = 408;

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
  supplies: number[]
): Promise<BigNumber[]> {
  const gameIds: BigNumber[] = [];
  const assets = await supplyAssets(creator, supplies);
  for (let i = 0; i < assets.length; i++) {
    const gameId = await getNewGame(
      gameTokenContract,
      creator,
      creator,
      [assets[i]],
      [supplies[i]],
      i
    );
    gameIds.push(gameId);
  }
  return gameIds;
}

// @todo: verify why _batchTransferFrom is owner == from only
describe('EstateV2', function () {
  it('create should fail on empty land array', async function () {
    const {estateContract, landContractAsMinter, user0} = await setupEstate();
    const size = 1;
    const x = 6;
    const y = 12;
    const uri =
      '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';

    await waitFor(landContractAsMinter.mintQuad(user0, size, x, y, emptyBytes));
    await expect(
      estateContract
        .connect(ethers.provider.getSigner(user0))
        .createEstate(user0, user0, {
          landIds: [],
          gameIds: [],
          uri,
        })
    ).to.be.revertedWith(`EMPTY_LAND_IDS_ARRAY`);
  });

  it('create should fail on different sizes for land, game arrays', async function () {
    const {estateContract, landContractAsMinter, user0} = await setupEstate();
    const size = 1;
    const x = 6;
    const y = 12;
    const uri =
      '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
    await waitFor(landContractAsMinter.mintQuad(user0, size, x, y, emptyBytes));
    const landMintingEvents = await landContractAsMinter.queryFilter(
      landContractAsMinter.filters.Transfer()
    );
    const event = landMintingEvents.filter((e) => e.event === 'Transfer')[0];
    const landId = event.args![2];
    await expect(
      estateContract
        .connect(ethers.provider.getSigner(user0))
        .createEstate(user0, user0, {
          landIds: [landId],
          gameIds: [],
          uri,
        })
    ).to.be.revertedWith(`DIFFERENT_LENGTH_LANDS_GAMES`);
  });

  it('create an estate with a single land and game', async function () {
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
      {beneficiary: user0, size: 1, x: 6, y: 12},
    ];
    const landIds = await mintLands(landContractAsMinter, mintingData);
    const gameIds = await mintGames(gameToken, user0, [1]);

    for (let i = 0; i < landIds.length; i++) {
      await landContractAsUser0.approve(estateContract.address, landIds[i]);
      await gameTokenAsUser0.approve(estateContract.address, gameIds[i]);
    }
    await waitFor(
      estateContract
        .connect(ethers.provider.getSigner(user0))
        .createEstate(user0, user0, {
          landIds: landIds,
          gameIds: gameIds,
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
    if (estateCreationEvent[0].args) {
      expect(estateCreationEvent[0].args[2].gameIds).to.be.eql(gameIds);
      expect(estateCreationEvent[0].args[2].landIds).to.be.eql(landIds);
      expect(estateCreationEvent[0].args[2].uri).to.be.equal(uri);
    }
  });

  it('create an estate with two lands and games', async function () {
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
      {beneficiary: user0, size: 1, x: 6, y: 12},
      {beneficiary: user0, size: 1, x: 5, y: 12},
    ];
    const landIds = await mintLands(landContractAsMinter, mintingData);
    const gameIds = await mintGames(gameToken, user0, [1, 1]);

    for (let i = 0; i < landIds.length; i++) {
      await landContractAsUser0.approve(estateContract.address, landIds[i]);
      await gameTokenAsUser0.approve(estateContract.address, gameIds[i]);
    }
    await waitFor(
      estateContract
        .connect(ethers.provider.getSigner(user0))
        .createEstate(user0, user0, {
          landIds: landIds,
          gameIds: gameIds,
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
    if (estateCreationEvent[0].args) {
      expect(estateCreationEvent[0].args[2].gameIds).to.be.eql(gameIds);
      expect(estateCreationEvent[0].args[2].landIds).to.be.eql(landIds);
      expect(estateCreationEvent[0].args[2].uri).to.be.equal(uri);
      const estateId = estateCreationEvent[0].args[1];
      const estateData = await estateContract.callStatic.getEstateData(
        estateId
      );
      expect(estateData.gameIds).to.be.eql(gameIds);
      expect(estateData.landIds).to.be.eql(landIds);
    }
  });

  it('create should fail for lands that are not adjacent', async function () {
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
      {beneficiary: user0, size: 1, x: 6, y: 12},
      {beneficiary: user0, size: 1, x: 8, y: 12},
    ];
    const landIds = await mintLands(landContractAsMinter, mintingData);
    const gameIds = await mintGames(gameToken, user0, [1, 1]);

    for (let i = 0; i < landIds.length; i++) {
      await landContractAsUser0.approve(estateContract.address, landIds[i]);
      await gameTokenAsUser0.approve(estateContract.address, gameIds[i]);
    }
    await expect(
      estateContract
        .connect(ethers.provider.getSigner(user0))
        .createEstate(user0, user0, {
          landIds: landIds,
          gameIds: gameIds,
          uri,
        })
    ).to.be.revertedWith('LANDS_ARE_NOT_ADJACENT');
  });

  it('adding lands to an existing estate with lands', async function () {
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
      {beneficiary: user0, size: 1, x: 6, y: 12},
      {beneficiary: user0, size: 1, x: 5, y: 12},
    ];
    const landIds = await mintLands(landContractAsMinter, mintingData);
    const gameIds = await mintGames(gameToken, user0, [1, 1]);

    for (let i = 0; i < landIds.length; i++) {
      await landContractAsUser0.approve(estateContract.address, landIds[i]);
      await gameTokenAsUser0.approve(estateContract.address, gameIds[i]);
    }

    await waitFor(
      estateContract
        .connect(ethers.provider.getSigner(user0))
        .createEstate(user0, user0, {
          landIds: landIds,
          gameIds: gameIds,
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
      expect(estateCreationEvent[0].args[2].gameIds).to.be.eql(gameIds);
      expect(estateCreationEvent[0].args[2].landIds).to.be.eql(landIds);
      expect(estateCreationEvent[0].args[2].uri).to.be.equal(uri);
      estateId = estateCreationEvent[0].args[1];
      const estateData = await estateContract.callStatic.getEstateData(
        estateId
      );
      expect(estateData.gameIds).to.be.eql(gameIds);
      expect(estateData.landIds).to.be.eql(landIds);
    }

    // mint and add new lands (w/o games) to the existing estate
    const mintingData2: LandMintingData[] = [
      {beneficiary: user0, size: 1, x: 7, y: 12},
      {beneficiary: user0, size: 1, x: 4, y: 12},
    ];
    const landIdsToAdd = await mintLands(landContractAsMinter, mintingData2);

    for (let i = 0; i < landIds.length; i++) {
      await landContractAsUser0.approve(
        estateContract.address,
        landIdsToAdd[i]
      );
    }

    const receipt2 = await waitFor(
      estateContract
        .connect(ethers.provider.getSigner(user0))
        .addLandsToEstate(user0, user0, estateId, {
          landIds: landIdsToAdd,
          gameIds: [0, 0],
          uri,
        })
    );

    const event = await expectEventWithArgs(
      estateContract,
      receipt2,
      'EstateTokenUpdated'
    );
    expect(event.args).not.be.equal(null);
    if (event.args[0]) {
      const newId = event.args[1].toHexString();
      const newVersion = Number(newId.substring(62));
      const oldVersion = Number(estateId.toHexString().substring(62));
      expect(newVersion).to.be.equal(oldVersion + 1);
    }
  });
});
