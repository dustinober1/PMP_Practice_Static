---
description: Pre-flight checks for code quality, build success, and data integrity
---

# Release & Quality Check

Run this workflow before pushing changes or deploying to production.

1.  **Lint Code**
    - Check for code style and syntax issues.

    ```bash
    // turbo
    npm run lint
    ```

2.  **Build Production Bundle**
    - Ensure the application builds successfully.

    ```bash
    // turbo
    npm run build
    ```

3.  **Validate Flashcards**
    - Ensure all flashcard data is valid.

    ```bash
    // turbo
    npm run generate:flashcards:validate
    ```

4.  **Regenerate Questions (Safety)**
    - Re-run question generation to ensure `questions.json` is in sync with source files.

    ```bash
    // turbo
    npm run generate:questions
    ```

5.  **Preview Build (Optional)**
    - Preview the production build locally to verify runtime behavior.

    ```bash
    npm run preview
    ```
