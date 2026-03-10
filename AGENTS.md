# AGENTS.md - Coding Guidelines for comet

This file provides guidelines for AI agents working on the comet codebase (Meteora DLMM helper library).

## Build & Development Commands

```bash
# Install dependencies
bun install

# Build the project
bun run build

# Development with watch mode
bun run dev

# Run all tests
bun run test

# Run a single test file
bun test test/index.test.ts

# Run tests with coverage
bun run test:coverage

# Run tests in watch mode
bun run test:watch

# Lint code
bun run lint

# Format code
bun run format

# Type check without emitting
bun run type-check
```

## Code Style Guidelines

### Formatting
- **Indentation**: Use tabs (configured in `.editorconfig`)
- **Quotes**: Use single quotes for strings
- **Line endings**: LF (Unix-style)
- **Trailing whitespace**: Trim automatically
- **Final newline**: Always include

### TypeScript Configuration
- Target: ESNext with module preservation
- Strict mode enabled
- `verbatimModuleSyntax: true` - use `import type` for type-only imports
- `noUncheckedIndexedAccess: true` - handle potentially undefined array/object access
- `isolatedDeclarations: true` - ensure each file can be type-checked independently

### Naming Conventions
- **Files**: camelCase for source files (e.g., `positions.ts`, `solPrice.ts`)
- **Interfaces**: PascalCase (e.g., `PositionSummary`, `FetchOHLCVParams`)
- **Types**: PascalCase (e.g., `PairAddress`)
- **Functions**: camelCase (e.g., `getAllUserPositions`, `fetchOHLCV`)
- **Variables**: camelCase

### Import Patterns
- Use ES modules with `type: "module"`
- Prefer named exports over default exports
- Use `import type` for type-only imports when using `verbatimModuleSyntax`

Example:
```typescript
import { Connection, PublicKey } from "@solana/web3.js";
import DLMM, {
	type LbPosition,
	type PositionInfo,
} from "@meteora-ag/dlmm";
```

### Function Patterns
- Use async/await for asynchronous operations
- Return typed Promises: `Promise<Type | null>`
- Wrap async operations in try/catch blocks
- Return `null` on errors after logging (consistent pattern in this codebase)

Example:
```typescript
async function fetchData(params: Params): Promise<Result | null> {
	try {
		const data = await someAsyncOperation();
		return data;
	} catch (error) {
		console.error(`Failed to fetch data: ${error}`);
		return null;
	}
}
```

### Error Handling
- Log errors with `console.error()` including context
- Return `null` for failed operations rather than throwing
- Type-safe error handling with null checks

### Interface Definitions
- Define params interfaces for function inputs: `XxxParams`
- Define return interfaces for complex return types
- Use readonly where appropriate
- Document units (e.g., lamports vs SOL, timestamps)

### Exports
- Export types separately from implementations
- Group related exports at file end:

```typescript
export type { Interface1, Interface2, TypeAlias };
export { function1, function2 };
```

## Project Structure

```
src/
├── index.ts          # Main exports
├── positions.ts      # DLMM position management
├── ohlcv.ts          # OHLCV data fetching
├── solPrice.ts       # SOL price utilities
├── upnl.ts           # Unrealized PnL calculations
└── initialDepositHelius.ts  # Helius integration

test/
└── index.test.ts     # Test suite
```

## Git Hooks

Pre-commit hooks run automatically:
- `bun run lint` - Code linting
- `bun run type-check` - TypeScript validation

## Commit Conventions

Follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` New features
- `fix:` Bug fixes
- `docs:` Documentation changes
- `style:` Code style/formatting
- `refactor:` Code refactoring
- `perf:` Performance improvements
- `test:` Test changes
- `chore:` Maintenance tasks

## Dependencies

Key dependencies to be aware of:
- `@meteora-ag/dlmm` - DLMM SDK
- `@solana/web3.js` - Solana web3
- `@coral-xyz/anchor` - Anchor framework
- Uses Bun runtime (not Node.js)

## Common Constants

- SOL mint address: `"So11111111111111111111111111111111111111112"`
- Uses Meteora AG DLMM API endpoints
- Supports both PublicKey objects and base58 strings for addresses
