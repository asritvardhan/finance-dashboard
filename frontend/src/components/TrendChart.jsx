/**
 * Plain CSS bar chart from trend API rows: { period, income, expense, net, transactions }
 */
export default function TrendChart({ trends, loading, error }) {
  if (loading) {
    return <div className="chart-skeleton" aria-busy />
  }
  if (error) {
    return <p className="text-muted">{error}</p>
  }
  if (!trends?.length) {
    return <p className="text-muted">No trend data yet. Add transactions to see this chart.</p>
  }

  const maxVal = Math.max(
    ...trends.flatMap((t) => [Number(t.income) || 0, Number(t.expense) || 0]),
    1
  )

  return (
    <div className="trend-chart" role="img" aria-label="Income and expense by period">
      <div className="trend-legend">
        <span className="legend-income">
          <i /> Income
        </span>
        <span className="legend-expense">
          <i /> Expense
        </span>
      </div>
      <div className="trend-bars">
        {trends.map((row) => (
          <div key={row.period} className="trend-group">
            <div className="trend-bar-pair">
              <div
                className="trend-bar trend-bar-income"
                style={{ height: `${(Number(row.income) / maxVal) * 100}%` }}
                title={`Income: ${row.income}`}
              />
              <div
                className="trend-bar trend-bar-expense"
                style={{ height: `${(Number(row.expense) / maxVal) * 100}%` }}
                title={`Expense: ${row.expense}`}
              />
            </div>
            <span className="trend-label">{row.period}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
