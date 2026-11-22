// 仮のトップ画面（ステップ3でホーム／入力／一覧／設定の画面に置き換える）
function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>無駄遣いストッパー家計簿</h1>
      </header>
      <main className="app-main">
        <section className="card">
          <p className="card-label">今月あと使える金額</p>
          <p className="card-amount">¥ ---</p>
        </section>
        <p className="note">準備中です。ステップ3で機能を作ります。</p>
      </main>
    </div>
  )
}

export default App
