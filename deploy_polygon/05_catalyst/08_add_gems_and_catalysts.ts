import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';
import gems from '../../data/gems';
import catalysts from '../../data/catalysts';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {execute, read} = deployments;

  const catalystsToAdd = [];
  const gemsToAdd = [];

  const {deployer} = await getNamedAccounts();

  for (const catalyst of catalysts) {
    const doesCatalystExist = await read(
      `PolygonGemsCatalystsRegistry`,
      'doesCatalystExist',
      catalyst.catalystId
    );
    if (!doesCatalystExist) {
      const {address} = await deployments.get(
        `PolygonCatalyst_${catalyst.symbol}`
      );
      catalystsToAdd.push(address);
    }
  }

  for (const gem of gems) {
    const doesGemExist = await read(
      `PolygonGemsCatalystsRegistry`,
      'doesGemExist',
      gem.gemId
    );
    if (!doesGemExist) {
      const {address} = await deployments.get(`PolygonGem_${gem.symbol}`);
      gemsToAdd.push(address);
    }
  }

  await execute(
    'PolygonGemsCatalystsRegistry',
    {from: deployer, log: true},
    'addGemsAndCatalysts',
    gemsToAdd,
    catalystsToAdd
  );
};
export default func;
func.tags = [
  'PolygonGemsCatalystsRegistry',
  'PolygonGemsCatalystsRegistry_setup',
  'L2',
];
func.dependencies = [
  'PolygonGemsCatalystsRegistry_deploy',
  'PolygonCatalysts',
  'PolygonGems',
];
