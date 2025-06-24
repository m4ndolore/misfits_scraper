
// Airtable Form Configuration Script
// Copy this into your Airtable scripting block

const formConfig = {
  "form_name": "iME Business Profile Questionnaire",
  "form_description": "Help us match you with the best defense contracting opportunities",
  "sections": [
    {
      "section_id": "technical_capabilities",
      "section_title": "Technical Capabilities & Expertise",
      "section_description": "Select all technology areas where your team has expertise",
      "fields": [
        {
          "field_name": "primary_tech_areas",
          "field_label": "What are your PRIMARY technical expertise areas?",
          "field_description": "Select up to 5 core competencies",
          "field_type": "multiple_select",
          "is_required": true,
          "validation": {
            "max_selections": 5
          },
          "options": [
            {
              "value": "ai_ml",
              "label": "Artificial Intelligence / Machine Learning"
            },
            {
              "value": "cybersecurity",
              "label": "Cybersecurity"
            },
            {
              "value": "autonomy",
              "label": "Autonomous Systems"
            },
            {
              "value": "communications",
              "label": "Communications & Networking"
            },
            {
              "value": "sensors",
              "label": "Sensors & Detection"
            },
            {
              "value": "materials",
              "label": "Advanced Materials"
            },
            {
              "value": "energy",
              "label": "Energy & Power Systems"
            },
            {
              "value": "software",
              "label": "Software Engineering"
            },
            {
              "value": "data_analytics",
              "label": "Data Analytics & Visualization"
            },
            {
              "value": "quantum",
              "label": "Quantum Technologies"
            },
            {
              "value": "space",
              "label": "Space Technologies"
            },
            {
              "value": "biotechnology",
              "label": "Biotechnology & Medical"
            },
            {
              "value": "manufacturing",
              "label": "Advanced Manufacturing"
            },
            {
              "value": "modeling_sim",
              "label": "Modeling & Simulation"
            },
            {
              "value": "hypersonics",
              "label": "Hypersonics"
            }
          ]
        },
        {
          "field_name": "secondary_tech_areas",
          "field_label": "What are your SECONDARY technical areas?",
          "field_description": "Additional areas where you have some expertise",
          "field_type": "multiple_select",
          "is_required": true,
          "validation": {},
          "options": [
            {
              "value": "ai_ml",
              "label": "Artificial Intelligence / Machine Learning"
            },
            {
              "value": "cybersecurity",
              "label": "Cybersecurity"
            },
            {
              "value": "autonomy",
              "label": "Autonomous Systems"
            },
            {
              "value": "communications",
              "label": "Communications & Networking"
            },
            {
              "value": "sensors",
              "label": "Sensors & Detection"
            },
            {
              "value": "materials",
              "label": "Advanced Materials"
            },
            {
              "value": "energy",
              "label": "Energy & Power Systems"
            },
            {
              "value": "software",
              "label": "Software Engineering"
            },
            {
              "value": "data_analytics",
              "label": "Data Analytics & Visualization"
            },
            {
              "value": "quantum",
              "label": "Quantum Technologies"
            },
            {
              "value": "space",
              "label": "Space Technologies"
            },
            {
              "value": "biotechnology",
              "label": "Biotechnology & Medical"
            },
            {
              "value": "manufacturing",
              "label": "Advanced Manufacturing"
            },
            {
              "value": "modeling_sim",
              "label": "Modeling & Simulation"
            },
            {
              "value": "hypersonics",
              "label": "Hypersonics"
            }
          ]
        }
      ]
    },
    {
      "section_id": "agency_experience",
      "section_title": "Agency Experience & Past Performance",
      "section_description": "Help us understand your experience with different agencies",
      "fields": [
        {
          "field_name": "agencies_worked_with",
          "field_label": "Which DoD agencies have you worked with?",
          "field_description": "Select all that apply",
          "field_type": "multiple_select",
          "is_required": true,
          "validation": {},
          "options": [
            {
              "value": "army",
              "label": "U.S. Army"
            },
            {
              "value": "navy",
              "label": "U.S. Navy"
            },
            {
              "value": "air_force",
              "label": "U.S. Air Force"
            },
            {
              "value": "space_force",
              "label": "U.S. Space Force"
            },
            {
              "value": "darpa",
              "label": "DARPA"
            },
            {
              "value": "disa",
              "label": "DISA"
            },
            {
              "value": "dla",
              "label": "DLA"
            },
            {
              "value": "mda",
              "label": "MDA"
            },
            {
              "value": "socom",
              "label": "SOCOM"
            },
            {
              "value": "other_dod",
              "label": "Other DoD"
            },
            {
              "value": "nasa",
              "label": "NASA"
            },
            {
              "value": "doe",
              "label": "Department of Energy"
            },
            {
              "value": "dhs",
              "label": "DHS"
            },
            {
              "value": "none",
              "label": "No prior DoD experience"
            }
          ]
        },
        {
          "field_name": "contract_types",
          "field_label": "What types of government contracts have you held?",
          "field_description": "Select all that apply",
          "field_type": "multiple_select",
          "is_required": true,
          "validation": {},
          "options": [
            {
              "value": "sbir_phase1",
              "label": "SBIR Phase I"
            },
            {
              "value": "sbir_phase2",
              "label": "SBIR Phase II"
            },
            {
              "value": "sbir_phase3",
              "label": "SBIR Phase III"
            },
            {
              "value": "sttr",
              "label": "STTR"
            },
            {
              "value": "baa",
              "label": "BAA"
            },
            {
              "value": "other_rd",
              "label": "Other R&D"
            },
            {
              "value": "production",
              "label": "Production Contracts"
            },
            {
              "value": "none",
              "label": "No prior contracts"
            }
          ]
        }
      ]
    },
    {
      "section_id": "business_preferences",
      "section_title": "Business Preferences & Risk Profile",
      "section_description": "Help us match opportunities to your business goals",
      "fields": [
        {
          "field_name": "preferred_contract_size",
          "field_label": "What is your preferred Phase I contract size?",
          "field_description": "",
          "field_type": "single_select",
          "is_required": true,
          "validation": {},
          "options": [
            {
              "value": "under_150k",
              "label": "Under $150K"
            },
            {
              "value": "150k_250k",
              "label": "$150K - $250K"
            },
            {
              "value": "250k_plus",
              "label": "$250K+"
            },
            {
              "value": "any",
              "label": "Any size"
            }
          ]
        },
        {
          "field_name": "risk_tolerance",
          "field_label": "How would you describe your risk tolerance?",
          "field_description": "",
          "field_type": "single_select",
          "is_required": true,
          "validation": {},
          "options": [
            {
              "value": "conservative",
              "label": "Conservative - Prefer well-defined lower-risk opportunities"
            },
            {
              "value": "moderate",
              "label": "Moderate - Balance of risk and reward"
            },
            {
              "value": "aggressive",
              "label": "Aggressive - Willing to tackle high-risk high-reward challenges"
            }
          ]
        },
        {
          "field_name": "timeline_preference",
          "field_label": "What is your preferred project timeline?",
          "field_description": "",
          "field_type": "single_select",
          "is_required": true,
          "validation": {},
          "options": [
            {
              "value": "short",
              "label": "Short-term (< 6 months)"
            },
            {
              "value": "medium",
              "label": "Medium-term (6-12 months)"
            },
            {
              "value": "long",
              "label": "Long-term (12+ months)"
            },
            {
              "value": "flexible",
              "label": "Flexible"
            }
          ]
        }
      ]
    },
    {
      "section_id": "team_capabilities",
      "section_title": "Team & Infrastructure",
      "section_description": "Tell us about your team's capabilities",
      "fields": [
        {
          "field_name": "clearance_level",
          "field_label": "What is the highest security clearance in your team?",
          "field_description": "",
          "field_type": "single_select",
          "is_required": true,
          "validation": {},
          "options": [
            {
              "value": "none",
              "label": "No clearances"
            },
            {
              "value": "public_trust",
              "label": "Public Trust"
            },
            {
              "value": "secret",
              "label": "Secret"
            },
            {
              "value": "top_secret",
              "label": "Top Secret"
            },
            {
              "value": "ts_sci",
              "label": "TS/SCI"
            }
          ]
        },
        {
          "field_name": "facility_clearance",
          "field_label": "Do you have a facility clearance?",
          "field_description": "",
          "field_type": "single_select",
          "is_required": true,
          "validation": {},
          "options": [
            {
              "value": "yes",
              "label": "Yes"
            },
            {
              "value": "in_process",
              "label": "In Process"
            },
            {
              "value": "no",
              "label": "No"
            }
          ]
        },
        {
          "field_name": "certifications",
          "field_label": "Which certifications does your company hold?",
          "field_description": "Select all that apply",
          "field_type": "multiple_select",
          "is_required": true,
          "validation": {},
          "options": [
            {
              "value": "iso9001",
              "label": "ISO 9001"
            },
            {
              "value": "cmmi",
              "label": "CMMI"
            },
            {
              "value": "iso27001",
              "label": "ISO 27001"
            },
            {
              "value": "as9100",
              "label": "AS9100"
            },
            {
              "value": "nist_800_171",
              "label": "NIST 800-171 Compliant"
            },
            {
              "value": "fedramp",
              "label": "FedRAMP"
            },
            {
              "value": "other",
              "label": "Other"
            },
            {
              "value": "none",
              "label": "None"
            }
          ]
        }
      ]
    },
    {
      "section_id": "innovation_profile",
      "section_title": "Innovation & Unique Value",
      "section_description": "What makes your company unique?",
      "fields": [
        {
          "field_name": "innovation_areas",
          "field_label": "What are your key innovation areas?",
          "field_description": "Select up to 3",
          "field_type": "multiple_select",
          "is_required": false,
          "validation": {
            "max_selections": 3
          },
          "options": [
            {
              "value": "novel_algorithms",
              "label": "Novel Algorithms/Methods"
            },
            {
              "value": "proprietary_tech",
              "label": "Proprietary Technology"
            },
            {
              "value": "unique_expertise",
              "label": "Unique Domain Expertise"
            },
            {
              "value": "cost_reduction",
              "label": "Cost Reduction Innovations"
            },
            {
              "value": "speed_efficiency",
              "label": "Speed/Efficiency Improvements"
            },
            {
              "value": "integration",
              "label": "System Integration Excellence"
            },
            {
              "value": "partnerships",
              "label": "Strategic Partnerships"
            }
          ]
        },
        {
          "field_name": "competitive_advantages",
          "field_label": "What are your main competitive advantages?",
          "field_description": "Brief description (optional)",
          "field_type": "long_text",
          "is_required": false,
          "validation": {}
        }
      ]
    }
  ]
};

