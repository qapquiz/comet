import { Connection } from "@solana/web3.js";
import { getCurrentSolPrice, getSolPriceByTimestamp } from "../solPrice";

const connection = new Connection("https://api.mainnet.solana.com");
const currentPrice = await getCurrentSolPrice({
	connection,
});

if (currentPrice !== null) {
	console.log(`Current SOL/USDC price: ${currentPrice}`);
} else {
	console.log('Failed to get current SOL price');
}

const fiftyDaysAgo = Math.floor((Date.now() - 50 * 24 * 60 * 60 * 1000) / 1000);
const historicalPrice = await getSolPriceByTimestamp({
	timestamp: fiftyDaysAgo,
});

if (historicalPrice !== null) {
	console.log(`SOL/USDC price 50 days ago: ${historicalPrice}`);
} else {
	console.log('Failed to get historical SOL price');
}