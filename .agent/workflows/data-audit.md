---
description: Deep clean and integrity check for static data
---

# Data Integrity Audit

Perform a deep audit of the static data files to ensure consistency and correctness.

1.  **Check for Duplicate IDs**
    - (Manual Step) Search for duplicate IDs in `src/data/questions.json`.
    - *Note: The `generate:questions` script should warn about this, but a manual grep is a good double-check.*

    ```bash
    grep -r "id\"" src/data/questions | awk -F: '{print $2}' | sort | uniq -d
    ```

2.  **Validate Enabler IDs**
    - Ensure all questions reference valid Enabler IDs from `src/data/enablers.json`.
    - *This is implicitly handled by the app's data loader, but you can verify by checking console warnings during `npm run dev`.*

3.  **Check for Orphaned Files**
    - List all question source files and ensure they are within the expected directory structure (`src/data/questions/<domain>/<task>/`).

    ```bash
    find src/data/questions -name "*.json" -not -path "src/data/questions.json"
    ```

4.  **Validate Flashcard Structure**
    - Run the rigorous flashcard validation script.

    ```bash
    // turbo
    npm run generate:flashcards:validate
    ```
