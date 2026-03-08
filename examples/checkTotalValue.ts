import { Connection, PublicKey } from "@solana/web3.js";
import {
	getAllUserPositions,
	getPositionSummaries,
	type PositionSummary,
} from "../positions";

interface TotalValues {
	totalDepositValueInSol: number;
	totalUnclaimedFeeValueInSol: number;
	totalClaimedFeeValueInSol: number;
	grandTotalInSol: number;
}

function calculateTotals(summaries: PositionSummary[]): TotalValues {
	const totals = summaries.reduce(
		(acc, summary) => {
			acc.totalDepositValueInSol += summary.depositValueInSol;
			acc.totalUnclaimedFeeValueInSol += summary.unclaimedFeeValueInSol;
			acc.totalClaimedFeeValueInSol += summary.claimedFeeValueInSol;
			return acc;
		},
		{
			totalDepositValueInSol: 0,
			totalUnclaimedFeeValueInSol: 0,
			totalClaimedFeeValueInSol: 0,
			grandTotalInSol: 0,
		} as TotalValues,
	);

	totals.grandTotalInSol =
		totals.totalDepositValueInSol +
		totals.totalUnclaimedFeeValueInSol +
		totals.totalClaimedFeeValueInSol;

	return totals;
}

function printTotals(totals: TotalValues, summaries: PositionSummary[]): void {
	console.log("\n=== POSITION DETAILS ===\n");
	for (const summary of summaries) {
		console.log(`Pair: ${summary.pairAddress}`);
		console.log(`Token X (${summary.tokenXMint.slice(0, 8)}...): ${summary.tokenXAmount.toFixed(6)}`);
		console.log(`Token Y (${summary.tokenYMint.slice(0, 8)}...): ${summary.tokenYAmount.toFixed(6)}`);
		console.log(`Deposit Value: ${summary.depositValueInSol.toFixed(6)} SOL`);
		console.log(`Unclaimed Fee Value: ${summary.unclaimedFeeValueInSol.toFixed(6)} SOL`);
		console.log("---");
	}
	
	console.log("\n=== TOTAL VALUE BREAKDOWN ===\n");
	console.log(`1. Deposit Value:          ${totals.totalDepositValueInSol.toFixed(6)} SOL`);
	console.log(`2. Unclaimed Fee Value:    ${totals.totalUnclaimedFeeValueInSol.toFixed(6)} SOL`);
	console.log(`3. Claimed Fee Value:      ${totals.totalClaimedFeeValueInSol.toFixed(6)} SOL`);
	console.log("\n" + "─".repeat(40));
	console.log(`GRAND TOTAL:               ${totals.grandTotalInSol.toFixed(6)} SOL`);
	console.log("─".repeat(40) + "\n");
}

const connection = new Connection(process.env.RPC_URL!);
const walletAddress = new PublicKey(
	"87bdcSg4zvjExbvsUSbGifYUp75JdLhLafjgwvCjzjkA",
);

const positions = await getAllUserPositions({
	connection,
	walletAddress,
});

if (positions) {
	const summaries = await getPositionSummaries(positions, connection);
	const totals = calculateTotals(summaries);
	printTotals(totals, summaries);
	console.log(`Number of positions: ${summaries.length}`);
} else {
	console.log(`No positions found for wallet ${walletAddress.toString()}`);
}
