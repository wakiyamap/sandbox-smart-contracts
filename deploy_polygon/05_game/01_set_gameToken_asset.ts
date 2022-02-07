import {DeployFunction} from 'hardhat-deploy/types';
import {skipUnlessTest, skipUnlessTestnet} from '../../utils/network';

const func: DeployFunction = async function (hre) {
  const {deployments, getNamedAccounts} = hre;
  const {execute, read} = deployments;

  const {assetAdmin} = await getNamedAccounts();

  const gameToken = await deployments.getOrNull('ChildGameToken');
  if (!gameToken) {
    return;
  }

  const isSuperOperator = await read(
    'PolygonAsset',
    'isSuperOperator',
    gameToken.address
  );

  if (!isSuperOperator) {
    await execute(
      'PolygonAsset',
      {from: assetAdmin, log: true},
      'setSuperOperator',
      gameToken.address,
      true
    );
  }
};
export default func;
func.runAtTheEnd = true;
func.tags = ['ChildGameToken', 'ChildGameToken_setup'];
func.dependencies = ['PolygonAsset', 'ChildGameToken_deploy'];
// TODO: Setup deploy-polygon folder and network.
func.skip = skipUnlessTestnet; // TODO enable
