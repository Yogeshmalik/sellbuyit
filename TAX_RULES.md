# Tax and statutory rules

Rule set `equity-delivery-2026-04` applies from 2026-04-01. It is versioned in `server/rules/marketRules.js` and selected using the submitted transaction date.

| Rule                         |                                                                    Configuration | Source                                                                                                                                      |
| ---------------------------- | -------------------------------------------------------------------------------: | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Delivery STT                 |                                                            0.10% on buy and sell | [NSE](https://www.nseindia.com/static/invest/first-time-investor-sebi-turnover-fees-stt-other-levies)                                       |
| Stamp duty                   |                                                                  0.015% buy side | [Zerodha charges](https://zerodha.com/charges/)                                                                                             |
| SEBI turnover fee            |                                                          ₹10/crore on both sides | [SEBI regulations](https://www.sebi.gov.in/web/?file=https%3A%2F%2Fwww.sebi.gov.in%2Fsebi_data%2Fattachdocs%2Fjan-2026%2F1767852346757.pdf) |
| Listed equity holding period |                                                                        12 months | [Income Tax Department](https://www.incometax.gov.in/iec/foportal/sites/default/files/2021-05/notification_3_of_2021_SFT_for_Shares_0.pdf)  |
| Transaction estimate rates   | 20% Section 111A STCG; 12.5% Section 112A LTCG after ₹1.25 lakh unused allowance | Current Income-tax return schedules / configured rule metadata                                                                              |
| Cess                         |                                                         4% of tax plus surcharge | [Income Tax Department](https://www.incometax.gov.in/iec/foportal/help/individual/return-applicable-1)                                      |

The calculator treats a user’s holding selection as authoritative. It tracks short and long lots independently. Taxable gain deducts configured transferable costs but not STT; this is disclosed in the audit note. Surcharge is only an estimate if annual taxable income is supplied, and special-rate income is capped at the documented surcharge rate. Rebate, marginal relief, loss set-off, residency exceptions and complete annual aggregation are outside V1.
