export const BSE_CHARGE_CATEGORIES = {
  standard375: {
    label: "₹375/crore category (A/B and specified non-exclusive scrips)",
    rate: "0.0000375",
  },
  standard275: {
    label: "₹275/crore category (M/MT/TS/MS and specified exclusive scrips)",
    rate: "0.0000275",
  },
  special10000: {
    label: "₹10,000/crore category (X/XT/Z)",
    rate: "0.0001",
  },
  special100000: {
    label: "₹1,00,000/crore category (P/ZP/SS/ST and applicable odd-lot cases)",
    rate: "0.001",
  },
};

const source = (name, url) => ({
  name,
  url,
  lastVerified: "2026-10-08",
});

export const MARKET_RULES = [
  {
    id: "equity-delivery-2026-03",
    effectiveFrom: "2026-03-01",
    effectiveTo: null,
    status: "verified",
    lastVerified: "2026-10-08",
    source: source(
      "NSE - STT, SEBI fees and other levies",
      "https://www.nseindia.com/static/invest/first-time-investor-sebi-turnover-fees-stt-other-levies",
    ),
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
        transactionRate: "0.000030699",
        ipftRate: "0.000000001",
        sourceUrl:
          "https://nsearchives.nseindia.com/content/circulars/FA73061.pdf",
      },
      BSE: {
        groups: {
          ...Object.fromEntries(
            Object.entries(BSE_CHARGE_CATEGORIES).map(([key, item]) => [
              key,
              item.rate,
            ]),
          ),
          // Backward-compatible aliases for direct API callers and existing data.
          A: BSE_CHARGE_CATEGORIES.standard375.rate,
          B: BSE_CHARGE_CATEGORIES.standard375.rate,
          E: BSE_CHARGE_CATEGORIES.standard375.rate,
          F: BSE_CHARGE_CATEGORIES.standard375.rate,
          FC: BSE_CHARGE_CATEGORIES.standard375.rate,
          G: BSE_CHARGE_CATEGORIES.standard375.rate,
          GC: BSE_CHARGE_CATEGORIES.standard375.rate,
          W: BSE_CHARGE_CATEGORIES.standard375.rate,
          T: BSE_CHARGE_CATEGORIES.standard375.rate,
          NS: BSE_CHARGE_CATEGORIES.standard375.rate,
          NT: BSE_CHARGE_CATEGORIES.standard375.rate,
          M: BSE_CHARGE_CATEGORIES.standard275.rate,
          MT: BSE_CHARGE_CATEGORIES.standard275.rate,
          TS: BSE_CHARGE_CATEGORIES.standard275.rate,
          MS: BSE_CHARGE_CATEGORIES.standard275.rate,
          IF: BSE_CHARGE_CATEGORIES.standard275.rate,
          IT: BSE_CHARGE_CATEGORIES.standard275.rate,
          X: BSE_CHARGE_CATEGORIES.special10000.rate,
          XC: BSE_CHARGE_CATEGORIES.special10000.rate,
          XD: BSE_CHARGE_CATEGORIES.special10000.rate,
          XT: BSE_CHARGE_CATEGORIES.special10000.rate,
          Z: BSE_CHARGE_CATEGORIES.special10000.rate,
          ZP: BSE_CHARGE_CATEGORIES.special100000.rate,
          P: BSE_CHARGE_CATEGORIES.special100000.rate,
          SS: BSE_CHARGE_CATEGORIES.special100000.rate,
          ST: BSE_CHARGE_CATEGORIES.special100000.rate,
        },
        sourceUrl: "https://zerodha.com/charges/",
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
  if (!rule) {
    throw new Error(
      "We don't have charge and tax rules configured for that transaction date. Please choose a supported date.",
    );
  }
  return rule;
}
