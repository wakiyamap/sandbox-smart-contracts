import {
  deployments,
  ethers,
  getNamedAccounts,
  getUnnamedAccounts,
} from 'hardhat';
import {withSnapshot} from '../../utils';
import {BigNumberish, Contract} from 'ethers';
import ERC20Mock from '@openzeppelin/contracts-0.8/build/contracts/ERC20PresetMinterPauser.json';

const name = 'AVATARNAME';
const symbol = 'TSBAV';
const baseUri = 'http://api';
export const setupAvatarTest = withSnapshot([], async function () {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {deployer, upgradeAdmin} = await getNamedAccounts();
  const [
    childChainManager,
    trustedForwarder,
    adminRole,
    minter,
    other,
    dest,
    pauser,
  ] = await getUnnamedAccounts();
  await deployments.deploy('PolygonAvatar', {
    from: deployer,
    proxy: {
      owner: upgradeAdmin,
      proxyContract: 'OptimizedTransparentProxy',
      execute: {
        methodName: 'initialize',
        args: [name, symbol, baseUri, trustedForwarder, adminRole],
      },
    },
  });
  const polygonAvatar = await ethers.getContract('PolygonAvatar', deployer);
  const polygonAvatarAsAdmin = await ethers.getContract(
    'PolygonAvatar',
    adminRole
  );
  // Grant roles.
  const childChainManagerRole = await polygonAvatar.CHILD_MANAGER_ROLE();
  await polygonAvatarAsAdmin.grantRole(
    childChainManagerRole,
    childChainManager
  );
  const minterRole = await polygonAvatar.MINTER_ROLE();
  await polygonAvatarAsAdmin.grantRole(minterRole, minter);
  const polygonAvatarAsMinter = await ethers.getContract(
    'PolygonAvatar',
    minter
  );
  const polygonAvatarAsOther = await ethers.getContract('PolygonAvatar', other);
  const polygonAvatarAsTrustedForwarder = await ethers.getContract(
    'PolygonAvatar',
    trustedForwarder
  );
  const pauseRole = await polygonAvatar.PAUSE_ROLE();
  await polygonAvatarAsAdmin.grantRole(pauseRole, pauser);
  const polygonAvatarAsPauser = await ethers.getContract(
    'PolygonAvatar',
    pauser
  );

  return {
    childChainManager,
    childChainManagerRole,
    baseUri,
    symbol,
    name,
    polygonAvatar,
    polygonAvatarAsAdmin,
    polygonAvatarAsMinter,
    polygonAvatarAsOther,
    polygonAvatarAsPauser,
    deployer,
    upgradeAdmin,
    trustedForwarder,
    polygonAvatarAsTrustedForwarder,
    adminRole,
    minterRole,
    pauseRole,
    minter,
    pauser,
    other,
    dest,
  };
});

export const mintSandAndApprove = async function (
  sandToken: Contract,
  addr: string,
  amount: BigNumberish,
  spender: string
): Promise<void> {
  await sandToken.mint(addr, amount);
  const sandTokenAsOther = await ethers.getContract('SandMock', addr);
  await sandTokenAsOther.approve(spender, amount);
};

export const setupAvatarSaleTest = withSnapshot([], async function () {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const {deployer, upgradeAdmin} = await getNamedAccounts();
  const [
    trustedForwarder,
    adminRole,
    seller,
    signer,
    other,
    dest,
  ] = await getUnnamedAccounts();
  await deployments.deploy('SandMock', {
    from: deployer,
    contract: ERC20Mock,
    args: ['AToken', 'SAND'],
    proxy: false,
  });

  // Polygon avatar implements batch mint.
  await deployments.deploy('PolygonAvatar', {
    from: deployer,
    proxy: {
      owner: upgradeAdmin,
      proxyContract: 'OptimizedTransparentProxy',
      execute: {
        methodName: 'initialize',
        args: [name, symbol, baseUri, trustedForwarder, adminRole],
      },
    },
  });
  const avatarAsAdmin = await ethers.getContract('PolygonAvatar', adminRole);
  const sandToken = await ethers.getContract('SandMock', deployer);

  await deployments.deploy('PolygonAvatarSale', {
    from: deployer,
    proxy: {
      owner: upgradeAdmin,
      proxyContract: 'OptimizedTransparentProxy',
      execute: {
        methodName: 'initialize',
        args: [
          avatarAsAdmin.address,
          sandToken.address,
          trustedForwarder,
          adminRole,
        ],
      },
    },
  });
  const avatarSaleAsOther = await ethers.getContract(
    'PolygonAvatarSale',
    other
  );
  const avatarSaleAsAdmin = await ethers.getContract(
    'PolygonAvatarSale',
    adminRole
  );
  // Grant roles.
  const minter = await avatarAsAdmin.MINTER_ROLE();
  await avatarAsAdmin.grantRole(minter, avatarSaleAsAdmin.address);
  const signerRole = await avatarSaleAsAdmin.SIGNER_ROLE();
  await avatarSaleAsAdmin.grantRole(signerRole, signer);
  const sellerRole = await avatarSaleAsAdmin.SELLER_ROLE();
  await avatarSaleAsAdmin.grantRole(sellerRole, seller);
  return {
    avatarSaleAsOther,
    avatarSaleAsAdmin,
    avatarAsAdmin,
    sandToken,
    deployer,
    upgradeAdmin,
    trustedForwarder,
    adminRole,
    seller,
    signer,
    other,
    dest,
  };
});
