"""
Airtable Database Analyzer
Uses Playwright to analyze Airtable structure and extract business profile data schemas
"""

from playwright.sync_api import sync_playwright
import json
import time
import os
from datetime import datetime
import re

class AirtableAnalyzer:
    def __init__(self):
        self.browser = None
        self.page = None
        self.analysis_results = {
            'timestamp': datetime.now().isoformat(),
            'tables': {},
            'fields': {},
            'data_samples': {},
            'recommendations': []
        }
        
    def launch_browser(self, headless=False):
        """Launch Playwright browser"""
        print("🚀 Launching browser for Airtable analysis...")
        
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            headless=headless,
            args=[
                '--no-sandbox',
                '--disable-setuid-sandbox',
                '--disable-dev-shm-usage'
            ]
        )
        
        # Create a new context with a realistic user agent
        context = self.browser.new_context(
            user_agent='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        )
        
        self.page = context.new_page()
        self.page.set_default_timeout(30000)  # 30 second timeout
        
        print("✅ Browser launched successfully")
        
    def navigate_to_airtable(self, airtable_url):
        """Navigate to the Airtable base"""
        print(f"🔍 Navigating to Airtable: {airtable_url}")
        
        try:
            self.page.goto(airtable_url, wait_until='networkidle')
            print("✅ Successfully loaded Airtable")
            
            # Wait a moment for dynamic content to load
            time.sleep(3)
            
            # Check if we need to sign in
            if self.page.url.find('login') != -1 or self.page.locator('text=Sign in').count() > 0:
                print("🔐 Login required - please log in manually")
                input("Press Enter after you've logged in...")
                
            return True
            
        except Exception as e:
            print(f"❌ Failed to navigate to Airtable: {e}")
            return False
    
    def analyze_table_structure(self):
        """Analyze the structure of tables in the Airtable base"""
        print("📊 Analyzing table structure...")
        
        try:
            # Look for table/view names in the sidebar
            table_elements = self.page.locator('[data-testid="table-list"] button, .sidebarTable, [role="button"]:has-text("Table")').all()
            
            print(f"Found {len(table_elements)} potential tables")
            
            # Try to extract table names
            tables = []
            for element in table_elements:
                try:
                    table_name = element.inner_text().strip()
                    if table_name and len(table_name) < 100:  # Reasonable name length
                        tables.append(table_name)
                        print(f"  📋 Table: {table_name}")
                except:
                    continue
            
            # If we can't find tables in sidebar, look for them in the main view
            if not tables:
                print("🔍 Looking for tables in main view...")
                possible_tables = self.page.locator('h1, h2, h3, [role="tab"], .tableTab').all()
                for element in possible_tables:
                    try:
                        text = element.inner_text().strip()
                        if text and len(text) < 50:
                            tables.append(text)
                            print(f"  📋 Found: {text}")
                    except:
                        continue
            
            self.analysis_results['tables'] = {
                'found_tables': tables,
                'count': len(tables)
            }
            
            return tables
            
        except Exception as e:
            print(f"❌ Error analyzing table structure: {e}")
            return []
    
    def analyze_field_structure(self):
        """Analyze field structure and types"""
        print("🔍 Analyzing field structure...")
        
        try:
            # Look for column headers
            field_elements = self.page.locator(
                'th[role="columnheader"], .columnHeader, [data-testid="column-header"], .fieldHeader'
            ).all()
            
            fields = []
            for element in field_elements:
                try:
                    field_name = element.inner_text().strip()
                    if field_name and field_name not in ['', ' ', '\n']:
                        # Try to determine field type
                        field_type = self.detect_field_type(element)
                        fields.append({
                            'name': field_name,
                            'type': field_type,
                            'element_info': element.get_attribute('class') or 'unknown'
                        })
                        print(f"  📝 Field: {field_name} (Type: {field_type})")
                except Exception as field_error:
                    print(f"    ⚠️  Error processing field: {field_error}")
                    continue
            
            # If no fields found via headers, try alternative selectors
            if not fields:
                print("🔍 Trying alternative field detection...")
                alt_elements = self.page.locator('div[role="columnheader"], .cell-header, th').all()
                for element in alt_elements:
                    try:
                        text = element.inner_text().strip()
                        if text:
                            fields.append({
                                'name': text,
                                'type': 'unknown',
                                'element_info': 'alternative_selector'
                            })
                            print(f"  📝 Alt Field: {text}")
                    except:
                        continue
            
            self.analysis_results['fields'] = {
                'found_fields': fields,
                'count': len(fields)
            }
            
            return fields
            
        except Exception as e:
            print(f"❌ Error analyzing field structure: {e}")
            return []
    
    def detect_field_type(self, field_element):
        """Try to detect the type of a field based on its attributes"""
        try:
            # Look for type indicators in classes or attributes
            class_attr = field_element.get_attribute('class') or ''
            data_attrs = field_element.get_attribute('data-testid') or ''
            
            # Common Airtable field type indicators
            if 'text' in class_attr.lower() or 'string' in class_attr.lower():
                return 'text'
            elif 'number' in class_attr.lower() or 'currency' in class_attr.lower():
                return 'number'
            elif 'date' in class_attr.lower():
                return 'date'
            elif 'checkbox' in class_attr.lower() or 'boolean' in class_attr.lower():
                return 'checkbox'
            elif 'select' in class_attr.lower() or 'option' in class_attr.lower():
                return 'select'
            elif 'attachment' in class_attr.lower() or 'file' in class_attr.lower():
                return 'attachment'
            elif 'link' in class_attr.lower() or 'reference' in class_attr.lower():
                return 'linked_record'
            elif 'email' in class_attr.lower():
                return 'email'
            elif 'phone' in class_attr.lower():
                return 'phone'
            elif 'url' in class_attr.lower():
                return 'url'
            else:
                return 'unknown'
                
        except:
            return 'unknown'
    
    def extract_sample_data(self, max_rows=10):
        """Extract sample data from visible rows"""
        print(f"📋 Extracting sample data (max {max_rows} rows)...")
        
        try:
            # Look for data rows
            row_elements = self.page.locator(
                'tr[role="row"], .row, [data-testid="row"], tbody tr'
            ).all()
            
            sample_data = []
            for i, row in enumerate(row_elements[:max_rows]):
                try:
                    # Extract cell data from the row
                    cells = row.locator('td, .cell, [role="gridcell"]').all()
                    row_data = []
                    
                    for cell in cells:
                        try:
                            cell_text = cell.inner_text().strip()
                            row_data.append(cell_text)
                        except:
                            row_data.append('')
                    
                    if row_data and any(row_data):  # Only add non-empty rows
                        sample_data.append(row_data)
                        print(f"  📊 Row {i+1}: {len(row_data)} cells")
                        
                except Exception as row_error:
                    print(f"    ⚠️  Error processing row {i}: {row_error}")
                    continue
            
            self.analysis_results['data_samples'] = {
                'rows_extracted': len(sample_data),
                'sample_data': sample_data[:5],  # Store only first 5 rows
                'total_rows_found': len(row_elements)
            }
            
            return sample_data
            
        except Exception as e:
            print(f"❌ Error extracting sample data: {e}")
            return []
    
    def generate_business_profile_mapping(self, fields):
        """Generate mapping recommendations for business profile fields"""
        print("🎯 Generating business profile mapping recommendations...")
        
        # Our required business profile fields from the schema
        required_fields = {
            'company_name': ['company', 'name', 'business name', 'organization'],
            'company_size': ['size', 'employees', 'company size', 'team size'],
            'cage_code': ['cage', 'cage code', 'registration'],
            'duns': ['duns', 'duns number', 'registration'],
            'security_clearance': ['clearance', 'security', 'classification'],
            'technical_areas': ['technical', 'capabilities', 'skills', 'expertise', 'technology'],
            'certifications': ['certification', 'certified', 'standards', 'iso', 'cmmi'],
            'past_performance': ['performance', 'contracts', 'projects', 'history'],
            'agency_preferences': ['agency', 'preferred', 'government', 'dod'],
            'budget_range': ['budget', 'financial', 'revenue', 'funding'],
            'risk_tolerance': ['risk', 'tolerance', 'comfort'],
            'contact_info': ['contact', 'email', 'phone', 'address']
        }
        
        mappings = []
        
        for field in fields:
            field_name_lower = field['name'].lower()
            
            # Try to match with our required fields
            for profile_field, keywords in required_fields.items():
                for keyword in keywords:
                    if keyword in field_name_lower:
                        mappings.append({
                            'airtable_field': field['name'],
                            'profile_field': profile_field,
                            'confidence': 'high' if keyword == field_name_lower else 'medium',
                            'field_type': field['type']
                        })
                        print(f"  🎯 Mapped: {field['name']} → {profile_field}")
                        break
        
        self.analysis_results['recommendations'] = mappings
        return mappings
    
    def capture_screenshot(self, filename='airtable_analysis.png'):
        """Capture screenshot of current page"""
        try:
            screenshot_path = f"ai/analysis/screenshots/{filename}"
            os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
            
            self.page.screenshot(path=screenshot_path, full_page=True)
            print(f"📸 Screenshot saved: {screenshot_path}")
            return screenshot_path
        except Exception as e:
            print(f"❌ Failed to capture screenshot: {e}")
            return None
    
    def save_analysis_results(self, filename='airtable_analysis.json'):
        """Save analysis results to JSON file"""
        try:
            output_path = f"ai/analysis/results/{filename}"
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            with open(output_path, 'w') as f:
                json.dump(self.analysis_results, f, indent=2)
            
            print(f"💾 Analysis results saved: {output_path}")
            return output_path
        except Exception as e:
            print(f"❌ Failed to save analysis results: {e}")
            return None
    
    def interactive_exploration(self):
        """Allow interactive exploration of the Airtable"""
        print("\n🔍 INTERACTIVE EXPLORATION MODE")
        print("Commands:")
        print("  'click <text>' - Click on element containing text")
        print("  'type <text>' - Type text")
        print("  'screenshot' - Take screenshot")
        print("  'extract' - Extract current view data")
        print("  'quit' - Exit interactive mode")
        print()
        
        while True:
            try:
                command = input("🎮 Enter command: ").strip().lower()
                
                if command == 'quit':
                    break
                elif command == 'screenshot':
                    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
                    self.capture_screenshot(f"interactive_{timestamp}.png")
                elif command == 'extract':
                    fields = self.analyze_field_structure()
                    data = self.extract_sample_data()
                    print(f"Extracted {len(fields)} fields and {len(data)} data rows")
                elif command.startswith('click '):
                    text = command[6:]
                    try:
                        self.page.click(f'text={text}')
                        print(f"✅ Clicked: {text}")
                        time.sleep(2)  # Wait for page to load
                    except Exception as e:
                        print(f"❌ Could not click '{text}': {e}")
                elif command.startswith('type '):
                    text = command[5:]
                    try:
                        self.page.keyboard.type(text)
                        print(f"✅ Typed: {text}")
                    except Exception as e:
                        print(f"❌ Could not type '{text}': {e}")
                else:
                    print("❓ Unknown command")
                    
            except KeyboardInterrupt:
                break
            except Exception as e:
                print(f"❌ Error in interactive mode: {e}")
    
    def close(self):
        """Close browser and cleanup"""
        if self.browser:
            self.browser.close()
        if self.playwright:
            self.playwright.stop()
        print("🔒 Browser closed")

def analyze_airtable(airtable_url, headless=False, interactive=False):
    """Main function to analyze an Airtable base"""
    analyzer = AirtableAnalyzer()
    
    try:
        # Launch browser
        analyzer.launch_browser(headless=headless)
        
        # Navigate to Airtable
        if not analyzer.navigate_to_airtable(airtable_url):
            print("❌ Failed to access Airtable")
            return None
        
        # Analyze structure
        print("\n" + "="*50)
        print("🔍 ANALYZING AIRTABLE STRUCTURE")
        print("="*50)
        
        tables = analyzer.analyze_table_structure()
        fields = analyzer.analyze_field_structure()
        sample_data = analyzer.extract_sample_data()
        mappings = analyzer.generate_business_profile_mapping(fields)
        
        # Take screenshot
        analyzer.capture_screenshot()
        
        # Interactive mode if requested
        if interactive:
            analyzer.interactive_exploration()
        
        # Save results
        results_path = analyzer.save_analysis_results()
        
        # Print summary
        print("\n" + "="*50)
        print("📊 ANALYSIS SUMMARY")
        print("="*50)
        print(f"Tables found: {len(tables)}")
        print(f"Fields found: {len(fields)}")
        print(f"Sample rows: {len(sample_data)}")
        print(f"Profile mappings: {len(mappings)}")
        print(f"Results saved: {results_path}")
        
        if mappings:
            print("\n🎯 TOP FIELD MAPPINGS:")
            for mapping in mappings[:10]:
                confidence_icon = "🟢" if mapping['confidence'] == 'high' else "🟡"
                print(f"  {confidence_icon} {mapping['airtable_field']} → {mapping['profile_field']}")
        
        return analyzer.analysis_results
        
    except Exception as e:
        print(f"❌ Analysis failed: {e}")
        return None
        
    finally:
        analyzer.close()

if __name__ == "__main__":
    import sys
    
    print("🔍 AIRTABLE BUSINESS PROFILE ANALYZER")
    print("=" * 40)
    
    # Get Airtable URL from command line or prompt
    if len(sys.argv) > 1:
        url = sys.argv[1]
    else:
        url = input("Enter Airtable URL: ").strip()
    
    if not url:
        print("❌ No URL provided")
        sys.exit(1)
    
    # Options
    headless = '--headless' in sys.argv
    interactive = '--interactive' in sys.argv
    
    print(f"🎯 Target: {url}")
    print(f"🖥️  Headless: {headless}")
    print(f"🎮 Interactive: {interactive}")
    print()
    
    # Run analysis
    results = analyze_airtable(url, headless=headless, interactive=interactive)
    
    if results:
        print("\n✅ Analysis complete! Check the results file for detailed findings.")
    else:
        print("\n❌ Analysis failed")