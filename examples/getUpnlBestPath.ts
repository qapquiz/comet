import { Connection, PublicKey } from "@solana/web3.js";
import { getUpnl } from "../upnl";

const connection = new Connection("https://api.mainnet.solana.com");

const walletAddress = process.argv[2];
const heliusApiKey = process.argv[3];
if (!walletAddress || !heliusApiKey) {
	console.error("Usage: bun run getUpnlBestPath.ts <wallet_address> <helius_api_key>");
	process.exit(1);
}

const wallet = new PublicKey(walletAddress);

/*
 * Uses Helius for faster transaction parsing with more accurate price data
 */

const result = await getUpnl({ connection, walletAddress: wallet, heliusApiKey });

if (!result) {
	console.log("No positions found");
	process.exit(0);
}

console.log(`Initial Deposit: ${result.initialDepositInSol.toFixed(6)} SOL`);
console.log(`Current Value: ${result.currentValueInSol.toFixed(6)} SOL`);
console.log(`Unclaimed Fees: ${result.unclaimedFeesInSol.toFixed(6)} SOL`);
console.log(`---`);
console.log(
	`uPnL: ${result.upnl >= 0 ? "+" : ""}${result.upnl.toFixed(6)} SOL (${result.upnlPercent.toFixed(2)}%)`,
);
console.log(
	`uPnL + Fees: ${result.upnlWithFees >= 0 ? "+" : ""}${result.upnlWithFees.toFixed(6)} SOL (${result.upnlWithFeesPercent.toFixed(2)}%)`,
);
