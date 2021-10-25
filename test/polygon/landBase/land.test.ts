import {expect} from '../../chai-setup';
import {ethers, getUnnamedAccounts} from 'hardhat';
import {Contract} from 'ethers';
import {setupUsers, waitFor, withSnapshot} from '../../utils';

type User = {
  address: string;
  MockLandWithMint: Contract;
};

const setupTest = withSnapshot(
  ['MockLandWithMint'],
  async (): Promise<{
    MockLandWithMint: Contract;
    landOwners: User[];
  }> => {
    const MockLandWithMint = await ethers.getContract('MockLandWithMint');
    const unnamedAccounts = await getUnnamedAccounts();
    const landOwners = await setupUsers(unnamedAccounts, {MockLandWithMint});
    return {MockLandWithMint, landOwners};
  }
);

describe('MockLandWithMint.sol', function () {
  describe('Mint and transfer full quad', function () {
    it('testing transferQuad', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          12,
          0,
          0,
          bytes
        )
      );

      const num = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[0].address
      );
      expect(num).to.equal(144);
      await waitFor(
        landOwners[0].MockLandWithMint.transferQuad(
          landOwners[0].address,
          landOwners[1].address,
          12,
          0,
          0,
          bytes
        )
      );
      const num1 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[0].address
      );
      expect(num1).to.equal(0);
      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(144);
    });
  });

  describe('Mint and transfer a smaller quad', function () {
    it('transfering a 3X3 quad from a 12x12', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';
      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          12,
          12,
          12,
          bytes
        )
      );
      const num = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[0].address
      );
      expect(num).to.equal(144);

      await waitFor(
        landOwners[0].MockLandWithMint.transferQuad(
          landOwners[0].address,
          landOwners[1].address,
          3,
          12,
          12,
          bytes
        )
      );

      const num1 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[0].address
      );

      expect(num1).to.equal(135);

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );

      expect(num2).to.equal(9);
    });
  });

  describe('Mint 1x1 and transfer it', function () {
    it('Mint and transfer 1x1', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          1,
          1,
          1,
          bytes
        )
      );
      const num = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[0].address
      );
      expect(num).to.equal(1);

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          1,
          2,
          1,
          bytes
        )
      );

      const num1 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[0].address
      );
      expect(num1).to.equal(2);

      await waitFor(
        landOwners[0].MockLandWithMint.transferQuad(
          landOwners[0].address,
          landOwners[1].address,
          1,
          1,
          1,
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[0].address
      );

      expect(num2).to.equal(1);

      const num3 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );

      expect(num3).to.equal(1);
    });
  });

  describe('Mint and transfer all its smaller quads', function () {
    it('transfering a 1X1 quad from a 3x3', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';
      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          3,
          3,
          3,
          bytes
        )
      );
      const num = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[0].address
      );
      expect(num).to.equal(9);

      for (let x = 3; x < 6; x++) {
        for (let y = 3; y < 6; y++) {
          await waitFor(
            landOwners[0].MockLandWithMint.transferQuad(
              landOwners[0].address,
              landOwners[1].address,
              1,
              x,
              y,
              bytes
            )
          );
        }
      }

      //landowner2 will burn all his land
      for (let x = 3; x < 6; x++) {
        for (let y = 3; y < 6; y++) {
          await waitFor(
            landOwners[1].MockLandWithMint.burn(
              0x0000000000000000000000000000000000000000000000000000000000000000 +
                (x + y * 408)
            )
          );
        }
      }

      const num1 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[0].address
      );

      expect(num1).to.equal(0);

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );

      expect(num2).to.equal(0);

      await expect(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          3,
          3,
          3,
          bytes
        )
      ).to.be.revertedWith('Already minted as 3x3');
    });
  });

  describe('transfer batch', function () {
    it('testing batchTransferQuad', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';
      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          24,
          0,
          0,
          bytes
        )
      );
      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          12,
          300,
          300,
          bytes
        )
      );
      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          6,
          30,
          30,
          bytes
        )
      );
      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          3,
          24,
          24,
          bytes
        )
      );
      await waitFor(
        landOwners[0].MockLandWithMint.batchTransferQuad(
          landOwners[0].address,
          landOwners[1].address,
          [24, 12, 6, 3],
          [0, 300, 30, 24],
          [0, 300, 30, 24],
          bytes
        )
      );
      const num1 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[0].address
      );
      expect(num1).to.equal(0);
      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(765);
    });
  });
  describe('Test for TRANSFER_ROLE', function () {
    it('input test with signatures', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';
      const transBytes = landOwners[0].MockLandWithMint.TRANSFER_ROLE();

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          24,
          0,
          0,
          bytes
        )
      );

      const arraySize = [1, 1];
      const arrayx = [1, 2];
      const arrayy = [1, 2];

      await landOwners[0].MockLandWithMint.setUpTranferRole(
        landOwners[3].address
      );
      const role = await landOwners[3].MockLandWithMint.hasRole(
        transBytes,
        landOwners[3].address
      );
      console.log('does it have role? ');
      console.log(role);

      await landOwners[3].MockLandWithMint.batchTransferQuad(
        landOwners[0].address,
        landOwners[1].address,
        arraySize,
        arrayx,
        arrayy,
        bytes
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(2);
    });
  });
});
