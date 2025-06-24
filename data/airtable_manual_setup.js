// Airtable Manual Form Setup Script
// This script helps you configure your form manually

// 1. First, create these fields in your table:
const requiredFields = [
    'Company Name (Single line text) - Required',
    'Email (Email) - Required',

    // Technical Capabilities & Expertise
    'primary_tech_areas (Multiple Select) - Required',
    'secondary_tech_areas (Multiple Select) - Required',

    // Agency Experience & Past Performance
    'agencies_worked_with (Multiple Select) - Required',
    'contract_types (Multiple Select) - Required',

    // Business Preferences & Risk Profile
    'preferred_contract_size (Single Select) - Required',
    'risk_tolerance (Single Select) - Required',
    'timeline_preference (Single Select) - Required',

    // Team & Infrastructure
    'clearance_level (Single Select) - Required',
    'facility_clearance (Single Select) - Required',
    'certifications (Multiple Select) - Required',

    // Innovation & Unique Value
    'innovation_areas (Multiple Select) - Optional',
    'competitive_advantages (Long Text) - Optional',
];

// 2. Configure form view settings:
const formSettings = {
    title: 'iME Business Profile Questionnaire',
    description: 'Help us match you with the best defense contracting opportunities',
    submitButtonText: 'Submit Profile',
    redirectUrl: '', // Add your thank you page URL
    coverImage: '', // Add your branding image URL
};

// 3. Field-specific settings:

// Technical Capabilities & Expertise
// primary_tech_areas:
//   - Description: Select up to 5 core competencies
//   - Max selections: 5
//   - Options: 15 choices

// secondary_tech_areas:
//   - Description: Additional areas where you have some expertise
//   - Options: 15 choices


// Agency Experience & Past Performance
// agencies_worked_with:
//   - Description: Select all that apply
//   - Options: 14 choices

// contract_types:
//   - Description: Select all that apply
//   - Options: 8 choices


// Business Preferences & Risk Profile
// preferred_contract_size:
//   - Options: 4 choices

// risk_tolerance:
//   - Options: 3 choices

// timeline_preference:
//   - Options: 4 choices


// Team & Infrastructure
// clearance_level:
//   - Options: 5 choices

// facility_clearance:
//   - Options: 3 choices

// certifications:
//   - Description: Select all that apply
//   - Options: 8 choices


// Innovation & Unique Value
// innovation_areas:
//   - Description: Select up to 3
//   - Max selections: 3
//   - Options: 7 choices

// competitive_advantages:
//   - Description: Brief description (optional)


// 4. After creating all fields:
//    a) Go to Forms view
//    b) Add all fields in the order shown above
//    c) Mark required fields
//    d) Add field descriptions
//    e) Configure conditional logic if needed

output.text('Setup instructions generated! Follow the steps above.');
