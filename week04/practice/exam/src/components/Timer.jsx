import { useState, useEffect, useRef } from 'react'

export default function Timer({ initialTime, onTimeUp }) {
  const [timeLeft, setTimeLeft] = useState(initialTime)
  const onTimeUpRef = useRef(onTimeUp)

  useEffect(() => {
    onTimeUpRef.current = onTimeUp
  }, [onTimeUp])

  useEffect(() => {
    setTimeLeft(initialTime)
  }, [initialTime])

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUpRef.current()
      return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          onTimeUpRef.current()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [timeLeft])

  return (
    <div className="timer">
      <span className="timer-label">剩余时间</span>
      <span className={`timer-value ${timeLeft <= 5 ? 'warning' : ''}`}>
        {String(timeLeft).padStart(2, '0')}
      </span>
    </div>
  )
}
