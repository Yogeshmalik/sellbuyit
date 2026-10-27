import { Link } from "react-router-dom";

/** Shared SellBuyIt wordmark for the responsive header and footer. */
export default function Brand({ location = "header" }) {
  const isFooter = location === "footer";

  return (
    <Link
      to="/calculator"
      className={`brand brand--${location}`}
      aria-label="SellBuyIt home"
    >
      <img className="brand__mark" src="/sellbuyit-mark.svg" alt="" />
      <span className="brand__copy">
        <span className="brand__name">
          Sell<span>Buy</span>It
        </span>
        {isFooter && (
          <span className="brand__tagline">
            Trade smarter. Calculate clearer.
          </span>
        )}
      </span>
    </Link>
  );
}
