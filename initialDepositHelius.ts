import { Connection, PublicKey } from "@solana/web3.js";
import { getSolPriceByTimestamp } from "./solPrice";
import { getPairPriceByTimestamp } from "./ohlcv";
import {
	getAllUserPositions,
	getPositionSummaries,
	type PositionSummary,
} from "./positions";
import type { PositionInfo } from "@meteora-ag/dlmm";
import type { InitialDeposit } from "./initialDeposit";

const SOL_MINT = "So11111111111111111111111111111111111111112";

interface GetInitialDepositsHeliusParams {
	connection: Connection;
	walletAddress: PublicKey;
	heliusApiKey: string;
	maxTransactions?: number;
	positions?: Map<string, PositionInfo>;
	summaries?: PositionSummary[];
}

interface HeliusTokenTransfer {
	fromUserAccount: string;
	toUserAccount: string;
	fromTokenAccount: string;
	toTokenAccount: string;
	tokenAmount: number;
	mint: string;
}

interface HeliusTransaction {
	description: string;
	type: string;
	source: string;
	fee: number;
	feePayer: string;
	signature: string;
	slot: number;
	timestamp: number;
	nativeTransfers: Array<{
		fromUserAccount: string;
		toUserAccount: string;
		amount: number;
	}>;
	tokenTransfers: HeliusTokenTransfer[];
	accountData: Array<{
		account: string;
		nativeBalanceChange: number;
		tokenBalanceChanges: Array<{
			userAccount: string;
			tokenAccount: string;
			mint: string;
			rawTokenAmount: {
				tokenAmount: string;
				decimals: number;
			};
		}>;
	}>;
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

async function getInitialDepositsHelius(
	params: GetInitialDepositsHeliusParams,
): Promise<Map<string, InitialDeposit>> {
	const {
		connection,
		walletAddress,
		heliusApiKey,
		maxTransactions = 100,
		positions: providedPositions,
		summaries: providedSummaries,
	} = params;

	const positions =
		providedPositions ?? (await getAllUserPositions({ connection, walletAddress }));
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

	const url = `https://api-mainnet.helius-rpc.com/v0/addresses/${walletAddress.toBase58()}/transactions?api-key=${heliusApiKey}&limit=${maxTransactions}`;

	console.log(`Fetching transaction history from Helius...`);
	const response = await fetch(url);
	const transactions = (await response.json()) as HeliusTransaction[];

	console.log(`Fetched ${transactions.length} parsed transactions`);

	const initialDeposits = new Map<string, InitialDeposit>();

	for (const tx of transactions) {
		const allAccounts = new Set<string>();
		
		for (const transfer of tx.tokenTransfers) {
			allAccounts.add(transfer.fromUserAccount);
			allAccounts.add(transfer.toUserAccount);
			allAccounts.add(transfer.fromTokenAccount);
			allAccounts.add(transfer.toTokenAccount);
		}
		
		for (const data of tx.accountData) {
			allAccounts.add(data.account);
		}

		const positionAddress = findPositionInAccounts(
			Array.from(allAccounts),
			allPositionAddresses,
		);

		if (!positionAddress) continue;

		const pairAddress = positionToPair.get(positionAddress);
		if (!pairAddress) continue;

		const mints = pairToMints.get(pairAddress);
		if (!mints) continue;

			let tokenXAmount = 0;
		let tokenYAmount = 0;

		for (const transfer of tx.tokenTransfers) {
			const isToPair = transfer.toUserAccount === pairAddress;
			if (isToPair) {
				if (transfer.mint === mints.tokenXMint) {
					tokenXAmount += transfer.tokenAmount;
				} else if (transfer.mint === mints.tokenYMint) {
					tokenYAmount += transfer.tokenAmount;
				}
			}
		}

		if (tokenXAmount === 0 && tokenYAmount === 0) continue;

		const existing = initialDeposits.get(positionAddress);
		const newTokenXAmount = (existing?.tokenXAmount ?? 0) + tokenXAmount;
		const newTokenYAmount = (existing?.tokenYAmount ?? 0) + tokenYAmount;

		let valueInUsd: number | null = existing?.valueInUsd ?? null;
		try {
			const solPrice = await getSolPriceByTimestamp({
				timestamp: tx.timestamp,
			});
			
			const pairPrice = await getPairPriceByTimestamp(pairAddress, tx.timestamp);
			
			if (solPrice !== null && pairPrice !== null) {
				let tokenXPriceInSol: number;
				let tokenYPriceInSol: number;
				
				if (mints.tokenYMint === SOL_MINT) {
					tokenXPriceInSol = pairPrice.price;
					tokenYPriceInSol = 1;
				} else if (mints.tokenXMint === SOL_MINT) {
					tokenXPriceInSol = 1;
					tokenYPriceInSol = 1 / pairPrice.price;
				} else {
					console.log(`Neither token is SOL, cannot calculate USD value`);
					continue;
				}
				
				const tokenXValueUsd = newTokenXAmount * tokenXPriceInSol * solPrice;
				const tokenYValueUsd = newTokenYAmount * tokenYPriceInSol * solPrice;
				
				valueInUsd = tokenXValueUsd + tokenYValueUsd;
			}
		} catch {
			console.log(`Could not fetch price for timestamp ${tx.timestamp}`);
		}

		let valueInSol = 0;
		if (mints.tokenXMint === SOL_MINT) {
			valueInSol = newTokenXAmount;
		} else if (mints.tokenYMint === SOL_MINT) {
			valueInSol = newTokenYAmount;
		}

		initialDeposits.set(positionAddress, {
			positionAddress,
			pairAddress,
			transactionSignature: tx.signature,
			timestamp: tx.timestamp,
			tokenXAmount: newTokenXAmount,
			tokenYAmount: newTokenYAmount,
			tokenXMint: mints.tokenXMint,
			tokenYMint: mints.tokenYMint,
			valueInSol,
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

export type { GetInitialDepositsHeliusParams };
export { getInitialDepositsHelius };
export type { InitialDeposit } from "./initialDeposit";
