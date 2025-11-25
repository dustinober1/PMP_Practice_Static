import fs from 'node:fs'
import path from 'node:path'

const rootDir = path.resolve(new URL('.', import.meta.url).pathname, '..')
const dataDir = path.join(rootDir, 'src', 'data')
const sourceDir = path.join(dataDir, 'flashcards-source')

const readJson = (filePath) =>
  JSON.parse(fs.readFileSync(filePath, { encoding: 'utf8' }))

const validateCardsFile = (filePath) => {
  const issues = []
  const warnings = []

  try {
    const cards = readJson(filePath)

    if (!Array.isArray(cards)) {
      issues.push('File does not contain an array')
      return { issues, warnings, count: 0 }
    }

    // Check exactly 100 cards
    if (cards.length !== 100) {
      issues.push(`Expected exactly 100 cards, found ${cards.length}`)
    }

    const difficultyCount = { easy: 0, medium: 0, hard: 0 }
    const fronts = new Set()
    const tagCounts = {}

    cards.forEach((card, index) => {
      const cardNum = index + 1

      // Validate required fields
      if (!card.front || typeof card.front !== 'string') {
        issues.push(`Card ${cardNum}: missing or invalid 'front' field`)
      } else {
        // Length validation
        if (card.front.length < 10) {
          issues.push(`Card ${cardNum}: front too short (${card.front.length} chars, minimum 10)`)
        }
        if (card.front.length > 200) {
          warnings.push(`Card ${cardNum}: front very long (${card.front.length} chars, maximum 200)`)
        }

        // Duplicate front validation
        if (fronts.has(card.front)) {
          issues.push(`Card ${cardNum}: duplicate front text: "${card.front.substring(0, 50)}..."`)
        }
        fronts.add(card.front)
      }

      if (!card.back || typeof card.back !== 'string') {
        issues.push(`Card ${cardNum}: missing or invalid 'back' field`)
      } else {
        // Length validation
        if (card.back.length < 10) {
          issues.push(`Card ${cardNum}: back too short (${card.back.length} chars, minimum 10)`)
        }
        if (card.back.length > 500) {
          warnings.push(`Card ${cardNum}: back very long (${card.back.length} chars, maximum 500)`)
        }
      }

      if (!card.tags || !Array.isArray(card.tags)) {
        issues.push(`Card ${cardNum}: missing or invalid 'tags' field`)
      } else {
        if (card.tags.length === 0) {
          warnings.push(`Card ${cardNum}: no tags provided`)
        }
        if (card.tags.length > 3) {
          warnings.push(`Card ${cardNum}: many tags (${card.tags.length}, recommended 1-3)`)
        }

        card.tags.forEach((tag, tagIndex) => {
          if (typeof tag !== 'string') {
            issues.push(`Card ${cardNum}, tag ${tagIndex + 1}: tag must be string`)
          } else {
            // Tag format validation
            if (!/^[a-z0-9-]+$/.test(tag)) {
              issues.push(`Card ${cardNum}, tag ${tagIndex + 1}: invalid tag format "${tag}" (use lowercase, hyphen-separated)`)
            }
            if (tag.length < 2) {
              warnings.push(`Card ${cardNum}, tag ${tagIndex + 1}: tag very short "${tag}"`)
            }
            tagCounts[tag] = (tagCounts[tag] || 0) + 1
          }
        })
      }

      if (!card.difficulty || typeof card.difficulty !== 'string') {
        issues.push(`Card ${cardNum}: missing or invalid 'difficulty' field`)
      } else if (!['easy', 'medium', 'hard'].includes(card.difficulty)) {
        issues.push(`Card ${cardNum}: invalid difficulty "${card.difficulty}" (must be easy, medium, or hard)`)
      } else {
        difficultyCount[card.difficulty]++
      }
    })

    // Validate difficulty distribution (50/30/20 ± 5 tolerance)
    const easyDiff = Math.abs(difficultyCount.easy - 50)
    const mediumDiff = Math.abs(difficultyCount.medium - 30)
    const hardDiff = Math.abs(difficultyCount.hard - 20)

    if (easyDiff > 5) {
      issues.push(`Difficulty distribution off - easy: ${difficultyCount.easy} (target 50 ± 5)`)
    }
    if (mediumDiff > 5) {
      issues.push(`Difficulty distribution off - medium: ${difficultyCount.medium} (target 30 ± 5)`)
    }
    if (hardDiff > 5) {
      issues.push(`Difficulty distribution off - hard: ${difficultyCount.hard} (target 20 ± 5)`)
    }

    // Find commonly used tags
    const commonTags = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([tag, count]) => `${tag} (${count})`)

    return {
      issues,
      warnings,
      count: cards.length,
      difficulty: difficultyCount,
      commonTags
    }

  } catch (error) {
    issues.push(`Failed to read/parse file: ${error.message}`)
    return { issues, warnings, count: 0 }
  }
}

