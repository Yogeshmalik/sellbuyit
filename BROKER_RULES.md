# Broker and exchange charge rules

This calculator models standard resident retail **equity-delivery** charges for the four brokers currently supported. Broker rules are stored in `server/brokers/brokerRules.js`; exchange and statutory rules are stored in `server/rules/marketRules.js`.

The figures below are the rules verified for the current V1 rule set. GST is calculated separately at 18% on the applicable service/transaction charges. Where a broker-facing page still shows an older exchange/IPFT figure, the calculator uses the newer exchange rule. The final contract note remains the source of truth for an individual's account.

## Broker charges

| Broker        | Delivery brokerage                                                                                    | DP charge assumption                                                                                                                        |
| ------------- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **Zerodha**   | ₹0                                                                                                    | ₹13 male / ₹12.75 female before GST, one scrip/ISIN per day                                                                                 |
| **Groww**     | Lower of ₹20 or 0.1% per executed order, minimum ₹5, subject to the 2.5% delivery brokerage cap       | Per sell transaction. ₹20 male / ₹19.75 female for debit value of ₹100 or more; ₹3.50 / ₹3.25 below ₹100 because Groww waives its component |
| **Upstox**    | ₹20 per executed order, subject to the applicable delivery brokerage cap                              | ₹20 per scrip per day, sell only                                                                                                            |
| **Angel One** | Lower of ₹20 or 0.1% per executed order, minimum ₹5, subject to the applicable delivery brokerage cap | ₹20 per scrip/ISIN transaction, sell only                                                                                                   |

### Order-count assumption

The app accepts total buy/sell value and the number of executed orders, but not the value of every individual order. When more than one order is entered, it therefore assumes the total value was split equally across those orders. This is necessary because brokerage caps, minimums and some demat charges are applied at the order/transaction level.

For example, two Groww sell orders are modelled as two equal-value sell transactions, not as one combined order.

### Exchange charges

Exchange transaction charges are **not broker overrides** in the calculator. The selected exchange and, for BSE, the applicable BSE fee category determine the exchange charge.

For **NSE cash-market equity delivery**, effective 1 March 2026, the exchange transaction charge is ₹306.99/crore and the NSE IPFT contribution is ₹0.01/crore on traded value, each side. The combined amount is ₹307/crore, equivalent to 0.00307% of turnover.

For **BSE**, transaction charges vary by the stock's applicable fee category. The UI uses these consolidated categories:

| BSE fee category used by the calculator | Transaction charge |
| --------------------------------------- | -----------------: |
| ₹375/crore category                     |         ₹375/crore |
| ₹275/crore category                     |         ₹275/crore |
| ₹10,000/crore category                  |      ₹10,000/crore |
| ₹1,00,000/crore category                |    ₹1,00,000/crore |

BSE uses scrip/group and, for some categories, exclusive/non-exclusive distinctions. The calculator therefore asks for the **applicable fee category** rather than pretending it can determine the category from a stock symbol. For example, BSE documentation identifies standard ₹375/crore and ₹275/crore categories, special ₹10,000/crore categories, and ₹1,00,000/crore categories including P/ZP/SS/ST and applicable odd-lot cases. The stock's applicable category should be checked against current BSE/broker information before relying on the estimate.

## Sources

- Zerodha charges: https://zerodha.com/charges/
- Groww pricing: https://groww.in/pricing
- Groww DP help: https://groww.in/help/stocks%2C-f%26o%2C-ipo-%26-mtf/sx-margin/what-are-dp-charges-depository-participant-charges-1
- Upstox brokerage charges: https://upstox.com/brokerage-charges/
- Angel One exchange transaction charges: https://www.angelone.in/exchange-transaction-charges
- NSE cash-market transaction/IPFT circular effective 1 March 2026: https://nsearchives.nseindia.com/content/circulars/FA73061.pdf

Rules are recorded with a last-verified date of 2026-10-08 in the source configuration. Broker promotions, account-specific tariff changes and contract-note adjustments are outside this V1 estimate.
