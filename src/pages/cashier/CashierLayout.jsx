export default function CashierLayout({
  children,
}) {
  const childList = Array.isArray(children) ? children : [children]
  const topbarContent = childList[0]
  const pageContent = childList.slice(1)

  return (
    <div className="cashier-panel-page">
      <section className="cashier-panel-shell">
        {topbarContent && <div className="cashier-topbar-slot">{topbarContent}</div>}
        <main className="cashier-panel-main">{pageContent}</main>
      </section>
    </div>
  )
}
