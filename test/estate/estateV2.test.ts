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
  supplies: number[],
  nextId: number
): Promise<any> {
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
    const {gameIds} = await mintGames(gameToken, user0, [1], 0);

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
    const {gameIds} = await mintGames(gameToken, user0, [1, 1], 0);

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
    const {gameIds} = await mintGames(gameToken, user0, [1, 1], 0);

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

  it('adding non-adjacent lands to an existing estate should fail', async function () {
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
    const {gameIds} = await mintGames(gameToken, user0, [1, 1], 0);

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
      {beneficiary: user0, size: 1, x: 12, y: 12},
      {beneficiary: user0, size: 1, x: 4, y: 12},
    ];
    const landIdsToAdd = await mintLands(landContractAsMinter, mintingData2);

    for (let i = 0; i < landIds.length; i++) {
      await landContractAsUser0.approve(
        estateContract.address,
        landIdsToAdd[i]
      );
    }

    await expect(
      estateContract
        .connect(ethers.provider.getSigner(user0))
        .addLandsToEstate(user0, user0, estateId, {
          landIds: landIdsToAdd,
          gameIds: [0, 0],
          uri,
        })
    ).to.be.revertedWith('LANDS_ARE_NOT_ADJACENT');
  });
  it('adding lands without games to an existing estate with lands and games', async function () {
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
    const {gameIds} = await mintGames(gameToken, user0, [1, 1], 0);

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
    let newId;
    if (event.args[0]) {
      newId = event.args[1].toHexString();
      const newVersion = Number(newId.substring(62));
      const oldVersion = Number(estateId.toHexString().substring(62));
      expect(newVersion).to.be.equal(oldVersion + 1);
    }
    const newEstateData = await estateContract.callStatic.getEstateData(newId);
    const mergedGames = [
      ...gameIds,
      ...[BigNumber.from('0'), BigNumber.from('0')],
    ];
    const mergedLands = [...landIds, ...landIdsToAdd];
    expect(newEstateData.gameIds).to.be.eql(mergedGames);
    expect(newEstateData.landIds).to.be.eql(mergedLands);
  });
  it('adding lands with games to an existing estate with lands and games', async function () {
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
    const mintGamesRes = await mintGames(gameToken, user0, [1, 1], 0);
    const {gameIds} = mintGamesRes;
    const lastId = mintGamesRes.lastId;

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
    let gameIdsToAdd = await mintGames(gameToken, user0, [1, 1], lastId);
    gameIdsToAdd = gameIdsToAdd.gameIds;

    for (let i = 0; i < landIdsToAdd.length; i++) {
      await landContractAsUser0.approve(
        estateContract.address,
        landIdsToAdd[i]
      );
      await gameTokenAsUser0.approve(estateContract.address, gameIdsToAdd[i]);
    }

    const receipt2 = await waitFor(
      estateContract
        .connect(ethers.provider.getSigner(user0))
        .addLandsToEstate(user0, user0, estateId, {
          landIds: landIdsToAdd,
          gameIds: gameIdsToAdd,
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
  it('removing lands from an existing estate with lands and games', async function () {
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
    const mintGamesRes = await mintGames(gameToken, user0, [1, 1], 0);
    const {gameIds} = mintGamesRes;

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

    const landIdsToRemove = [landIds[0]];

    const receipt2 = await waitFor(
      estateContract
        .connect(ethers.provider.getSigner(user0))
        .removeLandsFromEstate(user0, estateId, {
          landIds: landIdsToRemove,
          gameIds: [],
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
      const newEstateData = await estateContract.callStatic.getEstateData(
        newId
      );
      expect(newEstateData.gameIds).to.be.eql([gameIds[1]]);
      expect(newEstateData.landIds).to.be.eql([landIds[1]]);
    }
  });
  it('removing lands that break adjacency should fail', async function () {
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
      {beneficiary: user0, size: 1, x: 4, y: 12},
    ];
    const landIds = await mintLands(landContractAsMinter, mintingData);
    const mintGamesRes = await mintGames(gameToken, user0, [1, 1, 1], 0);
    const {gameIds} = mintGamesRes;

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
    const landIdsToRemove = [landIds[1]];
    await expect(
      estateContract
        .connect(ethers.provider.getSigner(user0))
        .removeLandsFromEstate(user0, estateId, {
          landIds: landIdsToRemove,
          gameIds: [],
          uri,
        })
    ).to.be.revertedWith('LANDS_ARE_NOT_ADJACENT');
  });

  it('removing land that are associated with a game associated with more lands should fail', async function () {
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
      {beneficiary: user0, size: 1, x: 5, y: 12},
      {beneficiary: user0, size: 1, x: 4, y: 12},
    ];
    const landIds = await mintLands(landContractAsMinter, mintingData);
    const {gameIds} = await mintGames(gameToken, user0, [1], 0);
    gameIds.push(...gameIds);

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
    const landIdsToRemove = [landIds[1]];
    await expect(
      estateContract
        .connect(ethers.provider.getSigner(user0))
        .removeLandsFromEstate(user0, estateId, {
          landIds: landIdsToRemove,
          gameIds: [],
          uri,
        })
    ).to.be.revertedWith('GAME_IS_ATTACHED_TO_OTHER_LANDS');
  });

  it('removing all lands associated with a single game', async function () {
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
      {beneficiary: user0, size: 1, x: 5, y: 12},
      {beneficiary: user0, size: 1, x: 4, y: 12},
      {beneficiary: user0, size: 1, x: 6, y: 12},
    ];
    const landIds = await mintLands(landContractAsMinter, mintingData);
    let {gameIds} = await mintGames(gameToken, user0, [1], 0);
    gameIds = [gameIds[0], gameIds[0], gameIds[0]];

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
    const landIdsToRemove = landIds;
    const receipt2 = await estateContract
      .connect(ethers.provider.getSigner(user0))
      .removeLandsFromEstate(user0, estateId, {
        landIds: landIdsToRemove,
        gameIds: [],
        uri,
      });
    const event = await expectEventWithArgs(
      estateContract,
      receipt2,
      'EstateTokenUpdated'
    );
    expect(event.args).not.be.equal(null);
    let newId;
    if (event.args[0]) {
      newId = event.args[1].toHexString();
      const newEstateData = await estateContract.callStatic.getEstateData(
        newId
      );
      expect(newEstateData.gameIds).to.eql([]);
      expect(newEstateData.landIds).to.eql([]);
    }
  });
});
