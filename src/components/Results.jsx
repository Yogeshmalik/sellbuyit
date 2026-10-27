import { lazy, Suspense } from "react";
import { rupees, pct } from "../utils/formatters.js";
import { Tip } from "./FormField.jsx";
import ResultRows from "./ResultRows.jsx";

const TradeInsights = lazy(() => import("./TradeInsights.jsx"));

function Results({ data, kind }) {
  if (!data)
    return (
      <aside className="empty">
        <span>Calculation output</span>
        <p>Enter the required trade details to generate an estimate.</p>
      </aside>
    );

  const calculation = data.calculation || data;
  const loss = Number(calculation.result.netProfit) < 0;
  const isSale = kind === "sale";
  const isTarget = kind === "target";
  return (
    <section className="results" aria-live="polite">
      {isSale ? (
        <>
          <div className="metric">
            <span>Final net profit / loss</span>
            <strong className={loss ? "negative" : "positive"}>
              {rupees(calculation.result.netProfit)}
            </strong>
            <small>
              {pct(calculation.result.returnPercentage)} effective net return
            </small>
          </div>
          <div className="summary">
            <span>Net sale proceeds</span>
            <b>{rupees(calculation.result.netSaleProceeds)}</b>
            <span>Profit before tax</span>
            <b>{rupees(calculation.values.profitBeforeTax)}</b>
            <span>Break-even selling price</span>
            <b>{rupees(calculation.result.breakEvenPrice)}</b>
          </div>
        </>
      ) : (
        <>
          <div className="metric">
            <span>
              {isTarget ? "Minimum selling price" : "Maximum buying price"}
            </span>
            <strong className="positive">{rupees(data.price)}</strong>
            <small>
              {isTarget
                ? "Minimum price per share to meet the selected net-profit target"
                : "Maximum price per share while still meeting the selected net-profit target"}
            </small>
          </div>
          <div className="summary">
            <span>Estimated net profit at this price</span>
            <b>{rupees(calculation.result.netProfit)}</b>
            <span>Effective net return</span>
            <b>{pct(calculation.result.returnPercentage)}</b>
            <span>Total charges</span>
            <b>{rupees(calculation.charges.total)}</b>
            <span>Estimated tax</span>
            <b>{rupees(calculation.tax.totalTax)}</b>
          </div>
        </>
      )}

      <Suspense
        fallback={
          <div className="trade-insights-loading" aria-live="polite">
            Preparing trade insights…
          </div>
        }
      >
        <TradeInsights calculation={calculation} kind={kind} />
      </Suspense>

      <table>
        <caption>
          Calculation breakdown{" "}
          <Tip>
            Charges are calculated using the configured broker, exchange,
            transaction date and tax assumptions. Rates are shown for audit
            purposes; the final contract note can differ by paise-level
            rounding, order splitting and account-specific charges.
          </Tip>
        </caption>
        <thead>
          <tr>
            <th>Component</th>
            <th>Rate</th>
            <th>Base</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <ResultRows calculation={calculation} />
        </tbody>
      </table>

      <details className="audit">
        <summary>How this was calculated</summary>
        <p>
          Profit before tax equals gross profit less configured charges. The tax
          estimate then applies the selected short/long-term treatment, the
          available Section 112A allowance and the configured surcharge
          estimate. STT is not deducted from the capital gain calculation. This
          is a transaction-level estimate, not a complete annual income-tax
          return.
        </p>
      </details>
    </section>
  );
}

export default Results;
