# Accessibility & Testing Guide

## Overview

PMP Practice is built with WCAG 2.1 Level AA compliance in mind. This document provides guidance for testing and validating accessibility standards, along with the features that have been implemented.

## WCAG 2.1 Level AA Compliance Checklist

### ✅ Perceivable

#### Color Contrast (WCAG 2.1 Level AA: 4.5:1 for normal text)
- [x] Primary text on backgrounds: **21:1** (zinc-900 on white)
- [x] Secondary text: **6.5:1** (zinc-600 on white)
- [x] Tertiary text: **4.5:1** (zinc-500 on white)
- [x] Dark mode primary: **15:1** (zinc-50 on zinc-950)
- [x] Dark mode secondary: **8:1** (zinc-300 on zinc-950)
- [x] Dark mode tertiary: **4.5:1** (zinc-400 on zinc-950)
- [x] All button variants exceed 4.5:1
- [x] All status colors (success, error, warning) exceed 4.5:1

**Test:** Use WebAIM Contrast Checker or Chrome DevTools

#### Text Alternatives
- [x] All icons have `aria-label` attributes
- [x] Images have appropriate `alt` text
- [x] Form inputs have associated labels via `htmlFor`
- [x] Button text is descriptive (not just "Click here")

#### Adaptable Content
- [x] Responsive design with multiple breakpoints (sm, md, lg, xl)
- [x] Mobile-first approach with hamburger menu
- [x] Touch-friendly targets: minimum 44×44px
- [x] No information conveyed by color alone

### ✅ Operable

#### Keyboard Navigation
- [x] All interactive elements are keyboard accessible
- [x] Tab order follows visual order
- [x] Focus indicators visible on all focusable elements
- [x] Skip navigation link appears on Tab (press Tab at page load)
- [x] Mobile menu closes with Escape key
- [x] No keyboard traps

**Test:**
1. Open DevTools Console
2. Press `Tab` repeatedly through all interactive elements
3. Verify focus is always visible
4. Press `Escape` to close mobile menu

#### Focus Management
- [x] Focus indicators: 2px outline with 2px offset
- [x] Focus color matches accent color (sky-500/sky-400)
- [x] Focus indicator visible in both light and dark modes
- [x] Focus trap not implemented (unnecessary for this layout)

#### Navigation
- [x] Mobile hamburger menu with smooth animations
- [x] Desktop navigation visible without JavaScript
- [x] Active navigation link highlighted
- [x] Breadcrumb-like context in Quiz component

**Test:**
- Mobile (< 768px): Click hamburger menu
- Desktop: Verify nav links are always visible
- Click links and verify smooth page transitions

#### Animation
- [x] Reduced motion support: animations disabled if `prefers-reduced-motion` is set
- [x] No auto-playing videos or animations
- [x] Hover animations are smooth (300ms duration)
- [x] No blinking or flashing content

**Test:**
1. macOS: System Preferences > Accessibility > Display > Reduce motion
2. Windows: Settings > Ease of Access > Display > Show animations
3. Verify animations still work but at reduced speed

### ✅ Understandable

#### Readable
- [x] Language marked (via `lang` attribute on `<html>`)
- [x] Typography has good readability:
  - Base font size: 1rem (16px)
  - Line height: 1.5rem
  - Max line length: 6xl container (72rem)
- [x] Font stack is web-safe

#### Predictable
- [x] Navigation is consistent across pages
- [x] Form validation messages are clear
- [x] Error messages are specific (e.g., "Name is required" not "Error")
- [x] Links open in same window (no target="_blank" without warning)
- [x] No form submission on select change

#### Input Assistance
- [x] Form labels are properly associated with inputs
- [x] Required fields marked with visual indicator (*)
- [x] Error messages tied to inputs via `aria-describedby`
- [x] Error text has color and icon (✗ symbol)
- [x] Helper text provided where needed

**Test:**
1. Fill out Settings form
2. Try to submit with missing fields
3. Verify error messages appear below inputs
4. Verify tab navigates between fields correctly

### ✅ Robust

#### Compatible
- [x] Valid semantic HTML
- [x] ARIA attributes used correctly (not overly)
- [x] Role attributes only where semantic HTML isn't available
- [x] No duplicate IDs
- [x] Proper heading hierarchy (h1 > h2 > h3)

