/**
 * Text Analysis Module for Content Consistency Grader
 * 
 * This module performs various NLP analyses to determine how consistent 
 * content is across different platforms.
 */

const natural = require('natural');
const sentiment = require('sentiment');
const nlp = require('compromise');

// Initialize NLP tools
const tokenizer = new natural.WordTokenizer();
const TfIdf = natural.TfIdf;
const sentimentAnalyzer = new sentiment();

/**
 * Analyzes content consistency across different platforms
 * 
 * @param {Object} platformContent - Object with platform names as keys and content strings as values
 * @returns {Object} Analysis results with consistency scores
 */
async function analyzeConsistency(platformContent) {
  try {
    // Extract platforms and their content
    const platforms = Object.keys(platformContent);
    
    if (platforms.length < 2) {
      throw new Error('At least two content samples are required for consistency analysis');
    }
    
    // 1. Perform sentiment analysis on each platform's content
    const sentimentResults = performSentimentAnalysis(platformContent);
    
    // 2. Extract key topics and keywords from each platform
    const keywordResults = extractKeywords(platformContent);
    
    // 3. Analyze tone consistency across platforms
    const toneResults = analyzeTone(platformContent);
    
    // 4. Calculate Jaccard similarity between platform content
    const similarityMatrix = calculateSimilarityMatrix(platformContent);
    
    // 5. Calculate overall consistency score
    const consistencyScore = calculateConsistencyScore(
      sentimentResults, 
      keywordResults, 
      toneResults, 
      similarityMatrix
    );
    
    // 6. Generate improvement recommendations
    const recommendations = generateRecommendations(
      sentimentResults, 
      keywordResults, 
      toneResults, 
      similarityMatrix
    );
    
    // Return the complete analysis results
    return {
      overallConsistencyScore: consistencyScore,
      sentimentAnalysis: sentimentResults,
      keywordAnalysis: keywordResults,
      toneAnalysis: toneResults,
      similarityMatrix: similarityMatrix,
      recommendations: recommendations
    };
  } catch (error) {
    console.error('Error in consistency analysis:', error);
    throw error;
  }
}

/**
 * Performs sentiment analysis on content from each platform
 * 
 * @param {Object} platformContent - Object with platform names as keys and content strings as values
 * @returns {Object} Sentiment scores for each platform
 */
function performSentimentAnalysis(platformContent) {
  const results = {};
  
  for (const platform in platformContent) {
    const content = platformContent[platform];
    const result = sentimentAnalyzer.analyze(content);
    
    results[platform] = {
      score: result.score,
      comparative: result.comparative,
      positive: result.positive,
      negative: result.negative
    };
  }
  
  // Calculate sentiment variance across platforms
  const sentimentScores = Object.values(results).map(r => r.comparative);
  const sentimentVariance = calculateVariance(sentimentScores);
  
  return {
    platformSentiments: results,
    variance: sentimentVariance,
    consistent: sentimentVariance < 0.2 // Threshold for consistency
  };
}

/**
 * Extracts key topics and keywords from each platform's content
 * 
 * @param {Object} platformContent - Object with platform names as keys and content strings as values
 * @returns {Object} Key topics and keywords for each platform
 */
function extractKeywords(platformContent) {
  const results = {};
  const allKeywords = new Set();
  const tfidf = new TfIdf();
  
  // Add each platform's content to TF-IDF
  let docIndex = 0;
  const platformIndices = {};
  
  for (const platform in platformContent) {
    tfidf.addDocument(platformContent[platform]);
    platformIndices[platform] = docIndex++;
    
    // Extract keywords using compromise
    const doc = nlp(platformContent[platform]);
    const nouns = doc.nouns().out('array');
    const verbs = doc.verbs().out('array');
    
    // Tokenize content
    const tokens = tokenizer.tokenize(platformContent[platform].toLowerCase());
    
    // Filter out common stop words
    const keywords = tokens.filter(word => 
      word.length > 2 && 
      !natural.stopwords.includes(word)
    );
    
    // Store keywords for this platform
    results[platform] = {
      topNouns: nouns.slice(0, 5),
      topVerbs: verbs.slice(0, 5),
      keywords: [...new Set(keywords)].slice(0, 10)
    };
    
    // Add to all keywords set
    keywords.forEach(kw => allKeywords.add(kw));
  }
  
  // Calculate keyword presence across platforms
  const keywordPresence = {};
  allKeywords.forEach(keyword => {
    keywordPresence[keyword] = {
      count: 0,
      platforms: []
    };
    
    for (const platform in platformContent) {
      if (results[platform].keywords.includes(keyword)) {
        keywordPresence[keyword].count++;
        keywordPresence[keyword].platforms.push(platform);
      }
    }
  });
  
  // Get top TF-IDF terms for each platform
  for (const platform in platformIndices) {
    const index = platformIndices[platform];
    const topTerms = [];
    
    tfidf.listTerms(index).slice(0, 10).forEach(item => {
      topTerms.push({
        term: item.term,
        tfidf: item.tfidf
      });
    });
    
    results[platform].topTerms = topTerms;
  }
  
  // Calculate keyword consistency score
  const numPlatforms = Object.keys(platformContent).length;
  const consistentKeywords = Array.from(allKeywords).filter(
    kw => keywordPresence[kw].count === numPlatforms
  );
  
  const keywordConsistencyScore = numPlatforms > 0 ? 
    consistentKeywords.length / Math.min(10, allKeywords.size) : 0;
  
  return {
    platformKeywords: results,
    consistentKeywords,
    keywordPresence,
    consistencyScore: keywordConsistencyScore
  };
}

