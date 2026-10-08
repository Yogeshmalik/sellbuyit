# Broker rules

All broker configurations have a source URL and verification date in `server/brokers/brokerRules.js`. They apply to standard resident retail equity-delivery accounts only.

| Broker    | Delivery brokerage                                    | DP assumption                                         |
| --------- | ----------------------------------------------------- | ----------------------------------------------------- |
| Zerodha   | Zero                                                  | ₹13 male / ₹12.75 female per ISIN/day, before GST     |
| Groww     | lower of 0.10% and ₹20; ₹5 minimum per executed order | value threshold and gender-specific official schedule |
| Upstox    | ₹20 per executed order                                | ₹20 per scrip/day before GST                          |
| Angel One | lower of 0.10% and ₹20; ₹5 minimum per executed order | ₹20 per ISIN transaction before GST                   |

NSE/BSE exchange fees are broker-configured where an official broker schedule gives a rate. BSE varies by scrip group, so the user must select a group. An absent broker/group configuration raises a clear API error instead of manufacturing a rate.
