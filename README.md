# Content Consistency Grader

A web application that helps brands assess how consistently their message is delivered across different platforms.

## Overview

Maintaining consistent brand messaging across multiple platforms is essential for brand identity and customer trust. The Content Consistency Grader analyzes text content from different platforms to:

1. Measure tone consistency
2. Identify key message elements
3. Detect brand voice patterns
4. Provide actionable insights for improving consistency

## Features

- **Text Analysis**: Evaluates tone, sentiment, and keyword usage across content samples
- **Consistency Scoring**: Provides quantitative metrics for messaging consistency
- **Visual Reports**: Clear visualizations of content analysis results
- **Improvement Recommendations**: Actionable suggestions for enhancing message consistency

## How It Works

1. Users input the same core message as it appears on different platforms (e.g., website, Twitter, Instagram)
2. The app analyzes the text for tone, keywords, and brand voice consistency
3. A "consistency score" is calculated based on text similarity and key message presence
4. The app highlights areas where the message diverges across platforms

## Technology Stack

- Frontend: HTML, CSS, JavaScript (React)
- Backend: Node.js/Express
- NLP Analysis: Natural.js library for text processing
- Visualization: Chart.js for data visualization

## Installation

```bash
# Clone the repository
git clone https://github.com/dxaginfo/ContentConsistencyGrader.git

# Navigate to the project directory
cd ContentConsistencyGrader

# Install dependencies
npm install

# Start the development server
npm start
```

## Project Structure

```
ContentConsistencyGrader/
├── public/             # Static files
├── src/                # Source code
│   ├── components/     # React components
│   ├── analysis/       # Text analysis modules
│   ├── utils/          # Utility functions
│   └── styles/         # CSS files
├── server/             # Backend server code
└── docs/               # Documentation
```

## Current Development Status

The project is currently in active development with a focus on:
- Text analysis component implementation
- Input form design
- Consistency score visualization

## License

MIT