/**
 * Analyzes tone consistency across different platforms
 * 
 * @param {Object} platformContent - Object with platform names as keys and content strings as values
 * @returns {Object} Tone analysis for each platform
 */
function analyzeTone(platformContent) {
  const results = {};
  const toneMarkers = {
    formal: ['therefore', 'consequently', 'furthermore', 'thus', 'hence', 'regarding'],
    casual: ['awesome', 'cool', 'yeah', 'super', 'totally', 'btw', 'lol'],
    professional: ['accordingly', 'additionally', 'significantly', 'importantly', 'notably'],
    promotional: ['amazing', 'incredible', 'exclusive', 'limited', 'opportunity', 'best']
  };
  
  for (const platform in platformContent) {
    const content = platformContent[platform].toLowerCase();
    const toneScores = {};
    
    // Count tone markers in content
    for (const tone in toneMarkers) {
      const markers = toneMarkers[tone];
      let count = 0;
      
      markers.forEach(marker => {
        const regex = new RegExp(`\\b${marker}\\b`, 'gi');
        const matches = content.match(regex);
        if (matches) count += matches.length;
      });
      
      // Normalize by content length
      toneScores[tone] = count / (content.split(' ').length) * 100;
    }
    
    // Determine dominant tone
    let dominantTone = Object.keys(toneScores).reduce((a, b) => 
      toneScores[a] > toneScores[b] ? a : b
    );
    
    results[platform] = {
      scores: toneScores,
      dominantTone
    };
  }
  
  // Check tone consistency across platforms
  const dominantTones = Object.values(results).map(r => r.dominantTone);
  const uniqueTones = new Set(dominantTones);
  
  const toneConsistencyScore = 1 - ((uniqueTones.size - 1) / 
    Math.max(Object.keys(toneMarkers).length - 1, 1));
  
  return {
    platformTones: results,
    consistencyScore: toneConsistencyScore,
    consistent: uniqueTones.size === 1
  };
}

/**
 * Calculates text similarity between all pairs of platforms
 * 
 * @param {Object} platformContent - Object with platform names as keys and content strings as values
 * @returns {Object} Similarity scores between platform pairs
 */
function calculateSimilarityMatrix(platformContent) {
  const platforms = Object.keys(platformContent);
  const matrix = {};
  
  for (let i = 0; i < platforms.length; i++) {
    const platform1 = platforms[i];
    matrix[platform1] = {};
    
    for (let j = 0; j < platforms.length; j++) {
      const platform2 = platforms[j];
      
      if (i === j) {
        matrix[platform1][platform2] = 1; // Same platform, perfect similarity
      } else if (j > i) {
        // Calculate Jaccard similarity between the two platform contents
        const tokens1 = new Set(tokenizer.tokenize(platformContent[platform1].toLowerCase()));
        const tokens2 = new Set(tokenizer.tokenize(platformContent[platform2].toLowerCase()));
        
        const intersection = new Set([...tokens1].filter(x => tokens2.has(x)));
        const union = new Set([...tokens1, ...tokens2]);
        
        const similarity = intersection.size / union.size;
        matrix[platform1][platform2] = similarity;
      } else {
        // Use previously calculated value for symmetry
        matrix[platform1][platform2] = matrix[platform2][platform1];
      }
    }
  }
  
  // Calculate average similarity across all platform pairs
  let totalSimilarity = 0;
  let pairCount = 0;
  
  for (let i = 0; i < platforms.length; i++) {
    for (let j = i + 1; j < platforms.length; j++) {
      totalSimilarity += matrix[platforms[i]][platforms[j]];
      pairCount++;
    }
  }
  
  const averageSimilarity = pairCount > 0 ? totalSimilarity / pairCount : 0;
  
  return {
    matrix,
    averageSimilarity
  };
}

/**
 * Calculates overall consistency score based on all analyses
 * 
 * @param {Object} sentimentResults - Results from sentiment analysis
 * @param {Object} keywordResults - Results from keyword extraction
 * @param {Object} toneResults - Results from tone analysis
 * @param {Object} similarityMatrix - Results from similarity calculation
 * @returns {Number} Overall consistency score (0-100)
 */
