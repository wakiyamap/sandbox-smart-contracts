import {setupEstate} from './fixtures';
import {waitFor} from '../utils';
import {expect} from '../chai-setup';
import {ethers} from 'hardhat';
import {EstateTestHelper} from './estateTestHelper';
import {getId} from './utils';
const emptyBytes = Buffer.from('');
const GRID_SIZE = 408;

async function mintQuad() {}
describe('EstateV2', function () {
  it('create should fail on empty land array', async function () {
    const {estateContract, landContractAsMinter, user0} = await setupEstate();
    const size = 1;
    const x = 6;
    const y = 12;
    const uri =
      '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';

    await waitFor(landContractAsMinter.mintQuad(user0, size, x, y, emptyBytes));
    await expect(
      estateContract
        .connect(ethers.provider.getSigner(user0))
        .createEstate(user0, user0, {
          landIds: [],
          gameIds: [],
          uri,
        })
    ).to.be.revertedWith(`EMPTY_LAND_IDS_ARRAY`);
  });

  it('create should fail on different sizes for land, game arrays', async function () {
    const {estateContract, landContractAsMinter, user0} = await setupEstate();
    const size = 1;
    const x = 6;
    const y = 12;
    const uri =
      '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF';
    await waitFor(landContractAsMinter.mintQuad(user0, size, x, y, emptyBytes));
    const assetAttributesRegistryEvents = await landContractAsMinter.queryFilter(
      landContractAsMinter.filters.Transfer()
    );
    const event = assetAttributesRegistryEvents.filter(
      (e) => e.event === 'Transfer'
    )[0];
    const landId = event.args![2];
    await expect(
      estateContract
        .connect(ethers.provider.getSigner(user0))
        .createEstate(user0, user0, {
          landIds: [landId],
          gameIds: [],
          uri,
        })
    ).to.be.revertedWith(`DIFFERENT_LENGTH_LANDS_GAMES`);
  });
});
