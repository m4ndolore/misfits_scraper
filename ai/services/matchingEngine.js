/**
 * Matching Engine
 * Scores opportunities against business profiles for personalized recommendations
 */

class MatchingEngine {
  constructor() {
    this.weights = {
      technicalAlignment: 0.35,    // How well technical capabilities match
      experienceMatch: 0.25,       // Past performance alignment  
      riskTolerance: 0.15,         // Risk vs company comfort level
      budgetFit: 0.10,             // Budget range compatibility
      strategicValue: 0.10,        // Strategic importance to company
      competitiveAdvantage: 0.05   // Unique positioning advantages
    };
  }

  /**
   * Calculate match score between opportunity and business profile
   * @param {Object} opportunity - Enhanced opportunity with analysis
   * @param {Object} businessProfile - Business profile from iME
   * @returns {Object} Match result with score and reasoning
   */
  calculateMatchScore(opportunity, businessProfile) {
    try {
      console.log(`🎯 Calculating match score for ${opportunity.topicCode}`);

      const scores = {
        technicalAlignment: this.scoreTechnicalAlignment(opportunity, businessProfile),
        experienceMatch: this.scoreExperienceMatch(opportunity, businessProfile),
        riskTolerance: this.scoreRiskTolerance(opportunity, businessProfile),
        budgetFit: this.scoreBudgetFit(opportunity, businessProfile),
        strategicValue: this.scoreStrategicValue(opportunity, businessProfile),
        competitiveAdvantage: this.scoreCompetitiveAdvantage(opportunity, businessProfile)
      };

      // Calculate weighted total score
      const totalScore = Object.entries(scores).reduce((total, [key, score]) => {
        return total + (score * this.weights[key]);
      }, 0);

      const matchResult = {
        opportunityId: opportunity.topicId,
        topicCode: opportunity.topicCode,
        overallScore: Math.round(totalScore * 100) / 100, // Round to 2 decimal places
        scoreBreakdown: scores,
        reasoning: this.generateReasoning(scores, opportunity, businessProfile),
        recommendation: this.generateRecommendation(totalScore, scores),
        riskFactors: this.identifyRiskFactors(opportunity, businessProfile),
        opportunities: this.identifyOpportunities(opportunity, businessProfile),
        calculatedAt: new Date().toISOString()
      };

      console.log(`✅ Match score calculated: ${matchResult.overallScore} for ${opportunity.topicCode}`);
      return matchResult;

    } catch (error) {
      console.error(`❌ Error calculating match score for ${opportunity.topicCode}:`, error);
      return this.generateErrorResult(opportunity, error);
    }
  }

  /**
   * Score technical capability alignment
   */
  scoreTechnicalAlignment(opportunity, businessProfile) {
    const oppRequirements = opportunity.analysis?.technicalRequirements || [];
    const companyCapabilities = businessProfile.capabilities?.technicalAreas || [];
    
    if (oppRequirements.length === 0) return 0.5; // Neutral if no requirements extracted
    
    // Calculate overlap between requirements and capabilities
    const matches = oppRequirements.filter(req => 
      companyCapabilities.some(cap => 
        cap.toLowerCase().includes(req.toLowerCase()) ||
        req.toLowerCase().includes(cap.toLowerCase())
      )
    );

    const alignmentScore = matches.length / oppRequirements.length;
    
    // Bonus for exact matches in key areas
    const keyMatches = matches.filter(match => 
      ['artificial intelligence', 'cybersecurity', 'software development'].includes(match.toLowerCase())
    );
    
    const bonusScore = keyMatches.length * 0.1;
    
    return Math.min(1.0, alignmentScore + bonusScore);
  }

  /**
   * Score based on past performance and experience
   */
  scoreExperienceMatch(opportunity, businessProfile) {
    const pastContracts = businessProfile.capabilities?.pastPerformance || [];
    const oppAgency = opportunity.component;
    const oppProgram = opportunity.program;
    
    let experienceScore = 0.3; // Base score for any company
    
    // Agency experience bonus
    const agencyExperience = pastContracts.filter(contract => 
      contract.agency === oppAgency
    ).length;
    experienceScore += Math.min(0.3, agencyExperience * 0.1);
    
    // Program type experience
    const programExperience = pastContracts.filter(contract =>
      contract.contractType?.includes('SBIR') || contract.contractType?.includes('STTR')
    ).length;
    experienceScore += Math.min(0.2, programExperience * 0.05);
    
    // Similar technology area experience
    const techExperience = pastContracts.filter(contract =>
      opportunity.analysis?.technicalRequirements?.some(req =>
        contract.technologyAreas?.includes(req)
      )
    ).length;
    experienceScore += Math.min(0.2, techExperience * 0.1);
    
    return Math.min(1.0, experienceScore);
  }

