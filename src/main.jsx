import { cloneElement, isValidElement, useState } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, NavLink, Route, Routes } from "react-router-dom";
import "./styles.css";

const today = new Date().toISOString().slice(0, 10);
const initial = {
  broker: "zerodha",
  exchange: "NSE",
  bseGroup: "standard375",
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

const BSE_CATEGORIES = [
  [
    "standard375",
    "₹375/crore category (A/B and specified non-exclusive scrips)",
  ],
  [
    "standard275",
    "₹275/crore category (M/MT/TS/MS and specified exclusive scrips)",
  ],
  ["special10000", "₹10,000/crore category (X/XT/Z)"],
  [
    "special100000",
    "₹1,00,000/crore category (P/ZP/SS/ST and applicable odd-lot cases)",
  ],
];

const rupees = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
const pct = (value) => `${Number(value || 0).toFixed(2)}%`;
const rate = (value) => {
  if (!value || value === "flat") return "Flat";
  const text = String(value);
  if (text.includes("₹") || text.includes("/")) return text;
  const [whole, fraction = ""] = text.split(".");
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
      role="img"
      aria-label={`Help: ${children}`}
      data-tip={children}
    >
      ?
    </span>
  );
}

function Field({ label, children, hint, tip, error }) {
  const control =
    isValidElement(children) && typeof children.type !== "symbol"
      ? cloneElement(children, {
          "aria-invalid": Boolean(error),
          "aria-describedby": error
            ? `${children.props.id || label}-error`
            : undefined,
        })
      : children;
  return (
    <label className={`field${error ? " has-error" : ""}`}>
      <span>
        {label}
        {tip && <Tip>{tip}</Tip>}
      </span>
      {control}
      {hint && !error && <small>{hint}</small>}
      {error && (
        <small
          className="field-error"
          id={`${children.props?.id || label}-error`}
        >
          {error}
        </small>
      )}
    </label>
  );
}