// Create form fields based on configuration
console.log('Form Configuration Generated:');
console.log('============================');

formConfig.sections.forEach(section => {
    console.log(`\n## ${section.section_title}`);
    console.log(`Description: ${section.section_description}`);
    
    section.fields.forEach((field, index) => {
        console.log(`\n${index + 1}. ${field.field_label}`);
        console.log(`   Field Name: ${field.field_name}`);
        console.log(`   Type: ${field.field_type}`);
        console.log(`   Required: ${field.is_required ? 'Yes' : 'No'}`);
        
        if (field.field_description) {
            console.log(`   Helper Text: "${field.field_description}"`);
        }
        
        if (field.validation.max_selections) {
            console.log(`   Max Selections: ${field.validation.max_selections}`);
        }
        
        if (field.options) {
            console.log(`   Options: ${field.options.length} choices`);
        }
    });
});

// Instructions for manual setup
console.log('\n\nMANUAL SETUP INSTRUCTIONS:');
console.log('==========================');
console.log('1. Create a new table called "Form Responses"');
console.log('2. Add these fields in order:');
console.log('   - Response ID (Autonumber)');
console.log('   - Company Name (Single line text) [Required]');
console.log('   - Email (Email) [Required]');
console.log('   - Submission Date (Created time)');
console.log('');
console.log('3. For each field above, add it with these settings:');
console.log('   - Use the Field Name as the actual field name');
console.log('   - Set the field type as specified');
console.log('   - Add the Helper Text to the field description');
console.log('   - Mark as Required if specified');
console.log('   - For Multiple Select fields with Max Selections, note this for form logic');
console.log('');
console.log('4. Create a Form view and configure conditional logic as needed');
