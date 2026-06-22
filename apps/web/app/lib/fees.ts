export type RobinhoodStyleFeeInput = {
  side: "buy" | "sell";
  shares: number;
  price: number;
  assetType?: "equity" | "option" | "index_option" | "adr" | "crypto";
  contracts?: number;
  expectedSpreadPercent?: number;
  expectedSlippagePercent?: number;
  marginPrincipal?: number;
  holdingDays?: number;
  marginApr?: number;
};

export type FeeScheduleItem = {
  effectiveDate: string;
  sourceName: string;
  sourceUrl: string;
  assetType: RobinhoodStyleFeeInput["assetType"];
  feeName: string;
  formula: string;
  roundingRule: string;
  exemptions: string;
  lastVerifiedAt: string;
};

export const feeScheduleItems: FeeScheduleItem[] = [
  {
    effectiveDate: "2026-04-04",
    sourceName: "SEC Section 31 Transaction Fee Rate Advisory for Fiscal Year 2026",
    sourceUrl: "https://www.sec.gov/rules-regulations/fee-rate-advisories/2026-2",
    assetType: "equity",
    feeName: "SEC Section 31 covered sale fee",
    formula: "sell principal / 1,000,000 * 20.60",
    roundingRule: "round to nearest cent after aggregate estimate",
    exemptions: "Buy-side equity transactions are not charged by this estimator.",
    lastVerifiedAt: "2026-06-22"
  },
  {
    effectiveDate: "2026-01-01",
    sourceName: "FINRA Trading Activity Fee schedule",
    sourceUrl: "https://www.finra.org/rules-guidance/guidance/trading-activity-fee",
    assetType: "equity",
    feeName: "FINRA TAF covered equity sale",
    formula: "shares sold * 0.000195, capped at 9.79",
    roundingRule: "round to nearest cent after cap",
    exemptions: "Estimator excludes small sales of 50 shares or fewer.",
    lastVerifiedAt: "2026-06-22"
  },
  {
    effectiveDate: "2026-01-01",
    sourceName: "Robinhood Financial fee schedule",
    sourceUrl: "https://cdn.robinhood.com/assets/robinhood/legal/RHF%2BFee%2BSchedule.pdf",
    assetType: "option",
    feeName: "Options regulatory/exchange passthrough estimate",
    formula: "contracts * 0.03",
    roundingRule: "round to nearest cent",
    exemptions: "Broker-specific exchange pass-throughs vary by product and venue.",
    lastVerifiedAt: "2026-06-22"
  },
  {
    effectiveDate: "2026-01-01",
    sourceName: "Robinhood Financial fee schedule",
    sourceUrl: "https://cdn.robinhood.com/assets/robinhood/legal/RHF%2BFee%2BSchedule.pdf",
    assetType: "index_option",
    feeName: "Index option contract fee estimate",
    formula: "contracts * 0.50",
    roundingRule: "round to nearest cent",
    exemptions: "Exact index-option pass-through depends on product and exchange.",
    lastVerifiedAt: "2026-06-22"
  },
  {
    effectiveDate: "2026-01-01",
    sourceName: "ADR custodial fee disclosure",
    sourceUrl: "https://cdn.robinhood.com/assets/robinhood/legal/RHF%2BFee%2BSchedule.pdf",
    assetType: "adr",
    feeName: "ADR custodial fee estimate",
    formula: "shares * 0.02 annualized estimate",
    roundingRule: "round to nearest cent",
    exemptions: "ADR bank fees vary by issuer and depositary.",
    lastVerifiedAt: "2026-06-22"
  },
  {
    effectiveDate: "2026-01-01",
    sourceName: "Robinhood crypto risk and fee disclosures",
    sourceUrl: "https://cdn.robinhood.com/assets/robinhood/legal/RHF%2BFee%2BSchedule.pdf",
    assetType: "crypto",
    feeName: "Crypto routing/spread estimate",
    formula: "notional * 0.0025",
    roundingRule: "round to nearest cent",
    exemptions: "Crypto execution cost varies by venue and liquidity.",
    lastVerifiedAt: "2026-06-22"
  }
];

export const robinhoodStyleFeeSchedule = {
  sourceName: "Robinhood Financial fee schedule, SEC Section 31 advisory, FINRA TAF",
  sourceUrls: [...new Set(feeScheduleItems.map((item) => item.sourceUrl))],
  verifiedOn: "2026-06-22",
  equityCommission: 0,
  secSection31RatePerMillionSellPrincipal: 20.6,
  finraTradingActivityFeePerShareSell: 0.000195,
  finraTradingActivityFeeCap: 9.79,
  finraSmallSaleShareExemption: 50,
  optionRegulatoryEstimatePerContract: 0.03,
  indexOptionEstimatePerContract: 0.5,
  adrCustodialEstimatePerShare: 0.02,
  cryptoRoutingSpreadPercent: 0.25
};

function roundFee(value: number) {
  if (value < 0.01) return 0;
  return Math.round(value * 100) / 100;
}

