---
description: Manual accessibility verification checklist (WCAG 2.1 AA)
---

# Accessibility Verification

Follow this checklist to ensure the application meets WCAG 2.1 AA standards.

1.  **Start Development Server**
    ```bash
    npm run dev
    ```

2.  **Keyboard Navigation**
    - [ ] Tab through the entire page. Verify that:
        - [ ] Focus order is logical.
        - [ ] Focus indicator is clearly visible (sky-colored outline).
        - [ ] No keyboard traps (can tab in and out of all areas).
        - [ ] Dropdowns and Modals can be closed with `Esc`.

3.  **Screen Reader Testing**
    - [ ] Enable VoiceOver (Mac) or NVDA (Windows).
    - [ ] Verify that:
        - [ ] Images have `alt` text (or are hidden if decorative).
        - [ ] Buttons have descriptive labels (aria-label if icon-only).
        - [ ] Form inputs have associated labels.
        - [ ] Dynamic content updates (like toast messages) are announced.

4.  **Color Contrast**
    - [ ] Use a contrast checker tool (e.g., WAVE, ARC).
    - [ ] Verify text-to-background contrast is at least 4.5:1.
    - [ ] Check both Light Mode and Dark Mode.

5.  **Zoom and Responsiveness**
    - [ ] Zoom page to 200%. Verify content is still readable and functional.
    - [ ] Test on mobile view (Chrome DevTools). Verify touch targets are at least 44x44px.

6.  **Reduced Motion**
    - [ ] Enable "Reduce Motion" in OS settings.
    - [ ] Verify that animations (modals, toasts, cards) are disabled or simplified.
