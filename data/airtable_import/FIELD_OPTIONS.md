# Airtable Field Options - Copy & Paste Ready

## Instructions:
1. Click on each field in Airtable
2. Click "Customize field type"
3. Copy and paste the options below
4. Airtable will automatically create each option when you paste

---

## Primary Technical Areas
**Field type:** Multiple select
**Description:** Select up to 5 core competencies
**Max selections:** 5

**Options (copy all lines below):**
```
Artificial Intelligence / Machine Learning
Cybersecurity
Autonomous Systems
Communications & Networking
Sensors & Detection
Advanced Materials
Energy & Power Systems
Software Engineering
Data Analytics & Visualization
Quantum Technologies
Space Technologies
Biotechnology & Medical
Advanced Manufacturing
Modeling & Simulation
Hypersonics
```

---

## Secondary Technical Areas
**Field type:** Multiple select
**Description:** Additional areas where you have some expertise

**Options (copy all lines below):**
```
Artificial Intelligence / Machine Learning
Cybersecurity
Autonomous Systems
Communications & Networking
Sensors & Detection
Advanced Materials
Energy & Power Systems
Software Engineering
Data Analytics & Visualization
Quantum Technologies
Space Technologies
Biotechnology & Medical
Advanced Manufacturing
Modeling & Simulation
Hypersonics
```

---

## Agencies Worked With
**Field type:** Multiple select
**Description:** Select all that apply

**Options (copy all lines below):**
```
U.S. Army
U.S. Navy
U.S. Air Force
U.S. Space Force
DARPA
DISA
DLA
MDA
SOCOM
Other DoD
NASA
Department of Energy
DHS
No prior DoD experience
```

---

## Contract Types
**Field type:** Multiple select
**Description:** Select all that apply

**Options (copy all lines below):**
```
SBIR Phase I
SBIR Phase II
SBIR Phase III
STTR
BAA
Other R&D
Production Contracts
No prior contracts
```

---

## Preferred Contract Size
**Field type:** Single select

**Options (copy all lines below):**
```
Under $150K
$150K - $250K
$250K+
Any size
```

---

## Risk Tolerance
**Field type:** Single select

**Options (copy all lines below):**
```
Conservative - Prefer well-defined lower-risk opportunities
Moderate - Balance of risk and reward
Aggressive - Willing to tackle high-risk high-reward challenges
```

---

## Timeline Preference
**Field type:** Single select

**Options (copy all lines below):**
```
Short-term (< 6 months)
Medium-term (6-12 months)
Long-term (12+ months)
Flexible
```

---

## Clearance Level
**Field type:** Single select

**Options (copy all lines below):**
```
No clearances
Public Trust
Secret
Top Secret
TS/SCI
```

---

## Facility Clearance
**Field type:** Single select

**Options (copy all lines below):**
```
Yes
In Process
No
```

---

## Certifications
**Field type:** Multiple select
**Description:** Select all that apply

**Options (copy all lines below):**
```
ISO 9001
CMMI
ISO 27001
AS9100
NIST 800-171 Compliant
FedRAMP
Other
None
```

---

## Innovation Areas
**Field type:** Multiple select
**Description:** Select up to 3
**Max selections:** 3

**Options (copy all lines below):**
```
Novel Algorithms/Methods
Proprietary Technology
Unique Domain Expertise
Cost Reduction Innovations
Speed/Efficiency Improvements
System Integration Excellence
Strategic Partnerships
```

---

## Competitive Advantages
**Field type:** Long text
**Description:** Brief description (optional)
**Required:** No

(No options needed - this is a text field)

---

## Quick Setup Script

If you have access to Airtable's scripting app, you can use this script to add all options at once:

```javascript
// Airtable Scripting App - Add All Options
const table = base.getTable('Form Responses');

// Define all options
const fieldOptions = {
    'primary_tech_areas': [
        'Artificial Intelligence / Machine Learning',
        'Cybersecurity',
        'Autonomous Systems',
        'Communications & Networking',
        'Sensors & Detection',
        'Advanced Materials',
        'Energy & Power Systems',
        'Software Engineering',
        'Data Analytics & Visualization',
        'Quantum Technologies',
        'Space Technologies',
        'Biotechnology & Medical',
        'Advanced Manufacturing',
        'Modeling & Simulation',
        'Hypersonics',
    ],
    'secondary_tech_areas': [
        'Artificial Intelligence / Machine Learning',
        'Cybersecurity',
        'Autonomous Systems',
        'Communications & Networking',
        'Sensors & Detection',
        'Advanced Materials',
        'Energy & Power Systems',
        'Software Engineering',
        'Data Analytics & Visualization',
        'Quantum Technologies',
        'Space Technologies',
        'Biotechnology & Medical',
        'Advanced Manufacturing',
        'Modeling & Simulation',
        'Hypersonics',
    ],
    'agencies_worked_with': [
        'U.S. Army',
        'U.S. Navy',
        'U.S. Air Force',
        'U.S. Space Force',
        'DARPA',
        'DISA',
        'DLA',
        'MDA',
        'SOCOM',
        'Other DoD',
        'NASA',
        'Department of Energy',
        'DHS',
        'No prior DoD experience',
    ],
    'contract_types': [
        'SBIR Phase I',
        'SBIR Phase II',
        'SBIR Phase III',
        'STTR',
        'BAA',
        'Other R&D',
        'Production Contracts',
        'No prior contracts',
    ],
    'preferred_contract_size': [
        'Under $150K',
        '$150K - $250K',
        '$250K+',
        'Any size',
    ],
    'risk_tolerance': [
        'Conservative - Prefer well-defined lower-risk opportunities',
        'Moderate - Balance of risk and reward',
        'Aggressive - Willing to tackle high-risk high-reward challenges',
    ],
    'timeline_preference': [
        'Short-term (< 6 months)',
        'Medium-term (6-12 months)',
        'Long-term (12+ months)',
        'Flexible',
    ],
    'clearance_level': [
        'No clearances',
        'Public Trust',
        'Secret',
        'Top Secret',
        'TS/SCI',
    ],
    'facility_clearance': [
        'Yes',
        'In Process',
        'No',
    ],
    'certifications': [
        'ISO 9001',
        'CMMI',
        'ISO 27001',
        'AS9100',
        'NIST 800-171 Compliant',
        'FedRAMP',
        'Other',
        'None',
    ],
    'innovation_areas': [
        'Novel Algorithms/Methods',
        'Proprietary Technology',
        'Unique Domain Expertise',
        'Cost Reduction Innovations',
        'Speed/Efficiency Improvements',
        'System Integration Excellence',
        'Strategic Partnerships',
    ],
};

// Update each field with its options
for (const [fieldName, options] of Object.entries(fieldOptions)) {
    try {
        const field = table.getField(fieldName);
        if (field.type === 'multipleSelects' || field.type === 'singleSelect') {
            await field.updateOptionsAsync({
                choices: options.map(name => ({name}))
            });
            console.log(`✓ Updated ${fieldName} with ${options.length} options`);
        }
    } catch (e) {
        console.error(`✗ Failed to update ${fieldName}:`, e.message);
    }
}

console.log('\nDone! All field options have been added.');
```
