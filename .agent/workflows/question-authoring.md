---
description: Interactive workflow for adding new PMP practice questions
---

# Question Authoring Workflow

This workflow guides you through adding a new question to the PMP Practice bank.

1.  **Identify the Target Enabler**
    - Consult `src/data/enablers.json` to find the correct `enablerId` (e.g., `e-people-1-1`).
    - Note the `domainId` (e.g., `people`) and `taskId` (e.g., `people-1`).

2.  **Create the Question File**
    - Run the following command to create a new question file.
    - Replace `<domain>`, `<task>`, and `<enabler>` with your specific values.
    - *Tip: The filename should be unique, e.g., `e-people-1-1-q001.json`.*

    ```bash
    # Example: touch src/data/questions/people/people-1/e-people-1-1-new.json
    touch src/data/questions/<domain>/<task>/<enabler>-new.json
    ```

3.  **Add Question Content**
    - Open the newly created file.
    - Paste the following template and fill it in:

    ```json
    [
      {
        "id": "q-unique-id-001",
        "domainId": "<domain>",
        "taskId": "<task>",
        "enablerId": "<enabler>",
        "scenario": "Your scenario text here...",
        "options": [
          { "id": "a", "text": "Option A text" },
          { "id": "b", "text": "Option B text" },
          { "id": "c", "text": "Option C text" },
          { "id": "d", "text": "Option D text" }
        ],
        "correctAnswerId": "a",
        "explanation": "Explanation of why A is correct and others are incorrect."
      }
    ]
    ```

4.  **Generate Questions Bank**
    - Run the generation script to merge your new question into the main `src/data/questions.json` file.

    ```bash
    // turbo
    npm run generate:questions
    ```

5.  **Verify**
    - Check the output of the generation script for any errors.
    - Ensure your new question appears in `src/data/questions.json`.