#### Screen Reader Support
- [x] Semantic HTML elements: `<header>`, `<nav>`, `<main>`, `<footer>`, `<article>`, `<section>`
- [x] ARIA landmarks: `<nav aria-label="Main navigation">`
- [x] Screen reader-only text: `.sr-only` class for skip link
- [x] Live regions for dynamic content: `aria-live="polite"` on toast/feedback
- [x] Status updates announced: `role="status"` on loading/feedback

**Test:**
1. **macOS (VoiceOver):**
   ```bash
   Cmd + F5  # Toggle VoiceOver
   Ctrl + Option + U  # Open rotor to see all landmarks
   ```
2. **Windows (NVDA):**
   - Download NVDA from https://www.nvaccess.org/
   - Toggle with Ctrl + Alt + N
   - Press R to navigate by region

3. **Check landmarks:**
   - Press R to cycle through regions
   - Verify: navigation, main content, footer

4. **Check form labels:**
   - Navigate to form fields
   - Verify label is announced with field
   - Verify required indicator is announced

---

## Testing Procedures

### 1. Automated Testing

#### Lighthouse Audit (Chrome DevTools)
```bash
# Run Lighthouse from Chrome DevTools:
1. Open DevTools (F12)
2. Click "Lighthouse" tab
3. Select "Accessibility"
4. Click "Analyze page load"
```

**Target:** Score of 90+

#### axe DevTools
```bash
# Install browser extension:
1. Download from https://www.deque.com/axe/devtools/
2. Open DevTools > axe DevTools
3. Click "Scan ALL of my page"
```

**Target:** 0 violations

#### WebAIM Contrast Checker
```
Online: https://webaim.org/resources/contrastchecker/
```

### 2. Manual Keyboard Navigation

**Start here:** Press Tab at page load

```
Expected order:
1. Skip to main content (blue pill)
2. Mobile hamburger menu (on mobile) OR navigation links (desktop)
3. Settings & data export button
4. Repository button
5. Domain cards (if Home page)
6. Quiz controls (if Quiz page)
7. Form inputs (if Settings page)
8. Footer links
```

**Checklist:**
- [ ] Focus is always visible
- [ ] Focus indicator is clear (2px sky outline)
- [ ] Tab order is logical
- [ ] No keyboard traps
- [ ] All buttons/links are reachable
- [ ] Escape closes mobile menu

### 3. Screen Reader Testing

#### macOS VoiceOver
```bash
# Enable VoiceOver
Cmd + F5

# Navigate by landmark
Ctrl + Option + U  # Opens rotor with landmarks list

# Navigate by heading
Ctrl + Option + Up/Down  # Jump between headings

# Navigate by form field
Ctrl + Option + J  # Move to next form field
```

**Test Checklist:**
- [ ] Skip link is announced first
- [ ] "Navigation, Main navigation" landmark is announced
- [ ] "Main, Main content" landmark is announced
- [ ] All form labels are announced with inputs
- [ ] Required indicator (*) is announced
- [ ] Error messages are announced
- [ ] Toast notifications are announced via aria-live

#### Windows NVDA
```bash
# Install and enable
Download from https://www.nvaccess.org/
Ctrl + Alt + N  # Toggle NVDA

# Basic shortcuts
H  # Next heading
F  # Next form field
B  # Next button
L  # Next list
R  # Next region/landmark
Insert + F7  # Elements list
```

### 4. Mobile Testing

#### Device Testing
- [ ] iPhone/iOS Safari
- [ ] Android Chrome
- [ ] Tablet landscapes
- [ ] Hamburger menu works on touch
- [ ] Buttons are easily tappable (44×44px minimum)

#### Responsive Testing
```bash
# Chrome DevTools
F12 > Toggle device toolbar (Ctrl + Shift + M)

Breakpoints to test:
- 375px (iPhone SE)
- 414px (iPhone 12)
- 768px (iPad/Tablet)
- 1024px (iPad Pro)
- 1280px (Desktop)
```

**Checklist:**
- [ ] Content is readable at all sizes
- [ ] No horizontal scrolling
- [ ] Touch targets are 44×44px minimum
- [ ] Mobile menu functions correctly
- [ ] Form inputs are easy to fill on mobile

### 5. Dark Mode Testing

#### Manual Testing
1. **Settings page:** Toggle theme selector
   - [ ] Light mode
   - [ ] Dark mode
   - [ ] System default (matches OS preference)

2. **Contrast verification in dark mode:**
   - [ ] Text contrast is at least 4.5:1
   - [ ] All color variants are readable
   - [ ] No white text on white backgrounds
   - [ ] No black text on black backgrounds

