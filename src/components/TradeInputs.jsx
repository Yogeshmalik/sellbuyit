import { Field } from "./FormField.jsx";
import { BSE_CATEGORIES } from "../utils/bseCategories.js";

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
          hint="Check the stock's BSE group and whether it is exclusive/non-exclusive in your broker or BSE scrip master."
          tip="BSE transaction charges depend on the stock's BSE group and, for E/F/FC/G/GC/I/W/T groups, whether the scrip is exclusive or non-exclusive. Choose the rate category that matches your stock. BSE's current master circular is the primary source for these categories and rates."
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
        tip="For listed equity, 12 months is the usual long-term threshold. For Section 112A's concessional rate, STT conditions can also apply. Choose the tax category that applies to the shares being sold; the calculator does not verify your purchase date or whether every tax condition is satisfied."
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

export default Inputs;
