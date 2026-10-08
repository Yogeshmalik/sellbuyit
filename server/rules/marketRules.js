export const BSE_CHARGE_CATEGORIES = {
  standard375: {
    label:
      "₹375/crore: A/B and non-exclusive E/F/FC/G/GC/I/W/T scrips",
    rate: "0.0000375",
  },
  standard275: {
    label:
      "₹275/crore: M/MT/TS/MS/IF/IT/R and exclusive E/F/FC/G/GC/I/W/T scrips",
    rate: "0.0000275",
  },
  special10000: {
    label: "₹10,000/crore: X/XT/Z scrips",
    rate: "0.001",
  },
  special100000: {
    label:
      "₹1,00,000/crore: P/ZP/SS/ST and applicable demat odd-lot trades",
    rate: "0.01",
  },
};

// BSE group classification is retained for audit/API compatibility. Groups
// E/F/FC/G/GC/I/W/T use the ₹375 rate when non-exclusive and ₹275 when
// exclusive; the user-facing selector therefore asks for the applicable rate
// category rather than pretending it can determine exclusivity from the group.
export const BSE_GROUP_MAPPINGS = {
  A: "standard375",
  B: "standard375",
  E: { nonExclusive: "standard375", exclusive: "standard275" },
  F: { nonExclusive: "standard375", exclusive: "standard275" },
  FC: { nonExclusive: "standard375", exclusive: "standard275" },
  G: { nonExclusive: "standard375", exclusive: "standard275" },
  GC: { nonExclusive: "standard375", exclusive: "standard275" },
  I: { nonExclusive: "standard375", exclusive: "standard275" },
  W: { nonExclusive: "standard375", exclusive: "standard275" },
  T: { nonExclusive: "standard375", exclusive: "standard275" },
  M: "standard275",
  MT: "standard275",
  TS: "standard275",
  MS: "standard275",
  IF: "standard275",
  IT: "standard275",
  R: "standard275",
  X: "special10000",
  XT: "special10000",
  Z: "special10000",
  // XC/XD were merged into X; retain aliases for older inputs.
  XC: "special10000",
  XD: "special10000",
  P: "special100000",
  ZP: "special100000",
  SS: "special100000",
  ST: "special100000",
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
        sourceUrl: "https://nsearchives.nseindia.com/content/circulars/FA73061.pdf",
      },
      BSE: {
        categories: BSE_CHARGE_CATEGORIES,
        groups: Object.fromEntries(
          Object.entries(BSE_GROUP_MAPPINGS).flatMap(([group, category]) => {
            if (typeof category === "string") {
              return [[group, BSE_CHARGE_CATEGORIES[category].rate]];
            }
            return [];
          }),
        ),
        sourceUrl:
          "https://www.bseindia.com/markets/MarketInfo/DownloadAttach.aspx?attachedId=8a7fec3a-95bc-4bd2-82de-76e2a84e2915&id=20250429-51",
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
