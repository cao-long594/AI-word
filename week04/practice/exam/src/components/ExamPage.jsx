import { useState, useEffect } from 'react'
import Timer from './Timer'

export default function ExamPage({
  question,
  questionIndex,
  totalQuestions,
  selectedAnswer,
  onAnswerSelect,
  onTimeUp,
  showAnswer,
  onNextQuestion
}) {
  const [answered, setAnswered] = useState(selectedAnswer !== null)
  const [timeLeft, setTimeLeft] = useState(15)

  useEffect(() => {
    setAnswered(selectedAnswer !== null)
    setTimeLeft(15)
  }, [selectedAnswer, questionIndex])

  useEffect(() => {
    if (showAnswer) {
      return
    }
    if (timeLeft <= 0) {
      return
    }
    const timer = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [timeLeft, showAnswer])

  const progressPercentage = (timeLeft / 15) * 100

  // 倒计时结束时显示正确答案（如果还未答题）
  const handleTimeUp = () => {
    if (!answered) {
      // 如果未答题，显示正确答案但不计分
      setAnswered(true)
      onTimeUp()
    }
  }

  const handleSelectOption = (optionIndex) => {
    if (!answered) {
      onAnswerSelect(optionIndex)
    }
  }

  const isCorrect = selectedAnswer === question.correctAnswer

  return (
    <div className="page exam-page">
      <div className="exam-container">
        <div className="exam-header">
          <h2 className="exam-title">考试小应用</h2>
          {!showAnswer && <Timer key={questionIndex} initialTime={15} onTimeUp={handleTimeUp} />}
        </div>
        {!showAnswer && (
          <div className="timer-progress">
            <div className="timer-progress-bar" style={{ width: `${progressPercentage}%` }}></div>
          </div>
        )}

        <div className="exam-content">
          <div className="question-box">
            <h3 className="question-text">{questionIndex + 1}. {question.question}</h3>

            <div className="options">
              {question.options.map((option, index) => {
                const isOptionCorrect = index === question.correctAnswer
                const isOptionSelected = selectedAnswer === index
                const showCorrectMark = showAnswer && isOptionCorrect
                const showStrike = showAnswer && isOptionSelected && !isCorrect

                return (
                  <button
                    key={index}
                    className={`option ${
                      showAnswer && isOptionCorrect ? 'correct' : ''
                    } ${
                      showAnswer && isOptionSelected && !isCorrect ? 'incorrect' : ''
                    } ${
                      !showAnswer && isOptionSelected ? 'selected' : ''
                    } ${
                      answered ? 'disabled' : ''
                    }`}
                    onClick={() => handleSelectOption(index)}
                    disabled={answered}
                  >
                    <span className="option-text">{option}</span>
                    {showCorrectMark && <span className="check-mark">✓</span>}
                    {showStrike && <span className="strike-mark">✗</span>}
                  </button>
                )
              })}
            </div>
          </div>

          <div className="progress">
            进度：{questionIndex + 1} / {totalQuestions}
          </div>
        </div>

        {showAnswer && (
          <div className="exam-footer">
            <button className="btn btn-primary" onClick={onNextQuestion}>
              {questionIndex + 1 === totalQuestions ? '查看结果' : '下一题'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
