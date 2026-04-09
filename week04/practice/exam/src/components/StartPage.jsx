export default function StartPage({ onStart }) {
  return (
    <div className="page start-page">
      <div className="start-content">
        <h1 className="start-title">开始考试</h1>
        <button className="btn btn-primary btn-large" onClick={onStart}>
          开始考试
        </button>
      </div>
    </div>
  )
}
