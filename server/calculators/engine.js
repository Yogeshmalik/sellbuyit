import Decimal from "decimal.js";
import { D, rupee, zero } from "./money.js";
import { calculateCharges } from "./charges.js";
import { ruleForDate } from "../rules/marketRules.js";
import { brokerById } from "../brokers/brokerRules.js";

const decimalSum = (values) =>
  values.reduce((sum, item) => sum.plus(item), zero());
const money = (value) => rupee(value).toFixed(2);

function groups(input) {
  if (input.holdingType === "mixed")
    return [
      { type: "short", quantity: D(input.shortQuantity) },
      { type: "long", quantity: D(input.longQuantity) },
    ];
  return [{ type: input.holdingType, quantity: D(input.quantity) }];
}

function taxForGroups({
  holdingGroups,
  buyPrice,
  sellPrice,
  charges,
  market,
  ltcgUsed,
  annualTaxableIncome,
}) {
  const totalQuantity = decimalSum(holdingGroups.map((g) => g.quantity));
  const deductible = charges
    .filter((item) => !item.name.startsWith("STT"))
    .reduce((sum, item) => sum.plus(item.amount), zero());
  const data = holdingGroups.map((group) => {
    const share = group.quantity.div(totalQuantity);
    const buyValue = group.quantity.times(buyPrice);
    const sellValue = group.quantity.times(sellPrice);
    const allocatedCharges = deductible.times(share);
    const gain = sellValue.minus(buyValue).minus(allocatedCharges);
    return { ...group, buyValue, sellValue, charges: allocatedCharges, gain };
  });
  const shortGain = decimalSum(
    data.filter((x) => x.type === "short").map((x) => x.gain),
  );
  const longGain = decimalSum(
    data.filter((x) => x.type === "long").map((x) => x.gain),
  );
  const eligibleExemption = Decimal.max(
    D(market.tax.ltcgExemption).minus(ltcgUsed),
    0,
  );
  const exemption = Decimal.min(Decimal.max(longGain, 0), eligibleExemption);
  const taxableLtcg = Decimal.max(longGain.minus(exemption), 0);
  const stcgTax = Decimal.max(shortGain, 0).times(market.tax.stcgRate);
  const ltcgTax = taxableLtcg.times(market.tax.ltcgRate);
  const incomeTax = stcgTax.plus(ltcgTax);
  const contextIncome = D(annualTaxableIncome || 0)
    .plus(Decimal.max(shortGain, 0))
    .plus(Decimal.max(longGain, 0));
  const surchargeRule = [...market.tax.surcharge]
    .reverse()
    .find((rule) => contextIncome.gt(rule.above));
  const surcharge = surchargeRule
    ? incomeTax.times(surchargeRule.rate)
    : zero();
  const cess = incomeTax.plus(surcharge).times(market.cessRate);
  return {
    groups: data,
    shortGain,
    longGain,
    exemption,
    taxableLtcg,
    stcgTax,
    ltcgTax,
    incomeTax,
    surcharge,
    cess,
    totalTax: incomeTax.plus(surcharge).plus(cess),
    surchargeRate: surchargeRule?.rate ?? "0",
  };
}

