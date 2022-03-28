import {HardhatRuntimeEnvironment} from 'hardhat/types';
import {DeployFunction} from 'hardhat-deploy/types';

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const {deployments, getNamedAccounts} = hre;
  const {deploy, read} = deployments;

  const TRUSTED_FORWARDER = await deployments.get('TRUSTED_FORWARDER');
  const AssetAttributesRegistry = await deployments.get(
    'PolygonAssetAttributesRegistry'
  );
  const {deployer, assetMinterAdmin} = await getNamedAccounts();
  const AssetERC1155 = await deployments.get('PolygonAssetERC1155');
  const AssetERC721 = await deployments.get('PolygonAssetERC721');

  const assetRegistryData = await read(
    'PolygonAssetAttributesRegistry',
    'getCatalystRegistry'
  );

  const commonQuantity = 1000;
  const rareQuantity = 100;
  const epicQuantity = 10;
  const legendaryQuantity = 1;
  const artQuantity = 1;
  const propQuantity = 10000;

  const assetQuantitiesByCatalystId = [
    commonQuantity,
    rareQuantity,
    epicQuantity,
    legendaryQuantity,
  ];
  const assetQuantitiesByTypeId = [artQuantity, propQuantity];

  await deploy(`PolygonAssetMinter`, {
    from: deployer,
    log: true,
    args: [
      AssetAttributesRegistry.address,
      AssetERC721.address,
      AssetERC1155.address,
      assetRegistryData,
      assetMinterAdmin,
      TRUSTED_FORWARDER.address,
      assetQuantitiesByCatalystId,
      assetQuantitiesByTypeId,
    ],
    contract: 'AssetMinter',
  });
};
export default func;
func.tags = ['PolygonAssetMinter', 'PolygonAssetMinter_deploy', 'L2'];
func.dependencies = [
  'PolygonAssetAttributesRegistry_deploy',
  'PolygonAsset_deploy',
  'TRUSTED_FORWARDER',
  'PolygonAssetERC1155_deploy',
  'PolygonAssetERC721',
];
