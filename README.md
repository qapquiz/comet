# comet

Meteora DLMM helper library for Solana

## Installation

```bash
bun add comet
```

## Features

- **Position Management** - Get all DLMM positions for a wallet with detailed summaries
- **Unrealized PnL** - Calculate unrealized PnL for positions with fee tracking
- **SOL Price** - Get current and historical SOL prices from DLMM pools
- **OHLCV Data** - Fetch candlestick data for trading analysis
- **Initial Deposits** - Track initial deposit values via Helius

## Usage

```typescript
import { Connection, PublicKey } from "@solana/web3.js";
import { getAllUserPositions, getUpnl, getCurrentSolPrice } from "comet";

const connection = new Connection("https://api.mainnet-beta.solana.com");
const wallet = new PublicKey("...");

// Get all positions for a wallet
const positions = await getAllUserPositions({
  connection,
  walletAddress: wallet,
});

// Calculate unrealized PnL
const upnl = await getUpnl({
  connection,
  walletAddress: wallet,
  heliusApiKey: "your-helius-api-key",
});

// Get current SOL price
const solPrice = await getCurrentSolPrice({ connection });
```

## API

### Positions

- `getAllUserPositions(params)` - Get all DLMM positions for a wallet
- `getPositionSummaries(params)` - Get detailed position summaries with values

### PnL

- `getUpnl(params)` - Calculate unrealized PnL including fees

### Price

- `getCurrentSolPrice(params)` - Get current SOL price from DLMM pool
- `getSolPriceByTimestamp(params)` - Get SOL price at a specific timestamp

### OHLCV

- `fetchOHLCV(params)` - Fetch candlestick data for analysis

## Requirements

- Solana web3.js
- Meteora DLMM SDK
- Helius API key (for PnL and initial deposit features)

## Contributing

Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## License

MIT
