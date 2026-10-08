import { useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import "./styles.css";

const today = new Date().toISOString().slice(0, 10);
const initial = {
  broker: "zerodha",
  exchange: "NSE",
  bseGroup: "A",
  holdingType: "short",
  quantity: "97",
  shortQuantity: "40",
  longQuantity: "60",
  buyPrice: "281.80",
  sellPrice: "290",
  transactionDate: today,
  dpCategory: "male",
  buyOrders: "1",
  sellOrders: "1",
  ltcgUsed: "0",
  annualTaxableIncome: "",
};
const rupees = (value) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(
    Number(value || 0),
  );
const pct = (value) => `${Number(value || 0).toFixed(2)}%`;
const rate = (value) => {
  if (!value || value === "flat") return "Flat";
  const [whole, fraction = ""] = String(value).split(".");
  const digits = `${whole}${fraction}`;
  const scale = fraction.length - 2;
  let percentage;
  if (scale <= 0) percentage = `${digits}${"0".repeat(-scale)}`;
  else {
    const padded = digits.padStart(scale + 1, "0");
    const split = padded.length - scale;
    const integerPart = padded.slice(0, split).replace(/^0+(?=\d)/, "");
    const decimalPart = padded.slice(split).replace(/0+$/, "");
    percentage = decimalPart ? `${integerPart}.${decimalPart}` : integerPart;
  }
  return `${percentage}%`;
};

function Tip({ children }) {
  return (
    <span
      className="tip"
      tabIndex="0"
      aria-label={children}
      data-tip={children}
    >
      ?
    </span>
  );
}
function Field({ label, children, hint, tip }) {
  return (
    <label className="field">
      <span>
        {label}
        {tip && <Tip>{tip}</Tip>}
      </span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
function Inputs({ values, setValues, targetMode }) {
  const set = (key) => (event) =>
    setValues({ ...values, [key]: event.target.value });
  return (
    <div className="form-grid">
      <Field label="Broker">
        <select value={values.broker} onChange={set("broker")}>
          <option value="zerodha">Zerodha</option>
          <option value="groww">Groww</option>
          <option value="upstox">Upstox</option>
          <option value="angelone">Angel One</option>
        </select>
      </Field>
      <Field label="Exchange">
        <select value={values.exchange} onChange={set("exchange")}>
          <option>NSE</option>
          <option>BSE</option>
        </select>
      </Field>
      {values.exchange === "BSE" && (
        <Field
          label="BSE scrip group"
          hint="Required because BSE fees differ by group."
          tip="BSE assigns every listed company a group. That group changes the exchange charge; check the company quote or your broker."
        >
          <select value={values.bseGroup} onChange={set("bseGroup")}>
            <option>A</option>
            <option>B</option>
            <option>E</option>
            <option>F</option>
            <option>G</option>
            <option>T</option>
            <option>XC</option>
            <option>XD</option>
            <option>XT</option>
            <option>Z</option>
            <option>ZP</option>
            <option>R</option>
            <option>SS</option>
            <option>ST</option>
          </select>
        </Field>
      )}
      <Field
        label="Holding type"
        tip="Short and long term are tax labels. Listed shares normally become long term after 12 months. V1 uses your selection."
      >
        <select value={values.holdingType} onChange={set("holdingType")}>
          <option value="short">Short Term</option>
          <option value="long">Long Term</option>
          <option value="mixed">Short + Long Term</option>
        </select>
      </Field>
      {values.holdingType === "mixed" ? (
        <>
          <Field label="Short-term shares">
            <input
              inputMode="numeric"
              value={values.shortQuantity}
              onChange={set("shortQuantity")}
            />
          </Field>
          <Field label="Long-term shares">
            <input
              inputMode="numeric"
              value={values.longQuantity}
              onChange={set("longQuantity")}
            />
          </Field>
        </>
      ) : (
        <Field label="Number of shares">
          <input
            inputMode="numeric"
            value={values.quantity}
            onChange={set("quantity")}
          />
        </Field>
      )}
      <Field label="Average buy price">
        <input
          inputMode="decimal"
          value={values.buyPrice}
          onChange={set("buyPrice")}
        />
      </Field>
      <Field
        label={
          targetMode === "maximum" ? "Expected selling price" : "Selling price"
        }
      >
        <input
          inputMode="decimal"
          value={values.sellPrice}
          onChange={set("sellPrice")}
        />
      </Field>
      <Field
        label="Transaction date"
        tip="The calculator selects dated charge and tax rules using this sale date."
      >
        <input
          type="date"
          value={values.transactionDate}
          onChange={set("transactionDate")}
        />
      </Field>
      <Field
        label="DP tariff category"
        hint="Official DP schedules differ by primary-holder category."
        tip="DP is a demat debit fee charged when delivery shares are sold. It is usually one fee per ISIN/day or transaction, not per share."
      >
        <select value={values.dpCategory} onChange={set("dpCategory")}>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </Field>
      <details className="advanced">
        <summary>Advanced estimation inputs</summary>
        <div className="advanced-grid">
          <Field label="Buy executed orders">
            <input
              inputMode="numeric"
              value={values.buyOrders}
              onChange={set("buyOrders")}
            />
          </Field>
          <Field label="Sell executed orders">
            <input
              inputMode="numeric"
              value={values.sellOrders}
              onChange={set("sellOrders")}
            />
          </Field>
          <Field label="LTCG exemption already used">
            <input
              inputMode="decimal"
              value={values.ltcgUsed}
              onChange={set("ltcgUsed")}
            />
          </Field>
          <Field label="Annual taxable income">
            <input
              inputMode="decimal"
              placeholder="Optional"
              value={values.annualTaxableIncome}
              onChange={set("annualTaxableIncome")}
            />
          </Field>
        </div>
      </details>
    </div>
  );
}
function Results({ data }) {
  if (!data)
    return (
      <aside className="empty">
        <span>Calculation output</span>
        <p>Enter a delivery trade to generate an auditable estimate.</p>
      </aside>
    );
  const loss = Number(data.result.netProfit) < 0;
  const rows = [
    ...data.charges.items,
    {
      name: "STCG tax",
      rate: "",
      base: data.tax.stcg,
      amount: data.tax.stcgTax,
    },
    {
      name: "LTCG tax",
      rate: "",
      base: data.tax.taxableLtcg,
      amount: data.tax.ltcgTax,
    },
    {
      name: "Surcharge",
      rate: `${Number(data.tax.surchargeRate) * 100}%`,
      base: data.tax.incomeTax,
      amount: data.tax.surcharge,
    },
    {
      name: "Health & Education Cess",
      rate: "4%",
      base: Number(data.tax.incomeTax) + Number(data.tax.surcharge),
      amount: data.tax.cess,
    },
  ];
  return (
    <section className="results" aria-live="polite">
      <div className="metric">
        <span>Final net profit / loss</span>
        <strong className={loss ? "negative" : "positive"}>
          {rupees(data.result.netProfit)}
        </strong>
        <small>{pct(data.result.returnPercentage)} effective net return</small>
      </div>
      <div className="summary">
        <span>Net sale proceeds</span>
        <b>{rupees(data.result.netSaleProceeds)}</b>
        <span>Break-even selling price</span>
        <b>{rupees(data.result.breakEvenPrice)}</b>
        <span>5% net-profit selling price</span>
        <b>{rupees(data.result.fivePercentTargetPrice)}</b>
        <span>5% maximum buy price</span>
        <b>{rupees(data.result.maximumBuyPriceForFivePercent)}</b>
      </div>
      <table>
        <caption>
          Calculation breakdown{" "}
          <Tip>
            Rates show up to four decimal places for readability. The server
            retains full Decimal precision.
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
          <tr className="section">
            <th colSpan="4">TRANSACTION</th>
          </tr>
          <tr>
            <th>Buy value</th>
            <td>-</td>
            <td>-</td>
            <td>{rupees(data.values.buyValue)}</td>
          </tr>
          <tr>
            <th>Sell value</th>
            <td>-</td>
            <td>-</td>
            <td>{rupees(data.values.sellValue)}</td>
          </tr>
          <tr className="section">
            <th colSpan="4">CHARGES</th>
          </tr>
          {rows.slice(0, data.charges.items.length).map((r) => (
            <tr key={r.name}>
              <th>{r.name}</th>
              <td>{rate(r.rate)}</td>
              <td>{rupees(r.base)}</td>
              <td>{rupees(r.amount)}</td>
            </tr>
          ))}
          <tr>
            <th>Total charges</th>
            <td>-</td>
            <td>-</td>
            <td>{rupees(data.charges.total)}</td>
          </tr>
          <tr className="section">
            <th colSpan="4">TAX</th>
          </tr>
          {rows.slice(data.charges.items.length).map((r) => (
            <tr key={r.name}>
              <th>{r.name}</th>
              <td>{r.rate || "-"}</td>
              <td>{rupees(r.base)}</td>
              <td>{rupees(r.amount)}</td>
            </tr>
          ))}
          <tr>
            <th>LTCG exemption applied</th>
            <td>-</td>
            <td>-</td>
            <td>{rupees(data.tax.ltcgExemption)}</td>
          </tr>
          <tr>
            <th>Total tax</th>
            <td>-</td>
            <td>-</td>
            <td>{rupees(data.tax.totalTax)}</td>
          </tr>
        </tbody>
      </table>
      <details className="audit">
        <summary>How this was calculated</summary>
        <p>
          Capital gain uses gross sale less cost and configured tax-deductible
          transaction expenses; STT is displayed but excluded from
          tax-deductible expenses. This is a transaction estimate, not an annual
          tax return calculation.
        </p>
      </details>
    </section>
  );
}
function PageGuide({ kind }) {
  const explanations = {
    sale: "This page estimates what you keep after selling shares at the price you enter. It includes configured charges and an estimated transaction-level tax. It does not replace your broker contract note or calculate your complete yearly income-tax return.",
    target:
      "This page works backwards from the profit you want. It finds the lowest selling price that should meet that goal after configured charges and estimated tax. It cannot guarantee the market will reach that price.",
    maximum:
      "This page works backwards from an expected selling price. It estimates the highest price you could pay and still keep your target net return. It is not a buy recommendation and cannot predict future prices.",
  };
  return (
    <section id="about" className="page-guide">
      <details>
        <summary>What does this page do?</summary>
        <p>{explanations[kind]}</p>
      </details>
    </section>
  );
}

function Calculator({ kind = "sale" }) {
  const [values, setValues] = useState(initial);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [targetType, setTargetType] = useState("percentage");
  const [targetValue, setTargetValue] = useState("5");
  const titles = {
    sale: [
      "Stock Sale Calculator",
      "Estimate charges, tax and net outcome for an Indian equity delivery sale.",
    ],
    target: [
      "Target Profit Calculator",
      "Find the minimum sale price needed to achieve a net profit after charges and tax.",
    ],
    maximum: [
      "Maximum Buy Price",
      "Find the maximum per-share entry price compatible with your required net return.",
    ],
  };
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const endpoint =
        kind === "sale"
          ? "sale"
          : kind === "target"
            ? "target-profit"
            : "maximum-buy-price";
      const cleanValues = Object.fromEntries(
        Object.entries(values).filter(([, value]) => value !== ""),
      );
      const body =
        kind === "target"
          ? { ...cleanValues, targetType, targetValue }
          : kind === "maximum"
            ? { ...cleanValues, targetPercent: targetValue }
            : cleanValues;
      const response = await fetch(`/api/calculations/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const payload = await response.json();
      if (!response.ok || !payload.success)
        throw new Error(
          payload.error?.message || "The calculation could not be completed.",
        );
      setData(kind === "sale" ? payload.data : payload.data.calculation);
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <main>
      <header className="page-title">
        <p>INDIAN EQUITY - DELIVERY</p>
        <h1>{titles[kind][0]}</h1>
        <p>{titles[kind][1]}</p>
      </header>
      <div className="workspace">
        <form className="panel" onSubmit={submit}>
          <h2>Trade inputs</h2>
          {kind !== "sale" && (
            <Field
              label={
                kind === "target"
                  ? "Target profit type"
                  : "Desired minimum net profit %"
              }
              tip={
                kind === "target"
                  ? "Percentage means net profit compared with the amount invested. Absolute amount means a rupee profit target."
                  : "This target is measured against your buy value and includes estimated charges and taxes."
              }
            >
              {kind === "target" && (
                <select
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                >
                  <option value="percentage">Percentage</option>
                  <option value="amount">Absolute amount</option>
                </select>
              )}
              <input
                inputMode="decimal"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
              />
            </Field>
          )}
          <Inputs values={values} setValues={setValues} targetMode={kind} />
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button>
            Calculate{" "}
            {kind === "target"
              ? "target price"
              : kind === "maximum"
                ? "maximum buy price"
                : "sale outcome"}
          </button>
        </form>
        <Results data={data} />
      </div>
      <PageGuide kind={kind} />
    </main>
  );
}
function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r=".9" className="fill" />
    </svg>
  );
}
function App() {
  return (
    <BrowserRouter>
      <header className="topbar">
        <NavLink to="/calculator" className="brand">
          Equity Ledger
        </NavLink>
        <nav aria-label="Main navigation">
          <NavLink to="/calculator">Stock Sale</NavLink>
          <NavLink to="/target-profit">Target Profit</NavLink>
          <NavLink to="/maximum-buy-price">Maximum Buy</NavLink>
          <a href="#about">About</a>
        </nav>
      </header>
      <Routes>
        <Route path="*" element={<Calculator />} />
        <Route path="/calculator" element={<Calculator />} />
        <Route path="/target-profit" element={<Calculator kind="target" />} />
        <Route
          path="/maximum-buy-price"
          element={<Calculator kind="maximum" />}
        />
      </Routes>
      <footer>
        <span>
          This calculator provides an estimate based on configured broker and
          Indian tax/market rules. Verify final amounts against your contract
          note and applicable tax rules.
        </span>
        <a
          href="https://instagram.com/thesixftperspective"
          target="_blank"
          rel="noreferrer"
        >
          <InstagramIcon />
          Made by Yogesh SM
        </a>
      </footer>
    </BrowserRouter>
  );
}
createRoot(document.getElementById("root")).render(<App />);
