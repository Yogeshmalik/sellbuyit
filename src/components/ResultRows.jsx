import { rupees, rate } from "../utils/formatters.js";

function ResultRows({ calculation }) {
  const rows = calculation.charges.items;
  return (
    <>
      <tr className="section">
        <th colSpan="4">TRANSACTION</th>
      </tr>
      <tr>
        <th>Buy value</th>
        <td>-</td>
        <td>-</td>
        <td>{rupees(calculation.values.buyValue)}</td>
      </tr>
      <tr>
        <th>Sell value</th>
        <td>-</td>
        <td>-</td>
        <td>{rupees(calculation.values.sellValue)}</td>
      </tr>
      <tr>
        <th>Gross profit / loss</th>
        <td>-</td>
        <td>-</td>
        <td>{rupees(calculation.values.grossProfit)}</td>
      </tr>
      <tr className="section">
        <th colSpan="4">CHARGES</th>
      </tr>
      {rows.map((item) => (
        <tr key={item.name}>
          <th>{item.name}</th>
          <td>{rate(item.rate)}</td>
          <td>{rupees(item.base)}</td>
          <td>{rupees(item.amount)}</td>
        </tr>
      ))}
      <tr>
        <th>Total charges</th>
        <td>-</td>
        <td>-</td>
        <td>{rupees(calculation.charges.total)}</td>
      </tr>
      <tr>
        <th>Profit before tax</th>
        <td>-</td>
        <td>-</td>
        <td>{rupees(calculation.values.profitBeforeTax)}</td>
      </tr>
      <tr className="section">
        <th colSpan="4">TAX</th>
      </tr>
      <tr>
        <th>STCG taxable gain</th>
        <td>-</td>
        <td>{rupees(calculation.tax.stcg)}</td>
        <td>{rupees(calculation.tax.stcgTax)}</td>
      </tr>
      <tr>
        <th>LTCG taxable gain after allowance</th>
        <td>-</td>
        <td>{rupees(calculation.tax.taxableLtcg)}</td>
        <td>{rupees(calculation.tax.ltcgTax)}</td>
      </tr>
      <tr>
        <th>Surcharge</th>
        <td>{Number(calculation.tax.surchargeRate) * 100 || 0}%</td>
        <td>{rupees(calculation.tax.incomeTax)}</td>
        <td>{rupees(calculation.tax.surcharge)}</td>
      </tr>
      <tr>
        <th>Health &amp; Education Cess</th>
        <td>4%</td>
        <td>
          {rupees(
            Number(calculation.tax.incomeTax) +
              Number(calculation.tax.surcharge),
          )}
        </td>
        <td>{rupees(calculation.tax.cess)}</td>
      </tr>
      <tr>
        <th>LTCG allowance applied</th>
        <td>-</td>
        <td>-</td>
        <td>{rupees(calculation.tax.ltcgExemption)}</td>
      </tr>
      <tr>
        <th>Total estimated tax</th>
        <td>-</td>
        <td>-</td>
        <td>{rupees(calculation.tax.totalTax)}</td>
      </tr>
    </>
  );
}

export default ResultRows;
