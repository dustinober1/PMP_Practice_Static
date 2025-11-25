import { useState, useEffect } from 'react'
import Badge from './Badge'
import { formatTime, calculateTimeRemaining, getTimeWarningLevel } from '../utils/examHelpers'

/**
 * Exam timer component with countdown and visual warnings
 * Shows time remaining, changes color based on time left
 * WCAG 2.1 Level AA compliant with aria-live region
 */
function ExamTimer({ startTime, pausedAt, totalPauseTime, totalMinutes = 230 / 60, onTimeUp }) {
  const [timeRemaining, setTimeRemaining] = useState(null)
  const [warningLevel, setWarningLevel] = useState('normal')

  // Timer countdown effect
  useEffect(() => {
    // Set initial time
    const remaining = calculateTimeRemaining(startTime, pausedAt, totalPauseTime, totalMinutes)
    setTimeRemaining(remaining)
    setWarningLevel(getTimeWarningLevel(remaining))

    // If time already expired, trigger timeout
    if (remaining <= 0) {
      onTimeUp()
      return
    }

    // Update timer every second
    const interval = setInterval(() => {
      const remaining = calculateTimeRemaining(startTime, pausedAt, totalPauseTime, totalMinutes)

      if (remaining <= 0) {
        setTimeRemaining(0)
        setWarningLevel('expired')
        clearInterval(interval)
        onTimeUp()
      } else {
        setTimeRemaining(remaining)
        setWarningLevel(getTimeWarningLevel(remaining))
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [startTime, pausedAt, totalPauseTime, totalMinutes, onTimeUp])

  if (timeRemaining === null) {
    return <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-200 dark:bg-zinc-700" />
  }

  const getVariant = () => {
    switch (warningLevel) {
      case 'critical':
        return 'error'
      case 'warning':
        return 'warning'
      default:
        return 'primary'
    }
  }

  const isCritical = warningLevel === 'critical'
  const isExpired = warningLevel === 'expired'

  return (
    <div className="space-y-2">
      <Badge
        variant={getVariant()}
        className={isCritical ? 'animate-pulse' : ''}
      >
        <div
          role="timer"
          aria-live="polite"
          aria-atomic="true"
          className="flex items-center gap-2 font-mono text-lg font-bold"
        >
          {isExpired && <span>⏱️</span>}
          {timeRemaining <= 600000 && warningLevel !== 'normal' && !isExpired && <span>⚠️</span>}
          {formatTime(timeRemaining)}
        </div>
      </Badge>

      {/* Time warning messages */}
      {warningLevel === 'warning' && (
        <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
          {Math.ceil(timeRemaining / (60 * 1000))} minutes remaining
        </p>
      )}
      {warningLevel === 'critical' && (
        <p className="text-xs font-semibold text-rose-700 dark:text-rose-400">
          Less than 1 minute remaining!
        </p>
      )}
    </div>
  )
}

export default ExamTimer
