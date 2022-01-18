import {AbiCoder} from '@ethersproject/contracts/node_modules/@ethersproject/abi';
import {expect} from '../../chai-setup';
import {waitFor} from '../../utils';
import {setupLand} from './fixtures';

describe('PolygonLand.sol', function () {
  describe('Land <> PolygonLand: Transfer', function () {
    describe('L1 to L2', function () {
      it('should be able to transfer 1x1 Land', async function () {
        const {
          Land,
          landMinter,
          users,
          LandTunnel,
          PolygonLand,
        } = await setupLand();
        const landHolder = users[0];
        const size = 1;
        const x = 0;
        const y = 0;
        const bytes = '0x00';
        const plotCount = size * size;

        // Mint LAND on L1
        await landMinter.Land.mintQuad(landHolder.address, size, x, y, bytes);
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(plotCount);

        // Transfer to L1 Tunnel
        await landHolder.Land.setApprovalForAll(LandTunnel.address, true);

        await waitFor(
          landHolder.LandTunnel.batchTransferQuadToL2(
            landHolder.address,
            [size],
            [x],
            [y],
            bytes
          )
        );

        expect(await Land.balanceOf(landHolder.address)).to.be.equal(0);
        expect(await Land.balanceOf(LandTunnel.address)).to.be.equal(plotCount);
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(
          plotCount
        );
      });
      it('should be able to transfer 3x3 Land', async function () {
        const {
          Land,
          landMinter,
          users,
          LandTunnel,
          PolygonLand,
        } = await setupLand();
        const landHolder = users[0];
        const size = 3;
        const x = 0;
        const y = 0;
        const bytes = '0x00';
        const plotCount = size * size;

        // Mint LAND on L1
        await landMinter.Land.mintQuad(landHolder.address, size, x, y, bytes);
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(plotCount);

        // Transfer to L1 Tunnel
        await landHolder.Land.setApprovalForAll(LandTunnel.address, true);
        await landHolder.LandTunnel.batchTransferQuadToL2(
          landHolder.address,
          [size],
          [x],
          [y],
          bytes
        );

        expect(await Land.balanceOf(landHolder.address)).to.be.equal(0);
        expect(await Land.balanceOf(LandTunnel.address)).to.be.equal(plotCount);
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(
          plotCount
        );
      });
      it('should be able to transfer 6x6 Land', async function () {
        const {
          Land,
          landMinter,
          users,
          LandTunnel,
          PolygonLand,
        } = await setupLand();
        const landHolder = users[0];
        const size = 6;
        const x = 0;
        const y = 0;
        const bytes = '0x00';
        const plotCount = size * size;

        // Mint LAND on L1
        await landMinter.Land.mintQuad(landHolder.address, size, x, y, bytes);
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(plotCount);

        // Transfer to L1 Tunnel
        await landHolder.Land.setApprovalForAll(LandTunnel.address, true);
        await landHolder.LandTunnel.batchTransferQuadToL2(
          landHolder.address,
          [size],
          [x],
          [y],
          bytes
        );

        expect(await Land.balanceOf(landHolder.address)).to.be.equal(0);
        expect(await Land.balanceOf(LandTunnel.address)).to.be.equal(plotCount);
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(
          plotCount
        );
      });
      it('should be able to transfer 12x12 Land', async function () {
        const {
          Land,
          landMinter,
          users,
          LandTunnel,
          PolygonLand,
        } = await setupLand();
        const landHolder = users[0];
        const size = 12;
        const x = 0;
        const y = 0;
        const bytes = '0x00';
        const plotCount = size * size;

        // Mint LAND on L1
        await landMinter.Land.mintQuad(landHolder.address, size, x, y, bytes);
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(plotCount);

        // Transfer to L1 Tunnel
        await landHolder.Land.setApprovalForAll(LandTunnel.address, true);
        await landHolder.LandTunnel.batchTransferQuadToL2(
          landHolder.address,
          [size],
          [x],
          [y],
          bytes
        );

        expect(await Land.balanceOf(landHolder.address)).to.be.equal(0);
        expect(await Land.balanceOf(LandTunnel.address)).to.be.equal(plotCount);
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(
          plotCount
        );
      });
      it('should not be able to transfer 24x24 Land', async function () {
        const {
          Land,
          landMinter,
          users,
          LandTunnel,
          PolygonLand,
        } = await setupLand();
        const landHolder = users[0];
        const size = 24;
        const x = 0;
        const y = 0;
        const bytes = '0x00';
        const plotCount = size * size;

        // Mint LAND on L1
        await landMinter.Land.mintQuad(landHolder.address, size, x, y, bytes);
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(plotCount);

        // Transfer to L1 Tunnel
        await landHolder.Land.setApprovalForAll(LandTunnel.address, true);
        await expect(
          landHolder.LandTunnel.batchTransferQuadToL2(
            landHolder.address,
            [size],
            [x],
            [y],
            bytes
          )
        ).to.be.revertedWith('Exceeds max allowed quads');
      });

      it('should be able to transfer multiple Lands', async function () {
        const {
          Land,
          landMinter,
          users,
          LandTunnel,
          PolygonLand,
        } = await setupLand();
        const landHolder = users[0];
        const bytes = '0x00';
        // Mint LAND on L1
        const mintingData = [
          [6, 3],
          [30, 24],
          [30, 24],
        ];
        const plotCount = mintingData[0]
          .map((size) => size * size)
          .reduce((a, b) => a + b, 0);
        await Promise.all(
          [...Array(4).keys()].map((idx) => {
            waitFor(
              landMinter.Land.mintQuad(
                landHolder.address,
                ...mintingData.map((x) => x[idx]),
                bytes
              )
            );
          })
        );
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(plotCount);

        // Transfer to L1 Tunnel
        await landHolder.Land.setApprovalForAll(LandTunnel.address, true);
        await landHolder.LandTunnel.batchTransferQuadToL2(
          landHolder.address,
          ...mintingData,
          bytes
        );

        expect(await Land.balanceOf(landHolder.address)).to.be.equal(0);
        expect(await Land.balanceOf(LandTunnel.address)).to.be.equal(45);
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(
          plotCount
        );
      });
    });
    describe('L2 to L1', function () {
      it('should be able to transfer 1x1 Land', async function () {
        const {
          deployer,
          Land,
          landMinter,
          users,
          MockLandTunnel,
          PolygonLand,
          MockPolygonLandTunnel,
        } = await setupLand();

        const landHolder = users[0];
        const size = 1;
        const x = 0;
        const y = 0;
        const bytes = '0x00';
        const plotCount = size * size;

        // Mint LAND on L1
        await landMinter.Land.mintQuad(landHolder.address, size, x, y, bytes);
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(plotCount);

        // Set Mock PolygonLandTunnel in PolygonLand
        await deployer.PolygonLand.setPolygonLandTunnel(
          MockPolygonLandTunnel.address
        );
        expect(await PolygonLand.polygonLandTunnel()).to.equal(
          MockPolygonLandTunnel.address
        );
        // Transfer to L1 Tunnel
        await landHolder.Land.setApprovalForAll(MockLandTunnel.address, true);
        await landHolder.MockLandTunnel.batchTransferQuadToL2(
          landHolder.address,
          [size],
          [x],
          [y],
          bytes
        );

        expect(await Land.balanceOf(landHolder.address)).to.be.equal(0);
        expect(await Land.balanceOf(MockLandTunnel.address)).to.be.equal(
          plotCount
        );
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(
          plotCount
        );

        // Transfer to L2 Tunnel
        await landHolder.PolygonLand.setApprovalForAll(
          MockPolygonLandTunnel.address,
          true
        );
        const tx = await landHolder.MockPolygonLandTunnel.batchTransferQuadToL1(
          landHolder.address,
          [size],
          [x],
          [y],
          bytes
        );
        await tx.wait();

        console.log('DUMMY CHECKPOINT. moving on...');

        // Release on L1
        const abiCoder = new AbiCoder();

        await deployer.MockLandTunnel.receiveMessage(
          abiCoder.encode(
            ['address', 'uint256[]', 'uint256[]', 'uint256[]', 'bytes'],
            [landHolder.address, [size], [x], [y], bytes]
          )
        );
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(plotCount);
        expect(await Land.balanceOf(MockLandTunnel.address)).to.be.equal(0);
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(0);
      });

      it('should be able to transfer 12x12 Land', async function () {
        const {
          deployer,
          Land,
          landMinter,
          users,
          MockLandTunnel,
          PolygonLand,
          MockPolygonLandTunnel,
        } = await setupLand();

        const landHolder = users[0];
        const size = 12;
        const x = 0;
        const y = 0;
        const bytes = '0x00';
        const plotCount = size * size;

        // Mint LAND on L1
        await landMinter.Land.mintQuad(landHolder.address, size, x, y, bytes);
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(plotCount);

        // Set Mock PolygonLandTunnel in PolygonLand
        await deployer.PolygonLand.setPolygonLandTunnel(
          MockPolygonLandTunnel.address
        );
        expect(await PolygonLand.polygonLandTunnel()).to.equal(
          MockPolygonLandTunnel.address
        );
        // Transfer to L1 Tunnel
        await landHolder.Land.setApprovalForAll(MockLandTunnel.address, true);
        await landHolder.MockLandTunnel.batchTransferQuadToL2(
          landHolder.address,
          [size],
          [x],
          [y],
          bytes
        );

        expect(await Land.balanceOf(landHolder.address)).to.be.equal(0);
        expect(await Land.balanceOf(MockLandTunnel.address)).to.be.equal(
          plotCount
        );
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(
          plotCount
        );

        // Transfer to L2 Tunnel
        await landHolder.PolygonLand.setApprovalForAll(
          MockPolygonLandTunnel.address,
          true
        );
        const tx = await landHolder.MockPolygonLandTunnel.batchTransferQuadToL1(
          landHolder.address,
          [size],
          [x],
          [y],
          bytes
        );
        await tx.wait();

        console.log('DUMMY CHECKPOINT. moving on...');

        // Release on L1
        const abiCoder = new AbiCoder();

        await deployer.MockLandTunnel.receiveMessage(
          abiCoder.encode(
            ['address', 'uint256[]', 'uint256[]', 'uint256[]', 'bytes'],
            [landHolder.address, [size], [x], [y], bytes]
          )
        );
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(plotCount);
        expect(await Land.balanceOf(MockLandTunnel.address)).to.be.equal(0);
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(0);
      });

      it('should not be able to transfer 2, 12x12 Land at once', async function () {
        const {
          deployer,
          Land,
          landMinter,
          users,
          MockLandTunnel,
          PolygonLand,
          MockPolygonLandTunnel,
        } = await setupLand();

        const bytes = '0x00';

        const landHolder = users[0];
        const size_1 = 12;
        const x_1 = 0;
        const y_1 = 0;

        const size_2 = 12;
        const x_2 = 12;
        const y_2 = 12;
        const plotCount = size_1 * size_1 + size_1 * size_2;

        // Mint LAND on L1
        await landMinter.Land.mintQuad(
          landHolder.address,
          size_1,
          x_1,
          y_1,
          bytes
        );
        await landMinter.Land.mintQuad(
          landHolder.address,
          size_2,
          x_2,
          y_2,
          bytes
        );
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(plotCount);

        // Set Mock PolygonLandTunnel in PolygonLand
        await deployer.PolygonLand.setPolygonLandTunnel(
          MockPolygonLandTunnel.address
        );
        expect(await PolygonLand.polygonLandTunnel()).to.equal(
          MockPolygonLandTunnel.address
        );
        // Transfer to L1 Tunnel
        await landHolder.Land.setApprovalForAll(MockLandTunnel.address, true);
        await landHolder.MockLandTunnel.batchTransferQuadToL2(
          landHolder.address,
          [size_1],
          [x_1],
          [y_1],
          bytes
        );
        await landHolder.MockLandTunnel.batchTransferQuadToL2(
          landHolder.address,
          [size_2],
          [x_2],
          [y_2],
          bytes
        );

        expect(await Land.balanceOf(landHolder.address)).to.be.equal(0);
        expect(await Land.balanceOf(MockLandTunnel.address)).to.be.equal(
          plotCount
        );
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(
          plotCount
        );

        // Transfer to L2 Tunnel
        await landHolder.PolygonLand.setApprovalForAll(
          MockPolygonLandTunnel.address,
          true
        );
        await expect(
          landHolder.MockPolygonLandTunnel.batchTransferQuadToL1(
            landHolder.address,
            [size_1, size_2],
            [x_1, x_2],
            [y_1, y_2],
            bytes
          )
        ).to.be.revertedWith('Exceeds max allowed quads.');
      });

      it('should be able to transfer 3x3 Land', async function () {
        const {
          deployer,
          Land,
          landMinter,
          users,
          MockLandTunnel,
          PolygonLand,
          MockPolygonLandTunnel,
        } = await setupLand();

        const landHolder = users[0];
        const size = 3;
        const x = 0;
        const y = 0;
        const bytes = '0x00';
        const plotCount = size * size;

        // Mint LAND on L1
        await landMinter.Land.mintQuad(landHolder.address, size, x, y, bytes);
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(plotCount);

        // Set Mock PolygonLandTunnel in PolygonLand
        await deployer.PolygonLand.setPolygonLandTunnel(
          MockPolygonLandTunnel.address
        );
        expect(await PolygonLand.polygonLandTunnel()).to.equal(
          MockPolygonLandTunnel.address
        );
        // Transfer to L1 Tunnel
        await landHolder.Land.setApprovalForAll(MockLandTunnel.address, true);
        await landHolder.MockLandTunnel.batchTransferQuadToL2(
          landHolder.address,
          [size],
          [x],
          [y],
          bytes
        );

        expect(await Land.balanceOf(landHolder.address)).to.be.equal(0);
        expect(await Land.balanceOf(MockLandTunnel.address)).to.be.equal(
          plotCount
        );
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(
          plotCount
        );

        // Transfer to L2 Tunnel
        await landHolder.PolygonLand.setApprovalForAll(
          MockPolygonLandTunnel.address,
          true
        );
        const tx = await landHolder.MockPolygonLandTunnel.batchTransferQuadToL1(
          landHolder.address,
          [size],
          [x],
          [y],
          bytes
        );
        await tx.wait();

        console.log('DUMMY CHECKPOINT. moving on...');

        // Release on L1
        const abiCoder = new AbiCoder();

        await deployer.MockLandTunnel.receiveMessage(
          abiCoder.encode(
            ['address', 'uint256[]', 'uint256[]', 'uint256[]', 'bytes'],
            [landHolder.address, [size], [x], [y], bytes]
          )
        );
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(plotCount);
        expect(await Land.balanceOf(MockLandTunnel.address)).to.be.equal(0);
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(0);
      });

      it('should be able to transfer 6x6 Land', async function () {
        const {
          deployer,
          Land,
          landMinter,
          users,
          MockLandTunnel,
          PolygonLand,
          MockPolygonLandTunnel,
        } = await setupLand();

        const landHolder = users[0];
        const size = 6;
        const x = 0;
        const y = 0;
        const bytes = '0x00';
        const plotCount = size * size;

        // Mint LAND on L1
        await landMinter.Land.mintQuad(landHolder.address, size, x, y, bytes);
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(plotCount);

        // Set Mock PolygonLandTunnel in PolygonLand
        await deployer.PolygonLand.setPolygonLandTunnel(
          MockPolygonLandTunnel.address
        );
        expect(await PolygonLand.polygonLandTunnel()).to.equal(
          MockPolygonLandTunnel.address
        );
        // Transfer to L1 Tunnel
        await landHolder.Land.setApprovalForAll(MockLandTunnel.address, true);
        await landHolder.MockLandTunnel.batchTransferQuadToL2(
          landHolder.address,
          [size],
          [x],
          [y],
          bytes
        );

        expect(await Land.balanceOf(landHolder.address)).to.be.equal(0);
        expect(await Land.balanceOf(MockLandTunnel.address)).to.be.equal(
          plotCount
        );
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(
          plotCount
        );

        // Transfer to L2 Tunnel
        await landHolder.PolygonLand.setApprovalForAll(
          MockPolygonLandTunnel.address,
          true
        );
        const tx = await landHolder.MockPolygonLandTunnel.batchTransferQuadToL1(
          landHolder.address,
          [size],
          [x],
          [y],
          bytes
        );
        await tx.wait();

        console.log('DUMMY CHECKPOINT. moving on...');

        // Release on L1
        const abiCoder = new AbiCoder();

        await deployer.MockLandTunnel.receiveMessage(
          abiCoder.encode(
            ['address', 'uint256[]', 'uint256[]', 'uint256[]', 'bytes'],
            [landHolder.address, [size], [x], [y], bytes]
          )
        );
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(plotCount);
        expect(await Land.balanceOf(MockLandTunnel.address)).to.be.equal(0);
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(0);
      });

      it('should should be able to transfer multiple lands', async function () {
        const {
          deployer,
          Land,
          landMinter,
          users,
          MockLandTunnel,
          PolygonLand,
          MockPolygonLandTunnel,
        } = await setupLand();
        const bytes = '0x00';
        // Set Mock PolygonLandTunnel in PolygonLand
        await deployer.PolygonLand.setPolygonLandTunnel(
          MockPolygonLandTunnel.address
        );
        expect(await PolygonLand.polygonLandTunnel()).to.equal(
          MockPolygonLandTunnel.address
        );

        const landHolder = users[0];
        const mintingData = [
          [6, 3],
          [30, 24],
          [30, 24],
        ];

        const numberOfLands = mintingData[0].length;
        const numberOfTokens = mintingData[0]
          .map((elem) => elem * elem)
          .reduce((a, b) => a + b, 0);
        await Promise.all(
          [...Array(numberOfLands).keys()].map((idx) => {
            waitFor(
              landMinter.Land.mintQuad(
                landHolder.address,
                ...mintingData.map((x) => x[idx]),
                bytes
              )
            );
          })
        );
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(
          numberOfTokens
        );

        // Transfer to L1 Tunnel
        await landHolder.Land.setApprovalForAll(MockLandTunnel.address, true);
        await landHolder.MockLandTunnel.batchTransferQuadToL2(
          landHolder.address,
          ...mintingData,
          bytes
        );

        expect(await Land.balanceOf(landHolder.address)).to.be.equal(0);
        expect(await Land.balanceOf(MockLandTunnel.address)).to.be.equal(
          numberOfTokens
        );
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(
          numberOfTokens
        );

        // Transfer to L2 Tunnel
        await landHolder.PolygonLand.setApprovalForAll(
          MockPolygonLandTunnel.address,
          true
        );
        const tx = await landHolder.MockPolygonLandTunnel.batchTransferQuadToL1(
          landHolder.address,
          ...mintingData,
          bytes
        );
        await tx.wait();

        console.log('DUMMY CHECKPOINT. moving on...');

        const abiCoder = new AbiCoder();

        await deployer.MockLandTunnel.receiveMessage(
          abiCoder.encode(
            ['address', 'uint256[]', 'uint256[]', 'uint256[]', 'bytes'],
            [landHolder.address, ...mintingData, bytes]
          )
        );

        expect(await Land.balanceOf(landHolder.address)).to.be.equal(
          numberOfTokens
        );
        expect(await Land.balanceOf(MockLandTunnel.address)).to.be.equal(0);
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(0);
      });

      it('should not be able to transfer if exceeds limit', async function () {
        const {
          deployer,
          Land,
          landMinter,
          users,
          MockLandTunnel,
          PolygonLand,
          MockPolygonLandTunnel,
        } = await setupLand();
        const bytes = '0x00';

        await deployer.PolygonLandTunnel.setLimit(1, 400);
        // Set Mock PolygonLandTunnel in PolygonLand
        await deployer.PolygonLand.setPolygonLandTunnel(
          MockPolygonLandTunnel.address
        );
        expect(await PolygonLand.polygonLandTunnel()).to.equal(
          MockPolygonLandTunnel.address
        );

        const landHolder = users[0];
        const mintingData = [
          [1, 1],
          [0, 240],
          [0, 240],
        ];

        const numberOfLands = mintingData[0].length;
        const numberOfTokens = mintingData[0]
          .map((elem) => elem * elem)
          .reduce((a, b) => a + b, 0);
        await Promise.all(
          [...Array(numberOfLands).keys()].map((idx) => {
            waitFor(
              landMinter.Land.mintQuad(
                landHolder.address,
                ...mintingData.map((x) => x[idx]),
                bytes
              )
            );
          })
        );
        expect(await Land.balanceOf(landHolder.address)).to.be.equal(
          numberOfTokens
        );

        // Transfer to L1 Tunnel
        await landHolder.Land.setApprovalForAll(MockLandTunnel.address, true);
        await landHolder.MockLandTunnel.batchTransferQuadToL2(
          landHolder.address,
          ...mintingData,
          bytes
        );

        expect(await Land.balanceOf(landHolder.address)).to.be.equal(0);
        expect(await Land.balanceOf(MockLandTunnel.address)).to.be.equal(
          numberOfTokens
        );
        expect(await PolygonLand.balanceOf(landHolder.address)).to.be.equal(
          numberOfTokens
        );

        // Transfer to L2 Tunnel

        // Check if limit is set
        expect(await MockPolygonLandTunnel.maxGasLimitOnL1()).to.eq(500);
        await landHolder.PolygonLand.setApprovalForAll(
          MockPolygonLandTunnel.address,
          true
        );
        expect(
          landHolder.MockPolygonLandTunnel.batchTransferQuadToL1(
            landHolder.address,
            ...mintingData,
            bytes
          )
        ).to.be.revertedWith('Exceeds gas limit on L1.');
      });
    });
  });
});
