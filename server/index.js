const express = require('express');
const cors = require('cors');
const path = require('path');
const textAnalyzer = require('./textAnalysis/analyzer');

// Initialize express app
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Routes
app.post('/api/analyze', async (req, res) => {
  try {
    const { platformContent } = req.body;
    
    // Check if data was provided
    if (!platformContent || Object.keys(platformContent).length === 0) {
      return res.status(400).json({ error: 'No content provided for analysis' });
    }
    
    // Process the data with our text analyzer
    const result = await textAnalyzer.analyzeConsistency(platformContent);
    
    // Return the results
    res.json(result);
  } catch (error) {
    console.error('Error analyzing content:', error);
    res.status(500).json({ error: 'Failed to analyze content' });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app; // For testing purposes