  /**
   * Score risk tolerance alignment
   */
  scoreRiskTolerance(opportunity, businessProfile) {
    const companyRiskTolerance = businessProfile.preferences?.riskTolerance || 'medium';
    const oppDifficulty = opportunity.analysis?.difficultyScore || 5;
    const oppRisks = opportunity.analysis?.riskFactors || [];
    
    // Convert difficulty to risk level
    let oppRiskLevel = 'medium';
    if (oppDifficulty <= 3) oppRiskLevel = 'low';
    if (oppDifficulty >= 7) oppRiskLevel = 'high';
    
    // Score based on risk alignment
    const riskMatrix = {
      'low': { 'low': 1.0, 'medium': 0.8, 'high': 0.6 },
      'medium': { 'low': 0.9, 'medium': 1.0, 'high': 0.7 },
      'high': { 'low': 0.6, 'medium': 0.8, 'high': 1.0 }
    };
    
    let riskScore = riskMatrix[companyRiskTolerance][oppRiskLevel];
    
    // Reduce score for specific risk factors the company can't handle
    const problematicRisks = oppRisks.filter(risk => {
      if (risk.includes('security clearance') && !businessProfile.companyInfo?.securityClearance?.length) {
        return true;
      }
      if (risk.includes('itar') && !businessProfile.capabilities?.certifications?.includes('ITAR')) {
        return true;
      }
      return false;
    });
    
    riskScore -= problematicRisks.length * 0.2;
    
    return Math.max(0, Math.min(1.0, riskScore));
  }

  /**
   * Score budget fit
   */
  scoreBudgetFit(opportunity, businessProfile) {
    const companyBudgetRange = businessProfile.preferences?.budgetRange;
    if (!companyBudgetRange) return 0.7; // Default if no budget preferences
    
    // Estimate opportunity budget based on agency and type
    let estimatedBudget = 150000; // Default Phase I SBIR
    
    if (opportunity.component === 'DARPA') estimatedBudget = 200000;
    if (opportunity.program?.includes('STTR')) estimatedBudget = 175000;
    
    // Check if estimated budget fits company range
    if (estimatedBudget >= companyBudgetRange.min && estimatedBudget <= companyBudgetRange.max) {
      return 1.0;
    }
    
    // Partial score if close to range
    const distance = Math.min(
      Math.abs(estimatedBudget - companyBudgetRange.min),
      Math.abs(estimatedBudget - companyBudgetRange.max)
    );
    
    return Math.max(0, 1.0 - (distance / estimatedBudget));
  }

  /**
   * Score strategic value to company
   */
  scoreStrategicValue(opportunity, businessProfile) {
    const companyFocus = businessProfile.preferences?.strategicFocus || [];
    const companyGoals = businessProfile.preferences?.businessGoals || [];
    
    let strategicScore = 0.5; // Base score
    
    // Innovation area alignment
    const innovationAreas = opportunity.analysis?.innovationAreas || [];
    const innovationMatch = innovationAreas.filter(area =>
      companyFocus.some(focus => focus.toLowerCase().includes(area.toLowerCase()))
    ).length;
    
    strategicScore += innovationMatch * 0.2;
    
    // Agency preference alignment
    const preferredAgencies = businessProfile.preferences?.agencyPreferences || [];
    if (preferredAgencies.includes(opportunity.component)) {
      strategicScore += 0.3;
    }
    
    return Math.min(1.0, strategicScore);
  }

  /**
   * Score competitive advantage
   */
  scoreCompetitiveAdvantage(opportunity, businessProfile) {
    const uniqueCapabilities = businessProfile.capabilities?.uniqueCapabilities || [];
    const certifications = businessProfile.capabilities?.certifications || [];
    const companySize = businessProfile.companyInfo?.size;
    
    let advantageScore = 0.4; // Base score
    
    // Small business advantage for SBIR/STTR
    if (companySize === 'small') {
      advantageScore += 0.3;
    }
    
    // Certification advantages
    const relevantCerts = certifications.filter(cert => {
      const oppText = (opportunity.description || '').toLowerCase();
      return oppText.includes(cert.toLowerCase());
    });
    advantageScore += relevantCerts.length * 0.1;
    
    // Unique capability advantages
    const leveragableCapabilities = uniqueCapabilities.filter(cap => {
      const oppRequirements = opportunity.analysis?.technicalRequirements || [];
      return oppRequirements.some(req => req.toLowerCase().includes(cap.toLowerCase()));
    });
    advantageScore += leveragableCapabilities.length * 0.15;
    
    return Math.min(1.0, advantageScore);
  }

