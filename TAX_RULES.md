# Tax and statutory rules

The current V1 rule set is `equity-delivery-2026-03` and applies from **1 March 2026**. It is versioned in `server/rules/marketRules.js` and selected using the submitted transaction date.

| Rule | Configuration | Source |
| --- | --- | --- |
| Delivery STT | 0.10% on buy and 0.10% on sell | [NSE - STT, SEBI fees and other levies](https://www.nseindia.com/static/invest/first-time-investor-sebi-turnover-fees-stt-other-levies) |
| STT rounding | Rounded to the nearest rupee in the calculator | [Zerodha - STT calculation explanation](https://support.zerodha.com/category/account-opening/resident-individual/ri-charges/articles/how-is-the-securities-transaction-tax-stt-calculated) |
| Stamp duty | 0.015% on buy side | [NSE / broker charge schedules](https://www.nseindia.com/static/invest/first-time-investor-sebi-turnover-fees-stt-other-levies) |
| SEBI turnover fee | ₹10/crore on buy and sell | [NSE](https://www.nseindia.com/static/invest/first-time-investor-sebi-turnover-fees-stt-other-levies) |
| NSE cash-market transaction charge | ₹306.99/crore on buy and sell, effective 1 March 2026 | [NSE circular](https://nsearchives.nseindia.com/content/circulars/FA73061.pdf) |
| NSE IPFT | ₹0.01/crore on buy and sell, effective 1 March 2026 | [NSE circular](https://nsearchives.nseindia.com/content/circulars/FA73061.pdf) |
| GST | 18% on applicable brokerage, exchange transaction charges, SEBI turnover fees, IPFT and DP charges; not on STT or stamp duty | [Broker charge schedules](https://www.zerodha.com/charges) |
| Listed equity long-term threshold | 12 months | [Income Tax Department](https://www.incometaxindia.gov.in/en/sale-of-shares) |
| STCG on specified listed equity | 20% for qualifying transfers covered by Section 111A from 23 July 2024 onward | [Income Tax Department](https://www.incometaxindia.gov.in/en/sale-of-shares) |
| LTCG on qualifying listed equity | 12.5% on LTCG above the available ₹1,25,000 Section 112A allowance for qualifying transfers from 23 July 2024 onward | [Income Tax Department](https://www.incometaxindia.gov.in/en/sale-of-shares) |
| Health & Education Cess | 4% of income tax plus surcharge | [Income Tax Department](https://www.incometaxindia.gov.in/en/sale-of-shares) |
| Surcharge on special-rate capital gains | Estimated from supplied annual taxable income; special-rate capital-gain surcharge is capped at 15% | [Income Tax Department](https://www.incometaxindia.gov.in/en/sale-of-shares) |

## Capital-gain calculation used by V1

The calculator treats the selected holding type as authoritative. It can model short-term, long-term, or a mixture of the two.

For this transaction-level estimate:

1. Gross capital gain starts with sale value less the acquisition value represented by the entered average buy price.
2. Configured acquisition/transfer expenses other than STT are allocated across the short/long quantities and used in the gain estimate.
3. STT is shown as a charge but is not deducted from the capital-gain calculation.
4. Short-term gains are estimated at 20% and qualifying long-term gains at 12.5% after the available Section 112A allowance.
5. The entered **LTCG exemption already used** reduces the remaining ₹1,25,000 allowance available to this transaction.
6. An optional **annual taxable income before this sale** can be supplied to produce an indicative surcharge estimate.

## Important scope limits

This is **not an annual income-tax return calculator**. It does not attempt to calculate the user's entire year's tax liability, rebate, marginal relief, complete loss set-off/carry-forward, every source of income, residency-specific exceptions, or all contract-note/account-specific adjustments.

The app therefore reports **estimated tax** and clearly separates it from the transaction charges. The actual tax return should be prepared using the user's complete annual records and applicable tax rules.

## Verification date

The current configured rule set was verified on **2026-10-08**. The code keeps the rule date-specific so a future statutory or exchange revision can be added as another rule set rather than silently changing a historical calculation.
