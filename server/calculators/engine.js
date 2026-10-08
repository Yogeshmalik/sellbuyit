import Decimal from "decimal.js";
import { D, rupee, zero } from "./money.js";
import { calculateCharges } from "./charges.js";
import { ruleForDate } from "../rules/marketRules.js";
import { brokerById } from "../brokers/brokerRules.js";

const decimalSum = (values) =>
  values.reduce((sum, item) => sum.plus(item), zero());
const money = (value) => rupee(value).toFixed(2);
const MAX_SOLVER_PRICE = D("10000000");
const MAX_EXPANSIONS = 80;
const MAX_ITERATIONS = 70;

function groups(input) {
  if (input.holdingType === "mixed") {
    return [
      { type: "short", quantity: D(input.shortQuantity) },
      { type: "long", quantity: D(input.longQuantity) },
    ];
  }
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
  if (totalQuantity.lte(0)) {
    throw new Error("Enter at least one share.");
  }

  // STT is specifically excluded from capital-gain deductions. The remaining
  // configured acquisition/transfer expenses are treated as deductible costs
  // for this transaction-level estimate.
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
  if (!input.buyPrice) {
    throw new Error("Enter your average buy price.");
  }
  if (!input.sellPrice) {
    throw new Error("Enter the selling price.");
  }

  const market = ruleForDate(input.transactionDate);
  const broker = brokerById(input.broker);
  const buyPrice = D(input.buyPrice);
  const sellPrice = D(input.sellPrice);
  const holdingGroups = groups(input);
  const quantity = decimalSum(holdingGroups.map((g) => g.quantity));
  if (quantity.lte(0)) {
    throw new Error("Enter at least one share.");
  }

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

  const grossProfit = sellValue.minus(buyValue);
  const profitBeforeTax = grossProfit.minus(chargeTotal);
  const netProfit = profitBeforeTax.minus(tax.totalTax);
  const netSaleProceeds = sellValue
    .minus(
      charges
        .filter((charge) => charge.side !== "buy")
        .reduce((sum, charge) => sum.plus(charge.amount), zero()),
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
      grossProfit: money(grossProfit),
      profitBeforeTax: money(profitBeforeTax),
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
  if (
    targetProfit === undefined ||
    targetProfit === null ||
    targetProfit === ""
  ) {
    throw new Error("Enter the profit target you want to achieve.");
  }
  const target = D(targetProfit);
  if (!target.isFinite() || target.lt(0)) {
    throw new Error(
      "Enter a valid profit target greater than or equal to zero.",
    );
  }
  if (direction !== "sell" && direction !== "buy") {
    throw new Error("This price calculation is not supported.");
  }

  const fixed = D(direction === "sell" ? input.buyPrice : input.sellPrice);
  if (!fixed.isFinite() || fixed.lte(0)) {
    throw new Error(
      direction === "sell"
        ? "Enter your average buy price before calculating a target selling price."
        : "Enter the expected selling price before calculating a target buying price.",
    );
  }

  const low = D("0.01");
  let high =
    direction === "sell"
      ? Decimal.max(fixed.times(3).plus(100), D("1"))
      : fixed;

  const evaluate = (price) =>
    D(
      calculateSale({
        ...input,
        [direction === "sell" ? "sellPrice" : "buyPrice"]: price.toFixed(4),
      }).result.netProfit,
    );

  if (direction === "sell") {
    let expansions = 0;
    while (evaluate(high).lt(target)) {
      if (expansions >= MAX_EXPANSIONS || high.gte(MAX_SOLVER_PRICE)) {
        throw new Error(
          "This profit target cannot be reached within the supported price range. Try a lower target or check your trade details.",
        );
      }
      high = Decimal.min(high.times(2), MAX_SOLVER_PRICE);
      expansions += 1;
    }
  } else if (evaluate(low).lt(target)) {
    throw new Error(
      "This profit target cannot be reached even at the lowest supported buying price. Try a lower target or a higher expected selling price.",
    );
  }

  let left = low;
  let right = high;
  for (let i = 0; i < MAX_ITERATIONS; i += 1) {
    const mid = left.plus(right).div(2);
    const value = evaluate(mid);
    if (value.gte(target)) {
      if (direction === "sell") right = mid;
      else left = mid;
    } else if (direction === "sell") {
      left = mid;
    } else {
      right = mid;
    }
  }

  const price =
    direction === "sell"
      ? right.toDecimalPlaces(2, Decimal.ROUND_CEIL)
      : left.toDecimalPlaces(2, Decimal.ROUND_FLOOR);

  return {
    price: price.toFixed(2),
    calculation: calculateSale({
      ...input,
      [direction === "sell" ? "sellPrice" : "buyPrice"]: price.toFixed(2),
    }),
  };
}

export function solveMaximumBuyForReturn(input, targetPercent) {
  if (
    targetPercent === undefined ||
    targetPercent === null ||
    targetPercent === ""
  ) {
    throw new Error("Enter the target net profit percentage you require.");
  }
  const target = D(targetPercent);
  if (!target.isFinite() || target.lte(0)) {
    throw new Error("Enter a target net profit percentage greater than 0.");
  }
  if (!input.sellPrice) {
    throw new Error("Enter the expected selling price.");
  }

  let low = D("0.01");
  let high = D(input.sellPrice);
  if (high.lte(low)) {
    throw new Error(
      "The expected selling price must be greater than ₹0.01 for this calculation.",
    );
  }

  const meets = (buyPrice) =>
    D(
      calculateSale({ ...input, buyPrice: buyPrice.toFixed(4) }).result
        .returnPercentage,
    ).gte(target);

  if (!meets(low)) {
    throw new Error(
      "The target return cannot be achieved even at ₹0.01 per share. Try a lower target or a higher expected selling price.",
    );
  }
  for (let i = 0; i < MAX_ITERATIONS; i += 1) {
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
  return {
    ...calculation,
    result: {
      ...calculation.result,
      breakEvenPrice: solvePrice(input, 0, "sell").price,
    },
  };
}
