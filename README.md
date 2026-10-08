# Equity Ledger

An Indian listed-equity delivery (CNC) sale estimator. It has a React/Vite frontend and a JavaScript Express calculation API. Financial calculations remain server-side and use `decimal.js`; the UI only validates, submits and renders results.

## Run

```bash
npm install
npm run dev
```

The client runs on port 5173 and proxies `/api` to the API on port 3001. Use `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build` for verification.

## Architecture

- `server/rules`: effective-dated statutory market rules and traceability.
- `server/brokers`: broker-specific brokerage, DP and exchange rules.
- `server/calculators`: Decimal charge calculators, tax engine and numerical solvers.
- `server/validation.js`: untrusted-request validation.
- `src`: accessible, responsive React presentation layer.

## Scope and assumptions

This release supports resident-individual, listed Indian equity delivery trades only. It assumes one ISIN/day for DP charges. Buy/sell order count, DP tariff category, annual taxable income and LTCG exemption already used are available as inputs because they materially affect estimates. The tax figure is attributable to the transaction, not a final return computation. No loss set-off, rebate, marginal relief, acquisition-date classification or historic purchase-charge reconstruction is performed.

## Updating rules / adding brokers

Add a dated rule to `server/rules/marketRules.js`, including source metadata and status. Add broker pricing in `server/brokers/brokerRules.js`; never put a rate in React. Add test coverage for every new rule boundary. See [TAX_RULES.md](TAX_RULES.md) and [BROKER_RULES.md](BROKER_RULES.md).

## Disclaimer

This calculator provides an estimate based on configured broker and Indian tax/market rules. Actual contract-note amounts, tax liability, rounding, surcharge, capital-loss set-off, holding-period classification and applicable rules may vary. Verify final amounts against your broker contract note and applicable tax rules.
