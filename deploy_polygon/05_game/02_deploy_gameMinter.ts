import {DeployFunction} from 'hardhat-deploy/types';
import {skipUnlessTest, skipUnlessTestnet} from '../../utils/network';
import {gameMintingFee, gameUpdateFee} from '../../data/gameMinterFees';

const func: DeployFunction = async function (hre) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const {deployer, gameTokenFeeBeneficiary} = await getNamedAccounts();
  const childGameContract = await deployments.get('ChildGameToken');
  const sandContract = await deployments.get('PolygonSand');
  const TRUSTED_FORWARDER = await deployments.get('TRUSTED_FORWARDER');

  await deploy('GameMinter', {
    from: deployer,
    log: true,
    args: [
      childGameContract.address,
      TRUSTED_FORWARDER.address,
      gameMintingFee,
      gameUpdateFee,
      gameTokenFeeBeneficiary,
      sandContract.address,
    ],
    skipIfAlreadyDeployed: true,
  });
};

export default func;
func.tags = ['GameMinter', 'GameMinter_deploy'];
func.dependencies = [
  'ChildGameToken_deploy',
  'PolygonSand_deploy',
  'TRUSTED_FORWARDER',
];
// TODO: Setup deploy-polygon folder and network.
func.skip = skipUnlessTestnet; // TODO enable
