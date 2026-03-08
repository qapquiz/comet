# AGENTS.md - Coding Agent Instructions for Comet

## Project Overview
Comet is a Bun-based TypeScript project for analyzing Solana DeFi data using Meteora DLMM pools. It fetches OHLCV (Open-High-Low-Close-Volume) data to analyze historical price movements.

## Environment & Runtime
- **Runtime**: Bun v1.3.9 or later
- **Language**: TypeScript 5+ (strict mode)
- **Module System**: ES Modules (`"type": "module"`)

## Commands

### Dependencies
```bash
bun install
```

### Running the Application
```bash
bun run index.ts
```

### Running a Single Test
No test framework is currently configured. If adding tests:
- Consider using Bun's built-in test runner (`bun test`)
- Tests should be placed in `__tests__/` or `test/` directories
- Pattern: `bun test path/to/test_file.test.ts`

### Linting & Formatting
No linting/formatting tools are currently configured. Recommended additions:
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier or Biome
- **Pre-commit**: Consider adding lint-staged for consistency

## Code Style Guidelines

### TypeScript Configuration
- Target: ESNext
- Strict mode enabled
- No unchecked indexed access
- No implicit overrides
- Verbatim module syntax enabled

### Import Ordering & Style
- Use named imports when possible: `import { Connection, PublicKey } from "@solana/web3.js"`
- Default imports for specific classes: `import DLMM from "@meteora-ag/dlmm"`
- Third-party imports first, relative imports second
- No extension in import paths (`.ts` not required due to `allowImportingTsExtensions: true`)

### Naming Conventions
- **Constants**: UPPER_SNAKE_CASE (e.g., `SOL_USDC_POOL`, `RPC_URL`)
- **Interfaces/Types**: PascalCase with descriptive names (e.g., `OHLCVCandle`, `OHLCVResponse`)
- **Variables**: camelCase (e.g., `connection`, `usdcDlmmPool`)
- **Functions**: camelCase with descriptive verbs (e.g., `getActiveBin`, `fetchPriceData`)
- **File names**: camelCase or kebab-case, match export name when possible

### Type Definitions
- Define interfaces for external API responses (see `OHLCVCandle`, `OHLCVResponse`)
- Use type assertions sparingly: `as OHLCVResponse` (prefer runtime validation)
- Always type function parameters and return values
- Use `publicKey!` assertion when confident environment variables exist

### Error Handling
- Validate array existence and length before accessing: `if (data && data.length > 0)`
- Provide meaningful console messages for missing data
- Use nullish coalescing (`??`) for fallback values
- Consider try/catch blocks for external API calls and Solana operations

### Code Organization
- Top-level constants defined before main logic
- Connection initialization early in the file
- Data fetching operations separated from presentation logic
- Use async/await for asynchronous operations (top-level await supported)
- Keep main execution flow clear and linear

### Solana/Web3 Specifics
- Use `process.env.RPC_URL!` for RPC endpoint (required env var)
- PublicKeys should be created from known addresses as constants
- DLMM pool initialization pattern: `DLMM.create(connection, poolAddress)`
- Cache pool instances when making multiple queries

### Environment Variables
- Required: `RPC_URL` - Solana RPC endpoint
- Store in `.env` file (gitignored)
- Access via `process.env.VARIABLE_NAME!` when mandatory

### Formatting & Spacing
- Indentation: Tabs or 2 spaces (check existing code)
- Use template literals for string interpolation with variables
- Blank lines between logical sections
- Trailing commas in multi-line objects/arrays

### API Integration Patterns
- Use fetch API for HTTP requests
- Define response interfaces for type safety
- Parse JSON responses with type assertions
- Handle missing data gracefully (console.log with helpful message)

## Testing Guidelines
When adding tests:
- Test data fetching and parsing logic
- Mock external API calls and RPC connections
- Verify error handling for missing/invalid data
- Test with various timeframes and pool addresses
- Consider snapshot testing for consistent outputs

## Dependencies
- `@solana/web3.js` - Solana blockchain interaction
- `@meteora-ag/dlmm` - Meteora Dynamic Liquidity Market Maker
- `@coral-xyz/anchor` - Anchor framework for Solana programs
