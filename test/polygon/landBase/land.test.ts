import {expect} from '../../chai-setup';
import {ethers, deployments, getUnnamedAccounts} from 'hardhat';
import {Contract, BigNumber} from 'ethers';
import {setupUsers, waitFor} from '../../utils';
import {data712} from './data712';
import {splitSignature} from 'ethers/lib/utils';

type User = {
  address: string;
  MockLandWithMint: Contract;
};

const setupTest = deployments.createFixture(
  async (): Promise<{
    MockLandWithMint: Contract;
    landOwners: User[];
  }> => {
    await deployments.fixture('MockLandWithMint');
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

  describe('GasTest for single transfer', function () {
    it('testing transfering 10 lands', async function () {
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

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          3,
          3,
          3,
          bytes
        )
      );

      let gasTotal = BigNumber.from('0');

      for (let i = 3; i < 6; i++) {
        for (let j = 3; j < 6; j++) {
          const receipt = await waitFor(
            landOwners[0].MockLandWithMint.transferQuad(
              landOwners[0].address,
              landOwners[1].address,
              1,
              i,
              j,
              bytes
            )
          );
          gasTotal = gasTotal.add(receipt.gasUsed);
        }
      }

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.transferQuad(
          landOwners[0].address,
          landOwners[1].address,
          1,
          1,
          1,
          bytes
        )
      );
      gasTotal = gasTotal.add(receipt.gasUsed);
      console.log('GAS USED ' + gasTotal.toString()); //receipt.gasUsed.toString());
    });

    it('testing transfering 50 lands', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      for (let i = 1; i < 6; i++) {
        await waitFor(
          landOwners[0].MockLandWithMint.mintQuad(
            landOwners[0].address,
            1,
            i,
            i,
            bytes
          )
        );
      }

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          3,
          18,
          18,
          bytes
        )
      );

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          6,
          54,
          54,
          bytes
        )
      );

      let gasTotal = BigNumber.from('0');

      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          const receipt = await waitFor(
            landOwners[0].MockLandWithMint.transferQuad(
              landOwners[0].address,
              landOwners[1].address,
              1,
              54 + i,
              54 + j,
              bytes
            )
          );
          gasTotal = gasTotal.add(receipt.gasUsed);
        }
      }

      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          const receipt = await waitFor(
            landOwners[0].MockLandWithMint.transferQuad(
              landOwners[0].address,
              landOwners[1].address,
              1,
              18 + i,
              18 + j,
              bytes
            )
          );
          gasTotal = gasTotal.add(receipt.gasUsed);
        }
      }

      for (let i = 1; i < 6; i++) {
        const receipt = await waitFor(
          landOwners[0].MockLandWithMint.transferQuad(
            landOwners[0].address,
            landOwners[1].address,
            1,
            i,
            i,
            bytes
          )
        );
        gasTotal = gasTotal.add(receipt.gasUsed);
      }
      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(50);

      console.log('GAS USED ' + gasTotal.toString()); //receipt.gasUsed.toString());
    });

    it('testing transfering 100 lands', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      let gasTotal = BigNumber.from('0');

      for (let i = 1; i < 101; i++) {
        await waitFor(
          landOwners[0].MockLandWithMint.mintQuad(
            landOwners[0].address,
            1,
            i,
            i,
            bytes
          )
        );
      }

      for (let i = 1; i < 101; i++) {
        const receipt = await waitFor(
          landOwners[0].MockLandWithMint.transferQuad(
            landOwners[0].address,
            landOwners[1].address,
            1,
            i,
            i,
            bytes
          )
        );

        gasTotal = gasTotal.add(receipt.gasUsed);
      }
      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(100);
      console.log('GAS USED ' + gasTotal.toString()); //receipt.gasUsed.toString());
    });

    it('testing transfering 250 lands', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      let gasTotal = BigNumber.from('0');

      for (let i = 1; i < 251; i++) {
        await waitFor(
          landOwners[0].MockLandWithMint.mintQuad(
            landOwners[0].address,
            1,
            i,
            i,
            bytes
          )
        );
      }

      for (let i = 1; i < 251; i++) {
        const receipt = await waitFor(
          landOwners[0].MockLandWithMint.transferQuad(
            landOwners[0].address,
            landOwners[1].address,
            1,
            i,
            i,
            bytes
          )
        );

        gasTotal = gasTotal.add(receipt.gasUsed);
      }
      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(250);
      console.log('GAS USED ' + gasTotal.toString()); //receipt.gasUsed.toString());
    });

    it('testing transfering 576 lands', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      let gasTotal = BigNumber.from('0');

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          24,
          0,
          0,
          bytes
        )
      );

      for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 24; j++) {
          const receipt = await waitFor(
            landOwners[0].MockLandWithMint.transferQuad(
              landOwners[0].address,
              landOwners[1].address,
              1,
              i,
              j,
              bytes
            )
          );
          gasTotal = gasTotal.add(receipt.gasUsed);
        }
      }

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(576);
      console.log('GAS USED ' + gasTotal.toString()); //receipt.gasUsed.toString());
    });

    it('test transfering 576 lands with batchTransferFrom', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      const gasTotal = BigNumber.from('0');

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          24,
          0,
          0,
          bytes
        )
      );

      const array = [];

      for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 24; j++) {
          array.push(i + j * 408);
        }
      }
      //fails because the tokens were minted inside a 24x24 quad
      await expect(
        landOwners[0].MockLandWithMint.batchTransferFrom(
          landOwners[0].address,
          landOwners[1].address,
          array,
          bytes
        )
      ).to.be.revertedWith(`BATCHTRANSFERFROM_NOT_OWNER`);
    });
  });

  describe('GasTest for batch transfer', function () {
    it('transfering 1 lands', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      let gasTotal = BigNumber.from('0');

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          1,
          1,
          1,
          bytes
        )
      );

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.transferQuad(
          landOwners[0].address,
          landOwners[1].address,
          1,
          1,
          1,
          bytes
        )
      );

      gasTotal = gasTotal.add(receipt.gasUsed);

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(1);
      console.log('GAS USED for 1 transfer ' + gasTotal.toString()); //receipt.gasUsed.toString());
    });

    it('batch transfering 10 lands', async function () {
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

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          3,
          3,
          3,
          bytes
        )
      );

      let gasTotal = BigNumber.from('0');

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.batchTransferQuad(
          landOwners[0].address,
          landOwners[1].address,
          [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
          [1, 3, 3, 3, 4, 4, 4, 5, 5, 5],
          [1, 3, 4, 5, 3, 4, 5, 3, 4, 5],
          bytes
        )
      );

      gasTotal = gasTotal.add(receipt.gasUsed);
      console.log('GAS USED ' + gasTotal.toString()); //receipt.gasUsed.toString());
    });

    it('testing transfering 50 lands', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      for (let i = 1; i < 6; i++) {
        await waitFor(
          landOwners[0].MockLandWithMint.mintQuad(
            landOwners[0].address,
            1,
            i,
            i,
            bytes
          )
        );
      }

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          3,
          18,
          18,
          bytes
        )
      );

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          6,
          54,
          54,
          bytes
        )
      );
      const arraySize = [1, 1, 1, 1, 1];
      const arrayx = [1, 2, 3, 4, 5];
      const arrayy = [1, 2, 3, 4, 5];

      for (let i = 0; i < 6; i++) {
        for (let j = 0; j < 6; j++) {
          arraySize.push(1);
          arrayx.push(54 + i);
          arrayy.push(54 + j);
        }
      }

      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          arraySize.push(1);
          arrayx.push(18 + i);
          arrayy.push(18 + j);
        }
      }

      //const gasTotal = BigNumber.from('0');

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.batchTransferQuad(
          landOwners[0].address,
          landOwners[1].address,
          arraySize,
          arrayx,
          arrayy,
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(50);

      console.log('GAS USED ' + receipt.gasUsed.toString()); //receipt.gasUsed.toString());
    });

    it('batch transfering 50 lands not in quads', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      let gasTotal = BigNumber.from('0');

      for (let i = 1; i < 51; i++) {
        await waitFor(
          landOwners[0].MockLandWithMint.mintQuad(
            landOwners[0].address,
            1,
            i,
            i,
            bytes
          )
        );
      }

      const arraySize = [];
      const arrayx = [];
      const arrayy = [];

      for (let i = 1; i < 51; i++) {
        arraySize.push(1);
        arrayx.push(i);
        arrayy.push(i);
      }

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.batchTransferQuad(
          landOwners[0].address,
          landOwners[1].address,
          arraySize,
          arrayx,
          arrayy,
          bytes
        )
      );

      gasTotal = gasTotal.add(receipt.gasUsed);

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(50);
      console.log('GAS USED ' + gasTotal.toString()); //receipt.gasUsed.toString());
    });

    it('batch transfering 100 lands', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      let gasTotal = BigNumber.from('0');

      for (let i = 1; i < 101; i++) {
        await waitFor(
          landOwners[0].MockLandWithMint.mintQuad(
            landOwners[0].address,
            1,
            i,
            i,
            bytes
          )
        );
      }

      const arraySize = [];
      const arrayx = [];
      const arrayy = [];

      for (let i = 1; i < 101; i++) {
        arraySize.push(1);
        arrayx.push(i);
        arrayy.push(i);
      }

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.batchTransferQuad(
          landOwners[0].address,
          landOwners[1].address,
          arraySize,
          arrayx,
          arrayy,
          bytes
        )
      );

      gasTotal = gasTotal.add(receipt.gasUsed);

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(100);
      console.log('GAS USED ' + gasTotal.toString()); //receipt.gasUsed.toString());
    });

    it('batch transfering 250 lands', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      let gasTotal = BigNumber.from('0');

      for (let i = 1; i < 251; i++) {
        await waitFor(
          landOwners[0].MockLandWithMint.mintQuad(
            landOwners[0].address,
            1,
            i,
            i,
            bytes
          )
        );
      }

      const arraySize = [];
      const arrayx = [];
      const arrayy = [];

      for (let i = 1; i < 251; i++) {
        arraySize.push(1);
        arrayx.push(i);
        arrayy.push(i);
      }

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.batchTransferQuad(
          landOwners[0].address,
          landOwners[1].address,
          arraySize,
          arrayx,
          arrayy,
          bytes
        )
      );
      gasTotal = gasTotal.add(receipt.gasUsed);

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(250);
      console.log('GAS USED for 250 ' + gasTotal.toString()); //receipt.gasUsed.toString());
    });

    it('batch transfering 500 lands', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      let gasTotal = BigNumber.from('0');

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          24,
          0,
          0,
          bytes
        )
      );

      const arraySize = [];
      const arrayx = [];
      const arrayy = [];

      for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 24; j++) {
          arraySize.push(1);
          arrayx.push(i);
          arrayy.push(j);
        }
      }

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.batchTransferQuad(
          landOwners[0].address,
          landOwners[1].address,
          arraySize,
          arrayx,
          arrayy,
          bytes
        )
      );
      gasTotal = gasTotal.add(receipt.gasUsed);

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(576);
      console.log('GAS USED 576 ' + gasTotal.toString()); //receipt.gasUsed.toString());
    });

    it('batch transfering FROM 500 lands', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      const gasTotal = BigNumber.from('0');

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          24,
          0,
          0,
          bytes
        )
      );

      const array = [];

      for (let i = 0; i < 24; i++) {
        for (let j = 0; j < 24; j++) {
          array.push(i + j * 408);
        }
      }

      //fails because the tokens were minted inside a 24x24 quad
      await expect(
        landOwners[0].MockLandWithMint.batchTransferFrom(
          landOwners[0].address,
          landOwners[1].address,
          array,
          bytes
        )
      ).to.be.revertedWith(`BATCHTRANSFERFROM_NOT_OWNER`);
    });
  });
  describe('GasTest for tranfer quad', function () {
    it('batch transfer 576', async function () {
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

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.transferQuad(
          landOwners[0].address,
          landOwners[1].address,
          12,
          0,
          0,
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(144);

      console.log('GAS USED for 144 ' + receipt.gasUsed); //receipt.gasUsed.toString());
    });

    it('batch transfer 2 576 land quads', async function () {
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
          24,
          48,
          48,
          bytes
        )
      );

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.batchTransferQuad(
          landOwners[0].address,
          landOwners[1].address,
          [24, 24],
          [0, 48],
          [0, 48],
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(1152);

      console.log('GAS USED for 2 576 ' + receipt.gasUsed); //receipt.gasUsed.toString());
    });

    it('batch transfer 3 576 land quads', async function () {
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
          24,
          48,
          48,
          bytes
        )
      );

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          24,
          72,
          72,
          bytes
        )
      );

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.batchTransferQuad(
          landOwners[0].address,
          landOwners[1].address,
          [24, 24, 24],
          [0, 48, 72],
          [0, 48, 72],
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(1728);

      console.log('GAS USED for 3 576 ' + receipt.gasUsed); //receipt.gasUsed.toString());
    });

    it('batch transfer 4 576 land quads', async function () {
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
          24,
          48,
          48,
          bytes
        )
      );

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          24,
          72,
          72,
          bytes
        )
      );

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          24,
          96,
          96,
          bytes
        )
      );

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.batchTransferQuad(
          landOwners[0].address,
          landOwners[1].address,
          [24, 24, 24, 24],
          [0, 48, 72, 96],
          [0, 48, 72, 96],
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(2304);

      console.log('GAS USED for 4 576 ' + receipt.gasUsed); //receipt.gasUsed.toString());
    });

    it('batch transfer 5 576 land quads', async function () {
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
          24,
          48,
          48,
          bytes
        )
      );

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          24,
          72,
          72,
          bytes
        )
      );

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          24,
          96,
          96,
          bytes
        )
      );

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          24,
          120,
          120,
          bytes
        )
      );

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.batchTransferQuad(
          landOwners[0].address,
          landOwners[1].address,
          [24, 24, 24, 24, 24],
          [0, 48, 72, 96, 120],
          [0, 48, 72, 96, 120],
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(2880);

      console.log('GAS USED for 576 ' + receipt.gasUsed); //receipt.gasUsed.toString());
    });

    it('batch transfer FROM 5 576', async function () {
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
          24,
          24,
          24,
          bytes
        )
      );

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          24,
          48,
          48,
          bytes
        )
      );

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          24,
          72,
          72,
          bytes
        )
      );

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          24,
          96,
          96,
          bytes
        )
      );

      const array = [];
      const array2 = [
        '1809251394333065553493296640760748560207343510400633813116524750123642650624',
        '1809251394333065553493296640760748560207343510400633813116524750123642660440',
        '1809251394333065553493296640760748560207343510400633813116524750123642670256',
        '1809251394333065553493296640760748560207343510400633813116524750123642680072',
        '1809251394333065553493296640760748560207343510400633813116524750123642689888',
      ];

      /*for (let j = 0; j < 5; j++) {
        array.push(
          0x0400000000000000000000000000000000000000000000000000000000000000 +
            (24 * j + 24 * j * 408)
        );
      }*/

      //console.log(array);

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.batchTransferFrom(
          landOwners[0].address,
          landOwners[1].address,
          array2,
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      //expect(num2).to.equal(2880);

      console.log('GAS USED for 576 ' + receipt.gasUsed); //receipt.gasUsed.toString());
    });
  });

  describe('Gas consumption for 1x1 from each different size of quad', function () {
    it('transfer quad 1X1', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          1,
          0,
          0,
          bytes
        )
      );

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.transferQuad(
          landOwners[0].address,
          landOwners[1].address,
          1,
          0,
          0,
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(1);

      console.log('GAS USED for 1x1 ' + receipt.gasUsed);
    });

    it('transfer 1x1 quad from 3X3', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          3,
          0,
          0,
          bytes
        )
      );

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.transferQuad(
          landOwners[0].address,
          landOwners[1].address,
          1,
          0,
          0,
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(1);

      console.log('GAS USED for 1X1 transfer from  3x3 ' + receipt.gasUsed);
    });

    it('transfer 1x1 quad from 6X6', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          6,
          0,
          0,
          bytes
        )
      );

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.transferQuad(
          landOwners[0].address,
          landOwners[1].address,
          1,
          0,
          0,
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(1);

      console.log('GAS USED for 1X1 from 6x6 ' + receipt.gasUsed);
    });

    it('transfer 1x1 quad from 12X12', async function () {
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

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.transferQuad(
          landOwners[0].address,
          landOwners[1].address,
          1,
          0,
          0,
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(1);

      console.log('GAS USED for 1x1 from 12x12 ' + receipt.gasUsed);
    });

    it('transfer 1x1 quad from 24X24', async function () {
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

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.transferQuad(
          landOwners[0].address,
          landOwners[1].address,
          1,
          0,
          0,
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(1);

      console.log('GAS USED for 1x1 fom 24x24 ' + receipt.gasUsed);
    });
  });

  describe('Gas consumption for each different size of quad', function () {
    it('transfer quad 1X1', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          1,
          0,
          0,
          bytes
        )
      );

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.transferQuad(
          landOwners[0].address,
          landOwners[1].address,
          1,
          0,
          0,
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(1);

      console.log('GAS USED for 1x1 ' + receipt.gasUsed);
    });

    it('transfer quad 3X3', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          3,
          0,
          0,
          bytes
        )
      );

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.transferQuad(
          landOwners[0].address,
          landOwners[1].address,
          3,
          0,
          0,
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(9);

      console.log('GAS USED for 3x3 ' + receipt.gasUsed);
    });

    it('transfer quad 6X6', async function () {
      const {landOwners} = await setupTest();
      const bytes = '0x3333';

      await waitFor(
        landOwners[0].MockLandWithMint.mintQuad(
          landOwners[0].address,
          6,
          0,
          0,
          bytes
        )
      );

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.transferQuad(
          landOwners[0].address,
          landOwners[1].address,
          6,
          0,
          0,
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(36);

      console.log('GAS USED for 6x6 ' + receipt.gasUsed);
    });

    it('transfer quad 12X12', async function () {
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

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.transferQuad(
          landOwners[0].address,
          landOwners[1].address,
          12,
          0,
          0,
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(144);

      console.log('GAS USED for 12x12 ' + receipt.gasUsed);
    });

    it('transfer quad 24X24', async function () {
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

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.transferQuad(
          landOwners[0].address,
          landOwners[1].address,
          24,
          0,
          0,
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(576);

      console.log('GAS USED for 24x24 ' + receipt.gasUsed);
    });
  });

  describe('Worst case senarios for gas', function () {
    it('transfer quad 24X24', async function () {
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

      const arraySize = [];
      const arrayx = [];
      const arrayy = [];

      for (let i = 0; i < 12; i++) {
        for (let j = 0; j < 12; j++) {
          arraySize.push(1);
          arrayx.push(i);
          arrayy.push(j);
        }
      }

      const receipt = await waitFor(
        landOwners[0].MockLandWithMint.batchTransferQuad(
          landOwners[0].address,
          landOwners[1].address,
          arraySize,
          arrayx,
          arrayy,
          bytes
        )
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(144);

      console.log('GAS USED for 144 1x1 from 24x24 ' + receipt.gasUsed);
    });
  });

  describe('Test for permit land', function () {
    it('input test with signatures', async function () {
      const {MockLandWithMint, landOwners} = await setupTest();
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

      const approve = {
        from: landOwners[0].address,
        to: landOwners[1].address,
        sizes: ethers.utils.solidityPack(['uint256[]'], [[1, 1]]),
        xs: ethers.utils.solidityPack(['uint256[]'], [[1, 2]]),
        ys: ethers.utils.solidityPack(['uint256[]'], [[1, 2]]),
        data: '0x3333',
      };

      const permitData712 = data712(MockLandWithMint, approve);

      const flatSig = await ethers.provider.send('eth_signTypedData_v4', [
        landOwners[0].address,
        permitData712,
      ]);

      const arraySize = [1, 1];
      const arrayx = [1, 2];
      const arrayy = [1, 2];

      await landOwners[0].MockLandWithMint.batchTransferQuadII(
        landOwners[0].address,
        landOwners[1].address,
        arraySize,
        arrayx,
        arrayy,
        bytes,
        flatSig
      );

      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(2);
    });

    it('sign transfer normally and then try transfer712 should fail', async function () {
      const {MockLandWithMint, landOwners} = await setupTest();
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

      const approve = {
        from: landOwners[0].address,
        to: landOwners[1].address,
        sizes: ethers.utils.solidityPack(['uint256[]'], [[1, 1]]),
        xs: ethers.utils.solidityPack(['uint256[]'], [[1, 2]]),
        ys: ethers.utils.solidityPack(['uint256[]'], [[1, 2]]),
        data: '0x3333',
      };

      const permitData712 = data712(MockLandWithMint, approve);

      const flatSig = await ethers.provider.send('eth_signTypedData_v4', [
        landOwners[0].address,
        permitData712,
      ]);

      const arraySize = [1, 1];
      const arrayx = [1, 2];
      const arrayy = [1, 2];

      await landOwners[0].MockLandWithMint.batchTransferQuad(
        landOwners[0].address,
        landOwners[1].address,
        arraySize,
        arrayx,
        arrayy,
        bytes
      );

      await expect(
        landOwners[0].MockLandWithMint.batchTransferQuadII(
          landOwners[0].address,
          landOwners[1].address,
          arraySize,
          arrayx,
          arrayy,
          bytes,
          flatSig
        )
      ).to.be.revertedWith(`not owner in _transferQuad`);
    });
    it('user2 trying to use message signed by user1', async function () {
      const {MockLandWithMint, landOwners} = await setupTest();
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

      const approve = {
        from: landOwners[0].address,
        to: landOwners[1].address,
        sizes: ethers.utils.solidityPack(['uint256[]'], [[1, 1]]),
        xs: ethers.utils.solidityPack(['uint256[]'], [[1, 2]]),
        ys: ethers.utils.solidityPack(['uint256[]'], [[1, 2]]),
        data: '0x3333',
      };

      const permitData712 = data712(MockLandWithMint, approve);

      const flatSig = await ethers.provider.send('eth_signTypedData_v4', [
        landOwners[0].address,
        permitData712,
      ]);

      const arraySize = [1, 1];
      const arrayx = [1, 2];
      const arrayy = [1, 2];

      await /*expect(*/
      landOwners[1].MockLandWithMint.batchTransferQuadII(
        landOwners[0].address,
        landOwners[1].address,
        arraySize,
        arrayx,
        arrayy,
        bytes,
        flatSig
      );
      /*).to.be.revertedWith(`INVALID_SIGNATURE`)*/
      const num2 = await landOwners[0].MockLandWithMint.balanceOf(
        landOwners[1].address
      );
      expect(num2).to.equal(2);
    });
  });
});
