# Airtable Form Import Instructions

## Quick Setup Using CSV Import

This method creates your form structure in 5 minutes using Airtable's CSV import feature.

### Step 1: Import the Template CSV

1. Open your Airtable base
2. Click the **"+" button** next to your tables
3. Select **"Import data" → "CSV file"**
4. Upload: `form_responses_template.csv`
5. Name the table: **"Form Responses"**
6. Click **"Create table"**

### Step 2: Configure Field Types

After import, Airtable will guess field types. You need to update these:

1. **Company Name** - Already correct (Single line text)
2. **Email** - Change to "Email" type
3. **primary_tech_areas** - Change to "Multiple select"
4. **secondary_tech_areas** - Change to "Multiple select"
5. **agencies_worked_with** - Change to "Multiple select"
6. **contract_types** - Change to "Multiple select"
7. **preferred_contract_size** - Change to "Single select"
8. **risk_tolerance** - Change to "Single select"
9. **timeline_preference** - Change to "Single select"
10. **clearance_level** - Change to "Single select"
11. **facility_clearance** - Change to "Single select"
12. **certifications** - Change to "Multiple select"
13. **innovation_areas** - Change to "Multiple select"
14. **competitive_advantages** - Change to "Long text"

### Step 3: Add Field Options

For each select field, you'll need to add the complete option list:

#### Primary & Secondary Tech Areas (same options for both):
- Artificial Intelligence / Machine Learning
- Cybersecurity
- Autonomous Systems
- Communications & Networking
- Sensors & Detection
- Advanced Materials
- Energy & Power Systems
- Software Engineering
- Data Analytics & Visualization
- Quantum Technologies
- Space Technologies
- Biotechnology & Medical
- Advanced Manufacturing
- Modeling & Simulation
- Hypersonics

#### Agencies Worked With:
- U.S. Army
- U.S. Navy
- U.S. Air Force
- U.S. Space Force
- DARPA
- DISA
- DLA
- MDA
- SOCOM
- Other DoD
- NASA
- Department of Energy
- DHS
- No prior DoD experience

#### Contract Types:
- SBIR Phase I
- SBIR Phase II
- SBIR Phase III
- STTR
- BAA
- Other R&D
- Production Contracts
- No prior contracts

#### Preferred Contract Size:
- Under $150K
- $150K - $250K
- $250K+
- Any size

#### Risk Tolerance:
- Conservative - Prefer well-defined lower-risk opportunities
- Moderate - Balance of risk and reward
- Aggressive - Willing to tackle high-risk high-reward challenges

#### Timeline Preference:
- Short-term (< 6 months)
- Medium-term (6-12 months)
- Long-term (12+ months)
- Flexible

#### Clearance Level:
- No clearances
- Public Trust
- Secret
- Top Secret
- TS/SCI

#### Facility Clearance:
- Yes
- In Process
- No

#### Certifications:
- ISO 9001
- CMMI
- ISO 27001
- AS9100
- NIST 800-171 Compliant
- FedRAMP
- Other
- None

#### Innovation Areas:
- Novel Algorithms/Methods
- Proprietary Technology
- Unique Domain Expertise
- Cost Reduction Innovations
- Speed/Efficiency Improvements
- System Integration Excellence
- Strategic Partnerships

### Step 4: Create the Form View

1. In your new table, click **"Create..." → "Form"**
2. Name it: **"iME Business Profile Questionnaire"**
3. Click **"Open form"**

### Step 5: Configure Form Settings

1. **Form Header:**
   - Title: "iME Business Profile Questionnaire"
   - Description: "Help us match you with the best defense contracting opportunities"

2. **Field Settings** (for each field):
   - Click the field name
   - Add descriptions:
     - primary_tech_areas: "Select up to 5 core competencies"
     - secondary_tech_areas: "Additional areas where you have some expertise"
     - agencies_worked_with: "Select all that apply"
     - contract_types: "Select all that apply"
     - certifications: "Select all that apply"
     - innovation_areas: "Select up to 3"
     - competitive_advantages: "Brief description (optional)"
   
3. **Required Fields:**
   - Toggle "Required" ON for all fields except:
     - innovation_areas (optional)
     - competitive_advantages (optional)

4. **Field Order:**
   - Drag fields to match this order:
     1. Company Name
     2. Email
     3. primary_tech_areas
     4. secondary_tech_areas
     5. agencies_worked_with
     6. contract_types
     7. preferred_contract_size
     8. risk_tolerance
     9. timeline_preference
     10. clearance_level
     11. facility_clearance
     12. certifications
     13. innovation_areas
     14. competitive_advantages

### Step 6: Advanced Form Configuration

1. **Add Section Headers** (optional):
   - After Email: "Technical Capabilities & Expertise"
   - Before agencies_worked_with: "Agency Experience & Past Performance"
   - Before preferred_contract_size: "Business Preferences & Risk Profile"
   - Before clearance_level: "Team & Infrastructure"
   - Before innovation_areas: "Innovation & Unique Value"

2. **Form Settings:**
   - Submit button text: "Submit Profile"
   - Show "Submit another response" link: No
   - Redirect after submission: Add your thank you page URL

3. **Email Notifications:**
   - Send email to: Your admin email
   - Include all questions and answers: Yes

### Step 7: Test Your Form

1. Click **"Preview"** to test the form
2. Submit a test response
3. Verify all fields work correctly
4. Check that required fields are enforced

### Step 8: Get Your Form Link

1. Click **"Share form"**
2. Copy the public form link
3. Optional: Embed the form on your website using the embed code

## Alternative: Batch Add Options

If you want to add all options at once for each field:

```javascript
// Paste this in Airtable's scripting app after creating the table
const table = base.getTable('Form Responses');

// Update primary_tech_areas field
await table.updateFieldOptionsAsync(
  table.getField('primary_tech_areas'),
  {
    choices: [
      {name: 'Artificial Intelligence / Machine Learning'},
      {name: 'Cybersecurity'},
      // ... add all options
    ]
  }
);
```

## Tips for Success

1. **Delete the sample row** after import (keep it empty)
2. **Test with real data** before sharing publicly
3. **Set up automations** for new submissions
4. **Create filtered views** for different response types
5. **Use form logic** to show/hide fields based on answers

## Next Steps

After form creation:
1. Set up webhook to your AI matching engine
2. Create email automations for submissions
3. Build dashboard views for analytics
4. Test with 5-10 real company profiles