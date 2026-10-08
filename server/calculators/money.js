import Decimal from "decimal.js";

Decimal.set({ precision: 28, rounding: Decimal.ROUND_HALF_UP });
export const D = (value = 0) => new Decimal(value);
export const rupee = (value) =>
  D(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
export const paise = (value) => D(value).toDecimalPlaces(2, Decimal.ROUND_CEIL);
export const zero = () => D(0);
