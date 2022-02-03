import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import {skipUnlessTest} from '../../utils/network';

const func: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const {deployments, getNamedAccounts} = hre;
  const {deployer, upgradeAdmin} = await getNamedAccounts();
  const {deploy} = deployments;

  const landContract = await deployments.get('MockLandWithMint');
  const gameToken = await deployments.get('ChildGameToken');
  const TRUSTED_FORWARDER = await deployments.get('TRUSTED_FORWARDER');
  const chainIndex = 1; // L2 (Polygon). Use 0 for Ethereum-Mainnet.
  await deploy('ChildEstateToken', {
    from: deployer,
    contract: 'ChildEstateTokenV1',
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
    log: true,
    skipIfAlreadyDeployed: true,
  });
};

export default func;
func.tags = ['ChildEstateToken', 'ChildEstateToken_deploy'];
func.dependencies = [
  'ChildGameToken_setup',
  'Land_deploy',
  'TRUSTED_FORWARDER',
  'MockLandWithMint_deploy',
];
func.skip = skipUnlessTest;
// TODO: Setup deploy-polygon folder and network.
