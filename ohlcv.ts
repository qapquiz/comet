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
	poolAddress: PublicKey;
	timeframe?: string;
	endTime?: number;
}

async function fetchOHLCV(
	params: FetchOHLCVParams,
): Promise<OHLCVResponse | null> {
	const { poolAddress, timeframe = "1h", endTime } = params;
	const url = `https://dlmm.datapi.meteora.ag/pools/${poolAddress.toString()}/ohlcv?timeframe=${timeframe}${endTime ? `&end_time=${endTime}` : ""}`;

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

export type { OHLCVCandle, OHLCVResponse, FetchOHLCVParams };
export { fetchOHLCV, getLatestCandle };