  /**
   * Generate human-readable reasoning for the match
   */
  generateReasoning(scores, opportunity, businessProfile) {
    const reasons = [];
    
    if (scores.technicalAlignment > 0.7) {
      reasons.push("Strong technical capability alignment with opportunity requirements");
    } else if (scores.technicalAlignment < 0.3) {
      reasons.push("Limited technical alignment - may require capability development");
    }
    
    if (scores.experienceMatch > 0.6) {
      reasons.push("Good past performance history with similar opportunities");
    }
    
    if (scores.riskTolerance < 0.4) {
      reasons.push("Risk level may be outside company comfort zone");
    }
    
    if (scores.competitiveAdvantage > 0.6) {
      reasons.push("Company has competitive advantages for this opportunity");
    }
    
    return reasons.length > 0 ? reasons : ["Standard match based on available data"];
  }

  /**
   * Generate recommendation based on overall score
   */
  generateRecommendation(totalScore, scores) {
    if (totalScore >= 0.8) {
      return {
        level: "highly_recommended",
        action: "Strongly consider pursuing this opportunity",
        priority: "high"
      };
    } else if (totalScore >= 0.6) {
      return {
        level: "recommended", 
        action: "Good fit - worth detailed evaluation",
        priority: "medium"
      };
    } else if (totalScore >= 0.4) {
      return {
        level: "conditional",
        action: "Consider if strategic or with teaming partners",
        priority: "low"
      };
    } else {
      return {
        level: "not_recommended",
        action: "Low match - focus on better aligned opportunities", 
        priority: "very_low"
      };
    }
  }

  /**
   * Identify specific risk factors
   */
  identifyRiskFactors(opportunity, businessProfile) {
    const risks = [];
    
    const oppRisks = opportunity.analysis?.riskFactors || [];
    const companyCapabilities = businessProfile.capabilities || {};
    
    // Security clearance risks
    if (oppRisks.some(risk => risk.includes('security clearance'))) {
      if (!businessProfile.companyInfo?.securityClearance?.length) {
        risks.push("Requires security clearance - company may need to obtain");
      }
    }
    
    // Competition level risks
    if (opportunity.analysis?.competitionLevel === 'high') {
      risks.push("High competition expected for this opportunity");
    }
    
    // Technical capability gaps
    const techGaps = (opportunity.analysis?.technicalRequirements || []).filter(req =>
      !(companyCapabilities.technicalAreas || []).some(cap =>
        cap.toLowerCase().includes(req.toLowerCase())
      )
    );
    
    if (techGaps.length > 0) {
      risks.push(`Technical capability gaps: ${techGaps.join(', ')}`);
    }
    
    return risks;
  }

  /**
   * Identify specific opportunities/advantages
   */
  identifyOpportunities(opportunity, businessProfile) {
    const opportunities = [];
    
    // Innovation opportunities
    const innovationAreas = opportunity.analysis?.innovationAreas || [];
    if (innovationAreas.length > 0) {
      opportunities.push(`Innovation potential in: ${innovationAreas.join(', ')}`);
    }
    
    // Agency relationship opportunities
    const pastAgencyWork = (businessProfile.capabilities?.pastPerformance || [])
      .filter(contract => contract.agency === opportunity.component).length;
    
    if (pastAgencyWork > 0) {
      opportunities.push(`Leverage existing ${opportunity.component} relationship`);
    }
    
    // Market expansion opportunities
    const newTechAreas = (opportunity.analysis?.technicalRequirements || [])
      .filter(req => !(businessProfile.capabilities?.technicalAreas || []).includes(req));
    
    if (newTechAreas.length > 0 && newTechAreas.length <= 2) {
      opportunities.push(`Opportunity to expand into: ${newTechAreas.join(', ')}`);
    }
    
    return opportunities;
  }

  /**
   * Generate error result when matching fails
   */
  generateErrorResult(opportunity, error) {
    return {
      opportunityId: opportunity.topicId,
      topicCode: opportunity.topicCode,
      overallScore: 0,
      error: error.message,
      recommendation: {
        level: "error",
        action: "Manual review required - matching failed",
        priority: "unknown"
      },
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Batch score multiple opportunities against a business profile
   */
  async scoreOpportunities(opportunities, businessProfile) {
    console.log(`🎯 Scoring ${opportunities.length} opportunities for ${businessProfile.companyInfo?.name || 'company'}`);
    
    const results = opportunities.map(opportunity => 
      this.calculateMatchScore(opportunity, businessProfile)
    );
    
    // Sort by score descending
    results.sort((a, b) => b.overallScore - a.overallScore);
    
    console.log(`✅ Scoring complete. Top score: ${results[0]?.overallScore || 0}`);
    
    return {
      matches: results,
      summary: {
        total: results.length,
        highlyRecommended: results.filter(r => r.overallScore >= 0.8).length,
        recommended: results.filter(r => r.overallScore >= 0.6 && r.overallScore < 0.8).length,
        conditional: results.filter(r => r.overallScore >= 0.4 && r.overallScore < 0.6).length,
        notRecommended: results.filter(r => r.overallScore < 0.4).length
      }
    };
  }
}

module.exports = MatchingEngine;