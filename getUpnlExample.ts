import { Connection, PublicKey } from "@solana/web3.js";
import { getUpnl } from "./upnl";

const RPC_URL = process.env.HELIUS_RPC_URL || process.env.RPC_URL;
if (!RPC_URL) {
	console.error("RPC_URL environment variable is required");
	process.exit(1);
}

const connection = new Connection(RPC_URL);

const walletAddress = process.argv[2];
if (!walletAddress) {
	console.error("Usage: bun run getUpnlExample.ts <wallet_address>");
	process.exit(1);
}

const wallet = new PublicKey(walletAddress);

const result = await getUpnl({ connection, walletAddress: wallet });

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
