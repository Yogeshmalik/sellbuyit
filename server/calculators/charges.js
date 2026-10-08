import Decimal from "decimal.js";
import { D, zero } from "./money.js";

const roundPaise = (value) =>
  D(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
const roundStt = (value) => D(value).toDecimalPlaces(0, Decimal.ROUND_HALF_UP);

const row = (
  name,
  side,
  rate,
  base,
  amount,
  applies,
  reason,
  rule,
  rounding = "Rounded to the nearest paise",
) => ({
  name,
  side,
  rate: String(rate ?? ""),
  base: D(base).toFixed(2),
  amount: D(amount).toFixed(2),
  applies,
  reason,
  rounding,
  source: rule?.source ?? null,
  effectiveFrom: rule?.effectiveFrom ?? null,
});

function brokeragePerOrder(orderValue, brokerage) {
  const value = D(orderValue);
  if (brokerage.kind === "free") return zero();

  const regulatoryCap = brokerage.regulatoryCapRate
    ? value.times(brokerage.regulatoryCapRate)
    : null;

  if (brokerage.kind === "flat") {
    const amount = D(brokerage.amount);
    return regulatoryCap ? Decimal.min(amount, regulatoryCap) : amount;
  }

  if (brokerage.kind === "percentage-capped-minimum") {
    const percentageAmount = value.times(brokerage.rate);
    const cappedAmount = Decimal.min(percentageAmount, D(brokerage.cap));
    const minimum = D(brokerage.minimum);
    const normalAmount = Decimal.max(cappedAmount, minimum);
    return regulatoryCap
      ? Decimal.min(normalAmount, regulatoryCap)
      : normalAmount;
  }

  throw new Error("This broker's brokerage rules are not available.");
}

export function calculateBrokerage(value, orders, broker) {
  const orderCount = D(orders);
  if (!orderCount.isInteger() || orderCount.lte(0)) {
    throw new Error("Enter a positive whole number of executed orders.");
  }

  // The UI stores only the total trade value and number of orders. We assume
  // the value was split equally across those orders so order-level caps and
  // minimums can still be modelled without inventing individual order values.
  const orderValue = D(value).div(orderCount);
  const perOrder = roundPaise(brokeragePerOrder(orderValue, broker.brokerage));
  return perOrder.times(orderCount);
}

function calculateDp({ sellValue, sellOrders, broker, dpCategory }) {
  const dp = broker.dp;
  const orderCount = D(sellOrders);

  if (dp.kind === "flat") {
    const amount = roundPaise(dp.amount);
    return dp.per === "isin-transaction" ? amount.times(orderCount) : amount;
  }

  if (dp.kind === "gendered") {
    return roundPaise(dp[dpCategory]);
  }

  if (dp.kind === "threshold-gendered") {
    // Groww applies its threshold to each sale transaction. Because the app
    // does not know the value of each individual order, assume equal split.
    const orderSellValue = D(sellValue).div(orderCount);
    const amount = orderSellValue.lt(dp.threshold)
      ? dpCategory === "female"
        ? dp.belowFemale
        : dp.belowMale
      : dp[dpCategory];
    return roundPaise(amount).times(orderCount);
  }

  throw new Error("This broker's demat charge rules are not available.");
}

function transactionRule(market, exchange, bseGroup) {
  if (exchange === "NSE") {
    return {
      ...market.exchanges.NSE,
      source: {
        name: "NSE cash-market transaction charges",
        url: market.exchanges.NSE.sourceUrl,
        lastVerified: market.lastVerified,
      },
      effectiveFrom: market.effectiveFrom,
    };
  }

  if (exchange === "BSE") {
    const groupRate = market.exchanges.BSE.groups[bseGroup];
    if (groupRate == null) {
      throw new Error(
        "We don't have a BSE fee category for that selection. Choose a supported BSE category.",
      );
    }
    return {
      transactionRate: groupRate,
      ipftRate: "0",
      source: {
        name: "BSE transaction charges",
        url: market.exchanges.BSE.sourceUrl,
        lastVerified: market.lastVerified,
      },
      effectiveFrom: market.effectiveFrom,
    };
  }

  throw new Error("Choose NSE or BSE as the exchange.");
}

export function calculateCharges({
  buyValue,
  sellValue,
  buyOrders,
  sellOrders,
  broker,
  market,
  exchange,
  bseGroup,
  dpCategory,
}) {
  const txRule = transactionRule(market, exchange, bseGroup);
  const brokerageBuy = calculateBrokerage(buyValue, buyOrders, broker);
  const brokerageSell = calculateBrokerage(sellValue, sellOrders, broker);
  const dpAmount = calculateDp({
    sellValue,
    sellOrders,
    broker,
    dpCategory,
  });

  const ipftRate = txRule.ipftRate ?? "0";
  const totalTurnover = D(buyValue).plus(sellValue);
  const ipftAmount = roundPaise(totalTurnover.times(ipftRate));

  const raw = [
    row(
      "Brokerage - buy",
      "buy",
      broker.brokerage.rate ?? "flat",
      buyValue,
      brokerageBuy,
      !brokerageBuy.isZero(),
      "Broker-specific delivery brokerage, calculated per assumed executed order",
      broker,
      "Each assumed order is rounded to the nearest paise before totals are added",
    ),
    row(
      "Brokerage - sell",
      "sell",
      broker.brokerage.rate ?? "flat",
      sellValue,
      brokerageSell,
      !brokerageSell.isZero(),
      "Broker-specific delivery brokerage, calculated per assumed executed order",
      broker,
      "Each assumed order is rounded to the nearest paise before totals are added",
    ),
    row(
      "STT - buy",
      "buy",
      market.sttRate,
      buyValue,
      roundStt(D(buyValue).times(market.sttRate)),
      true,
      "Equity delivery purchase",
      market,
      "Rounded to the nearest rupee",
    ),
    row(
      "STT - sell",
      "sell",
      market.sttRate,
      sellValue,
      roundStt(D(sellValue).times(market.sttRate)),
      true,
      "Equity delivery sale",
      market,
      "Rounded to the nearest rupee",
    ),
    row(
      "Stamp duty",
      "buy",
      market.stampDutyRate,
      buyValue,
      roundPaise(D(buyValue).times(market.stampDutyRate)),
      true,
      "Delivery purchase only",
      market,
    ),
    row(
      "Exchange transaction charges - buy",
      "buy",
      txRule.transactionRate,
      buyValue,
      roundPaise(D(buyValue).times(txRule.transactionRate)),
      true,
      `${exchange} cash market`,
      txRule,
    ),
    row(
      "Exchange transaction charges - sell",
      "sell",
      txRule.transactionRate,
      sellValue,
      roundPaise(D(sellValue).times(txRule.transactionRate)),
      true,
      `${exchange} cash market`,
      txRule,
    ),
    row(
      "SEBI turnover fees - buy",
      "buy",
      "₹10/crore",
      buyValue,
      roundPaise(D(buyValue).times(market.sebiRate)),
      true,
      "SEBI regulatory turnover fee",
      market,
    ),
    row(
      "SEBI turnover fees - sell",
      "sell",
      "₹10/crore",
      sellValue,
      roundPaise(D(sellValue).times(market.sebiRate)),
      true,
      "SEBI regulatory turnover fee",
      market,
    ),
    row(
      "IPFT",
      "both",
      exchange === "NSE" ? "₹0.01/crore" : "₹0/crore",
      totalTurnover,
      ipftAmount,
      !D(ipftRate).isZero(),
      "NSE investor protection fund contribution",
      txRule,
    ),
    row(
      "DP charges",
      "sell",
      "flat",
      sellValue,
      dpAmount,
      true,
      `Broker-specific demat debit charge (${broker.dp.per})`,
      broker,
    ),
  ];

  const gstBase = raw
    .filter((item) =>
      [
        "Brokerage - buy",
        "Brokerage - sell",
        "Exchange transaction charges - buy",
        "Exchange transaction charges - sell",
        "SEBI turnover fees - buy",
        "SEBI turnover fees - sell",
        "IPFT",
        "DP charges",
      ].includes(item.name),
    )
    .reduce((sum, item) => sum.plus(item.amount), zero());

  raw.push(
    row(
      "GST",
      "both",
      market.gstRate,
      gstBase,
      roundPaise(gstBase.times(market.gstRate)),
      true,
      "GST on applicable brokerage, exchange, SEBI, IPFT and demat charges; not on STT or stamp duty",
      market,
    ),
  );

  return raw;
}
