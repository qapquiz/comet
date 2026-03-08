# comet

Analyze Solana DeFi positions from Meteora DLMM pools with OHLCV support, position tracking, and PnL calculations.

## Installation

```bash
npm install comet
```

## Development

```bash
bun install
bun run build
```

## Usage

```typescript
import { Connection, PublicKey } from "@solana/web3.js";
import {
	getCurrentSolPrice,
	getSolPriceByTimestamp,
	getAllUserPositions,
	getPositionSummaries,
	getInitialDeposits,
	getUpnl,
} from "comet";

const connection = new Connection(process.env.RPC_URL!);
const walletAddress = new PublicKey("YOUR_WALLET_ADDRESS");

// Get current SOL price
const currentPrice = await getCurrentSolPrice({ connection });

// Get historical SOL price
const historicalPrice = await getSolPriceByTimestamp({
	timestamp: Math.floor(Date.now() / 1000),
});

// Get UPnL for wallet positions
const upnl = await getUpnl({ connection, walletAddress });
```

## API

### Price Functions

#### `getCurrentSolPrice(params)`

Get the current SOL price from a DLMM pool.

```typescript
const price = await getCurrentSolPrice({
	connection,
	poolAddress?: PublicKey, // defaults to SOL/USDC pool
});
```

#### `getSolPriceByTimestamp(params)`

Get the SOL price at a specific timestamp using OHLCV data.

```typescript
const price = await getSolPriceByTimestamp({
	timestamp: number,
	poolAddress?: PublicKey, // defaults to SOL/USDC pool
	timeframe?: string, // defaults to "1h"
});
```

### OHLCV Functions

#### `fetchOHLCV(params)`

Fetch OHLCV candlestick data from Meteora's DLMM API.

```typescript
const ohlcv = await fetchOHLCV({
	poolAddress: PublicKey,
	timeframe?: string, // defaults to "1h"
	endTime?: number,
});
```

#### `getLatestCandle(ohlcvData)`

Extract the most recent candle from OHLCV data.

```typescript
const latestCandle = getLatestCandle(ohlcvData);
```

### Position Functions

#### `getAllUserPositions(params)`

Fetch all DLMM liquidity positions for a wallet.

```typescript
const positions = await getAllUserPositions({
	connection,
	walletAddress: PublicKey,
});
// Returns: Map<string, PositionInfo> | null
```

#### `getLbPairWithLbPositions(positions)`

Group positions by their LB pair address.

```typescript
const pairs = getLbPairWithLbPositions(positions);
// Returns: Record<PairAddress, MetPosition>
```

#### `getPositionSummaries(positions, connection)`

Aggregate position data with token amounts, fees, and SOL values.

```typescript
const summaries = await getPositionSummaries(positions, connection);
// Returns: PositionSummary[]
```

### Deposit Functions

#### `getInitialDeposits(params)`

Find initial deposit amounts for each position from transaction history.

```typescript
const deposits = await getInitialDeposits({
	connection,
	walletAddress: PublicKey,
	maxSignatures?: number, // defaults to 50
	positions?: Map<string, PositionInfo>, // optional pre-fetched
	summaries?: PositionSummary[], // optional pre-fetched
});
// Returns: Map<string, InitialDeposit>
```

### PnL Functions

#### `getUpnl(params)`

Calculate Unrealized PnL comparing current values vs initial deposits.

```typescript
const result = await getUpnl({
	connection,
	walletAddress: PublicKey,
	maxSignatures?: number,
});
// Returns: UpnlResult | null
```

Returns:
- `initialDepositInSol` - Total initial deposit value
- `currentValueInSol` - Current position value
- `unclaimedFeesInSol` - Unclaimed fee value
- `upnl` - Unrealized PnL (current - initial)
- `upnlWithFees` - UPnL including unclaimed fees
- `upnlPercent` - UPnL as percentage
- `upnlWithFeesPercent` - UPnL with fees as percentage

## Examples

See the `examples/` directory for usage examples:

- `example.ts` - Basic SOL price fetching
- `getPositionsExample.ts` - Fetch and display user positions
- `getInitialDepositExample.ts` - Find initial deposits for positions
- `getUpnlBestPath.ts` - Calculate UPnL for a wallet
- `checkTotalValue.ts` - Calculate total value breakdown

## Environment

Set `RPC_URL` in your `.env` file:

```
RPC_URL=https://api.mainnet-beta.solana.com
```
