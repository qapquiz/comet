import { Connection, PublicKey } from "@solana/web3.js";
import { getAllUserPositions, getPositionSummaries } from "./positions";
import { getInitialDeposits } from "./initialDeposit";

interface UpnlResult {
	initialDepositInSol: number;
	currentValueInSol: number;
	unclaimedFeesInSol: number;
	upnl: number;
	upnlWithFees: number;
	upnlPercent: number;
	upnlWithFeesPercent: number;
}

interface GetUpnlParams {
	connection: Connection;
	walletAddress: PublicKey;
	maxSignatures?: number;
}

async function getUpnl(params: GetUpnlParams): Promise<UpnlResult | null> {
	const { connection, walletAddress, maxSignatures } = params;

	const positions = await getAllUserPositions({ connection, walletAddress });
	if (!positions) {
		return null;
	}

	const summaries = await getPositionSummaries(positions, connection);
	const deposits = await getInitialDeposits({
		connection,
		walletAddress,
		maxSignatures,
		positions,
		summaries,
	});

	const currentValueInSol = summaries.reduce(
		(sum, s) => sum + s.depositValueInSol,
		0,
	);

	let initialDepositInSol = 0;
	for (const deposit of deposits.values()) {
		initialDepositInSol += deposit.valueInSol;
	}

	const unclaimedFeesInSol = summaries.reduce(
		(sum, s) => sum + s.unclaimedFeeValueInSol,
		0,
	);

	const upnl = currentValueInSol - initialDepositInSol;
	const upnlWithFees = currentValueInSol + unclaimedFeesInSol - initialDepositInSol;
	const upnlPercent = initialDepositInSol > 0 ? (upnl / initialDepositInSol) * 100 : 0;
	const upnlWithFeesPercent = initialDepositInSol > 0 ? (upnlWithFees / initialDepositInSol) * 100 : 0;

	return {
		initialDepositInSol,
		currentValueInSol,
		unclaimedFeesInSol,
		upnl,
		upnlWithFees,
		upnlPercent,
		upnlWithFeesPercent,
	};
}

export type { UpnlResult, GetUpnlParams };
export { getUpnl };
