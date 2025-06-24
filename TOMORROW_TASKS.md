# Tomorrow's Tasks - December 19, 2024

## 🎯 Quick Reference for Airtable Automation Setup

### 1. Form Creation (First Priority)
- [ ] Open Airtable base "iME Onboarding Questionnaire"
- [ ] Create Form view on Questions table
- [ ] Configure:
  - Section grouping
  - Conditional logic for required fields
  - Max selections (e.g., 5 for primary tech)
  - Clear instructions/hints
- [ ] Test form with dummy data

### 2. Email Automations

#### Welcome Email (Immediate)
- [ ] Create automation: "When record created"
- [ ] Add email action to user
- [ ] Use template from `AIRTABLE_SETUP_GUIDE.md`
- [ ] Test with your email

#### Admin Notification
- [ ] Create automation: "When record created"
- [ ] Add email action to admin
- [ ] Include key profile details
- [ ] Add record link

#### AI Analysis Trigger
- [ ] Create automation: "When all required fields filled"
- [ ] Add webhook action to: `http://localhost:3000/api/analyze-profile`
- [ ] Map profile fields to JSON payload
- [ ] Store response in Airtable fields

#### Insights Email (24-48hr)
- [ ] Create automation: "When AI Analysis Complete = true"
- [ ] Add 24-hour delay
- [ ] Send personalized insights email
- [ ] Include top 5 opportunities

### 3. Testing Checklist
- [ ] Submit test profile through form
- [ ] Verify welcome email received
- [ ] Check admin notification
- [ ] Confirm webhook fires to AI engine
- [ ] Wait for insights email
- [ ] Review stored AI results in Airtable

### 4. API Endpoints to Remember

**Local Testing**:
```
http://localhost:3000/api/analyze-profile
http://localhost:3000/api/match-opportunities
http://localhost:3000/api/market-insights
```

**Required Fields for API**:
- companyInfo (name, type, team size)
- technical_capabilities (primary, secondary)
- agency_experience (agencies, contracts)
- business_preferences (risk, budget, timeline)

### 5. Quick Wins
- Start with just the welcome email
- Test form with 1-2 fields first
- Use Airtable's test webhook feature
- Keep initial automations simple

### 6. Files to Reference
- `/data/airtable_import/AIRTABLE_SETUP_GUIDE.md` - Email templates
- `/data/ime_onboarding_questions.json` - Question structure
- `/test_enhanced_matching.py` - See how scoring works
- `/PROJECT_STATUS.md` - Overall progress

## 💡 Pro Tips
1. Use Airtable's "Run test" feature for each automation
2. Check spam folder for test emails
3. Use console.log in webhook scripts for debugging
4. Keep browser console open when testing form
5. Save automation history for troubleshooting

Good luck! The foundation is solid - just need to wire it all together! 🚀