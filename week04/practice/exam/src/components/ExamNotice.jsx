export default function ExamNotice({ onExit, onContinue }) {
  return (
    <div className="page notice-page">
      <div className="notice-card">
        <h2>考试须知</h2>
        <div className="notice-content">
          <p>
            <strong>1.</strong> 每一个题目有 <span className="highlight">15 秒</span> 的答题时间。
          </p>
          <p>
            <strong>2.</strong> 一旦选择了答案，则无法取消/修改。
          </p>
          <p>
            <strong>3.</strong> 一旦倒计时结束，则不能选择关于本题的任何选项。
          </p>
          <p>
            <strong>4.</strong> 诚信考试，禁止抄袭。
          </p>
        </div>
        <div className="button-group">
          <button className="btn btn-outline" onClick={onExit}>
            退出考试
          </button>
          <button className="btn btn-primary" onClick={onContinue}>
            继续考试
          </button>
        </div>
      </div>
    </div>
  )
}
