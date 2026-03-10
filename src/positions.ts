import { Connection, PublicKey } from "@solana/web3.js";
import DLMM, {
	type LbPosition,
	type PositionInfo,
	type TokenReserve,
} from "@meteora-ag/dlmm";

interface GetAllUserPositionsParams {
	connection: Connection;
	walletAddress: PublicKey;
}

interface MetPosition {
	tokenX: TokenReserve;
	tokenY: TokenReserve;
	positions: Array<LbPosition>;
}

type PairAddress = string;

interface PositionSummary {
	pairAddress: string;
	positionAddresses: string[];
	tokenXMint: string;
	tokenYMint: string;
	tokenXAmount: number;
	tokenYAmount: number;
	unclaimedFeeX: number;
	unclaimedFeeY: number;
	claimedFeeX: number;
	claimedFeeY: number;
	depositValueInSol: number;
	unclaimedFeeValueInSol: number;
	claimedFeeValueInSol: number;
}

async function getAllUserPositions(
	params: GetAllUserPositionsParams,
): Promise<Map<string, PositionInfo> | null> {
	const { connection, walletAddress } = params;

	try {
		const positions = await DLMM.getAllLbPairPositionsByUser(
			connection,
			walletAddress,
		);

		if (!positions || positions.size === 0) {
			console.log("No positions found for this wallet");
			return null;
		}

		return positions;
	} catch (error) {
		console.error(`Failed to get user positions: ${error}`);
		return null;
	}
}

function getLbPairWithLbPositions(
	metPositions: Map<string, PositionInfo>,
): Record<PairAddress, MetPosition> {
	return Object.fromEntries(
		[...metPositions.values()]
			.filter((pos) => pos.publicKey?.toBase58())
			.map((pos) => [
				pos.publicKey!.toBase58(),
				{
					tokenX: pos.tokenX,
					tokenY: pos.tokenY,
					positions: pos.lbPairPositionsData,
				},
			]),
	);
}

async function getPositionSummaries(
	positions: Map<string, PositionInfo>,
	connection: Connection,
): Promise<PositionSummary[]> {
	const positionsByPair = getLbPairWithLbPositions(positions);
	const summaries: PositionSummary[] = [];
	const SOL_MINT = "So11111111111111111111111111111111111111112";

	for (const [pairAddress, metPosition] of Object.entries(positionsByPair)) {
		const tokenXDecimal = metPosition.tokenX.mint.decimals;
		const tokenYDecimal = metPosition.tokenY.mint.decimals;
		const tokenXMint = metPosition.tokenX.mint.address.toBase58();
		const tokenYMint = metPosition.tokenY.mint.address.toBase58();

		let totalTokenX = BigInt(0);
		let totalTokenY = BigInt(0);
		let totalUnclaimedFeeX = BigInt(0);
		let totalUnclaimedFeeY = BigInt(0);
		let totalClaimedFeeX = BigInt(0);
		let totalClaimedFeeY = BigInt(0);
		const positionAddresses: string[] = [];

		for (const position of metPosition.positions) {
			positionAddresses.push(position.publicKey.toBase58());
			totalTokenX += BigInt(position.positionData.totalXAmount);
			totalTokenY += BigInt(position.positionData.totalYAmount);
			totalUnclaimedFeeX += BigInt(position.positionData.feeX);
			totalUnclaimedFeeY += BigInt(position.positionData.feeY);
			totalClaimedFeeX += BigInt(position.positionData.totalClaimedFeeXAmount);
			totalClaimedFeeY += BigInt(position.positionData.totalClaimedFeeYAmount);
		}

		const tokenXAmount = Number(totalTokenX) / 10 ** tokenXDecimal;
		const tokenYAmount = Number(totalTokenY) / 10 ** tokenYDecimal;
		const unclaimedFeeX = Number(totalUnclaimedFeeX) / 10 ** tokenXDecimal;
		const unclaimedFeeY = Number(totalUnclaimedFeeY) / 10 ** tokenYDecimal;
		const claimedFeeX = Number(totalClaimedFeeX) / 10 ** tokenXDecimal;
		const claimedFeeY = Number(totalClaimedFeeY) / 10 ** tokenYDecimal;

		let depositValueInSol = 0;
		let unclaimedFeeValueInSol = 0;
		let claimedFeeValueInSol = 0;
		const isTokenXSol = tokenXMint === SOL_MINT;
		const isTokenYSol = tokenYMint === SOL_MINT;

		if (isTokenXSol || isTokenYSol) {
			const dlmmPool = await DLMM.create(
				connection,
				new PublicKey(pairAddress),
			);
			const activeBin = await dlmmPool.getActiveBin();
			const pricePerLamport = Number(activeBin.pricePerToken);

			if (isTokenXSol) {
				depositValueInSol = tokenXAmount + tokenYAmount * pricePerLamport;
				unclaimedFeeValueInSol =
					unclaimedFeeX + unclaimedFeeY * pricePerLamport;
				claimedFeeValueInSol = claimedFeeX + claimedFeeY * pricePerLamport;
			} else {
				depositValueInSol = tokenYAmount + tokenXAmount * pricePerLamport;
				unclaimedFeeValueInSol =
					unclaimedFeeY + unclaimedFeeX * pricePerLamport;
				claimedFeeValueInSol = claimedFeeY + claimedFeeX * pricePerLamport;
			}
		}

		summaries.push({
			pairAddress,
			positionAddresses,
			tokenXMint,
			tokenYMint,
			tokenXAmount,
			tokenYAmount,
			unclaimedFeeX,
			unclaimedFeeY,
			claimedFeeX,
			claimedFeeY,
			depositValueInSol,
			unclaimedFeeValueInSol,
			claimedFeeValueInSol,
		});
	}

	return summaries;
}

export type { GetAllUserPositionsParams, PairAddress, PositionSummary };
export { getAllUserPositions, getLbPairWithLbPositions, getPositionSummaries };
