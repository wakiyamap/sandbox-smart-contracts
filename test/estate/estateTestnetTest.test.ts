import {setupEstate} from './fixtures';
import {waitFor, expectEventWithArgsFromReceipt} from '../utils';
import {expect} from '../chai-setup';
import {ethers, deployments} from 'hardhat';
import {BigNumber} from 'ethers';
import ERC20Mock from '@openzeppelin/contracts-0.8/build/contracts/ERC20PresetMinterPauser.json';

describe.only('EstateTestNet', function () {
  it('start and update', async function () {
    const {
      estateContract,
      estateMinterContract,
      landContract,
      user0,
      gameToken,
      minter,
    } = await setupEstate();
    const uri =
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const bytes = '0x3333';

    //Minting Land
    await waitFor(
      landContract
        .connect(ethers.provider.getSigner(minter))
        .mintQuad(user0, 12, 0, 0, bytes)
    );

    //Minting games
    const minerAdd = await gameToken
      .connect(ethers.provider.getSigner(minter))
      .getMinter();

    const gameIds: BigNumber[] = [];

    for (let i = 0; i < 12; i++) {
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
            exactNumOfLandsRequired: 3,
          },
          user0,
          i
        );

      const event = await expectEventWithArgsFromReceipt(
        gameToken,
        receipt,
        'GameTokenUpdated'
      );
      gameIds.push(event.args[1]);
    }

    //Approving tokens
    await waitFor(
      landContract
        .connect(ethers.provider.getSigner(user0))
        .setApprovalForAllFor(user0, estateContract.address, true)
    );

    await waitFor(
      gameToken
        .connect(ethers.provider.getSigner(user0))
        .setApprovalForAllFor(user0, estateContract.address, true)
    );

    //deploying mock sand contract
    await deployments.deploy('SandMock', {
      from: user0,
      contract: ERC20Mock,
      args: ['AToken', 'SAND'],
      proxy: false,
    });

    //minting sand for user
    const sandToken = await ethers.getContract('SandMock', user0);
    await sandToken.mint(user0, 1000);

    //updating the sand address inside of estateMinter
    await waitFor(
      estateMinterContract
        .connect(ethers.provider.getSigner(user0))
        .updateSand(sandToken.address)
    );

    //Approving SAND for minter
    await waitFor(
      sandToken
        .connect(ethers.provider.getSigner(user0))
        .approve(estateMinterContract.address, 1000)
    );

    const accounts = await ethers.getSigners();

    //Backens signature
    let hashedData = ethers.utils.solidityKeccak256(
      ['bytes', 'bytes' /* , 'uint256' */],
      [
        ethers.utils.solidityPack(['uint[]'], [[0]]),
        ethers.utils.solidityPack(['uint[]'], [[0]]),
        //time,
      ]
    );
    let signature = await accounts[0].signMessage(
      ethers.utils.arrayify(hashedData)
    );

    //Estate minting
    await waitFor(
      estateMinterContract
        .connect(ethers.provider.getSigner(user0))
        .createEstate(
          {
            landIds: [0],
            gameIds: [0],
            uri,
          },
          signature /* , time */
        )
    );

    let estateCreationEvents = await estateContract.queryFilter(
      estateContract.filters.EstateTokenUpdated()
    );
    let estateCreationEvent = estateCreationEvents.filter(
      (e) => e.event === 'EstateTokenUpdated'
    );
    expect(estateCreationEvent[0].args).not.be.equal(null);

    let estateId;
    //Update part

    if (estateCreationEvent[0].args) {
      expect(estateCreationEvent[0].args[2].uri).to.be.equal(uri);
      estateId = estateCreationEvent[0].args[1];

      //generating new signature
      hashedData = ethers.utils.solidityKeccak256(
        ['uint256', 'bytes', 'bytes', 'bytes', 'bytes'],
        [
          estateId,
          ethers.utils.solidityPack(
            ['uint[]'],
            [
              [
                /* 0, 1 */
              ],
            ]
          ),
          ethers.utils.solidityPack(
            ['uint[]'],
            [
              [
                /* gameIds[1], gameIds[1] */
              ],
            ]
          ),
          ethers.utils.solidityPack(['uint[]'], [[0]]),
          ethers.utils.solidityPack(['uint[]'], [[0]]),
        ]
      );
      signature = await accounts[0].signMessage(
        ethers.utils.arrayify(hashedData)
      );

      //updating estate
      await waitFor(
        estateMinterContract
          .connect(ethers.provider.getSigner(user0))
          .updateEstate(
            estateId,
            {
              landAndGameAssociationsToAdd: [
                [
                  /* 0, 1 */
                ],
                [
                  /* gameIds[1], gameIds[1] */
                ],
              ],
              landAndGameAssociationsToRemove: [[0], [0]],
              landIdsToAdd: [
                /* 1 */
              ],
              landIdsToRemove: [0],
              gameIdsToAdd: [
                /* gameIds[1] */
              ],
              gameIdsToRemove: [],
              uri,
            },
            signature
          )
      );

      estateCreationEvents = await estateContract.queryFilter(
        estateContract.filters.EstateTokenUpdated()
      );
      estateCreationEvent = estateCreationEvents.filter(
        (e) => e.event === 'EstateTokenUpdated'
      );
      expect(estateCreationEvent[0].args).not.be.equal(null);

      if (estateCreationEvent[0].args) {
        //getters
        expect(estateCreationEvent[0].args[2].uri).to.be.equal(uri);
        estateId = estateCreationEvent[0].args[1];
        const landsFromEstate = await estateContract.getLands(estateId);
        console.log(landsFromEstate.toString());
        const gamesFromEstate = await estateContract.getGames(estateId);
        console.log(gamesFromEstate.toString());
        const landAndGames = await estateContract.getEstateData(estateId);
        console.log(landAndGames.toString());
      }
    }
  });
  it('transfer estate token and manipulation of g&l', async function () {
    const {
      estateContract,
      estateMinterContract,
      landContract,
      user0,
      user1,
      gameToken,
      minter,
    } = await setupEstate();
    const uri =
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const bytes = '0x3333';

    //minting lands
    await waitFor(
      landContract
        .connect(ethers.provider.getSigner(minter))
        .mintQuad(user0, 3, 0, 0, bytes)
    );

    //minting games
    const minerAdd = await gameToken
      .connect(ethers.provider.getSigner(minter))
      .getMinter();

    const gameIds: BigNumber[] = [];

    for (let i = 0; i < 3; i++) {
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
            exactNumOfLandsRequired: 3,
          },
          user0,
          i
        );

      const event = await expectEventWithArgsFromReceipt(
        gameToken,
        receipt,
        'GameTokenUpdated'
      );
      gameIds.push(event.args[1]);
    }
    //token approvals
    await waitFor(
      landContract
        .connect(ethers.provider.getSigner(user0))
        .setApprovalForAllFor(user0, estateContract.address, true)
    );

    await waitFor(
      gameToken
        .connect(ethers.provider.getSigner(user0))
        .setApprovalForAllFor(user0, estateContract.address, true)
    );

    //deploying fake sand
    await deployments.deploy('SandMock', {
      from: user0,
      contract: ERC20Mock,
      args: ['AToken', 'SAND'],
      proxy: false,
    });

    const sandToken = await ethers.getContract('SandMock', user0);

    let total = await sandToken.totalSupply();
    console.log(total.toString());

    await sandToken.mint(user0, 10000);

    total = await sandToken.totalSupply();
    console.log(total.toString());

    const balance = await sandToken.balanceOf(user0);
    console.log(balance.toString());

    await waitFor(
      estateMinterContract
        .connect(ethers.provider.getSigner(user0))
        .updateSand(sandToken.address)
    );

    //approving minter
    await waitFor(
      sandToken
        .connect(ethers.provider.getSigner(user0))
        .approve(estateMinterContract.address, 10000)
    );

    //generating signature
    const accounts = await ethers.getSigners();
    let hashedData = ethers.utils.solidityKeccak256(
      ['bytes', 'bytes'],
      [
        ethers.utils.solidityPack(['uint[]'], [[0]]),
        ethers.utils.solidityPack(['uint[]'], [[gameIds[0]]]),
      ]
    );
    let signature = await accounts[0].signMessage(
      ethers.utils.arrayify(hashedData)
    );

    //creation
    await waitFor(
      estateMinterContract
        .connect(ethers.provider.getSigner(user0))
        .createEstate(
          {
            landIds: [0],
            gameIds: [gameIds[0]],
            uri,
          },
          signature
        )
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
      expect(estateCreationEvent[0].args[2].uri).to.be.equal(uri);
      estateId = estateCreationEvent[0].args[1];

      //transfering estate
      await waitFor(
        estateContract
          .connect(ethers.provider.getSigner(user0))
          .transferFrom(user0, user1, estateId)
      );

      //verifying transfer
      const owner = await estateContract.ownerOf(estateId);
      expect(owner).to.be.eql(user1);

      //minting new lands for update
      await waitFor(
        landContract
          .connect(ethers.provider.getSigner(minter))
          .mintQuad(user1, 3, 12, 12, bytes)
      );

      //minting new games for update
      const gameIds2: BigNumber[] = [];
      for (let i = 0; i < 3; i++) {
        const receipt = await gameToken
          .connect(ethers.provider.getSigner(minerAdd))
          .createGame(
            user1,
            user1,
            {
              assetIdsToRemove: [],
              assetAmountsToRemove: [],
              assetIdsToAdd: [],
              assetAmountsToAdd: [],
              uri: uri,
              exactNumOfLandsRequired: 3,
            },
            user1,
            i
          );

        const event = await expectEventWithArgsFromReceipt(
          gameToken,
          receipt,
          'GameTokenUpdated'
        );
        gameIds2.push(event.args[1]);
      }

      //token approvals
      await waitFor(
        landContract
          .connect(ethers.provider.getSigner(user1))
          .setApprovalForAllFor(user1, estateContract.address, true)
      );

      await waitFor(
        gameToken
          .connect(ethers.provider.getSigner(user1))
          .setApprovalForAllFor(user1, estateContract.address, true)
      );

      //minting sand for new owner
      await sandToken.mint(user1, 10000);

      //new owner approving sand for update
      await waitFor(
        sandToken
          .connect(ethers.provider.getSigner(user1))
          .approve(estateMinterContract.address, 10000)
      );

      //generating update signature
      hashedData = ethers.utils.solidityKeccak256(
        ['uint256', 'bytes', 'bytes', 'bytes', 'bytes'],
        [
          estateId,
          ethers.utils.solidityPack(['uint[]'], [[4908, 4909]]),
          ethers.utils.solidityPack(['uint[]'], [[gameIds2[0], gameIds2[0]]]),
          ethers.utils.solidityPack(['uint[]'], [[0]]),
          ethers.utils.solidityPack(['uint[]'], [[gameIds[0]]]),
        ]
      );

      signature = await ethers.provider
        .getSigner(user0)
        .signMessage(ethers.utils.arrayify(hashedData));

      //update
      await waitFor(
        estateMinterContract
          .connect(ethers.provider.getSigner(user1))
          .updateEstate(
            estateId,
            {
              landAndGameAssociationsToAdd: [
                [4908, 4909],
                [gameIds2[0], gameIds2[0]],
              ],
              landAndGameAssociationsToRemove: [[0], [gameIds[0]]],
              landIdsToAdd: [4908, 4909],
              landIdsToRemove: [0],
              gameIdsToAdd: [gameIds2[0]],
              gameIdsToRemove: [gameIds[0]],
              uri,
            },
            signature
          )
      );

      //veryfing new owner have game and land retrieved
      const ownerLand = await landContract.ownerOf(0);
      expect(user1).to.be.equal(ownerLand);
      const ownerGame = await gameToken.ownerOf(gameIds[0]);
      expect(user1).to.be.equal(ownerGame);
    }
  });
  it('burn and retrieve tokens', async function () {
    const {
      estateContract,
      estateMinterContract,
      landContract,
      user0,
      gameToken,
      minter,
    } = await setupEstate();
    const uri =
      '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff';
    const bytes = '0x3333';

    //minting lands
    await waitFor(
      landContract
        .connect(ethers.provider.getSigner(minter))
        .mintQuad(user0, 12, 0, 0, bytes)
    );

    //mint games
    const minerAdd = await gameToken
      .connect(ethers.provider.getSigner(minter))
      .getMinter();

    const gameIds: BigNumber[] = [];

    for (let i = 0; i < 12; i++) {
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
            exactNumOfLandsRequired: 3,
          },
          user0,
          i
        );

      const event = await expectEventWithArgsFromReceipt(
        gameToken,
        receipt,
        'GameTokenUpdated'
      );
      gameIds.push(event.args[1]);
    }

    //token approvals
    await waitFor(
      landContract
        .connect(ethers.provider.getSigner(user0))
        .setApprovalForAllFor(user0, estateContract.address, true)
    );

    await waitFor(
      gameToken
        .connect(ethers.provider.getSigner(user0))
        .setApprovalForAllFor(user0, estateContract.address, true)
    );

    //deploying mock sand
    await deployments.deploy('SandMock', {
      from: user0,
      contract: ERC20Mock,
      args: ['AToken', 'SAND'],
      proxy: false,
    });

    //minting sand
    const sandToken = await ethers.getContract('SandMock', user0);
    await sandToken.mint(user0, 1000);

    await waitFor(
      estateMinterContract
        .connect(ethers.provider.getSigner(user0))
        .updateSand(sandToken.address)
    );

    //user approving sand to minter contract
    await waitFor(
      sandToken
        .connect(ethers.provider.getSigner(user0))
        .approve(estateMinterContract.address, 1000)
    );

    //generating signature
    const accounts = await ethers.getSigners();
    const hashedData = ethers.utils.solidityKeccak256(
      ['bytes', 'bytes'],
      [
        ethers.utils.solidityPack(['uint[]'], [[0, 1]]),
        ethers.utils.solidityPack(['uint[]'], [[gameIds[0], 0]]),
      ]
    );
    const signature = await accounts[0].signMessage(
      ethers.utils.arrayify(hashedData)
    );

    //creation
    await waitFor(
      estateMinterContract
        .connect(ethers.provider.getSigner(user0))
        .createEstate(
          {
            landIds: [0, 1],
            gameIds: [gameIds[0], 0],
            uri,
          },
          signature
        )
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
      expect(estateCreationEvent[0].args[2].uri).to.be.equal(uri);
      estateId = estateCreationEvent[0].args[1];

      let estateData = await estateContract.callStatic.getEstateData(estateId);

      //burning estate
      await waitFor(
        estateContract.connect(ethers.provider.getSigner(user0)).burn(estateId)
      );

      estateData = await estateContract.callStatic.getEstateData(estateId);

      //transfering from burned estate
      await waitFor(
        estateContract
          .connect(ethers.provider.getSigner(user0))
          .transferFromBurnedEstate(estateId, {
            landIds: [0, 1],
            gameIds: [gameIds[0]],
          })
      );

      //get burned estate data
      estateData = await estateContract.callStatic.getEstateData(estateId);
      //verify it is empty
      expect(estateData.gameIds).to.be.eql([]);
      expect(estateData.landIds).to.be.eql([]);
    }
  });

  it('generate signatures', async function () {
    //generating signature
    const accounts = await ethers.getSigners();
    let hashedData = ethers.utils.solidityKeccak256(
      ['bytes', 'bytes'],
      [
        ethers.utils.solidityPack(['uint[]'], [[87928]]),
        ethers.utils.solidityPack(['uint[]'], [[0]]),
      ]
    );
    let signature = await accounts[0].signMessage(
      ethers.utils.arrayify(hashedData)
    );
    console.log(signature);

    hashedData = ethers.utils.solidityKeccak256(
      ['uint256', 'bytes', 'bytes', 'bytes', 'bytes'],
      [
        12 /* estateId */,
        ethers.utils.solidityPack(['uint[]'], [[87928, 87927]]),
        ethers.utils.solidityPack(
          ['uint[]'],
          [
            [
              '43211865504944649743896590944276400778226798953295943020015370297108636696577',
              '43211865504944649743896590944276400778226798953295943020015370297108636696577',
            ],
          ]
        ),
        ethers.utils.solidityPack(['uint[]'], [[87928]]),
        ethers.utils.solidityPack(['uint[]'], [[0]]),
      ]
    );
    signature = await accounts[0].signMessage(
      ethers.utils.arrayify(hashedData)
    );

    console.log(signature);
  });
});