function calculateConsistencyScore(
  sentimentResults, 
  keywordResults, 
  toneResults, 
  similarityMatrix
) {
  // Weight each component in the overall score
  const weights = {
    sentiment: 0.2,
    keywords: 0.3,
    tone: 0.25,
    similarity: 0.25
  };
  
  // Convert variance to a 0-1 score (lower variance is better)
  const sentimentScore = Math.max(0, 1 - sentimentResults.variance);
  
  // Get the keyword consistency score (0-1)
  const keywordScore = keywordResults.consistencyScore;
  
  // Get the tone consistency score (0-1)
  const toneScore = toneResults.consistencyScore;
  
  // Get the similarity score (0-1)
  const similarityScore = similarityMatrix.averageSimilarity;
  
  // Calculate weighted average
  const overallScore = (
    weights.sentiment * sentimentScore +
    weights.keywords * keywordScore +
    weights.tone * toneScore +
    weights.similarity * similarityScore
  ) * 100;
  
  return Math.round(overallScore);
}

/**
 * Generates recommendations for improving content consistency
 * 
 * @param {Object} sentimentResults - Results from sentiment analysis
 * @param {Object} keywordResults - Results from keyword extraction
 * @param {Object} toneResults - Results from tone analysis
 * @param {Object} similarityMatrix - Results from similarity calculation
 * @returns {Array} List of recommendations
 */
function generateRecommendations(
  sentimentResults, 
  keywordResults, 
  toneResults, 
  similarityMatrix
) {
  const recommendations = [];
  
  // 1. Sentiment consistency recommendations
  if (!sentimentResults.consistent) {
    const platformSentiments = sentimentResults.platformSentiments;
    const platforms = Object.keys(platformSentiments);
    
    // Find platforms with most divergent sentiment
    let minSentiment = { platform: '', value: Infinity };
    let maxSentiment = { platform: '', value: -Infinity };
    
    platforms.forEach(platform => {
      const sentiment = platformSentiments[platform].comparative;
      if (sentiment < minSentiment.value) {
        minSentiment = { platform, value: sentiment };
      }
      if (sentiment > maxSentiment.value) {
        maxSentiment = { platform, value: sentiment };
      }
    });
    
    recommendations.push({
      category: 'sentiment',
      title: 'Align emotional tone across platforms',
      description: `Your content on ${maxSentiment.platform} has a more positive tone compared to ${minSentiment.platform}. Consider adjusting the emotional tone to be more consistent.`
    });
  }
  
  // 2. Keyword consistency recommendations
  const numPlatforms = Object.keys(keywordResults.platformKeywords).length;
  const inconsistentKeywords = Object.entries(keywordResults.keywordPresence)
    .filter(([_, data]) => data.count > 0 && data.count < numPlatforms)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 3);
  
  if (inconsistentKeywords.length > 0) {
    const keywordSuggestions = inconsistentKeywords.map(([keyword, data]) => {
      const missingPlatforms = Object.keys(keywordResults.platformKeywords)
        .filter(p => !data.platforms.includes(p))
        .join(', ');
      
      return `"${keyword}" (missing from ${missingPlatforms})`;
    }).join('; ');
    
    recommendations.push({
      category: 'keywords',
      title: 'Include key terms consistently across platforms',
      description: `These important terms appear inconsistently across your platforms: ${keywordSuggestions}`
    });
  }
  
  // 3. Tone consistency recommendations
  if (!toneResults.consistent) {
    const toneInconsistencies = [];
    const platformTones = toneResults.platformTones;
    
    for (const platform in platformTones) {
      const tone = platformTones[platform].dominantTone;
      toneInconsistencies.push(`${platform} (${tone})`);
    }
    
    recommendations.push({
      category: 'tone',
      title: 'Standardize your communication style',
      description: `Your tone varies across platforms: ${toneInconsistencies.join(', ')}. Choose one consistent voice for your brand.`
    });
  }
  
  // 4. Similarity recommendations
  const platforms = Object.keys(similarityMatrix.matrix);
  let lowestSimilarityPair = { platforms: ['', ''], value: 1 };
  
  for (let i = 0; i < platforms.length; i++) {
    for (let j = i + 1; j < platforms.length; j++) {
      const platform1 = platforms[i];
      const platform2 = platforms[j];
      const similarity = similarityMatrix.matrix[platform1][platform2];
      
      if (similarity < lowestSimilarityPair.value) {
        lowestSimilarityPair = { 
          platforms: [platform1, platform2], 
          value: similarity 
        };
      }
    }
  }
  
  if (lowestSimilarityPair.value < 0.5) {
    recommendations.push({
      category: 'similarity',
      title: 'Align messaging between platforms',
      description: `Your content on ${lowestSimilarityPair.platforms[0]} and ${lowestSimilarityPair.platforms[1]} differs significantly. Try to maintain more consistent messaging.`
    });
  }
  
  return recommendations;
}

/**
 * Calculates the variance of an array of numbers
 * 
 * @param {Array} values - Array of numerical values
 * @returns {Number} Variance
 */
function calculateVariance(values) {
  const n = values.length;
  if (n === 0) return 0;
  
  const mean = values.reduce((sum, val) => sum + val, 0) / n;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((sum, val) => sum + val, 0) / n;
  
  return variance;
}

module.exports = {
  analyzeConsistency,
  performSentimentAnalysis,
  extractKeywords,
  analyzeTone,
  calculateSimilarityMatrix,
  calculateConsistencyScore,
  generateRecommendations
};