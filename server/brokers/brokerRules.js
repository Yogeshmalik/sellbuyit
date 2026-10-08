const source = (name, url) => ({ name, url, lastVerified: "2026-10-08" });

export const BROKERS = {
  zerodha: {
    id: "zerodha",
    name: "Zerodha",
    effectiveFrom: "2026-03-01",
    source: source("Zerodha charges", "https://zerodha.com/charges/"),
    brokerage: { kind: "free" },
    dp: { kind: "gendered", male: "13", female: "12.75", per: "isin-day" },
    exchange: { NSE: "0.0000307", BSE: "0.0000375" },
  },
  groww: {
    id: "groww",
    name: "Groww",
    effectiveFrom: "2026-03-01",
    source: source(
      "Groww pricing",
      "https://groww.in/pricing?showHeader=false",
    ),
    brokerage: {
      kind: "percentage-capped-minimum",
      rate: "0.001",
      cap: "20",
      minimum: "5",
    },
    dp: {
      kind: "threshold-gendered",
      threshold: "100",
      male: "20",
      female: "19.75",
      belowMale: "3.5",
      belowFemale: "3.25",
      per: "sell-transaction",
    },
    exchange: { NSE: "0.0000297", BSE: "0.0000375" },
    ipft: { NSE: "0.000001" },
  },
  upstox: {
    id: "upstox",
    name: "Upstox",
    effectiveFrom: "2026-03-01",
    source: source(
      "Upstox brokerage charges",
      "https://upstox.com/brokerage-charges/",
    ),
    brokerage: { kind: "flat", amount: "20" },
    dp: { kind: "flat", amount: "20", per: "scrip-day" },
    exchange: { NSE: "0.0000307", BSE: null },
  },
  angelone: {
    id: "angelone",
    name: "Angel One",
    effectiveFrom: "2025-11-17",
    source: source(
      "Angel One pricing",
      "https://www.angelone.in/exchange-transaction-charges",
    ),
    brokerage: {
      kind: "percentage-capped-minimum",
      rate: "0.001",
      cap: "20",
      minimum: "5",
    },
    dp: { kind: "flat", amount: "20", per: "isin-transaction" },
    exchange: { NSE: "0.000030699", BSE: null },
  },
};

export function brokerById(id) {
  const broker = BROKERS[id];
  if (!broker)
    throw new Error("Selected broker has no configured delivery rule.");
  return broker;
}
