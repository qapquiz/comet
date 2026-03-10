import { PublicKey } from "@solana/web3.js";
import type { OHLCVResponse } from "../src/ohlcv";

export const SOL_USDC_POOL = "BGm1tav58oGcsQJehL9WXBFXF7D27vZsKefj4xJKD5Y";
export const TEST_WALLET = new PublicKey("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU");

export const mockOHLCVResponse: OHLCVResponse = {
	start_time: 1704067200,
	end_time: 1704153600,
	timeframe: "1h",
	data: [
		{
			timestamp: 1704067200,
			timestamp_str: "2024-01-01T00:00:00Z",
			open: 100,
			high: 105,
			low: 98,
			close: 102,
			volume: 1000,
		},
		{
			timestamp: 1704070800,
			timestamp_str: "2024-01-01T01:00:00Z",
			open: 102,
			high: 108,
			low: 101,
			close: 106,
			volume: 1500,
		},
	],
};

export type FetchType = typeof fetch;
