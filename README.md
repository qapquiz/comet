# comet

Fetch SOL/USDC price data from Meteora DLMM pools with OHLCV support.

## Development

To install dependencies:

```bash
bun install
```

To build:

```bash
bun run build
```

To run the example:

```bash
bun run example.ts
```

Note: You need to set `RPC_URL` in your `.env` file for the example to work.


## Installation

```bash
npm install comet
```

## Usage

```typescript
import { Connection } from "@solana/web3.js";
import { getCurrentSolPrice, getSolPriceByTimestamp } from "comet";

const connection = new Connection("YOUR_RPC_URL");

const currentPrice = await getCurrentSolPrice({ connection });
console.log(`Current SOL/USDC price: ${currentPrice}`);

const timestamp = Math.floor(Date.now() / 1000);
const historicalPrice = await getSolPriceByTimestamp({ timestamp });
console.log(`Historical SOL/USDC price: ${historicalPrice}`);
```

## API

### getCurrentSolPrice

Get the current SOL price from a DLMM pool.

```typescript
const price = await getCurrentSolPrice({
  connection,
  poolAddress?: PublicKey, // defaults to SOL/USDC pool
});
```

### getSolPriceByTimestamp

Get the SOL price at a specific timestamp using OHLCV data.

```typescript
const price = await getSolPriceByTimestamp({
  timestamp,
  poolAddress?: PublicKey, // defaults to SOL/USDC pool
  timeframe?: string, // defaults to "1h"
});
```
