import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {skipUnlessTest, skipUnlessTestnet} from '../../utils/network';

const func: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const {deployments, getNamedAccounts} = hre;
  const {deployer, upgradeAdmin} = await getNamedAccounts();
  const {deploy} = deployments;

  const landContract = await deployments.get('PolygonLand');
  const gameToken = await deployments.get('ChildGameToken');

  /* if (hre.network.name === 'hardhat') {
    // workaround for tests
    landContract = await deployments.get('MockLandWithMint');
  } else {
    landContract = await deployments.get('PolygonLand');
  } */

  const TRUSTED_FORWARDER = await deployments.get('TRUSTED_FORWARDER');
  const chainIndex = 1; // L2 (Polygon). Use 0 for Ethereum-Mainnet.

  await deploy('ChildEstateToken', {
    from: deployer,
    contract: 'ChildEstateTokenV1',
    log: true,
    /*args: [
      TRUSTED_FORWARDER.address,
      landContract.address,
      gameToken.address,
      chainIndex,
    ],*/
    proxy: {
      owner: upgradeAdmin,
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        methodName: 'initV1',
        args: [
          TRUSTED_FORWARDER.address,
          landContract.address,
          gameToken.address,
          chainIndex,
        ],
      },
      upgradeIndex: 0,
    },
    skipIfAlreadyDeployed: true,
  });
};

export default func;
func.tags = ['ChildEstateToken', 'ChildEstateToken_deploy'];
func.dependencies = [
  //'MockLandWithMint_deploy',
  'ChildGameToken_setup',
  'PolygonLand_deploy',
  'TRUSTED_FORWARDER',
  'PolygonLand_deploy',
];
func.skip = skipUnlessTestnet;
// TODO: Setup deploy-polygon folder and network.
