// Define the structure of your Polymarket position data
interface PositionData {
  avgPrice: number;
  totalBought: number;
  realizedPnl: number;
  curPrice: number;
}

/**
 * 1️⃣ Calculate Total Bet (Cost Basis)
 * Formula: avgPrice * totalBought
 */
export function calculateTotalBet(data: PositionData): number {
  const returnValue =  data.avgPrice * data.totalBought;
  return parseFloat(returnValue.toFixed(2));
}

/**
 * 2️⃣ Calculate Amount Won (Total Return)
 * Formula: totalBet + realizedPnl
 */
export function calculateAmountWon(data: PositionData): number {
  const totalBet = calculateTotalBet(data);
  const returnValue = totalBet + data.realizedPnl;
  return parseFloat(returnValue.toFixed(2));
}

/**
 * 3️⃣ Calculate Profit (Realized PnL)
 * Formula: realizedPnl
 */
export function calculateProfit(data: PositionData): number {
  const returnValue = data.realizedPnl;
  return parseFloat(returnValue.toFixed(2));
}

/**
 * 4️⃣ Calculate Profit Percentage
 * Formula: (realizedPnl / totalBet) * 100
 */
export function calculateProfitPercentage(data: PositionData): number {
  const totalBet = calculateTotalBet(data);
  if (totalBet === 0) return 0;
  return parseFloat(((data.realizedPnl / totalBet) * 100).toFixed(2));
}