export function estimateRobinhoodStyleFees(input: RobinhoodStyleFeeInput) {
  if (input.side === "buy") return 0;
  const principal = Math.max(0, input.shares * input.price);
  const secFee = (principal / 1_000_000) * robinhoodStyleFeeSchedule.secSection31RatePerMillionSellPrincipal;
  const tafBase = input.shares <= robinhoodStyleFeeSchedule.finraSmallSaleShareExemption
    ? 0
    : input.shares * robinhoodStyleFeeSchedule.finraTradingActivityFeePerShareSell;
  const tafFee = Math.min(tafBase, robinhoodStyleFeeSchedule.finraTradingActivityFeeCap);
  return roundFee(secFee + tafFee);
}

export type TradeCostEstimate = {
  grossEntryValue: number;
  grossExitValue: number;
  secSellFee: number;
  finraTradingActivityFee: number;
  optionsPassthroughEstimate: number;
  indexOptionContractFees: number;
  adrCustodialFeeEstimate: number;
  cryptoRoutingSpreadFeeEstimate: number;
  estimatedSpreadCost: number;
  estimatedSlippageCost: number;
  marginInterestEstimate: number;
  totalEstimatedTradeFriction: number;
  netPnl: number;
  breakEvenPrice: number;
  minimumRequiredProfitableMove: number;
  feeDragPercent: number;
  accountSizeSuitability: "Suitable" | "Caution" | "Poor";
  sourceNotes: FeeScheduleItem[];
};

export function estimateTradeCosts(input: RobinhoodStyleFeeInput & {
  exitPrice: number;
  accountCapital: number;
  expectedGrossMovePercent?: number;
}): TradeCostEstimate {
  const shares = Math.max(0, input.shares);
  const entry = Math.max(0, input.price);
  const exit = Math.max(0, input.exitPrice);
  const grossEntryValue = shares * entry;
  const grossExitValue = shares * exit;
  const principal = Math.max(grossEntryValue, grossExitValue);
  const secSellFee = input.side === "sell" ? roundFee((grossExitValue / 1_000_000) * robinhoodStyleFeeSchedule.secSection31RatePerMillionSellPrincipal) : 0;
  const tafBase = input.side === "sell" && shares > robinhoodStyleFeeSchedule.finraSmallSaleShareExemption
    ? shares * robinhoodStyleFeeSchedule.finraTradingActivityFeePerShareSell
    : 0;
  const finraTradingActivityFee = roundFee(Math.min(tafBase, robinhoodStyleFeeSchedule.finraTradingActivityFeeCap));
  const contracts = Math.max(0, input.contracts || 0);
  const optionsPassthroughEstimate = input.assetType === "option" ? roundFee(contracts * robinhoodStyleFeeSchedule.optionRegulatoryEstimatePerContract) : 0;
  const indexOptionContractFees = input.assetType === "index_option" ? roundFee(contracts * robinhoodStyleFeeSchedule.indexOptionEstimatePerContract) : 0;
  const adrCustodialFeeEstimate = input.assetType === "adr" ? roundFee(shares * robinhoodStyleFeeSchedule.adrCustodialEstimatePerShare) : 0;
  const cryptoRoutingSpreadFeeEstimate = input.assetType === "crypto" ? roundFee(principal * (robinhoodStyleFeeSchedule.cryptoRoutingSpreadPercent / 100)) : 0;
  const estimatedSpreadCost = roundFee(principal * ((input.expectedSpreadPercent ?? 0.08) / 100));
  const estimatedSlippageCost = roundFee(principal * ((input.expectedSlippagePercent ?? 0.06) / 100));
  const marginInterestEstimate = input.marginPrincipal && input.marginApr && input.holdingDays
    ? roundFee(input.marginPrincipal * (input.marginApr / 100) * (input.holdingDays / 365))
    : 0;
  const totalEstimatedTradeFriction = roundFee(secSellFee + finraTradingActivityFee + optionsPassthroughEstimate + indexOptionContractFees + adrCustodialFeeEstimate + cryptoRoutingSpreadFeeEstimate + estimatedSpreadCost + estimatedSlippageCost + marginInterestEstimate);
  const netPnl = roundFee(grossExitValue - grossEntryValue - totalEstimatedTradeFriction);
  const breakEvenPrice = shares > 0 ? roundFee(entry + (totalEstimatedTradeFriction / shares)) : entry;
  const minimumRequiredProfitableMove = principal > 0 ? (totalEstimatedTradeFriction / principal) * 100 : 0;
  const feeDragPercent = principal > 0 ? (totalEstimatedTradeFriction / principal) * 100 : 0;
  const suitability = input.accountCapital <= 1500 && feeDragPercent > 0.1 ? "Poor" : input.accountCapital <= 5000 || feeDragPercent > 0.25 ? "Caution" : "Suitable";
  return {
    grossEntryValue,
    grossExitValue,
    secSellFee,
    finraTradingActivityFee,
    optionsPassthroughEstimate,
    indexOptionContractFees,
    adrCustodialFeeEstimate,
    cryptoRoutingSpreadFeeEstimate,
    estimatedSpreadCost,
    estimatedSlippageCost,
    marginInterestEstimate,
    totalEstimatedTradeFriction,
    netPnl,
    breakEvenPrice,
    minimumRequiredProfitableMove,
    feeDragPercent,
    accountSizeSuitability: suitability,
    sourceNotes: feeScheduleItems.filter((item) => item.assetType === (input.assetType || "equity") || item.assetType === "equity")
  };
}
