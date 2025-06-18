/**
 * Business Profile Data Model
 * Defines the structure and requirements for business profile data from iME
 * 
 * This model documents what data we need from the iME API to enable
 * effective opportunity matching and analysis.
 */

/**
 * Complete business profile structure expected from iME
 */
const BusinessProfileSchema = {
  // Company identification and basic info
  companyInfo: {
    id: 'string',              // Unique company identifier
    name: 'string',            // Company legal name
    dbaName: 'string',         // Doing business as name (optional)
    size: 'enum',              // 'small' | 'medium' | 'large'
    employeeCount: 'number',   // Total employees
    yearEstablished: 'number', // Year company was founded
    
    // Registration information
    cageCode: 'string',        // Commercial and Government Entity Code
    duns: 'string',            // DUNS number
    uei: 'string',             // Unique Entity Identifier (SAM.gov)
    
    // Contact information
    headquarters: {
      address: 'string',
      city: 'string',
      state: 'string',
      zipCode: 'string',
      country: 'string'
    },
    
    // Security and certifications
    securityClearance: ['array'], // List of security clearances held by company
    facilityClearance: 'string',  // Facility security clearance level
    
    // Business classifications
    naicsCodes: ['array'],        // NAICS industry classification codes
    socioeconomicStatus: ['array'], // 8(a), HUBZone, WOSB, VOSB, etc.
  },

  // Technical capabilities and expertise
  capabilities: {
    // Core technical areas - CRITICAL for matching
    technicalAreas: ['array'],    // ['AI/ML', 'Cybersecurity', 'Software Development', etc.]
    
    // Industry verticals
    industries: ['array'],        // ['Defense', 'Aerospace', 'Healthcare', etc.]
    
    // Certifications and standards
    certifications: ['array'],    // ['ISO 9001', 'CMMI Level 3', 'ITAR', 'FedRAMP', etc.]
    
    // Technology stack and tools
    technologyStack: {
      programmingLanguages: ['array'], // ['Python', 'Java', 'C++', etc.]
      frameworks: ['array'],           // ['React', 'TensorFlow', '.NET', etc.]
      platforms: ['array'],            // ['AWS', 'Azure', 'Kubernetes', etc.]
      tools: ['array']                 // ['Jenkins', 'Docker', 'JIRA', etc.]
    },
    
    // Research and development capabilities
    rdCapabilities: {
      hasRdDepartment: 'boolean',
      rdEmployeeCount: 'number',
      researchAreas: ['array'],        // Areas of ongoing research
      intellectualProperty: {
        patents: 'number',
        trademarks: 'number',
        copyrights: 'number'
      }
    },
    
    // Manufacturing and production
    manufacturingCapabilities: {
      hasManufacturing: 'boolean',
      facilitySizeSquareFeet: 'number',
      productionCapacity: 'string',
      qualityStandards: ['array']      // ISO, AS9100, etc.
    },
    
    // Unique differentiators - IMPORTANT for competitive advantage
    uniqueCapabilities: ['array'],     // What makes this company special
    
    // Past performance - CRITICAL for experience scoring
    pastPerformance: [{
      contractNumber: 'string',
      agency: 'string',              // 'ARMY', 'NAVY', 'DARPA', etc.
      contractType: 'string',        // 'SBIR Phase I', 'STTR Phase II', 'Prime Contract', etc.
      programName: 'string',
      description: 'string',
      value: 'number',               // Contract value in USD
      startDate: 'date',
      endDate: 'date',
      status: 'string',              // 'Completed', 'In Progress', 'Cancelled'
      performanceRating: 'string',   // 'Excellent', 'Good', 'Satisfactory', etc.
      technologyAreas: ['array'],    // Technologies used in this contract
      role: 'string',                // 'Prime', 'Subcontractor', 'Consultant'
      teamPartners: ['array'],       // Other companies worked with
      successMetrics: {
        onTime: 'boolean',
        onBudget: 'boolean',
        requirementsMet: 'boolean',
        customerSatisfaction: 'number' // 1-10 scale
      }
    }]
  },

  // Business preferences and strategy - CRITICAL for matching
  preferences: {
    // Contract preferences
    contractTypes: ['array'],          // ['SBIR', 'STTR', 'Prime Contract', 'Subcontract']
    preferredContractVehicles: ['array'], // ['GSA Schedule', 'CIO-SP3', 'OASIS', etc.]
    
    // Agency preferences - IMPORTANT for targeting
    agencyPreferences: ['array'],      // ['ARMY', 'NAVY', 'USAF', 'DARPA', etc.]
    avoidAgencies: ['array'],          // Agencies to avoid
    
    // Budget and financial preferences
    budgetRange: {
      min: 'number',                   // Minimum contract value interested in
      max: 'number',                   // Maximum contract value can handle
      preferredRange: {
        min: 'number',
        max: 'number'
      }
    },
    
    // Geographic preferences
    geographicFocus: ['array'],        // States/regions of interest
    internationalCapability: 'boolean',
    
    // Risk and strategy preferences
    riskTolerance: 'enum',             // 'low' | 'medium' | 'high'
    innovationFocus: 'enum',           // 'cutting_edge' | 'proven_technology' | 'mixed'
    growthStrategy: 'enum',            // 'aggressive' | 'steady' | 'conservative'
    
    // Strategic focus areas - IMPORTANT for strategic scoring
    strategicFocus: ['array'],         // ['AI Innovation', 'Cybersecurity Leadership', etc.]
    businessGoals: ['array'],          // ['Market Expansion', 'Technology Development', etc.]
    
    // Timeline preferences
    timelinePreferences: {
      shortTerm: 'boolean',            // Interested in quick-start opportunities
      longTerm: 'boolean',             // Interested in multi-year programs
      preferredDuration: {
        min: 'number',                 // Minimum months
        max: 'number'                  // Maximum months
      }
    }
  },

  // Team and personnel information
  teamInfo: {
    keyPersonnel: [{
      name: 'string',
      role: 'string',                  // 'Principal Investigator', 'Technical Lead', etc.
      education: ['array'],            // Degrees and institutions
      experience: 'string',            // Years of relevant experience
      securityClearance: 'string',     // Individual clearance level
      expertise: ['array'],            // Technical expertise areas
      pastRoles: [{
        project: 'string',
        role: 'string',
        agency: 'string'
      }]
    }],
    
    availableCapacity: {
      fullTimeEquivalents: 'number',   // Available FTEs for new work
      specialistAreas: ['array'],      // Areas where specialists are available
      canHireAdditional: 'boolean'     // Can hire additional staff if needed
    }
  },

  // Financial information
  financialInfo: {
    annualRevenue: 'number',
    governmentRevenuePercentage: 'number', // What % of revenue is from gov contracts
    cashFlow: {
      sufficient: 'boolean',           // Can handle contract cash flow delays
      bondingCapacity: 'number'        // Maximum bondable contract value
    }
  },

  // Metadata
  metadata: {
    profileLastUpdated: 'date',
    dataVersion: 'string',
    completenessScore: 'number',       // 0-100% how complete the profile is
    verificationStatus: 'string'       // 'Verified', 'Pending', 'Unverified'
  }
};