function Inputs({ values, onChange, targetMode, fieldErrors }) {
  const error = (key) => fieldErrors[key];
  const hasAdvancedError = [
    "buyOrders",
    "sellOrders",
    "ltcgUsed",
    "annualTaxableIncome",
  ].some((key) => fieldErrors[key]);
  const input = (key, type = "text") => ({
    id: key,
    type,
    value: values[key],
    onChange: (event) => onChange(key, event.target.value),
  });

  return (
    <div className="form-grid">
      <Field
        label="Broker"
        tip="Choose the broker whose charges should be used. Brokerage and demat charges can differ between brokers."
        error={error("broker")}
      >
        <select {...input("broker")}>
          <option value="zerodha">Zerodha</option>
          <option value="groww">Groww</option>
          <option value="upstox">Upstox</option>
          <option value="angelone">Angel One</option>
        </select>
      </Field>

      <Field
        label="Exchange"
        tip="Choose where the shares are traded. NSE and BSE have different exchange transaction charges."
        error={error("exchange")}
      >
        <select {...input("exchange")}>
          <option>NSE</option>
          <option>BSE</option>
        </select>
      </Field>

      {values.exchange === "BSE" && (
        <Field
          label="BSE fee category"
          hint="Check the applicable category for your stock in your broker/BSE information."
          tip="BSE transaction charges vary widely by the stock's applicable fee category. This selection is required so the calculator uses the correct BSE charge instead of assuming one rate for every stock."
          error={error("bseGroup")}
        >
          <select {...input("bseGroup")}>
            {BSE_CATEGORIES.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field
        label="Holding type"
        tip="For listed equity, 12 months is the usual long-term threshold. Choose the tax category that applies to the shares being sold; the calculator does not verify your purchase date."
        error={error("holdingType")}
      >
        <select {...input("holdingType")}>
          <option value="short">Short Term</option>
          <option value="long">Long Term</option>
          <option value="mixed">Short + Long Term</option>
        </select>
      </Field>

      {values.holdingType === "mixed" ? (
        <>
          <Field
            label="Short-term shares"
            tip="Enter how many shares in this sale are short-term. This matters because short-term and long-term gains use different tax rates."
            error={error("shortQuantity")}
          >
            <input inputMode="numeric" {...input("shortQuantity")} />
          </Field>
          <Field
            label="Long-term shares"
            tip="Enter how many shares in this sale are long-term. This matters because long-term gains use different tax treatment and the Section 112A allowance can apply."
            error={error("longQuantity")}
          >
            <input inputMode="numeric" {...input("longQuantity")} />
          </Field>
        </>
      ) : (
        <Field
          label="Number of shares"
          tip="Enter the number of shares being sold. The quantity determines your total investment, sale value and the effect of fixed or minimum broker/demat charges. It is therefore required even when you are targeting a percentage profit."
          error={error("quantity")}
        >
          <input inputMode="numeric" {...input("quantity")} />
        </Field>
      )}

      {targetMode !== "maximum" && (
        <Field
          label="Average buy price"
          tip="Enter the average amount you paid for one share. The calculator uses it to work out your investment and, on the Target Profit page, the rupee value of a percentage target."
          error={error("buyPrice")}
        >
          <input inputMode="decimal" {...input("buyPrice")} />
        </Field>
      )}

      {targetMode === "maximum" && (
        <Field
          label="Expected selling price"
          tip="Enter the price you expect to receive for one share. The Maximum Buy calculator works backwards from this value to find the highest buying price that can still meet your target net return."
          error={error("sellPrice")}
        >
          <input inputMode="decimal" {...input("sellPrice")} />
        </Field>
      )}

      {targetMode === "sale" && (
        <Field
          label="Selling price"
          tip="Enter the price at which you expect to sell one share. The calculator estimates the final amount left after configured charges and transaction-level tax."
          error={error("sellPrice")}
        >
          <input inputMode="decimal" {...input("sellPrice")} />
        </Field>
      )}

      <Field
        label="Transaction date"
        tip="Choose the date of the trade. The calculator applies the charge and tax rule set effective on that date. The current configured rule set starts on 1 March 2026."
        error={error("transactionDate")}
      >
        <input type="date" {...input("transactionDate")} />
      </Field>

      <Field
        label="DP tariff category"
        hint="This matters only for brokers whose DP tariff differs by category."
        tip="DP means the demat-account debit charge applied when shares are sold. Depending on the broker, it may be charged once per stock/day or once per sell transaction."
        error={error("dpCategory")}
      >
        <select {...input("dpCategory")}>
          <option value="male">Male</option>
          <option value="female">Female</option>
        </select>
      </Field>

      <details className="advanced" open={hasAdvancedError ? true : undefined}>
        <summary>Advanced estimation inputs</summary>
        <div className="advanced-grid">
          <Field
            label="Separate buy orders"
            tip="Enter how many separate buy orders made up this purchase. Some broker fees are charged per executed order. Because the app does not have each order's individual value, it assumes the total buy value was split equally across these orders."
            error={error("buyOrders")}
          >
            <input inputMode="numeric" {...input("buyOrders")} />
          </Field>
          <Field
            label="Separate sell orders"
            tip="Enter how many separate sell orders made up this sale. Some brokerage and DP charges are charged per transaction/order. The calculator assumes the total sell value was split equally across these orders."
            error={error("sellOrders")}
          >
            <input inputMode="numeric" {...input("sellOrders")} />
          </Field>
          <Field
            label="LTCG exemption already used"
            tip="Enter how much of the ₹1,25,000 Section 112A long-term capital-gain allowance has already been used by other eligible gains during the same financial year. Enter ₹0 when none has been used."
            error={error("ltcgUsed")}
          >
            <input inputMode="decimal" {...input("ltcgUsed")} />
          </Field>
          <Field
            label="Annual taxable income before this sale"
            hint="Optional: used only for the surcharge estimate."
            tip="Enter your estimated taxable income for the financial year before adding this sale's gain. It is used only to estimate surcharge and is not a complete yearly income-tax calculation."
            error={error("annualTaxableIncome")}
          >
            <input
              inputMode="decimal"
              placeholder="Optional"
              {...input("annualTaxableIncome")}
            />
          </Field>
        </div>
      </details>
    </div>
  );
}

function ResultRows({ calculation }) {
  const rows = calculation.charges.items;
  return (
    <>
      <tr className="section">
        <th colSpan="4">TRANSACTION</th>
      </tr>
      <tr>
        <th>Buy value</th>
        <td>-</td>
        <td>-</td>
        <td>{rupees(calculation.values.buyValue)}</td>
      </tr>
      <tr>
        <th>Sell value</th>
        <td>-</td>
        <td>-</td>
        <td>{rupees(calculation.values.sellValue)}</td>
      </tr>
      <tr>
        <th>Gross profit / loss</th>
        <td>-</td>
        <td>-</td>
        <td>{rupees(calculation.values.grossProfit)}</td>
      </tr>
      <tr className="section">
        <th colSpan="4">CHARGES</th>
      </tr>
      {rows.map((item) => (
        <tr key={item.name}>
          <th>{item.name}</th>
          <td>{rate(item.rate)}</td>
          <td>{rupees(item.base)}</td>
          <td>{rupees(item.amount)}</td>
        </tr>
      ))}
      <tr>
        <th>Total charges</th>
        <td>-</td>
        <td>-</td>
        <td>{rupees(calculation.charges.total)}</td>
      </tr>
      <tr>
        <th>Profit before tax</th>
        <td>-</td>
        <td>-</td>
        <td>{rupees(calculation.values.profitBeforeTax)}</td>
      </tr>
      <tr className="section">
        <th colSpan="4">TAX</th>
      </tr>
      <tr>
        <th>STCG taxable gain</th>
        <td>-</td>
        <td>{rupees(calculation.tax.stcg)}</td>
        <td>{rupees(calculation.tax.stcgTax)}</td>
      </tr>
      <tr>
        <th>LTCG taxable gain after allowance</th>
        <td>-</td>
        <td>{rupees(calculation.tax.taxableLtcg)}</td>
        <td>{rupees(calculation.tax.ltcgTax)}</td>
      </tr>
      <tr>
        <th>Surcharge</th>
        <td>{Number(calculation.tax.surchargeRate) * 100 || 0}%</td>
        <td>{rupees(calculation.tax.incomeTax)}</td>
        <td>{rupees(calculation.tax.surcharge)}</td>
      </tr>
      <tr>
        <th>Health &amp; Education Cess</th>
        <td>4%</td>
        <td>
          {rupees(
            Number(calculation.tax.incomeTax) +
              Number(calculation.tax.surcharge),
          )}
        </td>
        <td>{rupees(calculation.tax.cess)}</td>
      </tr>
      <tr>
        <th>LTCG allowance applied</th>
        <td>-</td>
        <td>-</td>
        <td>{rupees(calculation.tax.ltcgExemption)}</td>
      </tr>
      <tr>
        <th>Total estimated tax</th>
        <td>-</td>
        <td>-</td>
        <td>{rupees(calculation.tax.totalTax)}</td>
      </tr>
    </>
  );
}

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

function PageGuide({ kind }) {
  const explanations = {
    sale: "Enter the price you expect to sell at. The calculator shows what you keep after configured charges and an estimated transaction-level tax, plus the selling price where the trade reaches break-even.",
    target:
      "Enter the amount or percentage of net profit you want. The calculator works backwards from your buy price and trade details to find the lowest selling price that should meet that target after configured charges and estimated tax.",
    maximum:
      "Enter the expected selling price and the net return you require. The calculator works backwards to find the highest price you can pay per share while still meeting that target after configured charges and estimated tax.",
  };
  return (
    <section id="about" className="page-guide">
      <strong>How this calculator works</strong>
      <p>{explanations[kind]}</p>
    </section>
  );
}

function toFieldErrors(issues = {}) {
  return Object.fromEntries(
    Object.entries(issues).map(([key, messages]) => [key, messages?.[0] || ""]),
  );
}

function friendlyNetworkError(error) {
  if (error?.name === "TypeError") {
    return "The calculator service is unavailable right now. Please make sure the calculation server is running and try again.";
  }
  return (
    error?.message ||
    "The calculation could not be completed. Please check the highlighted fields."
  );
}

function validateClient(values, kind, targetType, targetValue) {
  const errors = {};
  const positive = (value) =>
    value !== "" && Number.isFinite(Number(value)) && Number(value) > 0;
  const whole = (value) => /^\d+$/.test(String(value)) && Number(value) > 0;

  if (!whole(values.buyOrders))
    errors.buyOrders =
      "Enter the number of separate buy orders as a positive whole number.";
  if (!whole(values.sellOrders))
    errors.sellOrders =
      "Enter the number of separate sell orders as a positive whole number.";
  if (!values.transactionDate)
    errors.transactionDate = "Choose the transaction date.";
  if (values.exchange === "BSE" && !values.bseGroup)
    errors.bseGroup = "Choose the BSE fee category for your stock.";
  if (values.holdingType === "mixed") {
    if (!whole(values.shortQuantity))
      errors.shortQuantity = "Enter the number of short-term shares.";
    if (!whole(values.longQuantity))
      errors.longQuantity = "Enter the number of long-term shares.";
  } else if (!whole(values.quantity)) {
    errors.quantity = "Enter the number of shares as a positive whole number.";
  }

  if (kind !== "maximum" && !positive(values.buyPrice)) {
    errors.buyPrice =
      "Enter your average buy price as a number greater than zero.";
  }
  if (kind === "sale" && !positive(values.sellPrice)) {
    errors.sellPrice = "Enter the selling price as a number greater than zero.";
  }
  if (kind === "maximum" && !positive(values.sellPrice)) {
    errors.sellPrice =
      "Enter the expected selling price as a number greater than zero.";
  }

  const ltcgUsed = Number(values.ltcgUsed);
  if (values.ltcgUsed !== "" && (!Number.isFinite(ltcgUsed) || ltcgUsed < 0)) {
    errors.ltcgUsed = "Enter a non-negative LTCG allowance amount.";
  } else if (ltcgUsed > 125000) {
    errors.ltcgUsed = "This amount cannot be more than ₹1,25,000.";
  }
  const annualIncome = Number(values.annualTaxableIncome);
  if (
    values.annualTaxableIncome !== "" &&
    (!Number.isFinite(annualIncome) || annualIncome < 0)
  ) {
    errors.annualTaxableIncome =
      "Enter a non-negative annual taxable income amount.";
  }

  if (kind === "target" || kind === "maximum") {
    if (!positive(targetValue)) {
      errors.targetValue =
        kind === "target"
          ? "Enter the net-profit target you want to achieve."
          : "Enter the net-profit percentage you require.";
    }
    if (kind === "target" && !["percentage", "amount"].includes(targetType)) {
      errors.targetType =
        "Choose whether your target is a percentage or a rupee amount.";
    }
  }
  return errors;
}

function Calculator({ kind = "sale" }) {
  const [values, setValues] = useState(initial);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [targetType, setTargetType] = useState("percentage");
  const [targetValue, setTargetValue] = useState("5");

  const titles = {
    sale: [
      "Stock Sale Calculator",
      "See your estimated charges, tax and final net result before you sell.",
    ],
    target: [
      "Target Profit Calculator",
      "Find the minimum selling price needed to reach the net profit you want.",
    ],
    maximum: [
      "Maximum Buy Price",
      "Find the highest buying price that can still meet your required net return.",
    ],
  };

  const updateValue = (key, value) => {
    setValues((current) => ({ ...current, [key]: value }));
    setFieldErrors((current) => ({ ...current, [key]: "" }));
    setError("");
    setData(null);
  };

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setFieldErrors({});

    const clientErrors = validateClient(values, kind, targetType, targetValue);
    if (Object.keys(clientErrors).length) {
      setFieldErrors(clientErrors);
      setError("Please correct the highlighted fields.");
      return;
    }

    setLoading(true);
    try {
      const endpoint =
        kind === "sale"
          ? "sale"
          : kind === "target"
            ? "target-profit"
            : "maximum-buy-price";

      const body = {
        broker: values.broker,
        exchange: values.exchange,
        bseGroup: values.bseGroup,
        holdingType: values.holdingType,
        quantity: values.quantity,
        shortQuantity: values.shortQuantity,
        longQuantity: values.longQuantity,
        transactionDate: values.transactionDate,
        dpCategory: values.dpCategory,
        buyOrders: values.buyOrders,
        sellOrders: values.sellOrders,
        ltcgUsed: values.ltcgUsed || "0",
        annualTaxableIncome: values.annualTaxableIncome,
      };

      if (kind !== "maximum") body.buyPrice = values.buyPrice;
      if (kind !== "target") body.sellPrice = values.sellPrice;
      if (kind === "target") {
        body.targetType = targetType;
        body.targetValue = targetValue;
      }
      if (kind === "maximum") body.targetPercent = targetValue;

      const response = await fetch(`/api/calculations/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      let payload;
      try {
        payload = await response.json();
      } catch {
        throw new Error(
          "The calculator service returned an unexpected response. Please try again.",
        );
      }

      if (!response.ok || !payload.success) {
        const serverFields = payload.error?.fields;
        if (serverFields) setFieldErrors(toFieldErrors(serverFields));
        throw new Error(
          payload.error?.message ||
            "The calculation could not be completed. Please check the highlighted fields.",
        );
      }

      setData(payload.data);
    } catch (err) {
      setError(friendlyNetworkError(err));
    } finally {
      setLoading(false);
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
        <form className="panel" onSubmit={submit} noValidate>
          <h2>{kind === "sale" ? "Trade details" : "Required inputs"}</h2>

          {kind === "target" && (
            <div className="target-settings">
              <Field
                label="Target profit type"
                tip="Choose Percentage when you want a return relative to your investment. Choose Rupee amount when you have a specific net profit figure in mind. In both cases, the target is treated as profit after estimated charges and tax."
                error={fieldErrors.targetType}
              >
                <select
                  id="targetType"
                  value={targetType}
                  onChange={(event) => {
                    setTargetType(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      targetType: "",
                      targetValue: "",
                    }));
                    setError("");
                  }}
                >
                  <option value="percentage">Percentage</option>
                  <option value="amount">Rupee amount</option>
                </select>
              </Field>
              <Field
                label={
                  targetType === "percentage"
                    ? "Target net profit %"
                    : "Target net profit amount"
                }
                tip={
                  targetType === "percentage"
                    ? "Enter the net profit you want as a percentage of the amount invested. The result accounts for estimated charges and tax, so it is not the same as a simple price change percentage."
                    : "Enter the rupee amount of net profit you want to keep after estimated charges and tax."
                }
                error={fieldErrors.targetValue}
              >
                <input
                  id="targetValue"
                  inputMode="decimal"
                  value={targetValue}
                  onChange={(event) => {
                    setTargetValue(event.target.value);
                    setFieldErrors((current) => ({
                      ...current,
                      targetValue: "",
                    }));
                    setError("");
                    setData(null);
                  }}
                />
              </Field>
            </div>
          )}

          {kind === "maximum" && (
            <Field
              label="Required net profit %"
              tip="Enter the minimum net return you require as a percentage of the amount invested. The result includes estimated charges and tax, so it is not simply the difference between buy and sell prices."
              error={fieldErrors.targetValue}
            >
              <input
                id="targetValue"
                inputMode="decimal"
                value={targetValue}
                onChange={(event) => {
                  setTargetValue(event.target.value);
                  setFieldErrors((current) => ({
                    ...current,
                    targetValue: "",
                  }));
                  setError("");
                  setData(null);
                }}
              />
            </Field>
          )}

          <Inputs
            values={values}
            onChange={updateValue}
            targetMode={kind}
            fieldErrors={fieldErrors}
          />

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
          <button type="submit" disabled={loading}>
            {loading ? "Calculating..." : "Calculate"}{" "}
            {kind === "target"
              ? "target price"
              : kind === "maximum"
                ? "maximum buy price"
                : "sale outcome"}
          </button>
        </form>
        <Results data={data} kind={kind} />
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
