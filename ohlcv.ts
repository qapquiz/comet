import { PublicKey } from "@solana/web3.js";

interface OHLCVCandle {
	timestamp: number;
	timestamp_str: string;
	open: number;
	high: number;
	low: number;
	close: number;
	volume: number;
}

interface OHLCVResponse {
	start_time: number;
	end_time: number;
	timeframe: string | null;
	data: OHLCVCandle[];
}

interface FetchOHLCVParams {
	poolAddress: PublicKey | string;
	timeframe?: string;
	endTime?: number;
}

interface PairPrice {
	price: number;
	poolAddress: string;
}

async function fetchOHLCV(
	params: FetchOHLCVParams,
): Promise<OHLCVResponse | null> {
	const { poolAddress, timeframe = "1h", endTime } = params;
	const address = typeof poolAddress === "string" ? poolAddress : poolAddress.toString();
	const url = `https://dlmm.datapi.meteora.ag/pools/${address}/ohlcv?timeframe=${timeframe}${endTime ? `&end_time=${endTime}` : ""}`;

	try {
		const response = await fetch(url);
		const ohlcvData = (await response.json()) as OHLCVResponse;
		return ohlcvData;
	} catch (error) {
		console.error(`Failed to fetch OHLCV data: ${error}`);
		return null;
	}
}

function getLatestCandle(ohlcvData: OHLCVResponse): OHLCVCandle | null {
	if (ohlcvData.data && ohlcvData.data.length > 0) {
		return ohlcvData.data[ohlcvData.data.length - 1] ?? null;
	}
	return null;
}

async function getPairPriceByTimestamp(
	poolAddress: PublicKey | string,
	timestamp: number,
	timeframe: string = "1h",
): Promise<PairPrice | null> {
	const ohlcv = await fetchOHLCV({
		poolAddress,
		timeframe,
		endTime: timestamp,
	});

	if (!ohlcv) return null;

	const candle = getLatestCandle(ohlcv);
	if (!candle) return null;

	return {
		price: candle.close,
		poolAddress: typeof poolAddress === "string" ? poolAddress : poolAddress.toString(),
	};
}

export type {
	OHLCVCandle,
	OHLCVResponse,
	FetchOHLCVParams,
	PairPrice,
};
export {
	fetchOHLCV,
	getLatestCandle,
	getPairPriceByTimestamp,
};
