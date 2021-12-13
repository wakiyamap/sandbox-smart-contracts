// OBS: it takes 12 minutes to run on block 13760000 of eth mainnet
import 'dotenv/config';
import fs from 'fs-extra';
import {TheGraph} from '../utils/thegraph';
import {getBlockArgs} from '../utils/utils';
import path from 'path';

const blockNumber = getBlockArgs(0);

const theGraph = new TheGraph(
  'https://api.thegraph.com/subgraphs/name/pixowl/the-sandbox'
);

const assetTokenQueryString = `
  query($blockNumber: Int! $first: Int! $lastId: ID!) {
    assetTokenOwneds(first: $first where: {id_gt: $lastId} block: {number: $blockNumber}) {
      id
      owner {
        id
      }
      token {
        id
        supply
      }
      quantity
    }
  }
`;

const assetQueryString = `
query($blockNumber: Int! $first: Int! $lastId: ID!) {
    assetTokens(first: $first where: {id_gt: $lastId} block: {number: $blockNumber}) {
      id
      supply
      owners {
        id
        owner {
          id 
        }
        quantity
      }
      owner {
        id
      }
    } 
}
`;
const landQueryString = `
query($blockNumber: Int! $first: Int! $lastId: ID!) {
    landTokens(first: $first where: {id_gt: $lastId} block: {number: $blockNumber}) {
      id
      owner {
        id
      }
    } 
}
`;
const ownerQueryString = `
query($blockNumber: Int! $first: Int! $lastId: ID!) {
    owners(first: $first where: {id_gt: $lastId} block: {number: $blockNumber}) {
      id
      numAssets
      assetTokens {
        id
        quantity
      }
      numLands
      landTokens {
        id
      }
    }
}
`;

async function process(query: string, field: string, fileName: string) {
  const data: {id: string}[] = await theGraph.query(query, field, {
    blockNumber,
  });
  console.log(field, data.length, fileName);
  // write to disk
  fs.ensureDirSync('tmp');
  fs.writeFileSync(path.join('tmp', fileName), JSON.stringify(data, null, 4));
}

async function main() {
  // await process(assetQueryString, 'assetTokens', 'assetTokens_cashback.json');
  // await process(ownerQueryString, 'owners', 'asset_owners_cashback.json');
  await process(landQueryString, 'landTokens', 'landTokens_cashback.json');
  await process(
    assetTokenQueryString,
    'assetTokenOwneds',
    'asset_token_cashback.json'
  );
}

main().catch((err) => console.error(err));
