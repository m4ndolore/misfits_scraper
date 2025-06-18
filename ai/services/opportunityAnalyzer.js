/**
 * Opportunity Analysis Engine
 * AI-powered semantic analysis of DoD SBIR/STTR opportunities
 */

class OpportunityAnalyzer {
  constructor() {
    this.aiProvider = null; // Will be configured based on environment
    this.analysisCache = new Map();
  }

  /**
   * Analyzes a single opportunity to extract key insights
   * @param {Object} opportunity - Raw opportunity data from DoD API
   * @returns {Object} Enhanced opportunity with AI insights
   */
  async analyzeOpportunity(opportunity) {
    const cacheKey = `${opportunity.topicId}-${opportunity.topicCode}`;
    
    // Check cache first
    if (this.analysisCache.has(cacheKey)) {
      return this.analysisCache.get(cacheKey);
    }

    try {
      console.log(`🔍 Analyzing opportunity: ${opportunity.topicCode}`);
      
      // Extract full text for analysis
      const fullText = this.extractAnalysisText(opportunity);
      
      // Perform AI analysis
      const analysis = await this.performAIAnalysis(fullText, opportunity);
      
      // Enhance the opportunity with analysis results
      const enhancedOpportunity = {
        ...opportunity,
        analysis: {
          technicalRequirements: analysis.technicalRequirements,
          keyCapabilities: analysis.keyCapabilities,
          difficultyScore: analysis.difficultyScore,
          competitionLevel: analysis.competitionLevel,
          budgetIndicators: analysis.budgetIndicators,
          timelineFactors: analysis.timelineFactors,
          riskFactors: analysis.riskFactors,
          innovationAreas: analysis.innovationAreas,
          complianceRequirements: analysis.complianceRequirements
        },
        metadata: {
          analyzedAt: new Date().toISOString(),
          analysisVersion: '1.0.0'
        }
      };

      // Cache the result
      this.analysisCache.set(cacheKey, enhancedOpportunity);
      
      console.log(`✅ Analysis complete for ${opportunity.topicCode}`);
      return enhancedOpportunity;

    } catch (error) {
      console.error(`❌ Error analyzing opportunity ${opportunity.topicCode}:`, error);
      
      // Return original opportunity with error marker
      return {
        ...opportunity,
        analysis: {
          error: error.message,
          fallbackData: this.generateFallbackAnalysis(opportunity)
        }
      };
    }
  }

  /**
   * Extracts relevant text content for AI analysis
   */
  extractAnalysisText(opportunity) {
    const textParts = [
      opportunity.topicTitle || '',
      opportunity.objective || '',
      opportunity.description || '',
      opportunity.solicitationTitle || ''
    ];

    // Add Q&A content if available
    if (opportunity.questions && Array.isArray(opportunity.questions)) {
      opportunity.questions.forEach(qa => {
        if (qa.question) textParts.push(qa.question);
        if (qa.answers && Array.isArray(qa.answers)) {
          qa.answers.forEach(answer => {
            if (answer.answer) textParts.push(answer.answer);
          });
        }
      });
    }

    return textParts.filter(text => text && text.trim()).join('\n\n');
  }

  /**
   * Performs AI analysis using LLM
   */
  async performAIAnalysis(fullText, opportunity) {
    const analysisPrompt = this.buildAnalysisPrompt(fullText, opportunity);
    
    // TODO: Integrate with actual AI provider (OpenAI, Anthropic, etc.)
    // For now, use rule-based analysis as placeholder
    return this.ruleBasedAnalysis(fullText, opportunity);
  }

  /**
   * Builds the analysis prompt for LLM
   */
  buildAnalysisPrompt(fullText, opportunity) {
    return `
Analyze this DoD SBIR/STTR opportunity and extract the following information:

OPPORTUNITY DETAILS:
Topic Code: ${opportunity.topicCode}
Agency: ${opportunity.component}
Program: ${opportunity.program}
Status: ${opportunity.topicStatus}

FULL TEXT:
${fullText}

Please provide a JSON response with the following analysis:

{
  "technicalRequirements": ["list of specific technical requirements/capabilities needed"],
  "keyCapabilities": ["core technical capabilities required"],
  "difficultyScore": 1-10, // 1=easy, 10=extremely difficult
  "competitionLevel": "low|medium|high", // expected competition level
  "budgetIndicators": {
    "phase1": "estimated Phase I budget range",
    "phase2": "estimated Phase II budget range",
    "indicators": ["budget-related keywords found"]
  },
  "timelineFactors": ["timeline constraints and milestones"],
  "riskFactors": ["potential risks and challenges"],
  "innovationAreas": ["areas requiring innovation/research"],
  "complianceRequirements": ["security, regulatory, or compliance needs"]
}

Focus on extracting actionable insights that would help a contractor determine if this opportunity matches their capabilities.
`;
  }

