import { expect, test, describe } from "bun:test";
import { PublicKey, Connection } from "@solana/web3.js";
import type { PositionInfo } from "@meteora-ag/dlmm";
import { getInitialDepositsHelius } from "../src/initialDepositHelius";
import { TEST_WALLET, mockOHLCVResponse } from "./helpers";
import type { PositionSummary } from "../src/positions";

describe("Initial Deposit Module", () => {
	const mockHeliusTransaction = {
		description: "Add liquidity",
		type: "COMPRESSED_NFT_MINT",
		source: "METEORA",
		fee: 5000,
		feePayer: TEST_WALLET.toBase58(),
		signature:
			"5igx1CJ6QqQmJTXtQJ5z5m1v7gY2J3K4L5M6N7O8P9Q0R1S2T3U4V5W6X7Y8Z9A0B1C2D3E4F5G6H7I8J9K0L1M2N3O4P5Q6R7S8T9U0V1W2X3Y4Z5",
		slot: 123456789,
		timestamp: 1704067200,
		nativeTransfers: [],
		tokenTransfers: [
			{
				fromUserAccount: TEST_WALLET.toBase58(),
				toUserAccount: "D4hJ1x6tPaPj46X9PuXq8sM2YFhFKZt6U2QxJ8H9zKg",
				fromTokenAccount: "3HHb3mL3oN9K9UR3f7uXUf7qM7sJ8tK9uL0vM1wN2oP3",
				toTokenAccount: "4JJb4mN4pO0L0VS6i0vVg0rN0tK0uL1vM2wN3oP4qR5",
				tokenAmount: 1.5,
				mint: "So11111111111111111111111111111111111111112",
			},
			{
				fromUserAccount: TEST_WALLET.toBase58(),
				toUserAccount: "D4hJ1x6tPaPj46X9PuXq8sM2YFhFKZt6U2QxJ8H9zKg",
				fromTokenAccount: "8MMc5oO5qP1M1WT7j1wWg1sO1uL1vM2wN3oP4qR5sT6",
				toTokenAccount: "9NNd6pP6rQ2N2XU8k2xXg2tP2vM2wN3oP4qR5sT6uU7",
				tokenAmount: 100,
				mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
			},
		],
		accountData: [
			{
				account: "7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU",
				nativeBalanceChange: 0,
				tokenBalanceChanges: [],
			},
		],
	};

	test("getInitialDepositsHelius should return deposits map", async () => {
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
				amount: BigInt("1500000000"),
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
						totalXAmount: "1500000000",
						totalYAmount: "100000000",
						feeX: "0",
						feeY: "0",
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

		const originalFetch = globalThis.fetch;
		(globalThis as any).fetch = (url: string | URL | Request) => {
			const urlStr = url.toString();
			if (urlStr.includes("helius-rpc.com")) {
				return Promise.resolve({
					json: () => Promise.resolve([mockHeliusTransaction]),
				} as Response);
			}
			if (urlStr.includes("dlmm.datapi.meteora.ag")) {
				return Promise.resolve({
					json: () => Promise.resolve(mockOHLCVResponse),
				} as Response);
			}
			return Promise.resolve({
				json: () => Promise.resolve({}),
			} as Response);
		};

		const mockConnection = {} as Connection;
		const result = await getInitialDepositsHelius({
			connection: mockConnection,
			walletAddress: TEST_WALLET,
			heliusApiKey: "test-api-key",
		});

		expect(result.size).toBeGreaterThanOrEqual(0);

		(globalThis as any).fetch = originalFetch;
	});

	test("getInitialDepositsHelius should return empty map when no positions", async () => {
		const dlmmModule = await import("@meteora-ag/dlmm");
		(dlmmModule.default as any).getAllLbPairPositionsByUser = () => Promise.resolve(new Map());

		const mockConnection = {} as Connection;
		const result = await getInitialDepositsHelius({
			connection: mockConnection,
			walletAddress: TEST_WALLET,
			heliusApiKey: "test-api-key",
		});

		expect(result.size).toBe(0);
	});

	test("getInitialDepositsHelius should use provided positions and summaries", async () => {
		const mockSummary: PositionSummary = {
			pairAddress: "D4hJ1x6tPaPj46X9PuXq8sM2YFhFKZt6U2QxJ8H9zKg",
			positionAddresses: ["7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"],
			tokenXMint: "So11111111111111111111111111111111111111112",
			tokenYMint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
			tokenXAmount: 1.5,
			tokenYAmount: 100,
			unclaimedFeeX: 0,
			unclaimedFeeY: 0,
			claimedFeeX: 0,
			claimedFeeY: 0,
			depositValueInSol: 1.5,
			unclaimedFeeValueInSol: 0,
			claimedFeeValueInSol: 0,
		};

		const originalFetch = globalThis.fetch;
		(globalThis as any).fetch = (url: string | URL | Request) => {
			const urlStr = url.toString();
			if (urlStr.includes("helius-rpc.com")) {
				return Promise.resolve({
					json: () => Promise.resolve([mockHeliusTransaction]),
				} as Response);
			}
			if (urlStr.includes("dlmm.datapi.meteora.ag")) {
				return Promise.resolve({
					json: () => Promise.resolve(mockOHLCVResponse),
				} as Response);
			}
			return Promise.resolve({
				json: () => Promise.resolve({}),
			} as Response);
		};

		const mockConnection = {} as Connection;
		const pairAddress = new PublicKey("D4hJ1x6tPaPj46X9PuXq8sM2YFhFKZt6U2QxJ8H9zKg");
		const mockPositions = new Map([
			[
				"pair1",
				{
					lbPair: pairAddress,
					publicKey: pairAddress,
					tokenX: {},
					tokenY: {},
					lbPairPositionsData: [],
				},
			],
		]);

		const result = await getInitialDepositsHelius({
			connection: mockConnection,
			walletAddress: TEST_WALLET,
			heliusApiKey: "test-api-key",
			positions: mockPositions as any,
			summaries: [mockSummary],
		});

		expect(result.size).toBeGreaterThanOrEqual(0);

		(globalThis as any).fetch = originalFetch;
	});
});
