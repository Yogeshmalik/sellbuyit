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
  const percentage = Number(value) * 100;
  if (!Number.isFinite(percentage)) return text;
  const formatted = percentage.toFixed(6).replace(/\.?0+$/, "");
  return `${formatted}%`;
};

export { rupees, pct, rate };
