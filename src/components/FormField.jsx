import { cloneElement, isValidElement } from "react";

function Tip({ children }) {
  return (
    <span
      className="tip"
      tabIndex="0"
      role="img"
      aria-label={`Help: ${children}`}
      data-tip={children}
    >
      ?
    </span>
  );
}

function Field({ label, children, hint, tip, error }) {
  const control =
    isValidElement(children) && typeof children.type !== "symbol"
      ? cloneElement(children, {
          "aria-invalid": Boolean(error),
          "aria-describedby": error
            ? `${children.props.id || label}-error`
            : undefined,
        })
      : children;
  return (
    <label className={`field${error ? " has-error" : ""}`}>
      <span>
        {label}
        {tip && <Tip>{tip}</Tip>}
      </span>
      {control}
      {hint && !error && <small>{hint}</small>}
      {error && (
        <small
          className="field-error"
          id={`${children.props?.id || label}-error`}
        >
          {error}
        </small>
      )}
    </label>
  );
}

export { Tip, Field };
