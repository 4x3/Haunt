import { getAuctionPage } from './hypixel.js';

/*
 * Lowest-BIN index.
 *
 * The auction house is ~51 pages / 50k listings, so scanning it per command is
 * out of the question. Instead we walk every page once, keep only the cheapest
 * Buy-It-Now price per item name, and throw the raw listings away - that turns
 * ~120MB of JSON into a few thousand map entries.
 *
 * Rebuilt lazily: if nobody runs /lowestbin, we never pay for it.
 */

const TTL_MS = 5 * 60 * 1000;
const CONCURRENCY = 6;

let index = null;
let builtAt = 0;
let building = null;

async function fetchPage(page) {
  try {
    return await getAuctionPage(page);
  } catch {
    // One bad page shouldn't sink the whole index; we just lose those listings
    // until the next rebuild.
    return null;
  }
}

async function build() {
  const first = await getAuctionPage(0);
  const totalPages = first.totalPages ?? 1;
  const cheapest = new Map();

  const absorb = payload => {
    for (const auction of payload?.auctions ?? []) {
      if (!auction.bin) continue;

      const name = auction.item_name;
      const price = auction.starting_bid;
      if (!name || typeof price !== 'number') continue;

      const current = cheapest.get(name);
      if (!current || price < current.price) {
        cheapest.set(name, { price, tier: auction.tier ?? null });
      }
    }
  };

  absorb(first);

  // Plain batched loop rather than a worker pool - 51 pages doesn't justify
  // anything fancier, and it keeps us from hammering the API all at once.
  for (let page = 1; page <= totalPages - 1; page += CONCURRENCY) {
    const batch = [];
    for (let offset = 0; offset < CONCURRENCY && page + offset < totalPages; offset++) {
      batch.push(fetchPage(page + offset));
    }
    (await Promise.all(batch)).forEach(absorb);
  }

  return cheapest;
}

export async function lowestBinIndex() {
  if (index && Date.now() - builtAt < TTL_MS) return index;
  if (building) return building;

  building = build()
    .then(result => {
      index = result;
      builtAt = Date.now();
      return result;
    })
    .finally(() => {
      building = null;
    });

  return building;
}

export function indexAge() {
  return builtAt ? Date.now() - builtAt : null;
}