const main = () => {
  console.log('🔍 Validating flashcard source files...\n')

  if (!fs.existsSync(sourceDir)) {
    console.error(`❌ Source directory not found: ${sourceDir}`)
    console.log('Run the AI generation script first to create source files.')
    process.exit(1)
  }

  let totalFiles = 0
  let totalCards = 0
  let totalIssues = 0
  let totalWarnings = 0
  const failedFiles = []
  const fileResults = []

  // Walk the source directory tree
  const walk = (dir) => {
    fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
      const fullPath = path.join(dir, entry.name)

      if (entry.isDirectory()) {
        walk(fullPath)
      } else if (entry.isFile() && entry.name.endsWith('.json')) {
        totalFiles++
        const relativePath = path.relative(sourceDir, fullPath)

        console.log(`📄 Validating ${relativePath}...`)
        const result = validateCardsFile(fullPath)
        fileResults.push({ file: relativePath, ...result })

        totalCards += result.count
        totalIssues += result.issues.length
        totalWarnings += result.warnings.length

        if (result.issues.length > 0) {
          failedFiles.push(relativePath)
          console.log(`   ❌ ${result.issues.length} issues, ${result.warnings.length} warnings`)
        } else {
          console.log(`   ✅ ${result.count} cards, ${result.warnings.length} warnings`)
        }

        // Show first few issues
        result.issues.slice(0, 3).forEach(issue => {
          console.log(`      • ${issue}`)
        })
        if (result.issues.length > 3) {
          console.log(`      ... and ${result.issues.length - 3} more issues`)
        }
      }
    })
  }

  walk(sourceDir)

  // Generate summary
  console.log('\n📊 VALIDATION SUMMARY')
  console.log('='.repeat(50))
  console.log(`📁 Files processed: ${totalFiles}`)
  console.log(`🃏 Total cards: ${totalCards}`)
  console.log(`❌ Files with issues: ${failedFiles.length}`)
  console.log(`⚠️  Total issues: ${totalIssues}`)
  console.log(`⚠️  Total warnings: ${totalWarnings}`)

  if (failedFiles.length > 0) {
    console.log('\n❌ FAILED FILES:')
    failedFiles.forEach(file => {
      console.log(`   ${file}`)
    })
  }

  // Difficulty distribution summary
  const totalDifficulty = { easy: 0, medium: 0, hard: 0 }
  fileResults.forEach(result => {
    if (result.difficulty) {
      totalDifficulty.easy += result.difficulty.easy || 0
      totalDifficulty.medium += result.difficulty.medium || 0
      totalDifficulty.hard += result.difficulty.hard || 0
    }
  })

  console.log('\n🎯 DIFFICULTY DISTRIBUTION:')
  const totalValidCards = totalDifficulty.easy + totalDifficulty.medium + totalDifficulty.hard
  if (totalValidCards > 0) {
    console.log(`   Easy:   ${totalDifficulty.easy} (${Math.round(totalDifficulty.easy/totalValidCards*100)}%)`)
    console.log(`   Medium: ${totalDifficulty.medium} (${Math.round(totalDifficulty.medium/totalValidCards*100)}%)`)
    console.log(`   Hard:   ${totalDifficulty.hard} (${Math.round(totalDifficulty.hard/totalValidCards*100)}%)`)

    const expectedEasy = totalValidCards * 0.5
    const expectedMedium = totalValidCards * 0.3
    const expectedHard = totalValidCards * 0.2

    const easyOff = Math.abs(totalDifficulty.easy - expectedEasy) / totalValidCards * 100
    const mediumOff = Math.abs(totalDifficulty.medium - expectedMedium) / totalValidCards * 100
    const hardOff = Math.abs(totalDifficulty.hard - expectedHard) / totalValidCards * 100

    if (easyOff > 5 || mediumOff > 5 || hardOff > 5) {
      console.log('\n⚠️  Overall difficulty distribution is outside ±5% tolerance!')
    }
  }

  // Common tags summary
  console.log('\n🏷️  MOST COMMON TAGS:')
  const allTags = {}
  fileResults.forEach(result => {
    result.commonTags?.forEach(tagStr => {
      const [tag, count] = tagStr.split(' (')
      const cleanTag = tag
      const cleanCount = parseInt(count)
      allTags[cleanTag] = (allTags[cleanTag] || 0) + cleanCount
    })
  })

  const topTags = Object.entries(allTags)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 20)
    .map(([tag, count]) => `${tag} (${count})`)

  topTags.forEach(tagStr => {
    console.log(`   ${tagStr}`)
  })

  // Final result
  console.log('\n' + '='.repeat(50))

  if (totalIssues > 0) {
    console.log('❌ VALIDATION FAILED - Fix issues before merging')
    console.log('\nRecommendations:')
    console.log('1. Regenerate failed files: npm run generate:flashcards:ai -- --enabler <enabler-id>')
    console.log('2. Or manually fix the JSON files')
    console.log('3. Run validation again: npm run generate:flashcards:validate')
    process.exit(1)
  } else {
    console.log('✅ VALIDATION PASSED - All files are ready for merging!')
    console.log('\nNext step: npm run generate:flashcards:merge')
  }
}

main()
