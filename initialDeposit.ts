import { Connection, PublicKey } from "@solana/web3.js";
import { getSolPriceByTimestamp } from "./solPrice";
import {
	getAllUserPositions,
	getPositionSummaries,
	type PositionSummary,
} from "./positions";
import DLMM, { type PositionInfo } from "@meteora-ag/dlmm";

const SOL_MINT = "So11111111111111111111111111111111111111111112";

interface InitialDeposit {
	positionAddress: string;
	pairAddress: string;
	transactionSignature: string;
	timestamp: number;
	tokenXAmount: number;
	tokenYAmount: number;
	tokenXMint: string;
	tokenYMint: string;
	valueInSol: number;
	valueInUsd: number | null;
}

interface GetInitialDepositsParams {
	connection: Connection;
	walletAddress: PublicKey;
	maxSignatures?: number;
	positions?: Map<string, PositionInfo>;
	summaries?: PositionSummary[];
}

function findPositionInAccounts(
	accountKeys: string[],
	positionAddresses: Set<string>,
): string | null {
	for (const key of accountKeys) {
		if (positionAddresses.has(key)) {
			return key;
		}
	}
	return null;
}

async function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getInitialDeposits(
	params: GetInitialDepositsParams,
): Promise<Map<string, InitialDeposit>> {
	const {
		connection,
		walletAddress,
		maxSignatures = 500,
		positions: providedPositions,
		summaries: providedSummaries,
	} = params;

	const positions = providedPositions ?? (await getAllUserPositions({ connection, walletAddress }));
	if (!positions) {
		console.log("No positions found");
		return new Map();
	}

	const summaries = providedSummaries ?? (await getPositionSummaries(positions, connection));

	const positionToPair = new Map<string, string>();
	const pairToMints = new Map<
		string,
		{ tokenXMint: string; tokenYMint: string }
	>();
	const allPositionAddresses = new Set<string>();

	for (const summary of summaries) {
		pairToMints.set(summary.pairAddress, {
			tokenXMint: summary.tokenXMint,
			tokenYMint: summary.tokenYMint,
		});
		for (const posAddr of summary.positionAddresses) {
			positionToPair.set(posAddr, summary.pairAddress);
			allPositionAddresses.add(posAddr);
		}
	}

	console.log(`Found ${allPositionAddresses.size} position addresses`);

	const pairToVaults = new Map<
		string,
		{ tokenXVault: string; tokenYVault: string }
	>();

	for (const pairAddress of pairToMints.keys()) {
		try {
			const dlmmPool = await DLMM.create(
				connection,
				new PublicKey(pairAddress),
			);
			const poolData = dlmmPool.lbPair;

			if (dlmmPool.tokenX?.reserve && dlmmPool.tokenY?.reserve) {
				pairToVaults.set(pairAddress, {
					tokenXVault: dlmmPool.tokenX.reserve.toBase58(),
					tokenYVault: dlmmPool.tokenY.reserve.toBase58(),
				});
			}
		} catch (e) {
			console.log(`Could not fetch vaults for pair ${pairAddress}`);
		}
	}

	const signatures = await connection.getSignaturesForAddress(walletAddress, {
		limit: maxSignatures,
	});

	console.log(`Fetched ${signatures.length} signatures to analyze`);

	const initialDeposits = new Map<string, InitialDeposit>();
	const foundPositions = new Set<string>();

	for (let i = 0; i < Math.min(signatures.length, 50); i++) {
		const sigInfo = signatures[i];
		if (!sigInfo) continue;

		if (i > 0 && i % 5 === 0) {
			await sleep(500);
		}





		const tx = await connection.getParsedTransaction(sigInfo.signature, {
			maxSupportedTransactionVersion: 0,
		});

		if (!tx?.transaction.message.accountKeys) continue;

		const accountKeys = tx.transaction.message.accountKeys.map((k) =>
			typeof k === "string" ? k : k.pubkey.toBase58(),
		);

		const positionAddress = findPositionInAccounts(
			accountKeys,
			allPositionAddresses,
		);

		if (!positionAddress) {
			continue;
		}

		const pairAddress = positionToPair.get(positionAddress);
		if (!pairAddress) continue;

		const mints = pairToMints.get(pairAddress);
		if (!mints) continue;

		const vaults = pairToVaults.get(pairAddress);

		let tokenXAmount = 0;
		let tokenYAmount = 0;

		const preBalances = tx.meta?.preTokenBalances ?? [];
		const postBalances = tx.meta?.postTokenBalances ?? [];

		for (const post of postBalances) {
			const mint = post.mint;
			const postAmount = Number(post.uiTokenAmount.uiAmount ?? 0);

			const preBalance = preBalances.find(
				(b) => b.mint === mint && b.accountIndex === post.accountIndex,
			);
			const preAmount = preBalance
				? Number(preBalance.uiTokenAmount.uiAmount ?? 0)
				: 0;

			const delta = postAmount - preAmount;

			if (delta > 0) {
				if (mint === mints.tokenXMint) {
					tokenXAmount += delta;
				} else if (mint === mints.tokenYMint) {
					tokenYAmount += delta;
				}
			}
		}

		let valueInUsd: number | null = null;
		try {
			const solPrice = await getSolPriceByTimestamp({
				timestamp: tx.blockTime ?? 0,
			});
			if (solPrice !== null) {
				let valueInSol = 0;
				if (mints.tokenXMint === SOL_MINT) {
					valueInSol = tokenXAmount + tokenYAmount * solPrice;
				} else if (mints.tokenYMint === SOL_MINT) {
					valueInSol = tokenYAmount + tokenXAmount * solPrice;
				}
				valueInUsd = valueInSol * solPrice;
			}
		} catch {
			console.log(`Could not fetch price for timestamp ${tx.blockTime}`);
		}

		const existing = initialDeposits.get(positionAddress);
		const newTokenXAmount = (existing?.tokenXAmount ?? 0) + tokenXAmount;
		const newTokenYAmount = (existing?.tokenYAmount ?? 0) + tokenYAmount;
		const newValueInSol =
			mints.tokenXMint === SOL_MINT ? newTokenXAmount : newTokenYAmount;

		initialDeposits.set(positionAddress, {
			positionAddress,
			pairAddress,
			transactionSignature: sigInfo.signature,
			timestamp: tx.blockTime ?? 0,
			tokenXAmount: newTokenXAmount,
			tokenYAmount: newTokenYAmount,
			tokenXMint: mints.tokenXMint,
			tokenYMint: mints.tokenYMint,
			valueInSol: newValueInSol,
			valueInUsd,
		});

		console.log(
			`Accumulated deposit for position ${positionAddress.slice(0, 8)}... (+${tokenXAmount.toFixed(4)} X, +${tokenYAmount.toFixed(4)} Y)`,
		);
	}

	console.log(
		`Found ${initialDeposits.size} initial deposits out of ${allPositionAddresses.size} positions`,
	);

	return initialDeposits;
}

export type { InitialDeposit, GetInitialDepositsParams };
export { getInitialDeposits };
