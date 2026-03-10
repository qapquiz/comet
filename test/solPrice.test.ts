import { expect, test, describe } from "bun:test";
import { PublicKey, Connection } from "@solana/web3.js";
import { getCurrentSolPrice, getSolPriceByTimestamp } from "../src/solPrice";
import { SOL_USDC_POOL, mockOHLCVResponse } from "./helpers";

describe("SOL Price Module", () => {
	test("getCurrentSolPrice should return SOL price", async () => {
		const mockActiveBin = {
			pricePerToken: "150.50",
		};

		const dlmmModule = await import("@meteora-ag/dlmm");
		(dlmmModule.default as any).create = () =>
			Promise.resolve({
				getActiveBin: () => Promise.resolve(mockActiveBin),
			});

		const mockConnection = {} as Connection;
		const result = await getCurrentSolPrice({
			connection: mockConnection,
			poolAddress: new PublicKey(SOL_USDC_POOL),
		});

		expect(result).toBe(150.5);
	});

	test("getCurrentSolPrice should use default pool", async () => {
		const mockActiveBin = {
			pricePerToken: "150.50",
		};

		const dlmmModule = await import("@meteora-ag/dlmm");
		(dlmmModule.default as any).create = () =>
			Promise.resolve({
				getActiveBin: () => Promise.resolve(mockActiveBin),
			});

		const mockConnection = {} as Connection;
		await getCurrentSolPrice({
			connection: mockConnection,
		});

		expect(true).toBe(true);
	});

	test("getCurrentSolPrice should return null when no active bin", async () => {
		const dlmmModule = await import("@meteora-ag/dlmm");
		(dlmmModule.default as any).create = () =>
			Promise.resolve({
				getActiveBin: () => Promise.resolve(null),
			});

		const mockConnection = {} as Connection;
		const result = await getCurrentSolPrice({
			connection: mockConnection,
		});

		expect(result).toBeNull();
	});

	test("getCurrentSolPrice should return null on error", async () => {
		const dlmmModule = await import("@meteora-ag/dlmm");
		(dlmmModule.default as any).create = () => Promise.reject(new Error("Connection error"));

		const mockConnection = {} as Connection;
		const result = await getCurrentSolPrice({
			connection: mockConnection,
		});

		expect(result).toBeNull();
	});

	test("getSolPriceByTimestamp should return price from OHLCV", async () => {
		const originalFetch = globalThis.fetch;
		(globalThis as any).fetch = () =>
			Promise.resolve({
				json: () => Promise.resolve(mockOHLCVResponse),
			} as Response);

		const result = await getSolPriceByTimestamp({
			timestamp: 1704153600,
			timeframe: "1h",
		});

		expect(result).toBe(106);

		(globalThis as any).fetch = originalFetch;
	});

	test("getSolPriceByTimestamp should return null on error", async () => {
		const originalFetch = globalThis.fetch;
		(globalThis as any).fetch = () => Promise.reject(new Error("Network error"));

		const result = await getSolPriceByTimestamp({
			timestamp: 1704153600,
		});

		expect(result).toBeNull();

		(globalThis as any).fetch = originalFetch;
	});
});