  /**
   * Rule-based analysis as fallback/placeholder for AI
   */
  ruleBasedAnalysis(fullText, opportunity) {
    const text = fullText.toLowerCase();
    
    // Technical requirement extraction using keywords
    const technicalKeywords = {
      'artificial intelligence': ['AI', 'machine learning', 'deep learning', 'neural networks'],
      'cybersecurity': ['cyber', 'security', 'encryption', 'authentication', 'firewall'],
      'software development': ['software', 'application', 'programming', 'development'],
      'data analytics': ['data', 'analytics', 'big data', 'visualization', 'database'],
      'cloud computing': ['cloud', 'aws', 'azure', 'distributed computing'],
      'hardware': ['hardware', 'electronics', 'sensors', 'microprocessor'],
      'communications': ['communication', 'radio', 'network', 'protocol'],
      'simulation': ['simulation', 'modeling', 'virtual', 'digital twin']
    };

    const technicalRequirements = [];
    const keyCapabilities = [];

    Object.entries(technicalKeywords).forEach(([category, keywords]) => {
      const found = keywords.some(keyword => text.includes(keyword.toLowerCase()));
      if (found) {
        technicalRequirements.push(category);
        keyCapabilities.push(...keywords.filter(k => text.includes(k.toLowerCase())));
      }
    });

    // Difficulty assessment based on text analysis
    const complexityIndicators = [
      'prototype', 'research', 'novel', 'innovative', 'breakthrough',
      'advanced', 'cutting-edge', 'state-of-the-art', 'experimental'
    ];
    
    const difficultyScore = Math.min(10, 
      3 + complexityIndicators.filter(indicator => text.includes(indicator)).length
    );

    // Competition level based on opportunity characteristics
    let competitionLevel = 'medium';
    if (opportunity.component === 'DARPA') competitionLevel = 'high';
    if (text.includes('commercial') || text.includes('cots')) competitionLevel = 'high';
    if (text.includes('niche') || text.includes('specialized')) competitionLevel = 'low';

    // Extract budget indicators
    const budgetKeywords = ['million', 'budget', 'funding', 'cost', 'price'];
    const budgetIndicators = budgetKeywords.filter(keyword => text.includes(keyword));

    return {
      technicalRequirements,
      keyCapabilities: [...new Set(keyCapabilities)], // Remove duplicates
      difficultyScore,
      competitionLevel,
      budgetIndicators: {
        phase1: 'Not specified',
        phase2: 'Not specified', 
        indicators: budgetIndicators
      },
      timelineFactors: this.extractTimelines(text),
      riskFactors: this.extractRisks(text),
      innovationAreas: technicalRequirements.filter(req => 
        ['artificial intelligence', 'cybersecurity'].includes(req)
      ),
      complianceRequirements: this.extractCompliance(text)
    };
  }

  /**
   * Extract timeline-related information
   */
  extractTimelines(text) {
    const timelineKeywords = [
      'months', 'years', 'deadline', 'milestone', 'schedule',
      'delivery', 'completion', 'duration', 'timeline'
    ];
    
    return timelineKeywords.filter(keyword => text.includes(keyword));
  }

  /**
   * Extract risk factors
   */
  extractRisks(text) {
    const riskKeywords = [
      'classified', 'security clearance', 'itar', 'export control',
      'proprietary', 'intellectual property', 'patent', 'regulatory'
    ];
    
    return riskKeywords.filter(keyword => text.includes(keyword));
  }

  /**
   * Extract compliance requirements
   */
  extractCompliance(text) {
    const complianceKeywords = [
      'security clearance', 'secret', 'top secret', 'itar',
      'export control', 'cmmi', 'iso', 'certification',
      'compliance', 'regulation', 'standard'
    ];
    
    return complianceKeywords.filter(keyword => text.includes(keyword));
  }

  /**
   * Generate fallback analysis when AI fails
   */
  generateFallbackAnalysis(opportunity) {
    return {
      technicalRequirements: ['Analysis failed - manual review required'],
      keyCapabilities: [],
      difficultyScore: 5,
      competitionLevel: 'medium',
      budgetIndicators: { phase1: 'Unknown', phase2: 'Unknown', indicators: [] },
      timelineFactors: [],
      riskFactors: [],
      innovationAreas: [],
      complianceRequirements: []
    };
  }

  /**
   * Batch analyze multiple opportunities
   */
  async analyzeOpportunities(opportunities) {
    console.log(`🔄 Starting batch analysis of ${opportunities.length} opportunities`);
    
    const results = await Promise.allSettled(
      opportunities.map(opp => this.analyzeOpportunity(opp))
    );

    const successful = results
      .filter(result => result.status === 'fulfilled')
      .map(result => result.value);

    const failed = results
      .filter(result => result.status === 'rejected')
      .map(result => result.reason);

    console.log(`✅ Batch analysis complete: ${successful.length} successful, ${failed.length} failed`);
    
    return {
      successful,
      failed,
      summary: {
        total: opportunities.length,
        analyzed: successful.length,
        errors: failed.length
      }
    };
  }

  /**
   * Clear analysis cache
   */
  clearCache() {
    this.analysisCache.clear();
    console.log('🗑️ Analysis cache cleared');
  }
}

module.exports = OpportunityAnalyzer;