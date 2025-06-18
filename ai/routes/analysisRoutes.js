/**
 * Analysis API Routes
 * Express routes for opportunity analysis and matching functionality
 */

const express = require('express');
const router = express.Router();
const OpportunityAnalyzer = require('../services/opportunityAnalyzer');
const MatchingEngine = require('../services/matchingEngine');

// Initialize services
const analyzer = new OpportunityAnalyzer();
const matcher = new MatchingEngine();

/**
 * POST /api/analyze-opportunities
 * Analyze opportunities with AI to extract insights
 */
router.post('/analyze-opportunities', async (req, res) => {
  try {
    const { opportunities } = req.body;
    
    if (!opportunities || !Array.isArray(opportunities)) {
      return res.status(400).json({
        error: 'Invalid request: opportunities array required'
      });
    }

    console.log(`📊 Starting analysis of ${opportunities.length} opportunities`);
    
    const analysisResult = await analyzer.analyzeOpportunities(opportunities);
    
    res.json({
      success: true,
      data: analysisResult,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in analyze-opportunities:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message
    });
  }
});

/**
 * POST /api/match-opportunities
 * Score opportunities against a business profile
 */
router.post('/match-opportunities', async (req, res) => {
  try {
    const { opportunities, businessProfile } = req.body;
    
    if (!opportunities || !Array.isArray(opportunities)) {
      return res.status(400).json({
        error: 'Invalid request: opportunities array required'
      });
    }
    
    if (!businessProfile) {
      return res.status(400).json({
        error: 'Invalid request: businessProfile required'
      });
    }

    console.log(`🎯 Matching ${opportunities.length} opportunities against business profile`);
    
    // Analyze opportunities if not already analyzed
    const enhancedOpportunities = await Promise.all(
      opportunities.map(opp => 
        opp.analysis ? opp : analyzer.analyzeOpportunity(opp)
      )
    );
    
    // Score against business profile
    const matchingResult = await matcher.scoreOpportunities(enhancedOpportunities, businessProfile);
    
    res.json({
      success: true,
      data: matchingResult,
      metadata: {
        profileCompany: businessProfile.companyInfo?.name || 'Unknown',
        analysisTimestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error in match-opportunities:', error);
    res.status(500).json({
      error: 'Matching failed',
      message: error.message
    });
  }
});

/**
 * GET /api/recommendations/:profileId
 * Get personalized recommendations for a business profile
 * This will eventually connect to iME API to get the profile
 */
router.get('/recommendations/:profileId', async (req, res) => {
  try {
    const { profileId } = req.params;
    const { limit = 10, minScore = 0.5 } = req.query;
    
    // TODO: Fetch business profile from iME API
    // For now, return placeholder response
    res.json({
      success: true,
      data: {
        profileId,
        recommendations: [],
        message: 'iME integration pending - endpoint ready for business profile data'
      },
      metadata: {
        requestedAt: new Date().toISOString(),
        filters: { limit, minScore }
      }
    });
    
  } catch (error) {
    console.error('❌ Error in recommendations:', error);
    res.status(500).json({
      error: 'Failed to get recommendations',
      message: error.message
    });
  }
});

/**
 * POST /api/analyze-single
 * Analyze a single opportunity
 */
router.post('/analyze-single', async (req, res) => {
  try {
    const { opportunity } = req.body;
    
    if (!opportunity) {
      return res.status(400).json({
        error: 'Invalid request: opportunity object required'
      });
    }

    console.log(`🔍 Analyzing single opportunity: ${opportunity.topicCode}`);
    
    const enhancedOpportunity = await analyzer.analyzeOpportunity(opportunity);
    
    res.json({
      success: true,
      data: enhancedOpportunity,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('❌ Error in analyze-single:', error);
    res.status(500).json({
      error: 'Single opportunity analysis failed',
      message: error.message
    });
  }
});

/**
 * POST /api/market-insights
 * Generate market analysis and insights
 */
router.post('/market-insights', async (req, res) => {
  try {
    const { opportunities, timeframe = '12months' } = req.body;
    
    if (!opportunities || !Array.isArray(opportunities)) {
      return res.status(400).json({
        error: 'Invalid request: opportunities array required'
      });
    }

    console.log(`📈 Generating market insights for ${opportunities.length} opportunities`);
    
    // Analyze all opportunities first
    const analysisResults = await analyzer.analyzeOpportunities(opportunities);
    const analyzedOpportunities = analysisResults.successful;
    
    // Generate market insights
    const insights = generateMarketInsights(analyzedOpportunities, timeframe);
    
    res.json({
      success: true,
      data: insights,
      metadata: {
        opportunitiesAnalyzed: analyzedOpportunities.length,
        timeframe,
        generatedAt: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('❌ Error generating market insights:', error);
    res.status(500).json({
      error: 'Market insights generation failed',
      message: error.message
    });
  }
});

/**
 * GET /api/analysis-status
 * Get status and health of analysis services
 */
router.get('/analysis-status', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        services: {
          opportunityAnalyzer: 'operational',
          matchingEngine: 'operational'
        },
        cache: {
          analysisCache: analyzer.analysisCache.size
        },
        version: '1.0.0',
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Status check failed',
      message: error.message
    });
  }
});

/**
 * DELETE /api/clear-cache
 * Clear analysis cache
 */
router.delete('/clear-cache', (req, res) => {
  try {
    analyzer.clearCache();
    
    res.json({
      success: true,
      message: 'Analysis cache cleared',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      error: 'Cache clear failed',
      message: error.message
    });
  }
});

/**
 * Helper function to generate market insights
 */
function generateMarketInsights(opportunities, timeframe) {
  // Technology trend analysis
  const techTrends = {};
  opportunities.forEach(opp => {
    (opp.analysis?.technicalRequirements || []).forEach(tech => {
      techTrends[tech] = (techTrends[tech] || 0) + 1;
    });
  });

  // Agency activity analysis
  const agencyActivity = {};
  opportunities.forEach(opp => {
    const agency = opp.component;
    if (!agencyActivity[agency]) {
      agencyActivity[agency] = { count: 0, totalBudget: 0 };
    }
    agencyActivity[agency].count++;
  });

  // Competition analysis
  const competitionLevels = {
    low: opportunities.filter(opp => opp.analysis?.competitionLevel === 'low').length,
    medium: opportunities.filter(opp => opp.analysis?.competitionLevel === 'medium').length,
    high: opportunities.filter(opp => opp.analysis?.competitionLevel === 'high').length
  };

  // Difficulty distribution
  const difficultyDistribution = {};
  opportunities.forEach(opp => {
    const difficulty = opp.analysis?.difficultyScore || 5;
    const range = Math.floor(difficulty / 2) * 2; // Group into ranges: 0-2, 2-4, 4-6, 6-8, 8-10
    const key = `${range}-${range + 2}`;
    difficultyDistribution[key] = (difficultyDistribution[key] || 0) + 1;
  });

  return {
    summary: {
      totalOpportunities: opportunities.length,
      timeframe,
      analysisDate: new Date().toISOString()
    },
    technologyTrends: {
      topRequirements: Object.entries(techTrends)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([tech, count]) => ({ technology: tech, opportunities: count })),
      emerging: Object.entries(techTrends)
        .filter(([,count]) => count >= 2 && count <= 5)
        .map(([tech, count]) => ({ technology: tech, opportunities: count }))
    },
    agencyActivity: Object.entries(agencyActivity)
      .sort(([,a], [,b]) => b.count - a.count)
      .map(([agency, data]) => ({
        agency,
        opportunities: data.count,
        percentage: ((data.count / opportunities.length) * 100).toFixed(1)
      })),
    competitionAnalysis: {
      distribution: competitionLevels,
      recommendations: {
        lowCompetition: competitionLevels.low,
        mediumCompetition: competitionLevels.medium,
        highCompetition: competitionLevels.high
      }
    },
    difficultyAnalysis: {
      distribution: difficultyDistribution,
      averageDifficulty: (
        opportunities.reduce((sum, opp) => sum + (opp.analysis?.difficultyScore || 5), 0) / 
        opportunities.length
      ).toFixed(1)
    },
    recommendations: [
      'Focus on opportunities with medium competition for best win probability',
      'Consider emerging technology areas for strategic positioning',
      'Target agencies with higher activity levels for more opportunities'
    ]
  };
}

module.exports = router;