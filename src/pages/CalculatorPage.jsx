import { useState } from "react";
import { initial } from "../utils/initialValues.js";
import { Field } from "../components/FormField.jsx";
import Inputs from "../components/TradeInputs.jsx";
import Results from "../components/Results.jsx";
import PageGuide from "../components/PageGuide.jsx";
import {
  toFieldErrors,
  friendlyNetworkError,
  validateClient,
} from "../utils/calculatorHelpers.js";

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

export default Calculator;
