/**
 * Content Consistency Grader
 * Frontend JavaScript to handle user interaction and display results
 */

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const contentForm = document.getElementById('content-form');
  const platformInputs = document.getElementById('platform-inputs');
  const addPlatformBtn = document.getElementById('add-platform');
  const analyzeBtn = document.getElementById('analyze-btn');
  const backBtn = document.getElementById('back-to-input');
  const inputSection = document.getElementById('input-section');
  const resultsSection = document.getElementById('results-section');
  const loadingSection = document.getElementById('loading-section');
  const consistencyScoreEl = document.getElementById('consistency-score');
  const recommendationsList = document.getElementById('recommendation-list');
  
  // Chart elements
  const sentimentChart = document.getElementById('sentiment-chart');
  const keywordChart = document.getElementById('keyword-chart');
  const toneChart = document.getElementById('tone-chart');
  const similarityChart = document.getElementById('similarity-chart');
  
  // Text analysis elements
  const sentimentAnalysisEl = document.getElementById('sentiment-analysis');
  const keywordAnalysisEl = document.getElementById('keyword-analysis');
  const toneAnalysisEl = document.getElementById('tone-analysis');
  const similarityAnalysisEl = document.getElementById('similarity-analysis');
  
  // Event listeners
  addPlatformBtn.addEventListener('click', addPlatformInput);
  contentForm.addEventListener('submit', handleFormSubmit);
  backBtn.addEventListener('click', showInputSection);
  
  // Platform options for dropdown
  const platformOptions = [
    'Website', 'Twitter', 'Instagram', 'Facebook', 'LinkedIn', 
    'YouTube', 'TikTok', 'Blog', 'Email', 'Press Release', 'Other'
  ];
  
  // Keep track of used platforms
  let usedPlatforms = ['Website', 'Twitter'];
  
  /**
   * Adds a new platform input field
   */
  function addPlatformInput() {
    // Filter out already used platforms
    const availablePlatforms = platformOptions.filter(p => !usedPlatforms.includes(p));
    
    if (availablePlatforms.length === 0) {
      alert('You have added all available platforms.');
      return;
    }
    
    // Get the next available platform
    const nextPlatform = availablePlatforms[0];
    usedPlatforms.push(nextPlatform);
    
    // Create the new platform input
    const platformInput = document.createElement('div');
    platformInput.className = 'platform-input';
    
    const platformId = nextPlatform.toLowerCase().replace(/\s+/g, '-');
    
    platformInput.innerHTML = `
      <label for="${platformId}-content">${nextPlatform}</label>
      <textarea id="${platformId}-content" name="${platformId}" placeholder="Paste content from your ${nextPlatform} here..."></textarea>
    `;
    
    platformInputs.appendChild(platformInput);
  }
  
  /**
   * Handles form submission
   * @param {Event} e - The submit event
   */
  async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Collect form data
    const formData = new FormData(contentForm);
    const platformContent = {};
    
    // Check if at least two platforms have content
    let validPlatformCount = 0;
    
    for (const [platform, content] of formData.entries()) {
      if (content.trim()) {
        platformContent[platform] = content;
        validPlatformCount++;
      }
    }
    
    if (validPlatformCount < 2) {
      alert('Please provide content for at least two platforms to compare consistency.');
      return;
    }
    
    // Show loading section
    inputSection.classList.add('hidden');
    loadingSection.classList.remove('hidden');
    
    try {
      // Send data to server
      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ platformContent })
      });
      
      if (!response.ok) {
        throw new Error('Server response was not ok');
      }
      
      const result = await response.json();
      
      // Process and display results
      displayResults(result);
      
      // Hide loading, show results
      loadingSection.classList.add('hidden');
      resultsSection.classList.remove('hidden');
      
    } catch (error) {
      console.error('Error analyzing content:', error);
      alert('An error occurred while analyzing your content. Please try again.');
      
      // Go back to input screen
      loadingSection.classList.add('hidden');
      inputSection.classList.remove('hidden');
    }
  }
  
  /**
   * Displays analysis results
   * @param {Object} results - The analysis results from the server
   */
  function displayResults(results) {
    // 1. Set overall consistency score
    consistencyScoreEl.textContent = results.overallConsistencyScore;
    
    // Apply color based on score
    const scoreColor = getScoreColor(results.overallConsistencyScore);
    document.querySelector('.score-circle').style.backgroundColor = scoreColor;
    
    // 2. Create charts
    createSentimentChart(results.sentimentAnalysis);
    createKeywordChart(results.keywordAnalysis);
    createToneChart(results.toneAnalysis);
    createSimilarityChart(results.similarityMatrix);
    
    // 3. Set text analysis summaries
    setAnalysisSummaries(results);
    
    // 4. Display recommendations
    displayRecommendations(results.recommendations);
  }
  
  /**
   * Creates a chart for sentiment analysis
   * @param {Object} sentimentData - Sentiment analysis data
   */
  function createSentimentChart(sentimentData) {
    const platforms = Object.keys(sentimentData.platformSentiments);
    const sentimentScores = platforms.map(p => sentimentData.platformSentiments[p].comparative);
    
    // Destroy previous chart if it exists
    Chart.getChart(sentimentChart)?.destroy();
    
    new Chart(sentimentChart, {
      type: 'bar',
      data: {
        labels: platforms,
        datasets: [{
          label: 'Sentiment Score',
          data: sentimentScores,
          backgroundColor: 'rgba(74, 111, 165, 0.7)',
          borderColor: 'rgba(74, 111, 165, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Sentiment (Negative to Positive)'
            }
          }
        }
      }
    });
  }
  
  /**
   * Creates a chart for keyword analysis
   * @param {Object} keywordData - Keyword analysis data
   */
  function createKeywordChart(keywordData) {
    // Get top keywords by presence across platforms
    const keywordPresence = keywordData.keywordPresence;
    const keywords = Object.keys(keywordPresence)
      .sort((a, b) => keywordPresence[b].count - keywordPresence[a].count)
      .slice(0, 5);
    
    const counts = keywords.map(k => keywordPresence[k].count);
    
    // Destroy previous chart if it exists
    Chart.getChart(keywordChart)?.destroy();
    
    new Chart(keywordChart, {
      type: 'horizontalBar',
      data: {
        labels: keywords,
        datasets: [{
          label: 'Platform Presence',
          data: counts,
          backgroundColor: 'rgba(61, 153, 112, 0.7)',
          borderColor: 'rgba(61, 153, 112, 1)',
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Platforms'
            },
            max: Object.keys(keywordData.platformKeywords).length
          }
        }
      }
    });
  }
  
  /**
   * Creates a chart for tone analysis
   * @param {Object} toneData - Tone analysis data
   */
  function createToneChart(toneData) {
    const platforms = Object.keys(toneData.platformTones);
    const toneCategories = ['formal', 'casual', 'professional', 'promotional'];
    
    // Prepare datasets
    const datasets = toneCategories.map((tone, index) => {
      const colors = [
        'rgba(74, 111, 165, 0.7)',
        'rgba(61, 153, 112, 0.7)',
        'rgba(252, 196, 25, 0.7)',
        'rgba(214, 69, 65, 0.7)'
      ];
      
      return {
        label: tone.charAt(0).toUpperCase() + tone.slice(1),
        data: platforms.map(p => toneData.platformTones[p].scores[tone]),
        backgroundColor: colors[index % colors.length],
        borderColor: colors[index % colors.length].replace('0.7', '1'),
        borderWidth: 1
      };
    });
    
    // Destroy previous chart if it exists
    Chart.getChart(toneChart)?.destroy();
    
    new Chart(toneChart, {
      type: 'radar',
      data: {
        labels: platforms,
        datasets: datasets
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          r: {
            angleLines: {
              display: true
            },
            min: 0
          }
        }
      }
    });
  }
  
  /**
   * Creates a chart for content similarity
   * @param {Object} similarityData - Similarity matrix data
   */
  function createSimilarityChart(similarityData) {
    const platforms = Object.keys(similarityData.matrix);
    
    // Convert matrix to array of objects for heatmap
    const data = [];
    for (let i = 0; i < platforms.length; i++) {
      for (let j = 0; j < platforms.length; j++) {
        data.push({
          x: platforms[i],
          y: platforms[j],
          v: similarityData.matrix[platforms[i]][platforms[j]]
        });
      }
    }
    
    // Destroy previous chart if it exists
    Chart.getChart(similarityChart)?.destroy();
    
    new Chart(similarityChart, {
      type: 'scatter',
      data: {
        datasets: [{
          label: 'Content Similarity',
          data: data,
          backgroundColor: context => {
            const value = context.raw.v;
            return `rgba(61, 153, 112, ${value})`;
          },
          pointRadius: 10,
          pointHoverRadius: 12
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          x: {
            type: 'category',
            position: 'bottom',
            title: {
              display: true,
              text: 'Platform'
            }
          },
          y: {
            type: 'category',
            position: 'left',
            title: {
              display: true,
              text: 'Platform'
            }
          }
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: context => {
                const point = context.raw;
                return `${point.x} to ${point.y}: ${(point.v * 100).toFixed(1)}% similar`;
              }
            }
          }
        }
      }
    });
  }
  
  /**
   * Sets text summaries for each analysis section
   * @param {Object} results - The analysis results
   */
  function setAnalysisSummaries(results) {
    // Sentiment analysis summary
    const sentimentVariance = results.sentimentAnalysis.variance;
    sentimentAnalysisEl.textContent = sentimentVariance < 0.2 
      ? `Your content maintains a consistent emotional tone across platforms (variance: ${sentimentVariance.toFixed(2)}).` 
      : `Your content shows significant emotional tone variation across platforms (variance: ${sentimentVariance.toFixed(2)}).`;
    
    // Keyword analysis summary
    const keywordScore = results.keywordAnalysis.consistencyScore;
    keywordAnalysisEl.textContent = keywordScore > 0.7
      ? `Your key messaging terms are consistently used across platforms (${(keywordScore * 100).toFixed(0)}% consistency).`
      : `Your key messaging terms vary significantly across platforms (${(keywordScore * 100).toFixed(0)}% consistency).`;
    
    // Tone analysis summary
    const toneScore = results.toneAnalysis.consistencyScore;
    toneAnalysisEl.textContent = toneScore > 0.7
      ? `Your communication style is consistent across platforms (${(toneScore * 100).toFixed(0)}% consistency).`
      : `Your communication style varies across platforms (${(toneScore * 100).toFixed(0)}% consistency).`;
    
    // Similarity analysis summary
    const avgSimilarity = results.similarityMatrix.averageSimilarity;
    similarityAnalysisEl.textContent = avgSimilarity > 0.6
      ? `Your content is structurally similar across platforms (${(avgSimilarity * 100).toFixed(0)}% average similarity).`
      : `Your content structure varies significantly across platforms (${(avgSimilarity * 100).toFixed(0)}% average similarity).`;
  }
  
  /**
   * Displays recommendations for improving consistency
   * @param {Array} recommendations - List of recommendations
   */
  function displayRecommendations(recommendations) {
    // Clear previous recommendations
    recommendationsList.innerHTML = '';
    
    if (recommendations.length === 0) {
      recommendationsList.innerHTML = '<li>Great job! Your content is already highly consistent.</li>';
      return;
    }
    
    // Add each recommendation
    recommendations.forEach(rec => {
      const li = document.createElement('li');
      
      const title = document.createElement('strong');
      title.textContent = rec.title;
      
      const description = document.createElement('p');
      description.textContent = rec.description;
      
      li.appendChild(title);
      li.appendChild(description);
      
      recommendationsList.appendChild(li);
    });
  }
  
  /**
   * Returns a color based on the score value
   * @param {Number} score - The consistency score (0-100)
   * @returns {String} CSS color value
   */
  function getScoreColor(score) {
    if (score >= 80) return '#3d9970'; // Green
    if (score >= 60) return '#ffdc00'; // Yellow
    if (score >= 40) return '#ff851b'; // Orange
    return '#ff4136'; // Red
  }
  
  /**
   * Shows the input section and hides results
   */
  function showInputSection() {
    resultsSection.classList.add('hidden');
    inputSection.classList.remove('hidden');
  }
});