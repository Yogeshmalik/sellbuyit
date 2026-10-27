import { rupees, pct } from "../utils/formatters.js";

function TradeInsights({ calculation, kind }) {
  const netProfit = Number(calculation.result.netProfit || 0);
  const grossProfit = Number(calculation.values.grossProfit || 0);
  const charges = Number(calculation.charges.total || 0);
  const profitBeforeTax = Number(calculation.values.profitBeforeTax || 0);
  const tax = Number(calculation.tax.totalTax || 0);
  const breakEven =
    calculation.result.breakEvenPrice == null
      ? null
      : Number(calculation.result.breakEvenPrice);
  const sellPrice = Number(calculation.transaction?.sellPrice || 0);
  const buyPrice = Number(calculation.transaction?.buyPrice || 0);
  const chargeShare = grossProfit > 0 ? (charges / grossProfit) * 100 : null;
  const largestCharges = [...(calculation.charges.items || [])]
    .filter((item) => Number(item.amount) > 0)
    .sort((a, b) => Number(b.amount) - Number(a.amount))
    .slice(0, 2);
  const breakEvenGap =
    breakEven != null && sellPrice > 0 ? sellPrice - breakEven : null;

  const headline =
    netProfit > 0
      ? "This trade is estimated to finish in profit."
      : netProfit < 0
        ? "This trade is estimated to finish at a loss."
        : "This trade is estimated to break even after charges and tax.";

  const details = [];
  if (grossProfit <= 0) {
    details.push(
      "The buy and sell prices produce no gross profit before charges. Transaction costs and any applicable tax can increase the loss.",
    );
  } else if (charges > 0 && chargeShare != null) {
    details.push(
      `Estimated transaction charges of ${rupees(charges)} consume ${pct(chargeShare)} of the gross profit before tax.`,
    );
  }

  if (largestCharges.length) {
    details.push(
      `Largest charge${largestCharges.length > 1 ? "s" : ""}: ${largestCharges.map((item) => `${item.name} (${rupees(item.amount)})`).join(" and ")}.`,
    );
  }

  if (tax > 0) {
    details.push(
      `Estimated tax reduces the pre-tax result from ${rupees(profitBeforeTax)} to ${rupees(netProfit)}. This is a transaction-level estimate, not a complete annual tax calculation.`,
    );
  } else if (profitBeforeTax > 0) {
    details.push(
      "No transaction-level capital-gains tax was estimated for these inputs. Your final annual tax may differ based on your overall tax position and eligibility.",
    );
  }

  if (breakEvenGap != null) {
    if (breakEvenGap > 0) {
      details.push(
        `Your entered selling price is ${rupees(breakEvenGap)} per share above the estimated break-even price of ${rupees(breakEven)}.`,
      );
    } else if (breakEvenGap < 0) {
      details.push(
        `Your entered selling price is ${rupees(Math.abs(breakEvenGap))} per share below the estimated break-even price of ${rupees(breakEven)}.`,
      );
    } else {
      details.push(
        `Your selling price matches the estimated break-even price of ${rupees(breakEven)}.`,
      );
    }
  } else if (kind === "target" && buyPrice > 0) {
    details.push(
      `The target selling price is based on a buy price of ${rupees(buyPrice)} per share and includes the configured charges and estimated tax.`,
    );
  } else if (kind === "maximum" && sellPrice > 0) {
    details.push(
      `The maximum buy price is calculated against your expected selling price of ${rupees(sellPrice)} per share, including configured charges and estimated tax.`,
    );
  }

  return (
    <section className="trade-insights" aria-label="Trade insights">
      <div className="insights-heading">
        <div>
          <span className="eyebrow">TRADE INSIGHTS</span>
          <h3>{headline}</h3>
        </div>
        <span className="insights-mark" aria-hidden="true">
          ↗
        </span>
      </div>
      <p className="insights-intro">
        A plain-English explanation based on this calculation, not a buy or sell
        recommendation.
      </p>
      <details className="insights-details">
        <summary>Explain my result</summary>
        <ul>
          {details.map((detail, index) => (
            <li key={`${index}-${detail}`}>{detail}</li>
          ))}
        </ul>
      </details>
    </section>
  );
}

export default TradeInsights;
