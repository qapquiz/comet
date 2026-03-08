import { Connection, PublicKey } from "@solana/web3.js";
import {
	getAllUserPositions,
	getPositionSummaries,
	type PositionSummary,
} from "./positions";

function printPositionSummaries(summaries: PositionSummary[]): void {
	for (const summary of summaries) {
		for (const address of summary.positionAddresses) {
            console.log(`Position Address: ${address}`);
        }
        console.log(`Pair: ${summary.pairAddress}`);
        console.log(`Token X Amount: ${summary.tokenXAmount}`);
        console.log(`Token Y Amount: ${summary.tokenYAmount}`);
        console.log(`Token X Mint: ${summary.tokenXMint}`);
        console.log(`Token Y Mint: ${summary.tokenYMint}`);
        console.log(`Unclaimed Fee X: ${summary.unclaimedFeeX}`);
        console.log(`Unclaimed Fee Y: ${summary.unclaimedFeeY}`);
        console.log(`Claimed Fee X: ${summary.claimedFeeX}`);
        console.log(`Claimed Fee Y: ${summary.claimedFeeY}`);
        console.log(`Deposit Value in SOL: ${summary.depositValueInSol}`);
        console.log("---");
    }
}

const connection = new Connection(process.env.RPC_URL!);
const walletAddress = new PublicKey(
	"87bdcSg4zvjExbvsUSbGifYUp75JdLhLafjgwvCjzjkA",
);

const positions = await getAllUserPositions({
	connection,
	walletAddress
});

if (positions) {
    const summaries = await getPositionSummaries(positions, connection)
    printPositionSummaries(summaries)
} else {
    console.log(`no positions found for wallet ${walletAddress.toString()}`)
}