export function calculateSale(input) {
  const market = ruleForDate(input.transactionDate);
  const broker = brokerById(input.broker);
  const buyPrice = D(input.buyPrice);
  const sellPrice = D(input.sellPrice);
  const holdingGroups = groups(input);
  const quantity = decimalSum(holdingGroups.map((g) => g.quantity));
  const buyValue = quantity.times(buyPrice);
  const sellValue = quantity.times(sellPrice);
  const charges = calculateCharges({
    buyValue,
    sellValue,
    buyOrders: input.buyOrders,
    sellOrders: input.sellOrders,
    broker,
    market,
    exchange: input.exchange,
    bseGroup: input.bseGroup,
    dpCategory: input.dpCategory,
  });
  const chargeTotal = decimalSum(charges.map((item) => D(item.amount)));
  const tax = taxForGroups({
    holdingGroups,
    buyPrice,
    sellPrice,
    charges,
    market,
    ltcgUsed: D(input.ltcgUsed || 0),
    annualTaxableIncome: input.annualTaxableIncome,
  });
  const netProfit = sellValue
    .minus(buyValue)
    .minus(chargeTotal)
    .minus(tax.totalTax);
  const netSaleProceeds = sellValue
    .minus(
      charges
        .filter((row) => row.side !== "buy")
        .reduce((sum, row) => sum.plus(row.amount), zero()),
    )
    .minus(tax.totalTax);
  return {
    transaction: {
      ...input,
      brokerName: broker.name,
      quantity: quantity.toFixed(0),
      ruleSet: market.id,
      estimate:
        "Transaction-level estimate; annual return computation, loss set-off, rebate, marginal relief and contract-note aggregation may differ.",
    },
    values: {
      buyValue: money(buyValue),
      sellValue: money(sellValue),
      grossProfit: money(sellValue.minus(buyValue)),
    },
    charges: { items: charges, total: money(chargeTotal) },
    tax: {
      stcg: money(tax.shortGain),
      ltcg: money(tax.longGain),
      ltcgExemption: money(tax.exemption),
      taxableLtcg: money(tax.taxableLtcg),
      stcgTax: money(tax.stcgTax),
      ltcgTax: money(tax.ltcgTax),
      incomeTax: money(tax.incomeTax),
      surcharge: money(tax.surcharge),
      surchargeRate: tax.surchargeRate,
      cess: money(tax.cess),
      totalTax: money(tax.totalTax),
      groups: tax.groups.map((group) => ({
        type: group.type,
        quantity: group.quantity.toFixed(0),
        buyValue: money(group.buyValue),
        sellValue: money(group.sellValue),
        charges: money(group.charges),
        capitalGain: money(group.gain),
      })),
    },
    result: {
      netProfit: money(netProfit),
      netSaleProceeds: money(netSaleProceeds),
      returnPercentage: buyValue.isZero()
        ? "0.00"
        : money(netProfit.div(buyValue).times(100)),
    },
  };
}

export function solvePrice(input, targetProfit, direction) {
  const target = D(targetProfit);
  const fixed = D(direction === "sell" ? input.buyPrice : input.sellPrice);
  let low = D("0.01");
  let high = direction === "sell" ? fixed.times(3).plus(100) : fixed;
  const evaluate = (price) =>
    D(
      calculateSale({
        ...input,
        [direction === "sell" ? "sellPrice" : "buyPrice"]: price.toFixed(4),
      }).result.netProfit,
    );
  if (direction === "sell")
    while (evaluate(high).lt(target)) high = high.times(2);
  for (let i = 0; i < 70; i += 1) {
    const mid = low.plus(high).div(2);
    const value = evaluate(mid);
    if (value.gte(target)) {
      if (direction === "sell") high = mid;
      else low = mid;
    } else if (direction === "sell") low = mid;
    else high = mid;
  }
  const price =
    direction === "sell"
      ? high.toDecimalPlaces(2, 2)
      : low.toDecimalPlaces(2, 1);
  return {
    price: price.toFixed(2),
    calculation: calculateSale({
      ...input,
      [direction === "sell" ? "sellPrice" : "buyPrice"]: price.toFixed(2),
    }),
  };
}

export function solveMaximumBuyForReturn(input, targetPercent) {
  let low = D("0.01");
  let high = D(input.sellPrice);
  const meets = (buyPrice) =>
    D(
      calculateSale({ ...input, buyPrice: buyPrice.toFixed(4) }).result
        .returnPercentage,
    ).gte(targetPercent);
  for (let i = 0; i < 70; i += 1) {
    const mid = low.plus(high).div(2);
    if (meets(mid)) low = mid;
    else high = mid;
  }
  const price = low.toDecimalPlaces(2, Decimal.ROUND_FLOOR);
  return {
    price: price.toFixed(2),
    calculation: calculateSale({ ...input, buyPrice: price.toFixed(2) }),
  };
}

export function enrichSale(input) {
  const calculation = calculateSale(input);
  const buyValue = D(calculation.values.buyValue);
  return {
    ...calculation,
    result: {
      ...calculation.result,
      breakEvenPrice: solvePrice(input, 0, "sell").price,
      fivePercentTargetPrice: solvePrice(input, buyValue.times("0.05"), "sell")
        .price,
      maximumBuyPriceForFivePercent: solveMaximumBuyForReturn(input, 5).price,
    },
  };
}
