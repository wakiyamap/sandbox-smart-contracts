import {Contract, Event} from 'ethers';
import BN from 'bn.js';
import fs from 'fs-extra';
import hre from 'hardhat';
import {Deployment} from 'hardhat-deploy/types';
const {ethers} = hre;

type Land = {
  coordinateX: string;
  coordinateY: string;
  size: BN;
  tokenId: string;
};

async function queryEvents(
  filterFunc: (startBlock: number, endBlock: number) => Promise<Event[]>,
  startBlock: number,
  endBlock?: number
) {
  if (!endBlock) {
    endBlock = await ethers.provider.getBlockNumber();
  }
  let consecutiveSuccess = 0;
  const successes: Record<number, boolean> = {};
  const failures: Record<number, boolean> = {};
  const events = [];
  let blockRange = 100000;
  let fromBlock = startBlock;
  let toBlock = Math.min(fromBlock + blockRange, endBlock);
  while (fromBlock <= endBlock) {
    try {
      const moreEvents = await filterFunc(fromBlock, toBlock);
      successes[blockRange] = true;
      consecutiveSuccess++;
      if (consecutiveSuccess > 6) {
        const newBlockRange = blockRange * 2;
        if (!failures[newBlockRange] || successes[newBlockRange]) {
          blockRange = newBlockRange;
        }
      }

      fromBlock = toBlock + 1;
      toBlock = Math.min(fromBlock + blockRange, endBlock);
      events.push(...moreEvents);
    } catch (e) {
      failures[blockRange] = true;
      consecutiveSuccess = 0;
      blockRange /= 2;
      toBlock = Math.min(fromBlock + blockRange, endBlock);

      console.log({fromBlock, toBlock, numEvents: 'ERROR'});
      console.log({blockRange});
      console.error(e);
    }
  }
  return events;
}

const gridSize = new BN(408);

function tokenIdToMapCoords(
  topCornerId: BN
): {coordinateX: string; coordinateY: string} {
  const id = new BN(topCornerId.toString());
  const coordinateX = id
    .mod(gridSize) // x = id % 408
    .toString(10);
  const coordinateY = id
    .div(gridSize) // y = id / 408
    .toString(10);
  return {coordinateX, coordinateY};
}

async function getLandPreSales(): Promise<{[name: string]: Deployment}> {
  const {deployments} = hre;
  const allDeployedContracts = await deployments.all();
  const contracts: {[name: string]: Deployment} = {};
  Object.keys(allDeployedContracts).forEach((contractName) => {
    if (contractName.includes('LandPreSale')) {
      contracts[contractName] = allDeployedContracts[contractName];
    }
  });
  return contracts;
}

async function getPreSaleLandQuadPurchasedEvents(
  presaleDeploymentName: string,
  presaleDeployment: Deployment
) {
  const presaleContract = await ethers.getContract(presaleDeploymentName);
  return queryEvents(
    presaleContract.queryFilter.bind(
      presaleContract,
      presaleContract.filters.LandQuadPurchased()
    ),
    presaleDeployment.receipt?.blockNumber || 0
  );
}

async function setLandOwners(
  landContracts: Contract[],
  events: Event[],
  landOwnersMap: {[owner: string]: Land[]}
) {
  let promises = [];
  for (const event of events) {
    promises.push(setLandOwner(landContracts, event, landOwnersMap));
    if (promises.length >= 50) {
      await Promise.all(promises);
      promises = [];
    }
  }
  if (promises.length > 0) await Promise.all(promises);
}

async function setLandOwner(
  landContracts: Contract[],
  event: Event,
  landOwnersMap: {[owner: string]: Land[]}
) {
  const topCornerId: BN = event.args && event.args.topCornerId;
  const {coordinateX, coordinateY} = tokenIdToMapCoords(topCornerId);
  const size = new BN(event.args && event.args.size.toString());
  const currentLandOwner = await getOwner(landContracts, event);
  const land: Land = {
    coordinateX,
    coordinateY,
    size,
    tokenId: topCornerId.toString(),
  };
  if (currentLandOwner) {
    if (!landOwnersMap[currentLandOwner]) landOwnersMap[currentLandOwner] = [];
    landOwnersMap[currentLandOwner].push(land);
  }
}

async function getOwner(landContracts: Contract[], event: Event) {
  const topCornerId: BN = event.args && event.args.topCornerId;
  let currentLandOwner;
  for (const landContract of landContracts) {
    currentLandOwner = await landContract.callStatic
      .ownerOf(topCornerId)
      .catch(() => null);
    if (currentLandOwner) break;
  }
  return currentLandOwner || '0x0000000000000000000000000000000000000000';
}

(async () => {
  const presaleDeployments = await getLandPreSales();
  const networkName = hre.network.name;
  const exportFilePath = `tmp/${networkName}-landOwners.json`;
  const landOwnersMap: {[owner: string]: Land[]} = {};
  const LandContract = await ethers.getContract('Land');
  const LandOldContract = await ethers.getContract('Land_Old');
  const promises = [];
  for (const presaleDeploymentName in presaleDeployments) {
    const presaleDeployment = presaleDeployments[presaleDeploymentName];
    promises.push(
      (async () => {
        console.log(
          'Getting land quad purchased events for',
          presaleDeploymentName
        );
        const landQuadPurchasedEvents = await getPreSaleLandQuadPurchasedEvents(
          presaleDeploymentName,
          presaleDeployment
        );
        console.log(
          'Setting land owners for',
          presaleDeploymentName,
          'with events',
          landQuadPurchasedEvents.length
        );
        await setLandOwners(
          [LandContract, LandOldContract],
          landQuadPurchasedEvents,
          landOwnersMap
        );
        console.log('Done setting land owners for', presaleDeploymentName);
      })()
    );
  }
  await Promise.all(promises);
  // write output file
  console.log(`writing output to file ${exportFilePath}`);
  fs.outputJSONSync(exportFilePath, landOwnersMap);
})();
