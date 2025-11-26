---
description: End-to-end pipeline for AI flashcard generation, validation, and merging
---

# Flashcard Generation Pipeline

This workflow automates the process of creating, validating, and merging AI-generated flashcards.

1.  **Generate Flashcards (AI)**
    - Run the AI generation script.
    - To generate for a specific enabler, use: `npm run generate:flashcards:ai -- --enabler=e-people-1-1`
    - To generate for ALL enablers (long process), run without arguments.
    - *Note: Ensure Ollama is running (`ollama serve`).*

    ```bash
    npm run generate:flashcards:ai
    ```

2.  **Validate Source Files**
    - Check the generated source files for quality and structure compliance.

    ```bash
    // turbo
    npm run generate:flashcards:validate
    ```

3.  **Merge into Domain Files**
    - Merge the validated source files into the main domain flashcard files (`src/data/flashcards/*.json`).

    ```bash
    // turbo
    npm run generate:flashcards:merge
    ```

4.  **Full Pipeline (Shortcut)**
    - Alternatively, run the full validation and merge process in one go (skips AI generation if already done).

    ```bash
    npm run generate:flashcards
    ```
