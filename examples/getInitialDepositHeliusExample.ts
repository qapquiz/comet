import { Connection, PublicKey } from "@solana/web3.js";
import { getInitialDepositsHelius } from "../initialDepositHelius";

const RPC_URL = process.env.RPC_URL!;
const WALLET_ADDRESS = process.env.WALLET_ADDRESS!;
const HELIUS_API_KEY = process.env.HELIUS_API_KEY!;

const connection = new Connection(RPC_URL, "confirmed");
const wallet = new PublicKey(WALLET_ADDRESS);

console.log(`Fetching initial deposits for: ${wallet.toBase58()}\n`);

const deposits = await getInitialDepositsHelius({
	connection,
	walletAddress: wallet,
	heliusApiKey: HELIUS_API_KEY,
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
