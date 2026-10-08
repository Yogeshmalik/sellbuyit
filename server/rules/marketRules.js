export const MARKET_RULES = [
  {
    id: "equity-delivery-2026-04",
    effectiveFrom: "2026-04-01",
    effectiveTo: null,
    status: "verified",
    lastVerified: "2026-10-08",
    source: {
      name: "NSE - SEBI turnover fees, STT and other levies",
      url: "https://www.nseindia.com/static/invest/first-time-investor-sebi-turnover-fees-stt-other-levies",
    },
    sttRate: "0.001",
    stampDutyRate: "0.00015",
    sebiRate: "0.000001",
    gstRate: "0.18",
    cessRate: "0.04",
    tax: {
      stcgRate: "0.20",
      ltcgRate: "0.125",
      ltcgExemption: "125000",
      holdingPeriodMonths: 12,
      surcharge: [
        { above: "5000000", rate: "0.10" },
        { above: "10000000", rate: "0.15" },
      ],
    },
    exchanges: {
      NSE: {
        transactionRate: "0.0000307",
        ipftRate: "0",
        sourceUrl: "https://zerodha.com/charges/",
      },
      BSE: {
        groups: {
          A: "0.0000375",
          B: "0.0000375",
          E: "0.0000275",
          F: "0.0000275",
          G: "0.0000275",
          T: "0.0000275",
          XC: "0.001",
          XD: "0.001",
          XT: "0.001",
          Z: "0.001",
          ZP: "0.001",
          R: "0.01",
          SS: "0.01",
          ST: "0.01",
        },
        sourceUrl: "https://www.angelone.in/exchange-transaction-charges",
      },
    },
  },
];

export function ruleForDate(date) {
  const rule = MARKET_RULES.find(
    (item) =>
      item.effectiveFrom <= date &&
      (!item.effectiveTo || item.effectiveTo >= date),
  );
  if (!rule)
    throw new Error(
      "No market rule configuration is available for this transaction date.",
    );
  return rule;
}
