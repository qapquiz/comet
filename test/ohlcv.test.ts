import { expect, test, describe, beforeEach, afterEach } from "bun:test";
import { PublicKey } from "@solana/web3.js";
import { fetchOHLCV, getLatestCandle, getPairPriceByTimestamp } from "../src/ohlcv";
import { SOL_USDC_POOL, mockOHLCVResponse, type FetchType } from "./helpers";

describe("OHLCV Module", () => {
	let originalFetch: FetchType;

	beforeEach(() => {
		originalFetch = globalThis.fetch;
	});

	afterEach(() => {
		globalThis.fetch = originalFetch;
	});

	test("fetchOHLCV should return OHLCV data", async () => {
		(globalThis as any).fetch = () =>
			Promise.resolve({
				json: () => Promise.resolve(mockOHLCVResponse),
			} as Response);

		const result = await fetchOHLCV({
			poolAddress: SOL_USDC_POOL,
			timeframe: "1h",
		});

		expect(result).not.toBeNull();
		expect(result?.data).toHaveLength(2);
		expect(result?.timeframe).toBe("1h");
		expect(result?.data[0].close).toBe(102);

		(globalThis as any).fetch = originalFetch;
	});

	test("fetchOHLCV should accept PublicKey", async () => {
		(globalThis as any).fetch = () =>
			Promise.resolve({
				json: () => Promise.resolve(mockOHLCVResponse),
			} as Response);

		const result = await fetchOHLCV({
			poolAddress: new PublicKey(SOL_USDC_POOL),
			timeframe: "1h",
		});

		expect(result).not.toBeNull();
		expect(result?.data).toHaveLength(2);

		(globalThis as any).fetch = originalFetch;
	});

	test("fetchOHLCV should return null on error", async () => {
		(globalThis as any).fetch = () => Promise.reject(new Error("Network error"));

		const result = await fetchOHLCV({
			poolAddress: SOL_USDC_POOL,
		});

		expect(result).toBeNull();

		(globalThis as any).fetch = originalFetch;
	});

	test("fetchOHLCV should include endTime when provided", async () => {
		let capturedUrl = "";
		(globalThis as any).fetch = (url: string | URL | Request) => {
			capturedUrl = url.toString();
			return Promise.resolve({
				json: () => Promise.resolve(mockOHLCVResponse),
			} as Response);
		};

		await fetchOHLCV({
			poolAddress: SOL_USDC_POOL,
			timeframe: "1h",
			endTime: 1704153600,
		});

		expect(capturedUrl).toContain("end_time=1704153600");

		(globalThis as any).fetch = originalFetch;
	});

	test("getLatestCandle should return the last candle", () => {
		const candle = getLatestCandle(mockOHLCVResponse);

		expect(candle).not.toBeNull();
		expect(candle?.close).toBe(106);
		expect(candle?.timestamp).toBe(1704070800);
	});

	test("getLatestCandle should return null for empty data", () => {
		const result = getLatestCandle({ ...mockOHLCVResponse, data: [] });

		expect(result).toBeNull();
	});

	test("getPairPriceByTimestamp should return price", async () => {
		(globalThis as any).fetch = () =>
			Promise.resolve({
				json: () => Promise.resolve(mockOHLCVResponse),
			} as Response);

		const result = await getPairPriceByTimestamp(SOL_USDC_POOL, 1704153600, "1h");

		expect(result).not.toBeNull();
		expect(result?.price).toBe(106);
		expect(result?.poolAddress).toBe(SOL_USDC_POOL);

		(globalThis as any).fetch = originalFetch;
	});

	test("getPairPriceByTimestamp should return null on failure", async () => {
		(globalThis as any).fetch = () => Promise.reject(new Error("Network error"));

		const result = await getPairPriceByTimestamp(SOL_USDC_POOL, 1704153600, "1h");

		expect(result).toBeNull();

		(globalThis as any).fetch = originalFetch;
	});
});
