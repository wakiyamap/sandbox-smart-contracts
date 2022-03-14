import {DeployFunction} from 'hardhat-deploy/types';
import {skipUnlessTest, skipUnlessTestnet} from '../../utils/network';

const func: DeployFunction = async function (hre) {
  const {deployments, getNamedAccounts} = hre;
  const {execute, read} = deployments;

  const {estateTokenAdmin} = await getNamedAccounts();

  const estateMinter = await deployments.get('EstateMinter');

  const currentMinter = await read('ChildEstateToken', 'getMinter');
  const isMinter = currentMinter == estateMinter.address;

  if (!isMinter) {
    await execute(
      'ChildEstateToken',
      {from: estateTokenAdmin, log: true},
      'changeMinter',
      estateMinter.address
    );
  }
};
export default func;
func.runAtTheEnd = true;
func.tags = ['ChildEstateToken', 'ChildEstateToken_setup'];
func.dependencies = ['ChildEstateToken_deploy', 'EstateMinter_deploy'];
// TODO: Setup deploy-polygon folder and network.
func.skip = skipUnlessTestnet; // TODO enable
