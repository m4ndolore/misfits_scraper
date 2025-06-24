# Airtable Setup Guide for iME Onboarding Questionnaire

## Overview
This guide helps you set up the onboarding questionnaire in Airtable with proper relationships and views.

## Step 1: Create Base
Create a new Airtable base called "iME Onboarding Questionnaire"

## Step 2: Import Tables
Import the following CSV files as separate tables:

### 1. **Sections** Table
- Import: `sections.csv`
- Primary field: `section_id`
- Fields:
  - section_id (Single line text) - Primary
  - section_title (Single line text)
  - section_description (Long text)
  - display_order (Number)
  - is_required (Checkbox)

### 2. **Questions** Table  
- Import: `questions_master.csv`
- Primary field: `question_id`
- Fields:
  - question_id (Single line text) - Primary
  - section_id (Link to Sections table)
  - question_text (Long text)
  - question_hint (Single line text)
  - question_type (Single select: multi_select, single_select, text_input)
  - is_required (Checkbox)
  - max_selections (Number)
  - display_order (Number)
  - ai_factor (Link to AI Scoring Factors)
  - ai_weight (Number with decimal)

### 3. **Question Options** Table
- Import: `question_options.csv`
- Primary field: `option_id`
- Fields:
  - option_id (Single line text) - Primary
  - question_id (Link to Questions table)
  - option_value (Single line text)
  - option_label (Single line text)
  - option_keywords (Long text)
  - display_order (Number)

### 4. **AI Scoring Factors** Table
- Import: `ai_scoring_factors.csv`
- Primary field: `factor_id`
- Fields:
  - factor_id (Single line text) - Primary
  - factor_name (Single line text)
  - factor_description (Long text)
  - total_weight_percentage (Number)

### 5. **User Responses** Table (Create manually)
- Fields:
  - response_id (Autonumber) - Primary
  - company_name (Single line text)
  - question_id (Link to Questions)
  - selected_options (Link to Question Options - Allow multiple)
  - text_response (Long text)
  - created_date (Created time)

## Step 3: Create Relationships

1. **Questions → Sections**: Link `section_id` in Questions to Sections table
2. **Question Options → Questions**: Link `question_id` in Options to Questions table  
3. **Questions → AI Scoring**: Link `ai_factor` in Questions to AI Scoring Factors
4. **User Responses → Questions**: Link responses to questions
5. **User Responses → Options**: Link selected options (multiple allowed)

## Step 4: Create Views

### 1. **Questionnaire Builder View** (Grid)
- Table: Questions
- Group by: section_id
- Sort by: display_order
- Show fields: question_text, question_type, is_required, options count

### 2. **Form Preview View** (Gallery)
- Table: Sections
- Sort by: display_order
- Show: All questions linked to each section

### 3. **Options by Question View** (Grid)
- Table: Question Options
- Group by: question_id
- Sort by: display_order

### 4. **AI Scoring Dashboard** (Grid)
- Table: AI Scoring Factors
- Show: All linked questions and their weights

### 5. **Response Analytics View** (Grid)
- Table: User Responses
- Group by: company_name
- Filters: Created in last 30 days

## Step 5: Create Forms

### Option 1: Airtable Forms
Create a form view for User Responses table with conditional logic

### Option 2: External Form Integration
Use the API to build a custom form that:
1. Fetches sections in order
2. For each section, fetches questions
3. For each question, fetches options
4. Submits responses back to User Responses table

## Step 6: Automation Setup

1. **New Response Trigger**: When a user completes all required sections
2. **Calculate Match Score**: Use formula fields or automation to calculate scores
3. **Send to AI Engine**: Webhook to your matching engine with profile data

## API Integration Example

```javascript
// Fetch questionnaire structure
const getQuestionnaire = async () => {
  const sections = await fetchTable('Sections', { sort: 'display_order' });
  
  for (const section of sections) {
    section.questions = await fetchTable('Questions', {
      filterByFormula: `{section_id} = '${section.id}'`,
      sort: 'display_order'
    });
    
    for (const question of section.questions) {
      question.options = await fetchTable('Question Options', {
        filterByFormula: `{question_id} = '${question.id}'`,
        sort: 'display_order'
      });
    }
  }
  
  return sections;
};
```

## Tips for Success

1. **Use Airtable's Form View** for quick prototyping
2. **Create a "Test Responses" view** to validate data collection
3. **Use Rollup fields** to count responses per question
4. **Add Formula fields** to calculate completion percentage
5. **Set up Views** for different user roles (admin, analyst, user)

## Next Steps

### ✅ Completed (Dec 18, 2024)
1. ✅ Import all CSV files
2. ✅ Set up relationships  
3. ✅ Create base and views

### 📋 To Do (Dec 19, 2024)
1. Create form with conditional logic
2. Set up email automations:
   - Welcome email to users
   - Admin notification email
   - AI insights email (24-48hr delay)
3. Create webhook automation to AI matching engine
4. Test with 5-10 real company profiles

## Email Automation Templates

### 1. Welcome Email (Immediate)
```
Trigger: Form submission
To: {User Email}
Subject: Welcome to iME - Profile Received!

Hi {Company Name},

Thank you for completing your business profile! 

We're now analyzing your capabilities against hundreds of defense opportunities.

Within 24-48 hours, you'll receive:
- Your top matched opportunities
- Personalized insights about your competitive positioning  
- Market trends in your technology areas

Questions? Reply to this email.

Best regards,
The iME Team
```

### 2. Admin Notification
```
Trigger: Form submission
To: Admin email
Subject: New Profile - {Company Name}

New profile submitted:
- Company: {Company Name}
- Type: {Organization Type}
- Team Size: {Team Size}
- Primary Tech: {Primary Tech Areas}
- View Profile: {Airtable Record URL}

Total profiles: {Count of all profiles}
```

### 3. AI Insights Email (24-48hr)
```
Trigger: AI analysis complete
To: {User Email}
Subject: Your Personalized Defense Opportunities - {Company Name}

Hi {Company Name},

Our AI has analyzed your profile and found {Count} relevant opportunities!

🎯 TOP MATCHES:

1. {Opportunity 1 Title}
   - Agency: {Agency}
   - Match Score: {Score}%
   - Why it's a fit: {AI Reasoning}
   - Deadline: {Date}

2. {Opportunity 2 Title}
   ...

📊 MARKET INSIGHTS:
- Your strongest technical alignment: {Top Tech Area}
- Agencies most likely to fund your work: {Top Agencies}
- Competition level in your space: {Low/Medium/High}

View Full Analysis: {Dashboard Link}

Best regards,
The iME Team
```

## Webhook Configuration

```javascript
// Airtable Automation Script
// Trigger: When form record is created with all required fields

const profileData = {
    companyInfo: {
        name: record.get('company_name'),
        // ... map all fields
    },
    responses: {
        technical_capabilities: record.get('primary_tech_areas'),
        // ... map questionnaire responses
    }
};

// Send to AI matching engine
const response = await fetch('http://your-server:3000/api/analyze-profile', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ profile: profileData })
});

const results = await response.json();

// Update record with AI results
await table.updateRecord(record.id, {
    'AI Match Score': results.topScore,
    'Top Opportunities': results.matches.map(m => m.title).join(', '),
    'AI Insights': results.insights,
    'Analysis Complete': true
});
```