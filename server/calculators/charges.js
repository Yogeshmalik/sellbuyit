import Decimal from "decimal.js";
import { D, paise, zero } from "./money.js";

const row = (name, side, rate, base, amount, applies, reason, rule) => ({
  name,
  side,
  rate: String(rate ?? ""),
  base: D(base).toFixed(2),
  amount: paise(amount).toFixed(2),
  applies,
  reason,
  rounding: "Rounded up to the nearest paise for charge collection",
  source: rule?.source ?? null,
  effectiveFrom: rule?.effectiveFrom ?? null,
});

export function calculateBrokerage(value, orders, broker) {
  const b = broker.brokerage;
  let amount = zero();
  if (b.kind === "flat") amount = D(b.amount).times(orders);
  if (b.kind === "percentage-capped-minimum")
    amount = Decimal.max(
      Decimal.min(D(value).times(b.rate), D(b.cap)),
      D(b.minimum),
    ).times(orders);
  return paise(amount);
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
  const txRate =
    broker.exchange[exchange] ?? market.exchanges[exchange]?.groups?.[bseGroup];
  if (txRate == null)
    throw new Error(
      `The selected ${exchange} scrip group is not configured for ${broker.name}; it is deliberately not estimated.`,
    );
  const brokerageBuy = calculateBrokerage(buyValue, buyOrders, broker);
  const brokerageSell = calculateBrokerage(sellValue, sellOrders, broker);
  const dp = broker.dp;
  let dpAmount = zero();
  if (dp.kind === "flat") dpAmount = D(dp.amount);
  if (dp.kind === "gendered") dpAmount = D(dp[dpCategory]);
  if (dp.kind === "threshold-gendered")
    dpAmount = D(sellValue).lt(dp.threshold)
      ? D(dpCategory === "female" ? dp.belowFemale : dp.belowMale)
      : D(dp[dpCategory]);
  const ipftRate = broker.ipft?.[exchange] ?? "0";
  const raw = [
    row(
      "Brokerage - buy",
      "buy",
      broker.brokerage.rate ?? "flat",
      buyValue,
      brokerageBuy,
      !brokerageBuy.isZero(),
      "Broker-specific delivery brokerage",
      broker,
    ),
    row(
      "Brokerage - sell",
      "sell",
      broker.brokerage.rate ?? "flat",
      sellValue,
      brokerageSell,
      !brokerageSell.isZero(),
      "Broker-specific delivery brokerage",
      broker,
    ),
    row(
      "STT - buy",
      "buy",
      market.sttRate,
      buyValue,
      D(buyValue).times(market.sttRate),
      true,
      "Delivery purchase",
      market,
    ),
    row(
      "STT - sell",
      "sell",
      market.sttRate,
      sellValue,
      D(sellValue).times(market.sttRate),
      true,
      "Delivery sale",
      market,
    ),
    row(
      "Stamp duty",
      "buy",
      market.stampDutyRate,
      buyValue,
      D(buyValue).times(market.stampDutyRate),
      true,
      "Delivery purchase only",
      market,
    ),
    row(
      "Exchange transaction charges - buy",
      "buy",
      txRate,
      buyValue,
      D(buyValue).times(txRate),
      true,
      `${exchange} cash market`,
      broker,
    ),
    row(
      "Exchange transaction charges - sell",
      "sell",
      txRate,
      sellValue,
      D(sellValue).times(txRate),
      true,
      `${exchange} cash market`,
      broker,
    ),
    row(
      "SEBI turnover fees - buy",
      "buy",
      market.sebiRate,
      buyValue,
      D(buyValue).times(market.sebiRate),
      true,
      "Regulatory turnover fee",
      market,
    ),
    row(
      "SEBI turnover fees - sell",
      "sell",
      market.sebiRate,
      sellValue,
      D(sellValue).times(market.sebiRate),
      true,
      "Regulatory turnover fee",
      market,
    ),
    row(
      "IPFT",
      "both",
      ipftRate,
      D(buyValue).plus(sellValue),
      D(buyValue).plus(sellValue).times(ipftRate),
      !D(ipftRate).isZero(),
      "NSE investor protection fund charge",
      broker,
    ),
    row(
      "DP charges",
      "sell",
      "flat",
      sellValue,
      dpAmount,
      true,
      `One ${dp.per}; separate from contract note where applicable`,
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
      gstBase.times(market.gstRate),
      true,
      "GST on applicable service charges; not STT or stamp duty",
      market,
    ),
  );
  return raw;
}
