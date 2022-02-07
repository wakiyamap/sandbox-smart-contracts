import {
  ethers,
  deployments,
  getUnnamedAccounts,
  getNamedAccounts,
} from 'hardhat';
import {EstateTestHelper} from './estateTestHelper';

export const setupEstate = deployments.createFixture(async function () {
  await deployments.fixture(['MockLandWithMint']);
  await deployments.fixture(['PolygonAsset']);
  await deployments.fixture(['ChildGameToken']);
  await deployments.fixture(['ChildEstateToken']);
  const {gameTokenAdmin} = await getNamedAccounts();
  const others = await getUnnamedAccounts();
  const minter = others[4];
  const user0 = others[0];
  const user1 = others[2];
  const asset = await ethers.getContract('PolygonAsset', minter);
  const gameToken = await ethers.getContract('ChildGameToken');
  const estateContract = await ethers.getContract('ChildEstateToken');
  const estateContractAsMinter = await ethers.getContract(
    'ChildEstateToken',
    minter
  );

  const landContract = await ethers.getContract('MockLandWithMint');
  //const landAdmin = await landContract.callStatic.getAdmin();

  const landContractAsUser0 = await landContract.connect(
    ethers.provider.getSigner(user0)
  );
  const landContractAsMinter = await landContract.connect(
    ethers.provider.getSigner(minter)
  );

  const gameTokenAsAdmin = await ethers.getContract(
    'ChildGameToken',
    gameTokenAdmin
  );
  const gameTokenAsUser0 = await gameToken.connect(
    ethers.provider.getSigner(minter)
  );

  const gameTokenAsMinter = await gameToken.connect(
    ethers.provider.getSigner(gameTokenAdmin)
  );

  /* await waitFor(
    landContract
      .connect(ethers.provider.getSigner(landAdmin))
      .setMinter(minter, true)
  );*/

  /*await waitFor(
    landContract
      .connect(ethers.provider.getSigner(landAdmin))
      .setSuperOperator(estateContract.address, true)
  );*/

  await gameTokenAsAdmin.changeMinter(gameTokenAdmin);
  return {
    estateContract,
    estateContractAsMinter,
    landContract,
    landContractAsMinter,
    landContractAsUser0,
    minter,
    user0,
    user1,
    gameToken,
    gameTokenAsUser0,
    gameTokenAsAdmin,
    asset,
    gameTokenAsMinter,
    // @note need to pass the mainnet Land contract to estateTestHelper for it to work
    helper: new EstateTestHelper({
      Estate: estateContractAsMinter,
      LandFromMinter: landContractAsMinter,
      Land: landContract,
    }),
  };
});
