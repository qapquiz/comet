import { expect, test, describe } from "bun:test";
import { PublicKey, Connection } from "@solana/web3.js";
import type { PositionInfo } from "@meteora-ag/dlmm";
import { getUpnl } from "../src/upnl";
import { TEST_WALLET } from "./helpers";

describe("uPnL Module", () => {
	test("getUpnl should calculate PnL correctly", async () => {
		const pairAddress = new PublicKey("D4hJ1x6tPaPj46X9PuXq8sM2YFhFKZt6U2QxJ8H9zKg");
		const mockPosition: any = {
			lbPair: pairAddress,
			publicKey: pairAddress,
			tokenX: {
				mint: {
					address: new PublicKey("So11111111111111111111111111111111111111112"),
					decimals: 9,
				},
				reserve: new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"),
				amount: BigInt("2000000000"),
			},
			tokenY: {
				mint: {
					address: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
					decimals: 6,
				},
				reserve: new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"),
				amount: BigInt("100000000"),
			},
			lbPairPositionsData: [
				{
					publicKey: new PublicKey("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"),
					positionData: {
						totalXAmount: "2000000000",
						totalYAmount: "100000000",
						feeX: "100000000",
						feeY: "10000000",
						totalClaimedFeeXAmount: "0",
						totalClaimedFeeYAmount: "0",
						rewardOne: "0",
						rewardTwo: "0",
					},
				},
			],
		};

		const dlmmModule = await import("@meteora-ag/dlmm");
		(dlmmModule.default as any).getAllLbPairPositionsByUser = () =>
			Promise.resolve(new Map([["pair1", mockPosition as PositionInfo]]));
		(dlmmModule.default as any).create = () =>
			Promise.resolve({
				getActiveBin: () => Promise.resolve({ pricePerToken: "100" }),
			});

		const originalFetch = globalThis.fetch;
		(globalThis as any).fetch = () =>
			Promise.resolve({
				json: () => Promise.resolve([]),
			} as Response);

		const mockConnection = {} as Connection;
		const result = await getUpnl({
			connection: mockConnection,
			walletAddress: TEST_WALLET,
			heliusApiKey: "test-api-key",
		});

		expect(result).not.toBeNull();

		(globalThis as any).fetch = originalFetch;
	});

	test("getUpnl should return null when no positions", async () => {
		const dlmmModule = await import("@meteora-ag/dlmm");
		(dlmmModule.default as any).getAllLbPairPositionsByUser = () => Promise.resolve(new Map());

		const mockConnection = {} as Connection;
		const result = await getUpnl({
			connection: mockConnection,
			walletAddress: TEST_WALLET,
			heliusApiKey: "test-api-key",
		});

		expect(result).toBeNull();
	});
});