/**
 * PRIORITY DATA REQUIREMENTS FOR iME API
 * 
 * These are the minimum required fields needed for basic opportunity matching.
 * iME should prioritize collecting this data first.
 */
const MinimumRequiredFields = {
  CRITICAL: [
    'companyInfo.name',
    'companyInfo.size',
    'capabilities.technicalAreas',
    'capabilities.pastPerformance',
    'preferences.contractTypes',
    'preferences.agencyPreferences',
    'preferences.budgetRange'
  ],
  
  HIGH_PRIORITY: [
    'companyInfo.securityClearance',
    'capabilities.certifications',
    'capabilities.uniqueCapabilities',
    'preferences.riskTolerance',
    'preferences.strategicFocus',
    'teamInfo.keyPersonnel'
  ],
  
  MEDIUM_PRIORITY: [
    'companyInfo.cageCode',
    'companyInfo.naicsCodes',
    'capabilities.technologyStack',
    'preferences.geographicFocus',
    'financialInfo.annualRevenue'
  ]
};

/**
 * Sample API endpoints that iME should provide
 */
const RequiredAPIEndpoints = {
  // Get single business profile
  GET_PROFILE: 'GET /api/business-profiles/:id',
  
  // Get multiple profiles (for admin/analysis)
  GET_PROFILES: 'GET /api/business-profiles',
  
  // Search profiles by criteria
  SEARCH_PROFILES: 'POST /api/business-profiles/search',
  
  // Get profile capabilities summary
  GET_CAPABILITIES: 'GET /api/business-profiles/:id/capabilities',
  
  // Get past performance summary
  GET_PAST_PERFORMANCE: 'GET /api/business-profiles/:id/past-performance'
};

/**
 * Data validation rules for iME to implement
 */
const ValidationRules = {
  technicalAreas: {
    standardizedList: true,
    description: 'Should use standardized taxonomy of technical areas'
  },
  
  agencyPreferences: {
    validValues: ['ARMY', 'NAVY', 'USAF', 'DARPA', 'DLA', 'DHA', 'MDA', 'SOCOM', 'OSD'],
    description: 'Must use standard DoD component codes'
  },
  
  contractTypes: {
    validValues: ['SBIR Phase I', 'SBIR Phase II', 'STTR Phase I', 'STTR Phase II', 'Prime Contract', 'Subcontract'],
    description: 'Standardized contract type classifications'
  },
  
  riskTolerance: {
    validValues: ['low', 'medium', 'high'],
    description: 'Company risk tolerance level'
  }
};

module.exports = {
  BusinessProfileSchema,
  MinimumRequiredFields,
  RequiredAPIEndpoints,
  ValidationRules
};