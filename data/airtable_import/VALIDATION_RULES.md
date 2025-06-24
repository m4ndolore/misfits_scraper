
# Validation Rules for Airtable Form

## Required Fields (12 total):
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

## Optional Fields (2 total):
1. innovation_areas
2. competitive_advantages

## Fields with Selection Limits:
- **primary_tech_areas**: Maximum 5 selections
- **innovation_areas**: Maximum 3 selections

## Special Validation:
- **Email**: Must be valid email format
- **Company Name**: Should not be empty

Note: Airtable doesn't enforce max selections natively. You'll need to:
1. Add a note in the field description
2. Use form logic or automation to validate
3. Or use a custom form solution that enforces these limits
