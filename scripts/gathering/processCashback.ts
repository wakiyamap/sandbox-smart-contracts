import 'dotenv/config';
import fs from 'fs-extra';
import {BigNumber} from 'ethers';

function processOwners() {
  type TheGraphOutput = {
    id: string;
    numAssets: string;
    assetTokens: {
      id: string;
      quantity: string;
    }[];
    numLands: string;
    landTokens: {
      id: string;
    }[];
  };
  const data = fs.readFileSync('tmp/asset_owners_cashback.json');
  const parsed: TheGraphOutput[] = JSON.parse(data.toString());
  const processed = parsed
    .map((x) => ({
      address: x.id,
      numLands: parseInt(x.numLands),
      numAssets: parseInt(x.numAssets),
      assets: x.assetTokens.map((y) => ({id: y.id, quantity: y.quantity})),
      lands: x.landTokens.map((y) => y.id),
    }))
    .filter(
      (x) =>
        x.numAssets !== 0 ||
        x.numLands !== 0 ||
        x.assets.length !== 0 ||
        x.lands.length !== 0
    );
  console.log(
    processed
      .filter(
        (x) => x.numAssets !== x.assets.length && x.numLands !== x.lands.length
      )
      .map((x) => ({
        address: x.address,
        numLands: x.numLands,
        numAssets: x.numAssets,
        assetsLen: x.assets.length,
        landLen: x.lands.length,
      }))
  );
  // console.log(JSON.stringify(processed, null, 4));
}

function processAssets() {
  type TheGraphOutput = {
    id: string;
    owner: string;
    supply: string;
    owners: {
      id: string;
      owner: {id: string};
      quantity: string;
    }[];
  };

  const data = fs.readFileSync('tmp/assetTokens_cashback.json');
  const parsed: TheGraphOutput[] = JSON.parse(data.toString());
  const processed = parsed.map((x) => ({
    id: x.id,
    supply: parseInt(x.supply),
    owners: x.owners.map((y) => ({
      address: y.id,
      owner: y.owner.id,
      quantity: parseInt(y.quantity),
    })),
    total: x.owners.reduce((acc, val) => acc + parseInt(val.quantity), 0),
  }));
  console.log(
    JSON.stringify(
      processed
        .filter((x) => x.supply !== x.total)
        .map((x) => ({
          id: x.id,
          total: x.total,
          supply: x.supply,
          ownersLen: x.owners.length,
        })),
      null,
      4
    )
  );
}

function processLands() {
  type TheGraphOutput = {
    id: string;
    owner: {
      id: string;
    };
  };
  const data = fs.readFileSync('tmp/landTokens_cashback.json');
  const parsed: TheGraphOutput[] = JSON.parse(data.toString());
  const processed = parsed.map((x) => ({
    id: x.id,
    owner: x.owner.id,
  }));
  const GRID_SIZE = 408;
  const owners = processed.reduce((acc, val) => {
    const id = BigNumber.from(val.id);
    acc[val.owner] = [
      ...(acc[val.owner] || []),
      {
        id: id.toString(),
        x: id.mod(GRID_SIZE).toString(),
        y: id.div(GRID_SIZE).toString(),
        // layer: id.shr(248).toString(),
      },
    ];
    return acc;
  }, {} as {[key: string]: {id: string; x: string; y: string}[]});
  console.log(
    'Lands:',
    processed.length,
    'Owners:',
    Object.keys(owners).length
  );
  console.log(JSON.stringify(owners, null, 4));
}

function processAssetToken() {
  type TheGraphOutput = {
    id: string;
    quantity: string;
    owner: {
      id: string;
    };
    token: {
      id: string;
      supply: string;
    };
  };

  const data = fs.readFileSync('tmp/asset_token_cashback.json');
  const parsed: TheGraphOutput[] = JSON.parse(data.toString());
  const processed = parsed.map((x) => ({
    token: x.token.id,
    supply: parseInt(x.token.supply),
    owner: x.owner.id,
    quantity: parseInt(x.quantity),
  }));
  console.log(processed.length);
  const tokens = processed.reduce(
    (acc, val) => {
      const id = BigNumber.from(val.token);
      acc[val.token] = {
        id: id.toHexString(),
        // uint256(2)**(256 - 160)
        creator: id.shr(256 - 160).toHexString(),
        isNFT: !id.and('0x800000000000000000000000').isZero(),
        nftIndex: id.and('0x7FFFFFFF8000000000000000').shr(63).toString(),
        uriID: id
          .and(
            '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF000000007FFFFFFFFFFFF800'
          )
          .toHexString(),
        packId: id
          .and('0x7FFFFFFFFF800000')
          .shr(256 - 160 - 1 - 32 - 40)
          .toString(),
        packIndex: id.and('0x7FF').toString(),
        packNumFTTypes: id
          .and('0x7FF800')
          .shr(256 - 160 - 1 - 32 - 40 - 12)
          .toString(),
        supply: val.supply,
        owners: [
          ...((acc[val.token] && acc[val.token].owners) || []),
          {address: val.owner, quantity: val.quantity},
        ],
      };
      return acc;
    },
    {} as {
      [key: string]: {
        id: string;
        creator: string;
        isNFT: boolean;
        nftIndex: string;
        uriID: string;
        packId: string;
        packIndex: string;
        packNumFTTypes: string;
        supply: number;
        owners: {address: string; quantity: number}[];
      };
    }
  );
  console.log(JSON.stringify(tokens, null, 4));
}

async function main() {
  // await processLands();
  await processAssetToken();
}

main().catch((err) => console.error(err));
