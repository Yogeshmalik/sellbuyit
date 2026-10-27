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

export { initial };
