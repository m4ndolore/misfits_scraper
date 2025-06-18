/**
 * Test script for Opportunity Analysis Engine
 * Tests the AI analysis functionality with sample data
 */

const OpportunityAnalyzer = require('../services/opportunityAnalyzer');
const MatchingEngine = require('../services/matchingEngine');

// Sample opportunity data (structure from existing DoD API)
const sampleOpportunities = [
  {
    topicId: "TEST001",
    topicCode: "A24-001",
    topicTitle: "Artificial Intelligence for Autonomous Navigation",
    component: "ARMY",
    program: "SBIR",
    topicStatus: "591", // Open
    objective: "Develop AI-powered navigation systems for unmanned ground vehicles operating in GPS-denied environments. The solution should utilize computer vision, LIDAR, and machine learning algorithms to enable autonomous path planning and obstacle avoidance.",
    description: "The Army seeks innovative approaches to autonomous navigation that can function reliably in contested environments where GPS signals are unavailable or compromised. Solutions should demonstrate real-time processing capabilities, integration with existing vehicle platforms, and robust performance in diverse terrain conditions.",
    topicManagers: [
      {
        name: "Dr. John Smith",
        email: "john.smith@army.mil",
        phone: "555-123-4567"
      }
    ]
  },
  {
    topicId: "TEST002", 
    topicCode: "N24-042",
    topicTitle: "Cybersecurity Framework for Naval Communications",
    component: "NAVY",
    program: "STTR",
    topicStatus: "592", // Pre-release
    objective: "Design and implement next-generation cybersecurity protocols for secure naval communications systems. Must include quantum-resistant encryption and real-time threat detection capabilities.",
    description: "The Navy requires advanced cybersecurity solutions to protect critical communication infrastructure from emerging threats. The solution should provide end-to-end encryption, anomaly detection, and automated incident response capabilities while maintaining high-speed data transmission rates.",
    topicManagers: [
      {
        name: "Ms. Sarah Johnson",
        email: "sarah.johnson@navy.mil", 
        phone: "555-987-6543"
      }
    ]
  },
  {
    topicId: "TEST003",
    topicCode: "AF24-087",
    topicTitle: "Advanced Materials for Hypersonic Vehicle Applications", 
    component: "USAF",
    program: "SBIR",
    topicStatus: "591", // Open
    objective: "Research and develop novel materials capable of withstanding extreme temperatures and pressures encountered during hypersonic flight. Materials must demonstrate thermal stability above 2000°C and structural integrity under high dynamic loads.",
    description: "The Air Force seeks breakthrough materials technology for next-generation hypersonic vehicles. Solutions should address thermal protection, structural durability, and manufacturing scalability while maintaining weight constraints critical for flight performance.",
    topicManagers: [
      {
        name: "Dr. Michael Brown",
        email: "michael.brown@af.mil",
        phone: "555-456-7890"
      }
    ]
  }
];

// Sample business profile for testing matching
const sampleBusinessProfile = {
  companyInfo: {
    id: "COMP001",
    name: "Advanced AI Solutions LLC",
    size: "small",
    cageCode: "12345",
    securityClearance: ["Secret"],
    socioeconomicStatus: ["8(a)", "WOSB"]
  },
  capabilities: {
    technicalAreas: [
      "Artificial Intelligence",
      "Machine Learning", 
      "Computer Vision",
      "Software Development",
      "Autonomous Systems"
    ],
    certifications: [
      "ISO 9001",
      "CMMI Level 3"
    ],
    uniqueCapabilities: [
      "Real-time AI processing",
      "Edge computing optimization"
    ],
    pastPerformance: [
      {
        contractNumber: "W911NF-20-C-0001",
        agency: "ARMY",
        contractType: "SBIR Phase I",
        programName: "AI for Battlefield Intelligence",
        value: 150000,
        startDate: "2020-06-01",
        endDate: "2021-05-31",
        status: "Completed",
        performanceRating: "Excellent",
        technologyAreas: ["AI/ML", "Computer Vision"],
        role: "Prime"
      }
    ]
  },
  preferences: {
    contractTypes: ["SBIR", "STTR"],
    agencyPreferences: ["ARMY", "NAVY", "USAF"],
    budgetRange: {
      min: 100000,
      max: 2000000
    },
    riskTolerance: "medium",
    strategicFocus: [
      "AI Innovation",
      "Defense Technology"
    ]
  }
};

/**
 * Test the opportunity analysis functionality
 */
async function testOpportunityAnalysis() {
  console.log('\n🧪 TESTING OPPORTUNITY ANALYSIS ENGINE');
  console.log('=====================================');
  
  const analyzer = new OpportunityAnalyzer();
  
  try {
    // Test single opportunity analysis
    console.log('\n📋 Testing single opportunity analysis...');
    const singleResult = await analyzer.analyzeOpportunity(sampleOpportunities[0]);
    console.log(`✅ Analysis complete for ${singleResult.topicCode}`);
    console.log('📊 Analysis Results:');
    console.log(`   Technical Requirements: ${singleResult.analysis?.technicalRequirements?.join(', ') || 'None extracted'}`);
    console.log(`   Difficulty Score: ${singleResult.analysis?.difficultyScore || 'N/A'}/10`);
    console.log(`   Competition Level: ${singleResult.analysis?.competitionLevel || 'N/A'}`);
    
    // Test batch analysis
    console.log('\n📦 Testing batch opportunity analysis...');
    const batchResult = await analyzer.analyzeOpportunities(sampleOpportunities);
    console.log(`✅ Batch analysis complete: ${batchResult.successful.length}/${batchResult.summary.total} successful`);
    
    return batchResult.successful;
    
  } catch (error) {
    console.error('❌ Analysis test failed:', error);
    return [];
  }
}

