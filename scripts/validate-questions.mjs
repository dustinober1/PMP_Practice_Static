import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(new URL('.', import.meta.url).pathname, '..')
const questionsPath = path.join(rootDir, 'src', 'data', 'questions.json')

const readJson = (filePath) =>
  JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }))

// Validation rules for questions
const validationRules = {
  requiredFields: ['id', 'domainId', 'taskId', 'text', 'options', 'correctAnswer', 'explanation'],
  validDomains: ['people', 'process', 'business'],
  validDifficulties: ['easy', 'medium', 'hard'],
  validTypes: ['knowledge', 'scenario', 'process', 'best-practice'],
  validAnswers: ['A', 'B', 'C', 'D']
}

// Validate a single question
const validateQuestion = (question, index) => {
  const errors = []
  const warnings = []

  // Check required fields
  validationRules.requiredFields.forEach(field => {
    if (!question[field]) {
      errors.push(`Missing required field: ${field}`)
    }
  })

  // Validate domain ID
  if (question.domainId && !validationRules.validDomains.includes(question.domainId)) {
    errors.push(`Invalid domainId: ${question.domainId}. Must be one of: ${validationRules.validDomains.join(', ')}`)
  }

  // Validate difficulty
  if (question.difficulty && !validationRules.validDifficulties.includes(question.difficulty)) {
    errors.push(`Invalid difficulty: ${question.difficulty}. Must be one of: ${validationRules.validDifficulties.join(', ')}`)
  }

  // Validate question type
  if (question.questionType && !validationRules.validTypes.includes(question.questionType)) {
    errors.push(`Invalid questionType: ${question.questionType}. Must be one of: ${validationRules.validTypes.join(', ')}`)
  }

  // Validate correct answer
  if (question.correctAnswer && !validationRules.validAnswers.includes(question.correctAnswer)) {
    errors.push(`Invalid correctAnswer: ${question.correctAnswer}. Must be one of: ${validationRules.validAnswers.join(', ')}`)
  }

  // Validate options
  if (question.options) {
    if (!Array.isArray(question.options)) {
      errors.push('Options must be an array')
    } else if (question.options.length !== 4) {
      errors.push(`Options array must have exactly 4 items, found ${question.options.length}`)
    } else {
      const optionIds = question.options.map(opt => opt.id).sort()
      const expectedIds = ['A', 'B', 'C', 'D'].sort()

      if (JSON.stringify(optionIds) !== JSON.stringify(expectedIds)) {
        errors.push(`Options must have ids A, B, C, D. Found: ${optionIds.join(', ')}`)
      }

      // Check if correct answer exists in options
      const hasCorrectAnswer = question.options.some(opt => opt.id === question.correctAnswer)
      if (!hasCorrectAnswer) {
        errors.push(`Correct answer ${question.correctAnswer} not found in options`)
      }

      // Validate each option
      question.options.forEach((option, i) => {
        if (!option.id || !option.label) {
          errors.push(`Option ${i + 1} missing id or label`)
        }
        if (option.label && option.label.length < 5) {
          warnings.push(`Option ${option.id} label is very short (${option.label.length} chars)`)
        }
        if (option.label && option.label.length > 150) {
          warnings.push(`Option ${option.id} label is very long (${option.label.length} chars)`)
        }
      })
    }
  }

  // Validate question text
  if (question.text) {
    if (question.text.length < 10) {
      errors.push('Question text is too short')
    }
    if (question.text.length > 500) {
      warnings.push(`Question text is very long (${question.text.length} chars)`)
    }
    if (!question.text.includes('?')) {
      warnings.push('Question text might not be a proper question (no question mark)')
    }
  }

  // Validate explanation
  if (question.explanation) {
    if (question.explanation.length < 10) {
      errors.push('Explanation is too short')
    }
    if (question.explanation.length > 300) {
      warnings.push(`Explanation is very long (${question.explanation.length} chars)`)
    }
  }

  return {
    index,
    id: question.id || `question-${index}`,
    errors,
    warnings,
    isValid: errors.length === 0
  }
}

// Main validation function
const main = () => {
  console.log('🔍 PMP Question Quality Validator')
  console.log('====================================\n')

  try {
    const questions = readJson(questionsPath)
    console.log(`📊 Loaded ${questions.length} questions for validation\n`)

    const results = questions.map((question, index) => validateQuestion(question, index))

    const validQuestions = results.filter(r => r.isValid)
    const invalidQuestions = results.filter(r => !r.isValid)
    const totalErrors = results.reduce((sum, r) => sum + r.errors.length, 0)
    const totalWarnings = results.reduce((sum, r) => sum + r.warnings.length, 0)

    // Print summary
    console.log('📋 VALIDATION SUMMARY')
    console.log('=====================')
    console.log(`✅ Valid questions: ${validQuestions.length}/${questions.length}`)
    console.log(`❌ Invalid questions: ${invalidQuestions.length}`)
    console.log(`🔧 Total errors: ${totalErrors}`)
    console.log(`⚠️  Total warnings: ${totalWarnings}\n`)

    // Print detailed errors if any
    if (invalidQuestions.length > 0) {
      console.log('❌ VALIDATION ERRORS')
      console.log('=====================\n')

      invalidQuestions.forEach(result => {
        console.log(`❌ Question: ${result.id} (index ${result.index})`)
        result.errors.forEach(error => {
          console.log(`   • ${error}`)
        })
        console.log('')
      })
    }

    // Print warnings if any
    if (totalWarnings > 0) {
      console.log('⚠️  WARNINGS')
      console.log('============\n')

      results.filter(r => r.warnings.length > 0).forEach(result => {
        if (result.warnings.length > 0) {
          console.log(`⚠️  Question: ${result.id}`)
          result.warnings.forEach(warning => {
            console.log(`   • ${warning}`)
          })
          console.log('')
        }
      })
    }

    // Print domain distribution
    console.log('📊 DOMAIN DISTRIBUTION')
    console.log('=====================\n')

    const domainCounts = {}
    questions.forEach(q => {
      const domain = q.domainId || 'unknown'
      domainCounts[domain] = (domainCounts[domain] || 0) + 1
    })

    Object.entries(domainCounts).forEach(([domain, count]) => {
      const percentage = ((count / questions.length) * 100).toFixed(1)
      console.log(`${domain}: ${count} questions (${percentage}%)`)
    })

    // Print difficulty distribution
    console.log('\n📊 DIFFICULTY DISTRIBUTION')
    console.log('==========================\n')

    const difficultyCounts = {}
    questions.forEach(q => {
      const difficulty = q.difficulty || 'unknown'
      difficultyCounts[difficulty] = (difficultyCounts[difficulty] || 0) + 1
    })

    Object.entries(difficultyCounts).forEach(([difficulty, count]) => {
      const percentage = ((count / questions.length) * 100).toFixed(1)
      console.log(`${difficulty}: ${count} questions (${percentage}%)`)
    })

    // Exit with appropriate code
    if (totalErrors > 0) {
      console.log(`\n❌ Validation failed with ${totalErrors} errors`)
      process.exit(1)
    } else {
      console.log('\n✅ All questions passed validation!')
      console.log(`📈 Quality score: ${validQuestions.length}/${questions.length} (${((validQuestions.length/questions.length)*100).toFixed(1)}%)`)
    }

  } catch (error) {
    console.error('❌ Error during validation:', error.message)
    process.exit(1)
  }
}

main()