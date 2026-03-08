import { Connection, PublicKey } from "@solana/web3.js";
import DLMM from "@meteora-ag/dlmm";
import { fetchOHLCV, getLatestCandle } from "./ohlcv";

const SOL_USDC_POOL = new PublicKey(
	"BGm1tav58oGcsQJehL9WXBFXF7D27vZsKefj4xJKD5Y",
);

interface GetCurrentPriceParams {
	connection: Connection;
	poolAddress?: PublicKey;
}

interface GetPriceByTimestampParams {
	poolAddress?: PublicKey;
	timestamp: number;
	timeframe?: string;
}

async function getCurrentSolPrice(
	params: GetCurrentPriceParams,
): Promise<number | null> {
	const { connection, poolAddress = SOL_USDC_POOL } = params;

	try {
		const dlmmPool = await DLMM.create(connection, poolAddress);
		const activeBin = await dlmmPool.getActiveBin();

		if (!activeBin || !activeBin.pricePerToken) {
			console.error("No active bin found or price unavailable");
			return null;
		}

		return parseFloat(activeBin.pricePerToken);
	} catch (error) {
		console.error(`Failed to get current SOL price: ${error}`);
		return null;
	}
}

async function getSolPriceByTimestamp(
	params: GetPriceByTimestampParams,
): Promise<number | null> {
	const { poolAddress = SOL_USDC_POOL, timestamp, timeframe = "1h" } = params;

	try {
		const ohlcvData = await fetchOHLCV({
			poolAddress,
			timeframe,
			endTime: timestamp,
		});

		if (!ohlcvData) {
			console.error("Failed to fetch OHLCV data");
			return null;
		}

		const candle = getLatestCandle(ohlcvData);

		if (!candle) {
			console.error("No candle found for the given timestamp");
			return null;
		}

		return candle.close;
	} catch (error) {
		console.error(`Failed to get SOL price by timestamp: ${error}`);
		return null;
	}
}

export type { GetCurrentPriceParams, GetPriceByTimestampParams };
export { getCurrentSolPrice, getSolPriceByTimestamp };