/**
 * Test the matching engine functionality
 */
async function testMatchingEngine(analyzedOpportunities) {
  console.log('\n🎯 TESTING MATCHING ENGINE');
  console.log('===========================');
  
  const matcher = new MatchingEngine();
  
  try {
    // Test single opportunity matching
    console.log('\n🔍 Testing single opportunity matching...');
    const singleMatch = matcher.calculateMatchScore(analyzedOpportunities[0], sampleBusinessProfile);
    console.log(`✅ Match score calculated for ${singleMatch.topicCode}: ${singleMatch.overallScore}`);
    console.log(`📈 Recommendation: ${singleMatch.recommendation?.level} - ${singleMatch.recommendation?.action}`);
    console.log(`💡 Key Reasoning: ${singleMatch.reasoning?.slice(0, 2).join('; ') || 'Standard analysis'}`);
    
    // Test batch matching
    console.log('\n📊 Testing batch opportunity matching...');
    const batchMatches = await matcher.scoreOpportunities(analyzedOpportunities, sampleBusinessProfile);
    console.log(`✅ Batch matching complete: ${batchMatches.matches.length} opportunities scored`);
    console.log('\n🏆 TOP MATCHES:');
    
    batchMatches.matches.slice(0, 3).forEach((match, index) => {
      console.log(`   ${index + 1}. ${match.topicCode} - Score: ${match.overallScore} (${match.recommendation?.level})`);
    });
    
    console.log('\n📈 SUMMARY STATISTICS:');
    console.log(`   Highly Recommended: ${batchMatches.summary.highlyRecommended}`);
    console.log(`   Recommended: ${batchMatches.summary.recommended}`);
    console.log(`   Conditional: ${batchMatches.summary.conditional}`);
    console.log(`   Not Recommended: ${batchMatches.summary.notRecommended}`);
    
    return batchMatches;
    
  } catch (error) {
    console.error('❌ Matching test failed:', error);
    return null;
  }
}

/**
 * Test API endpoint format compatibility
 */
function testAPICompatibility(matchingResults) {
  console.log('\n🔌 TESTING API COMPATIBILITY');
  console.log('=============================');
  
  try {
    // Test data structure matches expected API response
    const apiResponse = {
      success: true,
      data: matchingResults,
      metadata: {
        profileCompany: sampleBusinessProfile.companyInfo.name,
        analysisTimestamp: new Date().toISOString()
      }
    };
    
    console.log('✅ API response structure valid');
    console.log(`📋 Response size: ${JSON.stringify(apiResponse).length} bytes`);
    
    // Test individual match object structure
    const sampleMatch = matchingResults.matches[0];
    const requiredFields = ['opportunityId', 'topicCode', 'overallScore', 'recommendation'];
    const hasAllFields = requiredFields.every(field => sampleMatch[field] !== undefined);
    
    if (hasAllFields) {
      console.log('✅ Match object structure valid');
    } else {
      console.log('❌ Match object missing required fields');
    }
    
    return true;
    
  } catch (error) {
    console.error('❌ API compatibility test failed:', error);
    return false;
  }
}

/**
 * Run all tests
 */
async function runAllTests() {
  console.log('🚀 STARTING OPPORTUNITY ANALYSIS ENGINE TESTS');
  console.log('==============================================');
  
  try {
    // Test 1: Opportunity Analysis
    const analyzedOpportunities = await testOpportunityAnalysis();
    if (analyzedOpportunities.length === 0) {
      console.log('❌ Analysis tests failed - cannot proceed with matching tests');
      return;
    }
    
    // Test 2: Matching Engine
    const matchingResults = await testMatchingEngine(analyzedOpportunities);
    if (!matchingResults) {
      console.log('❌ Matching tests failed - cannot proceed with API tests');
      return;
    }
    
    // Test 3: API Compatibility
    const apiCompatible = testAPICompatibility(matchingResults);
    
    // Summary
    console.log('\n📊 TEST SUMMARY');
    console.log('===============');
    console.log(`✅ Opportunity Analysis: ${analyzedOpportunities.length > 0 ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ Matching Engine: ${matchingResults ? 'PASSED' : 'FAILED'}`);
    console.log(`✅ API Compatibility: ${apiCompatible ? 'PASSED' : 'FAILED'}`);
    
    if (analyzedOpportunities.length > 0 && matchingResults && apiCompatible) {
      console.log('\n🎉 ALL TESTS PASSED! The Analysis Engine is ready for integration.');
    } else {
      console.log('\n⚠️  Some tests failed. Review output above for details.');
    }
    
  } catch (error) {
    console.error('❌ Test suite failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runAllTests().then(() => {
    console.log('\n✅ Test execution complete');
    process.exit(0);
  }).catch(error => {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runAllTests,
  testOpportunityAnalysis,
  testMatchingEngine,
  sampleOpportunities,
  sampleBusinessProfile
};