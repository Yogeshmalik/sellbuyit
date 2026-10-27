function PageGuide({ kind }) {
  const explanations = {
    sale: "Enter the price you expect to sell at. The calculator shows what you keep after configured charges and an estimated transaction-level tax, plus the selling price where the trade reaches break-even.",
    target:
      "Enter the amount or percentage of net profit you want. The calculator works backwards from your buy price and trade details to find the lowest selling price that should meet that target after configured charges and estimated tax.",
    maximum:
      "Enter the expected selling price and the net return you require. The calculator works backwards to find the highest price you can pay per share while still meeting that target after configured charges and estimated tax.",
  };
  return (
    <section id="about" className="page-guide">
      <strong>How this calculator works</strong>
      <p>{explanations[kind]}</p>
    </section>
  );
}

export default PageGuide;
