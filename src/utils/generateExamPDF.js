import { jsPDF } from 'jspdf'
import { formatTime } from './examHelpers'

/**
 * Generate PDF report of exam results
 * @param {Object} results - Exam results object
 * @param {Array} questions - All exam questions
 * @returns {void} - Downloads PDF file
 */
export const generateExamPDF = (results, questions) => {
  try {
    const pdf = new jsPDF()
    const pageWidth = pdf.internal.pageSize.getWidth()
    const pageHeight = pdf.internal.pageSize.getHeight()
    const margin = 12
    const contentWidth = pageWidth - margin * 2
    let yPosition = margin

    // Helper function to add text with wrapping
    const addWrappedText = (text, x, y, maxWidth, fontSize = 10) => {
      pdf.setFontSize(fontSize)
      const lines = pdf.splitTextToSize(text, maxWidth)
      pdf.text(lines, x, y)
      return y + lines.length * (fontSize * 0.35) + 2
    }

    // Helper function to check if new page needed
    const checkNewPage = (neededHeight) => {
      if (yPosition + neededHeight > pageHeight - margin) {
        pdf.addPage()
        yPosition = margin
      }
    }

    // ===== PAGE 1: SUMMARY =====

    // Title
    pdf.setFontSize(20)
    pdf.setFont(undefined, 'bold')
    pdf.text('PMP Practice Exam Results', margin, yPosition)
    yPosition += 12

    // Date
    pdf.setFontSize(10)
    pdf.setFont(undefined, 'normal')
    const now = new Date()
    pdf.text(`Date: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, margin, yPosition)
    yPosition += 8

    // Separator
    pdf.setDrawColor(200)
    pdf.line(margin, yPosition, pageWidth - margin, yPosition)
    yPosition += 8

    // Main Score Box
    if (results.passed) {
      pdf.setFillColor(76, 175, 80) // Green
    } else {
      pdf.setFillColor(244, 67, 54) // Red
    }
    pdf.rect(margin, yPosition, contentWidth, 30, 'F')

    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(14)
    pdf.setFont(undefined, 'bold')
    const statusText = results.passed ? 'PASSED ✓' : 'NOT PASSED ✗'
    pdf.text(statusText, pageWidth / 2, yPosition + 8, { align: 'center' })

    pdf.setFontSize(18)
    pdf.text(`${results.percentageScore}%`, pageWidth / 2, yPosition + 18, { align: 'center' })

    yPosition += 35
    pdf.setTextColor(0)

    // Score Details
    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(11)
    pdf.text('Overall Score', margin, yPosition)
    yPosition += 5

    pdf.setFont(undefined, 'normal')
    pdf.setFontSize(10)
    yPosition = addWrappedText(
      `${results.totalScore} out of 180 questions answered correctly`,
      margin,
      yPosition,
      contentWidth
    )
    yPosition = addWrappedText(
      `Passing Score: 110/180 (61%)`,
      margin,
      yPosition,
      contentWidth
    )
    yPosition += 5

    // Time Taken
    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(11)
    pdf.text('Time', margin, yPosition)
    yPosition += 5

    pdf.setFont(undefined, 'normal')
    pdf.setFontSize(10)
    yPosition = addWrappedText(
      `Total Time: ${formatTime(results.timeElapsed)}`,
      margin,
      yPosition,
      contentWidth
    )
    yPosition = addWrappedText(
      `Active Time: ${formatTime(results.timeElapsed - results.timePaused)}`,
      margin,
      yPosition,
      contentWidth
    )
    yPosition += 8

    checkNewPage(50)

    // Domain Breakdown Table
    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(11)
    pdf.text('Domain Breakdown', margin, yPosition)
    yPosition += 7

    // Table header
    pdf.setFillColor(230, 230, 230)
    pdf.rect(margin, yPosition, contentWidth / 3, 6, 'F')
    pdf.rect(margin + contentWidth / 3, yPosition, contentWidth / 3, 6, 'F')
    pdf.rect(margin + (contentWidth / 3) * 2, yPosition, contentWidth / 3, 6, 'F')

    pdf.setFont(undefined, 'bold')
    pdf.setFontSize(9)
    pdf.text('Domain', margin + 2, yPosition + 4)
    pdf.text('Score', margin + contentWidth / 3 + 2, yPosition + 4)
    pdf.text('Correct', margin + (contentWidth / 3) * 2 + 2, yPosition + 4)
    yPosition += 6

    // Table rows
    pdf.setFont(undefined, 'normal')
    Object.entries(results.domainScores).forEach(([domain, score]) => {
      pdf.rect(margin, yPosition, contentWidth / 3, 5)
      pdf.rect(margin + contentWidth / 3, yPosition, contentWidth / 3, 5)
      pdf.rect(margin + (contentWidth / 3) * 2, yPosition, contentWidth / 3, 5)

      const domainName = domain === 'people' ? 'People' : domain === 'process' ? 'Process' : 'Business'
      pdf.text(domainName, margin + 2, yPosition + 3.5)
      pdf.text(`${score.percentage}%`, margin + contentWidth / 3 + 2, yPosition + 3.5)
      pdf.text(`${score.correct}/${score.total}`, margin + (contentWidth / 3) * 2 + 2, yPosition + 3.5)

      yPosition += 5
    })

    yPosition += 8

    // ===== PAGE 2+: INCORRECT ANSWERS =====

    const incorrectAnswers = results.questionResults.filter((q) => !q.isCorrect)

    if (incorrectAnswers.length > 0) {
      checkNewPage(10)

      pdf.setFont(undefined, 'bold')
      pdf.setFontSize(12)
      pdf.text(`Incorrect Answers (${incorrectAnswers.length})`, margin, yPosition)
      yPosition += 8

      // Review each incorrect answer
      incorrectAnswers.forEach((questionResult) => {
        const question = questions.find((q) => q.id === questionResult.questionId)
        if (!question) return

        checkNewPage(20)

        // Question number and domain
        pdf.setFont(undefined, 'bold')
        pdf.setFontSize(10)
        const questionNumber = results.questionResults.findIndex(
          (q) => q.questionId === questionResult.questionId
        )
        yPosition = addWrappedText(
          `Q${questionNumber + 1} - ${question.domainId.toUpperCase()}`,
          margin,
          yPosition,
          contentWidth,
          10
        )

        // Question text
        pdf.setFont(undefined, 'normal')
        pdf.setFontSize(9)
        yPosition = addWrappedText(question.text, margin, yPosition, contentWidth, 9)
        yPosition += 2

        // Options
        pdf.setFontSize(8)
        question.options.forEach((option) => {
          const isCorrectAnswer = option.id === questionResult.correctAnswer
          const isUserAnswer = option.id === questionResult.userAnswer

          let prefix = '○ '
          if (isCorrectAnswer) {
            prefix = '✓ ' // Correct answer
          } else if (isUserAnswer) {
            prefix = '✗ ' // Wrong answer selected
          }

          const optionText = `${prefix}${option.label}`
          yPosition = addWrappedText(optionText, margin + 3, yPosition, contentWidth - 3, 8)
        })

        yPosition += 2

        // Explanation
        pdf.setFont(undefined, 'italic')
        pdf.setFontSize(8)
        pdf.setTextColor(100)
        yPosition = addWrappedText(
          `Explanation: ${question.explanation}`,
          margin,
          yPosition,
          contentWidth,
          8
        )
        pdf.setTextColor(0)

        yPosition += 4

        // Separator
        pdf.setDrawColor(220)
        pdf.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 4
      })
    }

    // Save PDF
    const filename = `PMP-Exam-Results-${now.toISOString().split('T')[0]}.pdf`
    pdf.save(filename)

    return true
  } catch (error) {
    console.error('Failed to generate PDF:', error)
    throw new Error('Failed to generate PDF report')
  }
}