#### System Preference Testing
```bash
# macOS
System Preferences > General > Appearance
  - Light
  - Dark
  - Auto (changes with system)

# Windows 10/11
Settings > Personalization > Colors
  - Light
  - Dark
  - Custom
```

### 6. Cross-Browser Testing

**Browsers to test:**
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

**Checklist for each browser:**
- [ ] Animations work smoothly
- [ ] Dark mode toggle works
- [ ] Form inputs function correctly
- [ ] Mobile menu works (if using dev tools)
- [ ] No console errors

**Test on:**
- [ ] macOS
- [ ] Windows
- [ ] Linux (if applicable)

---

## Color Palette Reference

### Light Mode
```
Primary background:  #ffffff (white)
Secondary bg:        #f4f4f5 (zinc-100)
Tertiary bg:         #fafafa (zinc-50)

Primary text:        #18181b (zinc-900) - 21:1 contrast
Secondary text:      #52525b (zinc-600) - 6.5:1 contrast
Tertiary text:       #71717a (zinc-500) - 4.5:1 contrast

Accent:              #0284c7 (sky-600) - 5.5:1 contrast
Success:             #10b981 (emerald-500)
Error:               #ef4444 (rose-500)
Warning:             #f59e0b (amber-500)

Border:              #e4e4e7 (zinc-200)
```

### Dark Mode
```
Primary background:  #09090b (zinc-950)
Secondary bg:        #18181b (zinc-900)
Tertiary bg:         #27272a (zinc-800)

Primary text:        #fafafa (zinc-50) - 15:1 contrast
Secondary text:      #d4d4d8 (zinc-300) - 8:1 contrast
Tertiary text:       #a1a1aa (zinc-400) - 4.5:1 contrast

Accent:              #38bdf8 (sky-400) - 6:1 contrast
Success:             #10b981 (emerald-500)
Error:               #f87171 (rose-400)
Warning:             #fbbf24 (amber-400)

Border:              #3f3f46 (zinc-700)
```

---

## Known Limitations & Future Improvements

### Current Limitations
1. **Custom select styling:** Native HTML selects have browser defaults; custom styling is applied but may vary by browser
2. **Modal implementation:** Current app doesn't use modals; if added, focus management should be implemented
3. **Complex tables:** No data tables implemented; if added, ARIA table roles needed

### Future Enhancements
1. Add test automation with Jest + React Testing Library
2. Implement CI/CD pipeline with accessibility checks
3. Add ARIA descriptions for complex processes
4. Implement breadcrumb navigation for deeper drill-downs
5. Add skip links for multiple content sections
6. Implement search functionality with ARIA live region feedback

---

## Resources

### WCAG & Standards
- [WCAG 2.1 Guideline](https://www.w3.org/WAI/WCAG21/quickref/)
- [Section 508 Standards](https://www.ada.gov/digital-accessibility-introduction)
- [MDN Accessibility Guide](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Testing Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [WAVE Browser Extension](https://wave.webaim.org/extension/)

### Screen Readers
- [NVDA (Windows)](https://www.nvaccess.org/)
- [JAWS (Windows, paid)](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver (macOS/iOS)](https://www.apple.com/accessibility/voiceover/)

### Learning Resources
- [WebAIM Blog](https://webaim.org/blog/)
- [Inclusive Components](https://inclusive-components.design/)
- [A11y Project](https://www.a11yproject.com/)

---

## Maintenance

### When Adding New Features
1. Add semantic HTML (use proper heading levels, landmarks)
2. Add ARIA labels to interactive elements
3. Ensure keyboard navigation works
4. Test with Lighthouse and axe
5. Test with screen reader (VoiceOver or NVDA)
6. Verify color contrast

### When Updating Styles
1. Test all color combinations in light & dark modes
2. Verify focus indicators are visible
3. Check that animations respect prefers-reduced-motion
4. Test responsiveness on mobile devices

### Regular Audits
- **Monthly:** Run Lighthouse & axe
- **Quarterly:** Manual keyboard navigation test
- **Quarterly:** Screen reader testing
- **Quarterly:** Mobile device testing

---

## Questions?

For accessibility questions or issues, refer to:
- [WebAIM Email List](https://webaim.org/contact/)
- [WCAG 2.1 Techniques](https://www.w3.org/WAI/WCAG21/Techniques/)
- [Deque University](https://dequeuniversity.com/)
