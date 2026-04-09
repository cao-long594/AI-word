import { useState } from 'react'
import './App.css'
import StartPage from './components/StartPage'
import ExamNotice from './components/ExamNotice'
import ExamPage from './components/ExamPage'
import ResultPage from './components/ResultPage'
import { questions } from './data/questions'

export default function App() {
  const [currentPage, setCurrentPage] = useState('start')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState(Array(questions.length).fill(null))
  const [score, setScore] = useState(0)
  const [showAnswer, setShowAnswer] = useState(false)

  const handleStartExam = () => {
    setCurrentPage('notice')
  }

  const handleExitFromNotice = () => {
    setCurrentPage('start')
  }

  const handleContinueExam = () => {
    setCurrentPage('exam')
    setCurrentQuestionIndex(0)
    setAnswers(Array(questions.length).fill(null))
    setScore(0)
    setShowAnswer(false)
  }

  const handleAnswerSelect = (optionIndex) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = optionIndex
    setAnswers(newAnswers)
    
    // 立即判断是否正确并计分
    const isCorrect = optionIndex === questions[currentQuestionIndex].correctAnswer
    if (isCorrect) {
      setScore(score + 1)
    }
    
    // 显示答案反馈
    setShowAnswer(true)
  }

  const handleMoveToNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
      setShowAnswer(false)
    } else {
      setCurrentPage('result')
    }
  }

  const handleRestartExam = () => {
    setCurrentPage('start')
    setCurrentQuestionIndex(0)
    setAnswers(Array(questions.length).fill(null))
    setScore(0)
  }

  return (
    <div className="app">
      {currentPage === 'start' && <StartPage onStart={handleStartExam} />}
      {currentPage === 'notice' && (
        <ExamNotice onExit={handleExitFromNotice} onContinue={handleContinueExam} />
      )}
      {currentPage === 'exam' && (
        <ExamPage
          question={questions[currentQuestionIndex]}
          questionIndex={currentQuestionIndex}
          totalQuestions={questions.length}
          selectedAnswer={answers[currentQuestionIndex]}
          onAnswerSelect={handleAnswerSelect}
          onTimeUp={handleMoveToNextQuestion}
          showAnswer={showAnswer}
          onNextQuestion={handleMoveToNextQuestion}
        />
      )}
      {currentPage === 'result' && (
        <ResultPage score={score} totalQuestions={5} onRestart={handleRestartExam} />
      )}
    </div>
  )
}
