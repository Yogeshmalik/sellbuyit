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

export { toFieldErrors, friendlyNetworkError, validateClient };
