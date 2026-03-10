import { expect, test, describe } from "bun:test";
import { PublicKey, Connection } from "@solana/web3.js";
import type { PositionInfo } from "@meteora-ag/dlmm";
import {
	getAllUserPositions,
	getLbPairWithLbPositions,
	getPositionSummaries,
} from "../src/positions";
import { TEST_WALLET } from "./helpers";

describe("Positions Module", () => {
	const createMockPositionInfo = (): any => {
		const pairAddress = new PublicKey("D4hJ1x6tPaPj46X9PuXq8sM2YFhFKZt6U2QxJ8H9zKg");
		return {
			lbPair: pairAddress,
			publicKey: pairAddress,
			tokenX: {
				mint: {
					address: new PublicKey("So11111111111111111111111111111111111111112"),
					decimals: 9,
				},
				reserve: new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"),
				amount: BigInt("1000000000"),
			},
			tokenY: {
				mint: {
					address: new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"),
					decimals: 6,
				},
				reserve: new PublicKey("DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"),
				amount: BigInt("500000000"),
			},
			lbPairPositionsData: [
				{
					publicKey: new PublicKey("7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU"),
					positionData: {
						totalXAmount: "1000000000",
						totalYAmount: "500000000",
						feeX: "10000000",
						feeY: "5000000",
						totalClaimedFeeXAmount: "20000000",
						totalClaimedFeeYAmount: "10000000",
						rewardOne: "0",
						rewardTwo: "0",
					},
				},
			],
		};
	};

	test("getAllUserPositions should return positions map", async () => {
		const mockPositions = new Map([["pair1", createMockPositionInfo() as PositionInfo]]);

		const dlmmModule = await import("@meteora-ag/dlmm");
		(dlmmModule.default as any).getAllLbPairPositionsByUser = () => Promise.resolve(mockPositions);

		const mockConnection = {} as Connection;
		const result = await getAllUserPositions({
			connection: mockConnection,
			walletAddress: TEST_WALLET,
		});

		expect(result).not.toBeNull();
		expect(result?.size).toBe(1);
	});

	test("getAllUserPositions should return null when no positions", async () => {
		const dlmmModule = await import("@meteora-ag/dlmm");
		(dlmmModule.default as any).getAllLbPairPositionsByUser = () => Promise.resolve(new Map());

		const mockConnection = {} as Connection;
		const result = await getAllUserPositions({
			connection: mockConnection,
			walletAddress: TEST_WALLET,
		});

		expect(result).toBeNull();
	});

	test("getAllUserPositions should return null on error", async () => {
		const dlmmModule = await import("@meteora-ag/dlmm");
		(dlmmModule.default as any).getAllLbPairPositionsByUser = () =>
			Promise.reject(new Error("Connection failed"));

		const mockConnection = {} as Connection;
		const result = await getAllUserPositions({
			connection: mockConnection,
			walletAddress: TEST_WALLET,
		});

		expect(result).toBeNull();
	});

	test("getLbPairWithLbPositions should transform positions", () => {
		const mockPositions = new Map([["pair1", createMockPositionInfo() as PositionInfo]]);

		const result = getLbPairWithLbPositions(mockPositions);

		expect(Object.keys(result)).toHaveLength(1);
		expect(result["D4hJ1x6tPaPj46X9PuXq8sM2YFhFKZt6U2QxJ8H9zKg"]).toBeDefined();
		expect(result["D4hJ1x6tPaPj46X9PuXq8sM2YFhFKZt6U2QxJ8H9zKg"].positions).toHaveLength(1);
	});

	test("getLbPairWithLbPositions should filter out positions without publicKey", () => {
		const positionWithNull = createMockPositionInfo();
		positionWithNull.publicKey = null;
		const positionsWithNull = new Map([["pair1", positionWithNull as PositionInfo]]);

		const result = getLbPairWithLbPositions(positionsWithNull);

		expect(Object.keys(result)).toHaveLength(0);
	});

	test("getPositionSummaries should calculate summaries correctly", async () => {
		const mockActiveBin = {
			pricePerToken: "100",
		};

		const dlmmModule = await import("@meteora-ag/dlmm");
		(dlmmModule.default as any).create = () =>
			Promise.resolve({
				getActiveBin: () => Promise.resolve(mockActiveBin),
			});

		const mockConnection = {} as Connection;
		const positions = new Map([["pair1", createMockPositionInfo() as PositionInfo]]);

		const summaries = await getPositionSummaries(positions, mockConnection);

		expect(summaries).toHaveLength(1);
		const summary = summaries[0];
		expect(summary.tokenXAmount).toBe(1);
		expect(summary.tokenYAmount).toBe(500);
		expect(summary.positionAddresses).toHaveLength(1);
	});

	test("getPositionSummaries should handle SOL pairs", async () => {
		const mockActiveBin = {
			pricePerToken: "2",
		};

		const dlmmModule = await import("@meteora-ag/dlmm");
		(dlmmModule.default as any).create = () =>
			Promise.resolve({
				getActiveBin: () => Promise.resolve(mockActiveBin),
			});

		const mockConnection = {} as Connection;
		const positions = new Map([["pair1", createMockPositionInfo() as PositionInfo]]);

		const summaries = await getPositionSummaries(positions, mockConnection);

		expect(summaries[0].depositValueInSol).toBeGreaterThan(0);
	});

	test("getPositionSummaries should handle non-SOL pairs", async () => {
		const nonSolPosition = createMockPositionInfo();
		nonSolPosition.tokenX.mint.address = new PublicKey(
			"DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263",
		);
		nonSolPosition.tokenY.mint.address = new PublicKey(
			"EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
		);

		const mockConnection = {} as Connection;
		const positions = new Map([["pair1", nonSolPosition as PositionInfo]]);

		const summaries = await getPositionSummaries(positions, mockConnection);

		expect(summaries[0].depositValueInSol).toBe(0);
	});
});
