export default function ResultPage({ score, totalQuestions, onRestart }) {
  const getResultMessage = () => {
    if (score === totalQuestions) {
      return {
        title: '完美分数！',
        description: '恭喜你，满分通过！继续保持！'
      }
    } else if (score >= 4) {
      return {
        title: '不错的表现！',
        description: `你得了 ${score} 分，表现很棒！`
      }
    } else if (score >= 3) {
      return {
        title: '还不错！',
        description: `你得了 ${score} 分，再加油就能更好！`
      }
    } else if (score >= 2) {
      return {
        title: '继续努力！',
        description: `你得了 ${score} 分，需要多复习一下。`
      }
    } else {
      return {
        title: '需要加油！',
        description: `你得了 ${score} 分，建议重新学习相关内容。`
      }
    }
  }

  const result = getResultMessage()

  return (
    <div className="page result-page">
      <div className="result-card">
        <div className="result-icon">👑</div>
        <h2>{result.title}</h2>
        <p className="result-text">{result.description}</p>
        <p className="score-display">
          <span className="score-value">{score}</span> / <span className="total-score">{totalQuestions}</span>
        </p>

        <div className="button-group">
          <button className="btn btn-primary" onClick={onRestart}>
            重新考试
          </button>
          <button className="btn btn-outline" onClick={() => window.location.href = '/'}>
            退出考试
          </button>
        </div>
      </div>
    </div>
  )
}
