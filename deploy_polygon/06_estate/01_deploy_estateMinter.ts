import {DeployFunction} from 'hardhat-deploy/types';
import {skipUnlessTest, skipUnlessTestnet} from '../../utils/network';
import {estateMintingFee, estateUpdateFee} from '../../data/estateMinterFees';

const func: DeployFunction = async function (hre) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy} = deployments;
  const {
    deployer,
    estateTokenFeeBeneficiary,
    estateTokenAdmin,
  } = await getNamedAccounts();
  const ChildEstateToken = await deployments.get('ChildEstateToken');
  const sandContract = await deployments.get('PolygonSand');
  const TRUSTED_FORWARDER = await deployments.get('TRUSTED_FORWARDER');

  const chainIndex = 1;

  await deploy('EstateMinter', {
    from: deployer,
    log: true,
    args: [
      ChildEstateToken.address,
      TRUSTED_FORWARDER.address,
      estateTokenAdmin,
      estateMintingFee,
      estateUpdateFee,
      estateTokenFeeBeneficiary,
      sandContract.address,
      chainIndex,
    ],
    skipIfAlreadyDeployed: true,
  });
};

export default func;
func.tags = ['EstateMinter', 'EstateMinter_deploy'];
func.dependencies = [
  'ChildEstateToken_deploy',
  'PolygonSand_deploy',
  'TRUSTED_FORWARDER',
];
// TODO: Setup deploy-polygon folder and network.
func.skip = skipUnlessTestnet; // TODO enable
