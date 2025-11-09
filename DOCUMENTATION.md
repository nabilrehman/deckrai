# Deckr.ai Detailed Documentation

## 1. About the Project

Deckr.ai is an AI-powered presentation-making tool that allows users to create and edit slide decks using generative AI. It provides a rich set of features for generating new slides, modifying existing ones, and personalizing presentations for specific audiences.

## 2. Technology Stack

*   **Frontend:**
    *   React
    *   TypeScript
    *   Vite
*   **Backend:**
    *   Firebase (for authentication and other services)
*   **AI:**
    *   Google Generative AI (Gemini and Imagen models)

## 3. Project Structure

The project follows a standard React project structure.

*   **`App.tsx`**: The main component that manages the application's state and renders different components based on the current state.
*   **`components/`**: Contains reusable UI components.
    *   **`Editor.tsx`**: The core component for editing slides.
    *   **`Header.tsx`**: The main header of the application.
    *   **`SlidePreviewList.tsx`**: Displays a list of all slides in the deck.
    *   **`SlideEditor.tsx`**: Displays and edits the currently selected slide.
*   **`config/`**: Contains configuration files, such as Firebase configuration.
*   **`data/`**: Contains static data, such as templates.
*   **`services/`**: Contains business logic and API interactions.
    *   **`authService.ts`**: Handles authentication logic.
    *   **`geminiService.ts`**: Interacts with the Google Generative AI API.

## 4. Features

This section provides a detailed description of each feature and how to use it.

### 4.1. AI Slide Generation

**Description:**

This feature allows users to generate new slides from a text prompt. The application uses Google's Generative AI models to create a new slide that matches the user's description.

**How to Use:**

1.  In the `Editor` view, click the "Add Slide" button in the `SlidePreviewList`.
2.  A prompt input field will appear. Enter a description of the slide you want to create.
3.  Click the "Generate" button.
4.  The AI will generate a new slide and add it to the deck.

**Code:**

*   **Component:** `components/Editor.tsx` (handles the UI for adding a new slide)
*   **Service:** `services/geminiService.ts` (the `createSlideFromPrompt` function)

### 4.2. Deck-level AI

**Description:**

This feature allows users to modify the entire deck based on a high-level prompt. For example, a user can enter "customize this deck for nike.com" and the AI will generate a plan to modify the entire deck.

**How to Use:**

1.  In the `Editor` view, there is a text area for deck-level AI prompts.
2.  Enter a high-level prompt describing the changes you want to make to the entire deck.
3.  Click the "Create AI Plan" button.
4.  The AI will generate an execution plan, which will be displayed in a modal.
5.  Review the plan and click "Execute Plan" to apply the changes.

**Code:**

*   **Component:** `components/Editor.tsx` (handles the UI for the deck-level AI prompt and the execution plan modal)
*   **Service:** `services/geminiService.ts` (the `generateDeckExecutionPlan` and `executeSlideTask` functions)

### 4.3. Slide Personalization

**Description:**

This feature automatically personalizes slides for a specific company by analyzing their website and replacing content like logos and text.

**How to Use:**

1.  This feature is triggered as part of the "Deck-level AI" workflow.
2.  When a user provides a prompt like "customize this deck for nike.com", the AI will analyze the website and generate a plan to personalize the slides.
3.  The plan may include replacing logos, text, and other content to match the company's branding.

**Code:**

*   **Service:** `services/geminiService.ts` (the `getPersonalizationPlan` and `getPersonalizedVariationsFromPlan` functions)

### 4.4. Style Library

**Description:**

The Style Library allows users to save slides and use them as references to apply a consistent style across other slides.

**How to Use:**

1.  In the `Editor` view, click the "Add to Style Library" button on a slide.
2.  The slide will be added to the `StyleLibraryPanel`.
3.  To apply the style to another slide, select the target slide and then select the desired style from the `StyleLibraryPanel`.
4.  The AI will remake the target slide with the style of the selected reference slide.

**Code:**

*   **Component:** `components/StyleLibraryPanel.tsx` (displays the style library)
*   **Component:** `components/Editor.tsx` (handles the logic for applying styles)
*   **Service:** `services/geminiService.ts` (the `remakeSlideWithStyleReference` function)

### 4.5. Manual Editing

**Description:**

The application provides basic editing features like undo, reset, and deleting slides.

**How to Use:**

*   **Undo:** Click the "Undo" button on a slide to revert the last change.
*   **Reset:** Click the "Reset" button on a slide to revert all changes to the original version.
*   **Delete:** Click the "Delete" button on a slide to remove it from the deck.

**Code:**

*   **Component:** `components/Editor.tsx` (handles the UI and logic for manual editing)
*   **Component:** `App.tsx` (manages the state of the slides)

### 4.6. PDF Export

**Description:**

Users can download their presentations as PDF files.

**How to Use:**

1.  Click the "Download PDF" button in the `Header`.
2.  The application will generate a PDF of the presentation and download it to your computer.

**Code:**

*   **Component:** `App.tsx` (the `handleDownloadPdf` function)
*   **Library:** `jspdf`

### 4.7. Presentation Mode

**Description:**

This feature allows users to present their deck in a full-screen presentation mode.

**How to Use:**

1.  Click the "Present" button in the `Header`.
2.  The presentation will open in a full-screen view.
3.  Use the arrow keys to navigate between slides.
4.  Press the "Esc" key to exit presentation mode.

**Code:**

*   **Component:** `components/PresentationView.tsx` (the presentation mode component)
*   **Component:** `App.tsx` (handles the logic for entering and exiting presentation mode)

## 5. Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

*   Node.js and npm (or yarn) installed on your machine.

### Installation

1.  Clone the repo
    ```sh
    git clone https://github.com/your_username_/Project-Name.git
    ```
2.  Install NPM packages
    ```sh
    npm install
    ```
3.  Set up your environment variables (see Configuration section below).
4.  Run the development server
    ```sh
    npm run dev
    ```

## 6. Configuration

The application requires an API key for Google Generative AI. This should be stored in a `.env.local` file in the root of the project.

```
API_KEY=your_google_generative_ai_api_key
```