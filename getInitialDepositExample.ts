import { Connection, PublicKey } from "@solana/web3.js";
import { getInitialDeposits } from "./initialDeposit";

const RPC_URL = process.env.HELIUS_RPC_URL || process.env.RPC_URL;

if (!RPC_URL) {
	console.error("RPC_URL environment variable is required");
	process.exit(1);
}

const connection = new Connection(RPC_URL);

const walletAddress = process.argv[2];
if (!walletAddress) {
	console.error("Usage: bun run getInitialDepositExample.ts <wallet_address>");
	process.exit(1);
}

const wallet = new PublicKey(walletAddress);

console.log(`Fetching initial deposits for: ${wallet.toBase58()}\n`);

try {
	const deposits = await getInitialDeposits({
		connection,
		walletAddress: wallet,
	});

	if (deposits.size === 0) {
		console.log("No initial deposits found");
		process.exit(0);
	}

	console.log(`Found ${deposits.size} initial deposits:\n`);

	for (const [posAddr, deposit] of deposits) {
		console.log(`Position: ${posAddr}`);
		console.log(`  Pair: ${deposit.pairAddress}`);
		console.log(`  Signature: ${deposit.transactionSignature}`);
		console.log(`  Timestamp: ${new Date(deposit.timestamp * 1000).toISOString()}`);
		console.log(`  Token X: ${deposit.tokenXAmount} (${deposit.tokenXMint})`);
		console.log(`  Token Y: ${deposit.tokenYAmount} (${deposit.tokenYMint})`);
		console.log(`  Value in SOL: ${deposit.valueInSol}`);
		console.log(`  Value in USD: ${deposit.valueInUsd ?? "N/A"}`);
		console.log();
	}
} catch (error) {
	console.error("Error:", error);
	process.exit(1);
}
