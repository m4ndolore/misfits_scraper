#!/usr/bin/env node
/**
 * Create Airtable Form using API
 * This script creates a complete form setup in Airtable for the iME questionnaire
 */

const fetch = require('node-fetch');
require('dotenv').config();

// Load form configuration
const formConfig = require('./data/airtable_form_config.json');

class AirtableFormCreator {
    constructor() {
        this.apiKey = process.env.AIRTABLE_API_KEY;
        this.baseId = process.env.AIRTABLE_BASE_ID;
        this.headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    /**
     * Create a new table with all form fields
     */
    async createFormTable() {
        console.log('Creating Form Responses table...');
        
        // Build field definitions
        const fields = [
            {
                name: 'Response ID',
                type: 'autoNumber'
            },
            {
                name: 'Company Name',
                type: 'singleLineText'
            },
            {
                name: 'Email',
                type: 'email'
            },
            {
                name: 'Submission Date',
                type: 'dateTime',
                options: {
                    timeZone: 'America/New_York',
                    dateFormat: {
                        name: 'us'
                    }
                }
            }
        ];

        // Add all questionnaire fields
        formConfig.sections.forEach(section => {
            section.fields.forEach(field => {
                const fieldDef = this.createFieldDefinition(field);
                fields.push(fieldDef);
            });
        });

        // Create table
        const createTableUrl = `https://api.airtable.com/v0/meta/bases/${this.baseId}/tables`;
        
        try {
            const response = await fetch(createTableUrl, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify({
                    name: 'Form Responses',
                    fields: fields
                })
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to create table: ${error}`);
            }

            const result = await response.json();
            console.log('✓ Table created successfully');
            return result.id;
        } catch (error) {
            console.error('Error creating table:', error);
            throw error;
        }
    }

    /**
     * Convert field configuration to Airtable field definition
     */
    createFieldDefinition(field) {
        const fieldDef = {
            name: field.field_name,
            description: field.field_description || ''
        };

        switch (field.field_type) {
            case 'single_select':
                fieldDef.type = 'singleSelect';
                fieldDef.options = {
                    choices: field.options.map(opt => ({
                        name: opt.label,
                        color: this.getColorForOption(opt.value)
                    }))
                };
                break;

            case 'multiple_select':
                fieldDef.type = 'multipleSelects';
                fieldDef.options = {
                    choices: field.options.map(opt => ({
                        name: opt.label,
                        color: this.getColorForOption(opt.value)
                    }))
                };
                break;

            case 'long_text':
                fieldDef.type = 'multilineText';
                break;

            default:
                fieldDef.type = 'singleLineText';
        }

        return fieldDef;
    }

    /**
     * Assign colors to options for better visual organization
     */
    getColorForOption(value) {
        const colorMap = {
            // Technical areas - blues/purples
            'ai_ml': 'blueBright',
            'cybersecurity': 'purpleBright',
            'autonomy': 'blueDark',
            'communications': 'cyanBright',
            'sensors': 'tealBright',
            
            // Agencies - greens
            'army': 'greenBright',
            'navy': 'greenDark',
            'air_force': 'greenLight',
            'space_force': 'tealDark',
            
            // Risk levels - yellows/oranges/reds
            'conservative': 'yellowBright',
            'moderate': 'orangeBright',
            'aggressive': 'redBright',
            
            // Default
            'default': 'grayLight'
        };

        return colorMap[value] || colorMap['default'];
    }

    /**
     * Create a form view for the table
     */
    async createFormView(tableId) {
        console.log('Creating form view...');
        
        const viewUrl = `https://api.airtable.com/v0/meta/bases/${this.baseId}/tables/${tableId}/views`;
        
        // Build visible fields list with descriptions
        const visibleFields = ['Company Name', 'Email'];
        formConfig.sections.forEach(section => {
            section.fields.forEach(field => {
                visibleFields.push(field.field_name);
            });
        });

        const viewConfig = {
            name: 'iME Onboarding Form',
            type: 'form',
            metadata: {
                viewSectionConfigs: this.createFormSections()
            }
        };

        try {
            const response = await fetch(viewUrl, {
                method: 'POST',
                headers: this.headers,
                body: JSON.stringify(viewConfig)
            });

            if (!response.ok) {
                const error = await response.text();
                throw new Error(`Failed to create view: ${error}`);
            }

            const result = await response.json();
            console.log('✓ Form view created successfully');
            return result;
        } catch (error) {
            console.error('Error creating form view:', error);
            throw error;
        }
    }

    /**
     * Create form sections configuration
     */
    createFormSections() {
        const sections = [{
            name: 'Company Information',
            fields: ['Company Name', 'Email']
        }];

        formConfig.sections.forEach(section => {
            sections.push({
                name: section.section_title,
                description: section.section_description,
                fields: section.fields.map(f => f.field_name)
            });
        });

        return sections;
    }

    /**
     * Update field properties (required, descriptions, etc)
     */
    async updateFieldProperties(tableId) {
        console.log('Updating field properties...');
        
        // Get current fields
        const tableUrl = `https://api.airtable.com/v0/meta/bases/${this.baseId}/tables/${tableId}`;
        const response = await fetch(tableUrl, { headers: this.headers });
        const table = await response.json();
        
        // Update each field with required status and descriptions
        for (const field of table.fields) {
            const fieldConfig = this.findFieldConfig(field.name);
            if (!fieldConfig) continue;

            if (fieldConfig.is_required || field.name === 'Company Name' || field.name === 'Email') {
                // Note: Airtable API doesn't directly support setting required fields
                // This would need to be done manually or through the form configuration
                console.log(`  - ${field.name}: Mark as required in form settings`);
            }

            if (fieldConfig.validation?.max_selections) {
                console.log(`  - ${field.name}: Set max selections to ${fieldConfig.validation.max_selections}`);
            }
        }
    }

    /**
     * Find field configuration by name
     */
    findFieldConfig(fieldName) {
        for (const section of formConfig.sections) {
            const field = section.fields.find(f => f.field_name === fieldName);
            if (field) return field;
        }
        return null;
    }

    /**
     * Generate a shareable form link
     */
    generateFormLink(viewId) {
        return `https://airtable.com/shr${viewId}`;
    }

    /**
     * Main execution
     */
    async createForm() {
        try {
            console.log('=== Airtable Form Creator ===\n');
            
            // Step 1: Create table
            const tableId = await this.createFormTable();
            
            // Step 2: Create form view
            const view = await this.createFormView(tableId);
            
            // Step 3: Update field properties
            await this.updateFieldProperties(tableId);
            
            // Summary
            console.log('\n=== Setup Complete! ===');
            console.log(`Table ID: ${tableId}`);
            console.log(`View ID: ${view.id}`);
            console.log(`Form URL: ${this.generateFormLink(view.id)}`);
            
            console.log('\n=== Next Steps ===');
            console.log('1. Open Airtable and navigate to your base');
            console.log('2. Find the "Form Responses" table');
            console.log('3. Click on the "iME Onboarding Form" view');
            console.log('4. Configure these form settings:');
            console.log('   - Mark required fields');
            console.log('   - Set up conditional logic');
            console.log('   - Customize form design and branding');
            console.log('   - Configure email notifications');
            console.log('5. Test the form with sample data');
            
            // Save configuration
            const config = {
                tableId,
                viewId: view.id,
                formUrl: this.generateFormLink(view.id),
                createdAt: new Date().toISOString()
            };
            
            const fs = require('fs');
            fs.writeFileSync('data/airtable_form_config_result.json', JSON.stringify(config, null, 2));
            console.log('\nConfiguration saved to: data/airtable_form_config_result.json');
            
        } catch (error) {
            console.error('Failed to create form:', error);
            process.exit(1);
        }
    }
}

// Alternative: Script for Airtable's Scripting Block
function generateAirtableScript() {
    console.log('\n=== Alternative: Airtable Scripting Block Code ===\n');
    
    const script = `
// Airtable Scripting Block Code
// Run this inside your Airtable base

// Create all fields programmatically
const table = base.getTable('Form Responses');

// Field configurations from our form config
const fieldConfigs = ${JSON.stringify(formConfig.sections.flatMap(s => s.fields), null, 2)};

// Create records for testing
const testRecord = {
    'Company Name': 'Test Company Inc.',
    'Email': 'test@example.com'
};

// Add questionnaire responses
fieldConfigs.forEach(field => {
    if (field.field_type === 'single_select' && field.options.length > 0) {
        testRecord[field.field_name] = field.options[0].label;
    } else if (field.field_type === 'multiple_select' && field.options.length > 0) {
        testRecord[field.field_name] = [field.options[0].label];
    } else if (field.field_type === 'long_text') {
        testRecord[field.field_name] = 'Sample text response';
    }
});

// Create test record
await table.createRecordAsync(testRecord);
console.log('Test record created successfully!');
`;

    console.log(script);
}

// Run the script
if (require.main === module) {
    const creator = new AirtableFormCreator();
    
    // Check for required environment variables
    if (!process.env.AIRTABLE_API_KEY || !process.env.AIRTABLE_BASE_ID) {
        console.error('Error: Missing required environment variables');
        console.error('Please set AIRTABLE_API_KEY and AIRTABLE_BASE_ID in your .env file');
        
        // Generate scripting block code as alternative
        generateAirtableScript();
        process.exit(1);
    }
    
    // Create the form
    creator.createForm().catch(console.error);
}

module.exports = AirtableFormCreator;