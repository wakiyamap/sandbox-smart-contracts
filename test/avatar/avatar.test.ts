import {ethers} from 'hardhat';
import {expect} from 'chai';
import {solidityPack} from 'ethers/lib/utils';
import {addMinter, setupAvatarTest} from './fixtures';
import {cleanTestingEnvironment} from '../utils';

describe('Avatar.sol', function () {
  before(cleanTestingEnvironment);
  describe('initialization', function () {
    it('creation', async function () {
      const fixtures = await setupAvatarTest();
      expect(await fixtures.avatar.name()).to.be.equal(fixtures.name);
      expect(await fixtures.avatar.symbol()).to.be.equal(fixtures.symbol);
      expect(await fixtures.avatar.baseTokenURI()).to.be.equal(
        fixtures.baseUri
      );
    });

    it('interfaces', async function () {
      const fixtures = await setupAvatarTest();
      const interfaces = {
        IERC165: '0x01ffc9a7',
        IERC721: '0x80ac58cd',
        IERC721Metadata: '0x5b5e139f',
        IAccessControl: '0x7965db0b',
      };
      for (const i of Object.values(interfaces)) {
        expect(await fixtures.avatar.supportsInterface(i)).to.be.true;
      }
    });
  });
  describe('roles', function () {
    it('admin', async function () {
      const fixtures = await setupAvatarTest();
      const defaultAdminRole = await fixtures.avatar.DEFAULT_ADMIN_ROLE();
      expect(
        await fixtures.avatar.hasRole(defaultAdminRole, fixtures.adminRole)
      ).to.be.true;
      const storageChangerRole = await fixtures.avatar.STORAGE_CHANGER_ROLE();
      expect(
        await fixtures.avatar.hasRole(
          storageChangerRole,
          fixtures.storageChanger
        )
      ).to.be.true;
    });

    it('minter', async function () {
      const fixtures = await setupAvatarTest();
      const avatarAsMinter = await ethers.getContract(
        'Avatar',
        fixtures.minter
      );
      await expect(avatarAsMinter.mint(fixtures.other, 123)).to.revertedWith(
        'must have minter role'
      );
      await expect(fixtures.avatar.mint(fixtures.other, 123)).to.revertedWith(
        'must have minter role'
      );

      await addMinter(fixtures.adminRole, fixtures.avatar, fixtures.minter);
      const minterRole = await fixtures.avatar.MINTER_ROLE();
      expect(await fixtures.avatar.hasRole(minterRole, fixtures.minter)).to.be
        .true;
      await expect(fixtures.avatar.ownerOf(123)).to.revertedWith(
        'ERC721: owner query for nonexistent token'
      );
      await avatarAsMinter.mint(fixtures.other, 123);
      expect(await fixtures.avatar.ownerOf(123)).to.be.equal(fixtures.other);
      await expect(avatarAsMinter.mint(fixtures.other, 123)).to.revertedWith(
        'ERC721: token already minted'
      );
    });

    it('metaTX trusted forwarder', async function () {
      const fixtures = await setupAvatarTest();
      await addMinter(fixtures.adminRole, fixtures.avatar, fixtures.minter);
      // Regular transfer
      const avatarAsMinter = await ethers.getContract(
        'Avatar',
        fixtures.minter
      );
      await avatarAsMinter.mint(fixtures.other, 123);
      expect(await fixtures.avatar.ownerOf(123)).to.be.equal(fixtures.other);
      const avatarAsOther = await ethers.getContract('Avatar', fixtures.other);
      await avatarAsOther.transferFrom(fixtures.other, fixtures.dest, 123);
      expect(await fixtures.avatar.ownerOf(123)).to.be.equal(fixtures.dest);

      // MetaTX transfer
      await avatarAsMinter.mint(fixtures.other, 124);
      expect(await fixtures.avatar.ownerOf(124)).to.be.equal(fixtures.other);
      const avatarAsTrustedForwarder = await ethers.getContract(
        'Avatar',
        fixtures.trustedForwarder
      );
      const txData = await avatarAsTrustedForwarder.populateTransaction.transferFrom(
        fixtures.other,
        fixtures.dest,
        124
      );
      // The msg.sender goes at the end.
      txData.data = solidityPack(
        ['bytes', 'address'],
        [txData.data, fixtures.other]
      );
      await avatarAsTrustedForwarder.signer.sendTransaction(txData);
      expect(await fixtures.avatar.ownerOf(124)).to.be.equal(fixtures.dest);
    });
  });
});
