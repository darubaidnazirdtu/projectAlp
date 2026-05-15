/**
 * Form Testing Script
 * 
 * This script automatically tests all add page forms by:
 * 1. Logging into the application
 * 2. Navigating to each add page
 * 3. Filling forms with random test data
 * 4. Submitting the forms
 * 5. Verifying data appears in the corresponding table pages
 */

import puppeteer from 'puppeteer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// LOGGING SETUP - Writes to both console and file
// ============================================================================

const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
const logFilePath = path.join(__dirname, `test-forms-log-${timestamp}.txt`);
const logStream = fs.createWriteStream(logFilePath, { flags: 'a' });

// Override console.log to also write to file
const originalLog = console.log.bind(console);
const originalError = console.error.bind(console);

console.log = (...args) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    originalLog(...args);
    logStream.write(message + '\n');
};

console.error = (...args) => {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    originalError(...args);
    logStream.write('[ERROR] ' + message + '\n');
};

console.log(`\n[LOG] Output is being saved to: ${logFilePath}\n`);

// ============================================================================
// CONFIGURATION
// ============================================================================

const CONFIG = {
    BASE_URL: 'http://localhost:5173',
    LOGIN_EMAIL: 'iqachead@dtu.ac.in ',
    LOGIN_PASSWORD: '12345',
    LOGIN_ROLE: 'IQAC_HEAD',
    HEADLESS: true,
    SLOW_MO: 10,
    TIMEOUT: 60000,
    // Add resources here to test specifically, or leave empty to test all
    RESOURCES_TO_TEST: 'all',
    DUMMY_PDF_PATH: 'C:\\Users\\tanej\\OneDrive\\Desktop\\WEBD\\IQAC\\project\\backend\\public\\temp\\dummy.pdf'
};
console.log("h")

// List of all resource IDs from tableConfig.js
const ALL_RESOURCES = [
    'books_chapters_published',
    'capability_enhancement_schemes',
    'collaborative_activities',
    'collaborative_research_exchanges',
    'conference_research_papers',
    'courses',
    'departments',
    'dept_library_books',
    'dept_professional_schemes',
    'developed_e_contents',
    'extension_outreach_activities',
    'faculty',
    'faculty_development_programs',
    'faculty_visits',
    'financial_support_events',
    'functional_mous',
    'it_infrastructure_stock_items',
    'journal_research_papers',
    'mentor_stress_support_sessions',
    'patents',
    'phd_defences',
    'professional_affiliations',
    'professional_staff_trainings',
    'programmes',
    'programmes_with_field_research',
    'research_funding_grants',
    'research_innovation_awards',
    'revenue_from_consultancies',
    'revenue_from_corporate_trainings',
    'staff_trainings',
    'student_centric_methods',
    'student_financial_support_events',
    'student_performance_activities',
    'students',
    'students_competitive_exams',
    'students_higher_education_placements',
    'teachers_using_ict'
];

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

// Custom delay function (page.waitForTimeout is deprecated in newer Puppeteer)
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ============================================================================
// RANDOM DATA GENERATORS
// ============================================================================

const randomString = (length = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result.charAt(0).toUpperCase() + result.slice(1);
};

const randomNumber = (min = 1, max = 100) => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
};

const randomYear = () => {
    return randomNumber(2023, 2026);
};

const randomDate = () => {
    const year = randomNumber(2022, 2026);
    const month = String(randomNumber(1, 12)).padStart(2, '0');
    const day = String(randomNumber(1, 28)).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const randomBoolean = () => Math.random() > 0.5;

const randomFromArray = (arr) => {
    if (!arr || arr.length === 0) return null;
    return arr[Math.floor(Math.random() * arr.length)];
};

/**
 * Normalize a date string to a comparable format
 * Handles both YYYY-MM-DD and MM/DD/YYYY formats
 */
const normalizeDateForComparison = (dateStr) => {
    if (!dateStr) return null;

    // Try to match YYYY-MM-DD format
    const isoMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
    if (isoMatch) {
        const [, year, month, day] = isoMatch;
        return { year: parseInt(year), month: parseInt(month), day: parseInt(day) };
    }

    // Try to match MM/DD/YYYY format
    const usMatch = dateStr.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
    if (usMatch) {
        const [, month, day, year] = usMatch;
        return { year: parseInt(year), month: parseInt(month), day: parseInt(day) };
    }

    return null;
};

/**
 * Check if two date strings represent the same date
 */
const datesAreEqual = (date1, date2) => {
    const d1 = normalizeDateForComparison(date1);
    const d2 = normalizeDateForComparison(date2);

    if (!d1 || !d2) return false;

    return d1.year === d2.year && d1.month === d2.month && d1.day === d2.day;
};

/**
 * Check if a value is a date string
 */
const isDateString = (value) => {
    if (!value || typeof value !== 'string') return false;
    return /^\d{4}-\d{1,2}-\d{1,2}$/.test(value);
};

const randomEmail = () => {
    return `${randomString(8).toLowerCase()}@test.edu`;
};

const randomPhone = () => {
    return `98${randomNumber(10000000, 99999999)}`;
};

const randomPan = () => {
    // Format: 5 letters, 4 digits, 1 letter (e.g., ABCDE1234F)
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) result += letters.charAt(Math.floor(Math.random() * letters.length));
    for (let i = 0; i < 4; i++) result += digits.charAt(Math.floor(Math.random() * digits.length));
    result += letters.charAt(Math.floor(Math.random() * letters.length));
    return result;
};

// ============================================================================
// FORM FIELD DETECTION AND FILLING
// ============================================================================

/**
 * Detects field type based on input element attributes and label
 */
async function detectFieldType(page, inputElement) {
    const tagName = await inputElement.evaluate(el => el.tagName.toLowerCase());
    const inputType = await inputElement.evaluate(el => el.type || '');
    const name = await inputElement.evaluate(el => el.name || '');

    if (tagName === 'select') return 'select';
    if (inputType === 'checkbox') return 'checkbox';
    if (inputType === 'file') return 'file';
    if (inputType === 'date') return 'date';
    if (inputType === 'number') return 'number';
    if (inputType === 'email') return 'email';
    if (inputType === 'url') return 'url';
    if (tagName === 'textarea') return 'textarea';

    // Check name for hints
    const nameLower = name.toLowerCase();
    if (nameLower.includes('email')) return 'email';
    if (nameLower.includes('department')) return 'department_id';
    if (nameLower.includes('faculty')) return 'faculty_id';
    if (nameLower.includes('student')) return 'student_id';
    if (nameLower.includes('course')) return 'course_id';
    if (nameLower.includes('programme')) return 'programme_id';
    if (nameLower.includes('email')) return 'email';
    if (nameLower.includes('phone')) return 'phone';
    if (nameLower.includes('year') || nameLower === 'ay') return 'year';
    if (nameLower.includes('supervisor')) return 'faculty_id';

    return 'text';
}

/**
 * Generates appropriate random value based on field type
 */
function generateValueForField(fieldType, fieldName, resourceId) {
    const nameLower = (fieldName || '').toLowerCase();

    // NOTE: Entity ID fields (department_id, faculty_id, student_id, etc.) are now
    // handled by react-select dropdowns in fillReactSelect(), not here.

    switch (fieldType) {
        case 'number':
            if (nameLower.includes('year')) return String(randomYear());
            if (nameLower.includes('amount') || nameLower.includes('fund')) return String(randomNumber(10000, 500000));
            if (nameLower.includes('duration')) return String(randomNumber(1, 30));
            if (nameLower.includes('credits')) return String(randomNumber(1, 6));
            if (nameLower.includes('semester')) return String(randomNumber(1, 8));
            if (nameLower.includes('participant') || nameLower.includes('enrolled') || nameLower.includes('copies')) {
                return String(randomNumber(10, 100));
            }
            return String(randomNumber(1, 100));

        case 'date':
            return randomDate();

        case 'year':
            if (nameLower.includes('academic') || nameLower === 'ay') return "2026-27";
            return String(randomYear());

        case 'email':
            return randomEmail();

        case 'phone':
            return randomPhone();

        case 'url':
            return `https://example.com/${randomString(8).toLowerCase()}`;

        case 'textarea':
            return `Test ${randomString(5)}: ${randomString(15)} ${randomString(10)} ${randomString(12)}.`;

        case 'text':
        default:
            // Generate appropriate text based on field name
            if (nameLower.includes('pan') || nameLower.includes('pancard')) {
                return randomPan();
            }
            if (nameLower.includes('title') || nameLower.includes('name')) {
                return `Test ${randomString(8)} ${randomString(6)}`;
            }
            if (nameLower.includes('isbn')) {
                return `978-${randomNumber(1000000000, 9999999999)}`;
            }
            if (nameLower.includes('doi')) {
                return `10.${randomNumber(1000, 9999)}/${randomString(8)}`;
            }
            if (nameLower.includes('venue') || nameLower.includes('location')) {
                return `${randomString(6)} Hall, ${randomString(8)} University`;
            }
            return `Test_${randomString(6)}`;
    }
}

/**
 * Fills a single form field
 */
async function fillField(page, inputElement, fieldType, fieldName, resourceId) {
    const tagName = await inputElement.evaluate(el => el.tagName.toLowerCase());

    if (tagName === 'select') {
        // Get available options
        const options = await inputElement.evaluate(el => {
            const opts = Array.from(el.options);
            return opts.filter(o => o.value).map(o => o.value);
        });

        if (options.length > 0) {
            const value = randomFromArray(options);
            await inputElement.select(value);
            await inputElement.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })));
            return value;
        }
        return null;
    }

    if (fieldType === 'checkbox') {
        if (randomBoolean()) {
            await inputElement.click();
        }
        return await inputElement.evaluate(el => el.checked);
    }

    if (fieldType === 'file') {
        try {
            await inputElement.uploadFile(CONFIG.DUMMY_PDF_PATH);
            await delay(500);
            return 'dummy.pdf';
        } catch (e) {
            console.log(`    [SKIP] File upload skipped: ${e.message}`);
            return null;
        }
    }

    // Text-like inputs
    const value = generateValueForField(fieldType, fieldName, resourceId);

    // For date inputs, set value directly instead of typing (avoids format issues)
    if (fieldType === 'date') {
        // Date inputs expect YYYY-MM-DD format when setting value programmatically
        // Use native value setter to work with React controlled components
        await inputElement.evaluate((el, val) => {
            // Get the native input value setter
            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
            nativeInputValueSetter.call(el, val);
            // Trigger input event that React's synthetic event system will pick up
            const inputEvent = new Event('input', { bubbles: true });
            el.dispatchEvent(inputEvent);
        }, value);
        return value;
    }

    // Clear existing value
    await inputElement.click({ clickCount: 3 });
    await inputElement.type(value, { delay: 10 });
    await inputElement.evaluate(el => el.dispatchEvent(new Event('change', { bubbles: true })));
    await inputElement.evaluate(el => el.dispatchEvent(new Event('blur', { bubbles: true })));

    return value;
}

// ============================================================================
// REACT-SELECT HANDLING
// ============================================================================

/**
 * Fills a react-select dropdown by clicking to open and selecting an option.
 * Returns the selected value or null if failed.
 */
async function fillReactSelect(page, container, fieldName) {
    try {
        const nameLower = fieldName.toLowerCase();
        const isFacultyField = nameLower.includes('faculty') || nameLower.includes('supervisor') || nameLower.includes('officer');

        // Click on the react-select control to open the dropdown
        const control = await container.$('[class*="control"]');
        if (!control) {
            console.log(`    [SKIP] React-select control not found for ${fieldName}`);
            return null;
        }

        await control.click();
        await delay(300); // Wait for dropdown to open

        // If it's a faculty field, try to type "FAC_PAWAN" to filter
        if (isFacultyField) {
            const input = await container.$('input');
            if (input) {
                await input.type('FAC_PAWAN', { delay: 50 });
                await delay(1000); // Wait for search results
            }
        }

        // Wait for the menu to appear with explicit selector
        try {
            await page.waitForSelector('[class*="menu"]', { timeout: 3000 });
        } catch (e) {
            console.log(`    [SKIP] React-select menu didn't open for ${fieldName}`);
            return null;
        }

        // Give extra time for async options to load (API calls)
        await delay(1500);

        // Try multiple selector strategies for react-select options
        const optionSelectors = [
            '[class*="menu"] [class*="option"]',
            '[class*="menuList"] > div',
            '[id*="react-select"][id*="option"]',
            '[class*="-option"]'
        ];

        let options = [];
        for (const selector of optionSelectors) {
            options = await page.$$(selector);
            if (options.length > 0) break;
        }

        if (options.length > 0) {
            // If it's a faculty field, try to find "FAC_PAWAN" in the options
            if (isFacultyField) {
                for (const option of options) {
                    const text = await option.evaluate(el => el.textContent || '');
                    if (text.includes('FAC_PAWAN')) {
                        await option.click();
                        await delay(300);
                        return 'FAC_PAWAN';
                    }
                }
            }

            // Fallback: select the first real option
            for (const option of options) {
                const text = await option.evaluate(el => el.textContent || '');
                const textLower = text.toLowerCase();
                if (!textLower.includes('no options') &&
                    !textLower.includes('no matches') &&
                    !textLower.includes('loading') &&
                    text.trim().length > 0) {
                    await option.click();
                    await delay(300);

                    // Get the selected value from the hidden input or displayed text
                    const selectedValue = await container.evaluate(el => {
                        const singleValue = el.querySelector('[class*="singleValue"]');
                        return singleValue ? singleValue.textContent : null;
                    });

                    // Extract just the ID portion (before " - ") for table verification
                    const fullValue = selectedValue || text;
                    const idPortion = fullValue.includes(' - ') ? fullValue.split(' - ')[0].trim() : fullValue.trim();
                    return idPortion;
                }
            }
        }

        // If no options found, press Escape to close the dropdown
        await page.keyboard.press('Escape');
        console.log(`    [SKIP] No valid options available for react-select ${fieldName}`);
        return null;
    } catch (e) {
        console.log(`    [ERROR] Failed to fill react-select ${fieldName}: ${e.message}`);
        return null;
    }
}

/**
 * Finds all react-select containers in the form and returns them with their field info.
 */
async function findReactSelectContainers(page) {
    // React-select containers have a specific class pattern
    const containers = await page.$$('[class*="css-"][class*="-container"]');
    const validContainers = [];

    for (const container of containers) {
        // Check if this is actually a react-select by looking for the control
        const hasControl = await container.$('[class*="control"]');
        if (hasControl) {
            // Try to determine the field name by looking at nearby labels and data attributes
            const fieldName = await container.evaluate(el => {
                // First check if the container itself has aria-label or data attributes
                if (el.getAttribute('aria-label')) {
                    return el.getAttribute('aria-label');
                }

                // Look for label in the immediate parent
                let parent = el.parentElement;
                while (parent && parent.tagName !== 'FORM') {
                    // Check for label as direct child
                    const label = parent.querySelector(':scope > label');
                    if (label && label.textContent.trim()) {
                        return label.textContent.replace('*', '').trim();
                    }

                    // Check if we're inside an ObjectListField - look for column headers
                    const objectList = parent.closest('.border.border-gray-200');
                    if (objectList) {
                        // Find the header row and match column position
                        const headerRow = objectList.querySelector('.md\\:grid.gap-4.mb-2');
                        if (headerRow) {
                            const headers = headerRow.querySelectorAll('div');
                            // Find our position in the data row
                            const dataRow = el.closest('[class*="grid"]');
                            if (dataRow) {
                                const cells = dataRow.querySelectorAll(':scope > div');
                                for (let i = 0; i < cells.length; i++) {
                                    if (cells[i].contains(el) && headers[i]) {
                                        return headers[i].textContent.replace('*', '').trim();
                                    }
                                }
                            }
                        }
                    }

                    parent = parent.parentElement;
                }

                // Check previous sibling
                const prevSibling = el.previousElementSibling;
                if (prevSibling && prevSibling.tagName === 'LABEL') {
                    return prevSibling.textContent.replace('*', '').trim();
                }

                return 'unknown';
            });

            validContainers.push({ container, fieldName });
        }
    }

    return validContainers;
}

// ============================================================================
// MAIN TEST FUNCTIONS
// ============================================================================

/**
 * Login to the application
 */
async function login(page) {
    console.log('\n[LOGIN] Navigating to login page...');
    await page.goto(`${CONFIG.BASE_URL}/login`, { waitUntil: 'networkidle0' });

    // Fill email
    const emailInput = await page.$('input[name="email"]');
    if (emailInput) {
        await emailInput.click({ clickCount: 3 });
        await emailInput.type(CONFIG.LOGIN_EMAIL, { delay: 20 });
    }

    // Select role
    const roleSelect = await page.$('select[name="role"]');
    if (roleSelect) {
        await roleSelect.select(CONFIG.LOGIN_ROLE);
    }

    // Fill password
    const passwordInput = await page.$('input[name="password"]');
    if (passwordInput) {
        await passwordInput.click({ clickCount: 3 });
        await passwordInput.type(CONFIG.LOGIN_PASSWORD, { delay: 20 });
    }

    // Submit
    await page.click('button[type="submit"]');

    // Wait for navigation or success
    try {
        await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 10000 });
    } catch (e) {
        // May already be on the app page
    }

    const currentUrl = page.url();
    if (currentUrl.includes('/app')) {
        console.log('[LOGIN] Login successful!');
        return true;
    }

    console.log('[LOGIN] Login may have failed. Current URL:', currentUrl);
    return false;
}

/**
 * Test a single resource's add form
 */
async function testAddResource(page, resourceId, testResults) {
    const addUrl = `${CONFIG.BASE_URL}/app/add/${resourceId}`;
    const tableUrl = `${CONFIG.BASE_URL}/app/tables/${resourceId}`;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[ADD TEST] Testing resource: ${resourceId}`);
    console.log(`${'='.repeat(60)}`);

    const result = {
        resourceId,
        testType: 'add',
        formFilled: false,
        formSubmitted: false,
        submissionSuccess: false,
        tableVerified: false,
        filledValues: {},
        error: null
    };

    try {
        // Navigate to add page
        console.log(`  [NAV] Going to add page: ${addUrl}`);
        await page.goto(addUrl, { waitUntil: 'networkidle0', timeout: CONFIG.TIMEOUT });

        // Check for 404
        const is404 = await page.$('text/Not Found');
        if (is404) {
            result.error = 'Add page not found (404)';
            console.log(`  [ERROR] ${result.error}`);
            testResults.push(result);
            return result;
        }

        // Wait for form to load
        await delay(1000);

        // Find all form inputs
        const formInputs = await page.$$('form input, form select, form textarea');
        console.log(`  [FORM] Found ${formInputs.length} form fields`);

        // Check for ObjectList "Add Item" buttons and click them to add at least one item
        const addItemButtons = await page.$$('button');
        for (const btn of addItemButtons) {
            const btnText = await btn.evaluate(el => el.textContent || '');
            if (btnText.includes('Add Item') || btnText.includes('+ Add Item')) {
                await btn.click();
                await delay(300);
                console.log('  [FORM] Added object list item');
            }
        }

        // Re-fetch inputs after adding items
        const allInputs = await page.$$('form input, form select, form textarea');

        // First, handle all react-select dropdowns (entitySelect fields like department_id, faculty_id, student_id)
        const reactSelectContainers = await findReactSelectContainers(page);
        console.log(`  [FORM] Found ${reactSelectContainers.length} react-select dropdowns`);

        for (const { container, fieldName } of reactSelectContainers) {
            const value = await fillReactSelect(page, container, fieldName);
            if (value !== null) {
                // Use a normalized field name for storage (department_id, faculty_id, etc.)
                const normalizedName = fieldName.toLowerCase().replace(/\s+/g, '_');
                result.filledValues[normalizedName] = value;
                console.log(`    [FILL] ${fieldName}: ${String(value).substring(0, 40)}${String(value).length > 40 ? '...' : ''}`);
            }
        }

        // Fill each regular field (skip react-select inputs which have already been handled)
        for (const input of allInputs) {
            try {
                const name = await input.evaluate(el => el.name || el.id || '');
                const disabled = await input.evaluate(el => el.disabled);
                const hidden = await input.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style.display === 'none' || style.visibility === 'hidden';
                });

                // Skip react-select inputs - they are handled separately above
                const isReactSelect = name.startsWith('react-select-');
                if (disabled || hidden || isReactSelect) continue;

                const fieldType = await detectFieldType(page, input);
                const value = await fillField(page, input, fieldType, name, resourceId);

                if (value !== null && name) {
                    result.filledValues[name] = value;
                    console.log(`    [FILL] ${name}: ${String(value).substring(0, 30)}${String(value).length > 30 ? '...' : ''}`);
                }
            } catch (e) {
                // Skip problematic fields
            }
        }

        result.formFilled = true;
        console.log(`  [FORM] Form filled with ${Object.keys(result.filledValues).length} values`);

        // Wait a bit for React state updates
        await delay(1000);

        // Submit the form
        console.log('  [SUBMIT] Submitting form...');
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
            // Focus on submit button first
            await submitButton.focus();
            await delay(500);

            await submitButton.click();
            result.formSubmitted = true;

            // Wait for success or error message to appear (with timeout)
            // Use Promise.race to wait for whichever appears first
            let successMsg = null;
            let errorMsg = null;

            try {
                // Wait up to 15 seconds for either success or error message
                await Promise.race([
                    page.waitForSelector('.bg-green-50', { timeout: 15000 }).then(el => { successMsg = el; }),
                    page.waitForSelector('.bg-red-50', { timeout: 15000 }).then(el => { errorMsg = el; }),
                    // Also wait for loading to complete (button re-enables)
                    page.waitForFunction(() => {
                        const btn = document.querySelector('button[type="submit"]');
                        return btn && !btn.disabled;
                    }, { timeout: 15000 })
                ]);

                // Give React a moment to update the DOM
                await delay(500);

                // Re-check for messages after race completes
                if (!successMsg) successMsg = await page.$('.bg-green-50');
                if (!errorMsg) errorMsg = await page.$('.bg-red-50');

                if (successMsg) {
                    const successText = await successMsg.evaluate(el => el.textContent);
                    console.log(`  [SUCCESS] ${successText}`);
                    result.submissionSuccess = true;
                } else if (errorMsg) {
                    const errorText = await errorMsg.evaluate(el => el.textContent);
                    console.log(`  [FAIL] Submission error: ${errorText}`);
                    result.error = errorText;
                } else {
                    console.log('  [WARN] No success/error message detected');
                }
            } catch (waitError) {
                // Timeout waiting for message - check one more time
                const successMsg = await page.$('.bg-green-50');
                const errorMsg = await page.$('.bg-red-50');

                if (successMsg) {
                    const successText = await successMsg.evaluate(el => el.textContent);
                    console.log(`  [SUCCESS] ${successText}`);
                    result.submissionSuccess = true;
                } else if (errorMsg) {
                    const errorText = await errorMsg.evaluate(el => el.textContent);
                    console.log(`  [FAIL] Submission error: ${errorText}`);
                    result.error = errorText;
                } else {
                    console.log('  [WARN] No success/error message detected (timeout)');
                }
            }
        } else {
            result.error = 'Submit button not found';
            console.log(`  [ERROR] ${result.error}`);
        }

        // Verify in table (only if submission was successful)
        if (result.submissionSuccess) {
            console.log(`  [VERIFY] Navigating to table: ${tableUrl}`);
            await page.goto(tableUrl, { waitUntil: 'networkidle0', timeout: CONFIG.TIMEOUT });
            await delay(2000);

            // Get all table rows
            const rows = await page.$$('table tbody tr');
            console.log(`  [VERIFY] Found ${rows.length} rows in table`);

            // Get values to check (text values only, not file uploads)
            // Also exclude nested objectList subfields (pattern: field_0_subfield, field_1_subfield, etc.)
            // These are transformed and displayed differently in tables, not as individual columns
            const nestedFieldPattern = /_\d+_/; // Matches _0_, _1_, _2_, etc.
            const textValuesToCheck = Object.entries(result.filledValues)
                .filter(([k, v]) => typeof v === 'string' && v.length > 3 && !v.includes('@') && v !== 'dummy.pdf')
                .filter(([k, v]) => !nestedFieldPattern.test(k)) // Exclude nested objectList subfields
                .filter(([k]) => k !== 'geo_tag_location_link') // Exclude geo_tag_location_link (displays as link, not text)
                .slice(0, 10);

            // Get file field names (fields that had file uploads)
            const fileFields = Object.entries(result.filledValues)
                .filter(([k, v]) => v === 'dummy.pdf')
                .map(([k]) => k);

            let bestMatchRow = null;
            let bestMatchCount = 0;
            let bestRowContent = '';

            // Check each row to find one that contains ALL submitted values
            for (let i = 0; i < rows.length; i++) {
                const row = rows[i];
                const rowContent = await row.evaluate(el => Array.from(el.querySelectorAll('td')).map(td => td.textContent).join(' '));
                let matchCount = 0;

                for (const [fieldName, value] of textValuesToCheck) {
                    // For dates, check both formats
                    if (isDateString(value)) {
                        // Try to find any date format in row content that matches
                        const dateMatch = rowContent.match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [];
                        const foundMatch = dateMatch.some(tableDate => datesAreEqual(value, tableDate));
                        if (foundMatch || rowContent.includes(value)) {
                            matchCount++;
                        }
                    } else {
                        const searchValue = value.substring(0, 15);
                        if (rowContent.includes(searchValue)) {
                            matchCount++;
                        }
                    }
                }

                if (matchCount > bestMatchCount) {
                    bestMatchCount = matchCount;
                    bestMatchRow = row;
                    bestRowContent = rowContent;
                }

                // If we found a row with all values, break
                if (matchCount === textValuesToCheck.length) {
                    break;
                }
            }

            const foundValues = [];
            const missingValues = [];

            // Get column headers to map field positions
            const headerCells = await page.$$eval('table thead th', cells =>
                cells.map(c => c.textContent.trim().toLowerCase().replace(/\s+/g, '_'))
            );

            // Get all cells from the best matching row
            let rowCells = [];
            if (bestMatchRow) {
                rowCells = await bestMatchRow.$$eval('td', cells =>
                    cells.map(c => c.textContent.trim())
                );
            }

            // Check which values were found in the best matching row
            for (const [fieldName, value] of textValuesToCheck) {
                // For dates, use special comparison
                if (isDateString(value)) {
                    // Try to find any date format in row content that matches
                    const dateMatches = bestRowContent.match(/\d{1,2}\/\d{1,2}\/\d{4}/g) || [];
                    const foundMatch = dateMatches.some(tableDate => datesAreEqual(value, tableDate));

                    if (foundMatch || bestRowContent.includes(value)) {
                        foundValues.push({ field: fieldName, value: value });
                        console.log(`  [FOUND] ${fieldName}: "${value}" (date)`);
                    } else {
                        missingValues.push({ field: fieldName, value: value });
                        console.log(`  [MISSING] ${fieldName}: "${value}"`);
                        // Show dates found in row for debugging
                        if (dateMatches.length > 0) {
                            console.log(`    -> Dates found in row: ${dateMatches.join(', ')}`);
                        }
                    }
                } else {
                    const searchValue = value.substring(0, 15);
                    if (bestRowContent.includes(searchValue)) {
                        foundValues.push({ field: fieldName, value: searchValue });
                        console.log(`  [FOUND] ${fieldName}: "${searchValue}"`);
                    } else {
                        missingValues.push({ field: fieldName, value: searchValue });
                        console.log(`  [MISSING] ${fieldName}: "${searchValue}"`);

                        // Try to find the column index for this field and show actual value
                        // Use strict matching to avoid false positives (e.g., geo_tag_location_link vs location)
                        const fieldNameNormalized = fieldName.toLowerCase().replace(/[^a-z0-9_]/g, '_');
                        const fieldNameNoUnderscores = fieldNameNormalized.replace(/_/g, '');

                        // Try multiple matching strategies, from most specific to least
                        let columnIndex = headerCells.findIndex(h => h === fieldNameNormalized); // Exact match

                        if (columnIndex === -1) {
                            // Try matching with underscores stripped from both
                            columnIndex = headerCells.findIndex(h =>
                                h.replace(/_/g, '') === fieldNameNoUnderscores
                            );
                        }

                        if (columnIndex === -1) {
                            // Try to find header that starts with the field name words
                            // This handles cases like geo_tag_link matching geo_tag_location_link
                            columnIndex = headerCells.findIndex(h => {
                                const headerWords = h.split('_');
                                const fieldWords = fieldNameNormalized.split('_');
                                // Match if header words are a prefix of field words
                                return fieldWords.length >= headerWords.length &&
                                    headerWords.every((w, i) => fieldWords[i] === w);
                            });
                        }

                        if (columnIndex !== -1 && rowCells[columnIndex]) {
                            console.log(`    -> Actual value in row: "${rowCells[columnIndex]}"`);
                        } else {
                            // Just show all row cells for debugging
                            console.log(`    -> Row cells: ${rowCells.slice(0, 5).map((c, i) => `[${i}]${c.substring(0, 20)}`).join(' | ')}`);
                        }
                    }
                }
            }

            // Check if file fields show "view" link in the matching row
            let fileFieldsVerified = true;
            if (fileFields.length > 0 && bestMatchRow) {
                // Look for "view" text or links in the row
                const hasViewLink = await bestMatchRow.evaluate(el => {
                    const text = el.textContent.toLowerCase();
                    const links = el.querySelectorAll('a');
                    // Check if there's a "view" text or a link with "view" or href to pdf
                    return text.includes('view') ||
                        Array.from(links).some(a =>
                            a.textContent.toLowerCase().includes('view') ||
                            a.href.includes('.pdf') ||
                            a.href.includes('/view')
                        );
                });

                if (hasViewLink) {
                    console.log(`  [FOUND] File fields show "view" link`);
                } else {
                    console.log(`  [MISSING] File fields do not show "view" link`);
                    fileFieldsVerified = false;
                }
            }

            // Consider verified if ALL text values were found in the SAME row
            // and file fields show "view" link
            const allValuesInSameRow = foundValues.length === textValuesToCheck.length;
            result.tableVerified = allValuesInSameRow && fileFieldsVerified;
            result.verificationDetails = {
                found: foundValues.length,
                missing: missingValues.length,
                total: textValuesToCheck.length,
                allInSameRow: allValuesInSameRow,
                fileFieldsVerified: fileFieldsVerified
            };

            console.log(`  [VERIFY] ${foundValues.length}/${textValuesToCheck.length} values found in same row`);
            if (!allValuesInSameRow) {
                console.log(`  [WARN] Not all values found in the same row`);
            }
            if (!result.tableVerified) {
                console.log(`  [WARN] Verification failed: allInSameRow=${allValuesInSameRow}, fileFieldsVerified=${fileFieldsVerified}`);
            } else {
                console.log(`  [SUCCESS] All values verified in same row`);
            }
        }

    } catch (e) {
        result.error = e.message;
        console.log(`  [ERROR] ${e.message}`);
    }

    testResults.push(result);
    return result;
}

/**
 * Test editing functionality for a resource
 */
async function testEditResource(page, resourceId, testResults) {
    const tableUrl = `${CONFIG.BASE_URL}/app/tables/${resourceId}`;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[EDIT TEST] Testing resource: ${resourceId}`);
    console.log(`${'='.repeat(60)}`);

    const result = {
        resourceId,
        testType: 'edit',
        editButtonClicked: false,
        formModified: false,
        submissionSuccess: false,
        changesVerified: false,
        modifiedValues: {},
        error: null
    };

    try {
        // Navigate to table page
        console.log(`  [NAV] Going to table page: ${tableUrl}`);
        await page.goto(tableUrl, { waitUntil: 'networkidle0', timeout: CONFIG.TIMEOUT });
        await delay(2000);

        // Get all table rows
        const rows = await page.$$('table tbody tr');
        console.log(`  [TABLE] Found ${rows.length} rows in table`);

        if (rows.length === 0) {
            result.error = 'No rows available to edit';
            console.log(`  [ERROR] ${result.error}`);
            testResults.push(result);
            return result;
        }

        // Find and click the edit button in the first row
        const firstRow = rows[0];
        // Find edit button (title="Edit" or text "Edit" or link with /edit/)
        const buttons = await firstRow.$$('button');
        const links = await firstRow.$$('a');
        let editButton = null;

        // Check buttons
        for (const btn of buttons) {
            const title = await btn.evaluate(el => el.title || '');
            const text = await btn.evaluate(el => el.textContent || '');
            if (title === 'Edit' || text.includes('Edit')) {
                editButton = btn;
                break;
            }
        }

        // Check links if no button found
        if (!editButton) {
            for (const link of links) {
                const href = await link.evaluate(el => el.getAttribute('href') || '');
                if (href.includes('/edit/')) {
                    editButton = link;
                    break;
                }
            }
        }

        if (!editButton) {
            result.error = 'Edit button/link not found in table row';
            console.log(`  [ERROR] ${result.error}`);
            testResults.push(result);
            return result;
        }

        console.log('  [CLICK] Clicking edit button...');
        await editButton.click();
        result.editButtonClicked = true;
        await delay(2000);

        // Wait for edit form to load
        await page.waitForSelector('form', { timeout: 5000 });
        console.log('  [FORM] Edit form loaded');

        // Find text inputs to modify (skip file inputs, checkboxes, and selects for simplicity)
        const textInputs = await page.$$('form input[type="text"], form input[type="number"], form textarea');
        console.log(`  [FORM] Found ${textInputs.length} editable text fields`);

        // Modify up to 3 text fields
        let modifiedCount = 0;
        for (const input of textInputs.slice(0, 3)) {
            try {
                const name = await input.evaluate(el => el.name || el.id || '');
                const disabled = await input.evaluate(el => el.disabled);
                const hidden = await input.evaluate(el => {
                    const style = window.getComputedStyle(el);
                    return style.display === 'none' || style.visibility === 'hidden';
                });

                if (disabled || hidden || !name) {
                    console.log(`    [SKIP] Field ${name} is disabled/hidden/unnamed`);
                    continue;
                }

                // Skip react-select inputs as they require specific interaction
                if (name.includes('react-select')) {
                    console.log(`    [SKIP] Field ${name} is react-select`);
                    continue;
                }

                const fieldType = await detectFieldType(page, input);
                const newValue = generateValueForField(fieldType, name, resourceId);

                console.log(`    [DEBUG] Field: ${name}, Type: ${fieldType}, Generated: ${newValue}`);

                if (!newValue) {
                    console.log(`    [SKIP] No value generated for ${name} (${fieldType})`);
                    continue;
                }

                const filledValue = await fillField(page, input, fieldType, name, resourceId);

                if (filledValue !== null) {
                    console.log(`    [MODIFY] ${name}: ${filledValue}`);
                    result.modifiedValues[name] = filledValue;
                    modifiedCount++;

                    // Stop after modifying a few fields to avoid over-editing
                    // if (Object.keys(result.modifiedValues).length >= 3) break;
                } else {
                    console.log(`    [FAIL] fillField returned null for ${name}`);
                }
            } catch (e) {
                console.log(`    [ERROR] Exception processing field ${name}: ${e.message}`);
            }
        }

        if (modifiedCount === 0) {
            result.error = 'No fields could be modified';
            console.log(`  [ERROR] ${result.error}`);
            testResults.push(result);
            return result;
        }

        result.formModified = true;
        console.log(`  [FORM] Modified ${modifiedCount} fields`);

        // Wait for React state updates
        await delay(1000);

        // Submit the form
        console.log('  [SUBMIT] Submitting edited form...');
        const submitButton = await page.$('button[type="submit"]');
        if (submitButton) {
            await submitButton.focus();
            await delay(500);
            await submitButton.click();

            // Wait for success or error message
            try {
                await Promise.race([
                    page.waitForSelector('.bg-green-50', { timeout: 15000 }),
                    page.waitForSelector('.bg-red-50', { timeout: 15000 }),
                    page.waitForFunction(() => {
                        const btn = document.querySelector('button[type="submit"]');
                        return btn && !btn.disabled;
                    }, { timeout: 15000 })
                ]);

                await delay(500);

                const successMsg = await page.$('.bg-green-50');
                const errorMsg = await page.$('.bg-red-50');

                if (successMsg) {
                    const successText = await successMsg.evaluate(el => el.textContent);
                    console.log(`  [SUCCESS] ${successText}`);
                    result.submissionSuccess = true;
                } else if (errorMsg) {
                    const errorText = await errorMsg.evaluate(el => el.textContent);
                    console.log(`  [FAIL] Edit submission error: ${errorText}`);
                    result.error = errorText;
                }
            } catch (waitError) {
                console.log('  [WARN] No success/error message detected');
            }
        } else {
            result.error = 'Submit button not found';
            console.log(`  [ERROR] ${result.error}`);
        }

        // Verify changes in table
        if (result.submissionSuccess) {
            console.log(`  [VERIFY] Navigating back to table to verify changes...`);
            await page.goto(tableUrl, { waitUntil: 'networkidle0', timeout: CONFIG.TIMEOUT });
            await delay(2000);

            const updatedRows = await page.$$('table tbody tr');
            let changesFound = false;

            for (const row of updatedRows) {
                const rowContent = await row.evaluate(el =>
                    Array.from(el.querySelectorAll('td')).map(td => td.textContent).join(' ')
                );

                // Check if any of our modified values appear in this row
                const modifiedValuesList = Object.values(result.modifiedValues);
                const matchCount = modifiedValuesList.filter(val => {
                    const searchValue = String(val).substring(0, 15);
                    return rowContent.includes(searchValue);
                }).length;

                if (matchCount > 0) {
                    changesFound = true;
                    // If we found some matches but not all, it might be due to hidden columns
                    const totalModified = modifiedValuesList.length;
                    if (matchCount === totalModified) {
                        console.log(`  [VERIFY] Found all ${matchCount}/${totalModified} modified values in table`);
                    } else {
                        console.log(`  [VERIFY] Found ${matchCount}/${totalModified} modified values in table (Note: valid if some fields are not displayed in table)`);
                    }
                    break;
                }
            }

            result.changesVerified = changesFound;
            if (changesFound) {
                console.log(`  [SUCCESS] Edit changes verified in table`);
            } else {
                console.log(`  [WARN] Could not verify edit changes in table (values not found in any row)`);
            }
        }

    } catch (e) {
        result.error = e.message;
        console.log(`  [ERROR] ${e.message}`);
    }

    testResults.push(result);
    return result;
}

/**
 * Test delete functionality for a resource
 */
async function testDeleteResource(page, resourceId, testResults) {
    const tableUrl = `${CONFIG.BASE_URL}/app/tables/${resourceId}`;

    console.log(`\n${'='.repeat(60)}`);
    console.log(`[DELETE TEST] Testing resource: ${resourceId}`);
    console.log(`${'='.repeat(60)}`);

    const result = {
        resourceId,
        testType: 'delete',
        deleteButtonClicked: false,
        confirmationHandled: false,
        deletionSuccess: false,
        deletionVerified: false,
        error: null
    };

    try {
        // Navigate to table page
        console.log(`  [NAV] Going to table page: ${tableUrl}`);
        await page.goto(tableUrl, { waitUntil: 'networkidle0', timeout: CONFIG.TIMEOUT });
        await delay(2000);

        // Get all table rows
        const rowsBefore = await page.$$('table tbody tr');
        const rowCountBefore = rowsBefore.length;
        console.log(`  [TABLE] Found ${rowCountBefore} rows before deletion`);

        if (rowCountBefore === 0) {
            result.error = 'No rows available to delete';
            console.log(`  [ERROR] ${result.error}`);
            testResults.push(result);
            return result;
        }

        // Get content of first row to verify it's gone later
        const firstRowContent = await rowsBefore[0].evaluate(el =>
            Array.from(el.querySelectorAll('td')).map(td => td.textContent).join(' ')
        );
        console.log(`  [ROW] First row content: ${firstRowContent.substring(0, 50)}...`);

        // Find and click the delete button in the first row
        // Find and click the delete button in the first row
        const buttons = await rowsBefore[0].$$('button');
        let deleteButton = null;

        for (const btn of buttons) {
            const title = await btn.evaluate(el => el.title || '');
            const text = await btn.evaluate(el => el.textContent || '');
            // Often delete buttons have specific styling or icons, checking generic 'Delete' for now
            if (title === 'Delete' || text.includes('Delete')) {
                deleteButton = btn;
                break;
            }
        }

        if (!deleteButton) {
            result.error = 'Delete button not found in table row';
            console.log(`  [ERROR] ${result.error}`);
            testResults.push(result);
            return result;
        }

        console.log('  [CLICK] Clicking delete button...');

        await deleteButton.click();
        result.deleteButtonClicked = true;

        // Handle Custom Delete Confirmation Modal
        try {
            console.log('  [MODAL] Waiting for delete confirmation modal...');
            // Wait for the modal confirm button (red button with text "Delete" or specific class)
            // Based on frontend code: button with class 'bg-red-600'
            const confirmBtnSelector = 'div.fixed button.bg-red-600';
            await page.waitForSelector(confirmBtnSelector, { visible: true, timeout: 3000 });

            console.log('  [MODAL] Modal appeared, clicking confirm...');
            await page.click(confirmBtnSelector);
            result.confirmationHandled = true;
            console.log('  [MODAL] Clicked confirm delete button');
        } catch (e) {
            console.log(`  [WARN] Delete confirmation modal issue: ${e.message}`);
        }
        await delay(2000);

        // Wait for success message or table update
        try {
            await Promise.race([
                page.waitForSelector('.bg-green-50', { timeout: 10000 }),
                delay(3000) // Give some time for deletion to process
            ]);

            const successMsg = await page.$('.bg-green-50');
            if (successMsg) {
                const successText = await successMsg.evaluate(el => el.textContent);
                console.log(`  [SUCCESS] ${successText}`);
                result.deletionSuccess = true;
            }
        } catch (e) {
            // May not have a success message, check row count instead
        }

        // Verify deletion by checking row count
        await delay(1000);
        await page.reload({ waitUntil: 'networkidle0' });
        await delay(2000);

        const rowsAfter = await page.$$('table tbody tr');
        const rowCountAfter = rowsAfter.length;
        console.log(`  [TABLE] Found ${rowCountAfter} rows after deletion`);

        // Check if row count decreased
        if (rowCountAfter < rowCountBefore) {
            result.deletionVerified = true;
            result.deletionSuccess = true;
            console.log(`  [SUCCESS] Row count decreased from ${rowCountBefore} to ${rowCountAfter}`);
        } else {
            // Also check if the specific row content is gone
            let rowStillExists = false;
            for (const row of rowsAfter) {
                const rowContent = await row.evaluate(el =>
                    Array.from(el.querySelectorAll('td')).map(td => td.textContent).join(' ')
                );
                if (rowContent === firstRowContent) {
                    rowStillExists = true;
                    break;
                }
            }

            if (!rowStillExists && rowCountAfter > 0) {
                result.deletionVerified = true;
                result.deletionSuccess = true;
                console.log(`  [SUCCESS] Deleted row no longer exists in table`);
            } else {
                console.log(`  [WARN] Could not verify deletion - row count unchanged`);
            }
        }

    } catch (e) {
        result.error = e.message;
        console.log(`  [ERROR] ${e.message}`);
    }

    testResults.push(result);
    return result;
}

/**
 * Print test summary
 */
function printSummary(testResults) {
    console.log('\n' + '='.repeat(70));
    console.log('TEST SUMMARY');
    console.log('='.repeat(70));

    // Separate results by test type
    const addTests = testResults.filter(r => r.testType === 'add');
    const editTests = testResults.filter(r => r.testType === 'edit');
    const deleteTests = testResults.filter(r => r.testType === 'delete');

    console.log(`\nTotal Tests Run: ${testResults.length}`);
    console.log(`  - Add Tests: ${addTests.length}`);
    console.log(`  - Edit Tests: ${editTests.length}`);
    console.log(`  - Delete Tests: ${deleteTests.length}`);

    // Add test statistics
    if (addTests.length > 0) {
        const addPassed = addTests.filter(r => r.submissionSuccess);
        const addVerified = addTests.filter(r => r.tableVerified);
        console.log(`\n--- ADD TESTS ---`);
        console.log(`Submitted Successfully: ${addPassed.length}/${addTests.length}`);
        console.log(`Verified in Tables: ${addVerified.length}/${addTests.length}`);

        const addFailed = addTests.filter(r => !r.submissionSuccess);
        if (addFailed.length > 0) {
            console.log('\nFailed Add Tests:');
            for (const r of addFailed) {
                console.log(`  - ${r.resourceId}: ${r.error || 'Unknown error'}`);
            }
        }
    }

    // Edit test statistics
    if (editTests.length > 0) {
        const editPassed = editTests.filter(r => r.submissionSuccess);
        const editVerified = editTests.filter(r => r.changesVerified);
        console.log(`\n--- EDIT TESTS ---`);
        console.log(`Submitted Successfully: ${editPassed.length}/${editTests.length}`);
        console.log(`Changes Verified: ${editVerified.length}/${editTests.length}`);

        const editFailed = editTests.filter(r => !r.submissionSuccess && r.editButtonClicked);
        if (editFailed.length > 0) {
            console.log('\nFailed Edit Tests:');
            for (const r of editFailed) {
                console.log(`  - ${r.resourceId}: ${r.error || 'Unknown error'}`);
            }
        }

        const noEditButton = editTests.filter(r => !r.editButtonClicked);
        if (noEditButton.length > 0) {
            console.log('\nNo Edit Button Found:');
            for (const r of noEditButton) {
                console.log(`  - ${r.resourceId}`);
            }
        }
    }

    // Delete test statistics
    if (deleteTests.length > 0) {
        const deletePassed = deleteTests.filter(r => r.deletionSuccess);
        const deleteVerified = deleteTests.filter(r => r.deletionVerified);
        console.log(`\n--- DELETE TESTS ---`);
        console.log(`Deleted Successfully: ${deletePassed.length}/${deleteTests.length}`);
        console.log(`Deletion Verified: ${deleteVerified.length}/${deleteTests.length}`);

        const deleteFailed = deleteTests.filter(r => !r.deletionSuccess && r.deleteButtonClicked);
        if (deleteFailed.length > 0) {
            console.log('\nFailed Delete Tests:');
            for (const r of deleteFailed) {
                console.log(`  - ${r.resourceId}: ${r.error || 'Unknown error'}`);
            }
        }

        const noDeleteButton = deleteTests.filter(r => !r.deleteButtonClicked);
        if (noDeleteButton.length > 0) {
            console.log('\nNo Delete Button Found:');
            for (const r of noDeleteButton) {
                console.log(`  - ${r.resourceId}`);
            }
        }
    }

    console.log('\n' + '='.repeat(70));
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main() {
    console.log('='.repeat(70));
    console.log('COMPREHENSIVE FORM TESTING SCRIPT');
    console.log('Testing: ADD, EDIT, and DELETE functionality');
    console.log('='.repeat(70));
    console.log(`Base URL: ${CONFIG.BASE_URL}`);
    console.log(`Headless: ${CONFIG.HEADLESS}`);

    const browser = await puppeteer.launch({
        headless: CONFIG.HEADLESS,
        slowMo: CONFIG.SLOW_MO,
        args: ['--start-maximized'],
        defaultViewport: null
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(CONFIG.TIMEOUT);

    const testResults = [];

    try {
        // Login first
        const loginSuccess = await login(page);
        if (!loginSuccess) {
            console.error('[FATAL] Login failed. Exiting.');
            await browser.close();
            process.exit(1);
        }

        // Determine which resources to test
        let resourcesToTest = ALL_RESOURCES;
        if (CONFIG.RESOURCES_TO_TEST !== 'all') {
            if (Array.isArray(CONFIG.RESOURCES_TO_TEST)) {
                resourcesToTest = CONFIG.RESOURCES_TO_TEST;
            } else if (typeof CONFIG.RESOURCES_TO_TEST === 'string') {
                resourcesToTest = [CONFIG.RESOURCES_TO_TEST];
            }
        }

        console.log(`\n[INFO] Testing ${resourcesToTest.length} resources with ADD, EDIT, and DELETE operations...`);

        // Test each resource with all three operations
        for (const resourceId of resourcesToTest) {
            // 1. Test ADD functionality
            const addResult = await testAddResource(page, resourceId, testResults);

            // 2. Test EDIT functionality (only if add was successful)
            if (addResult.submissionSuccess) {
                await testEditResource(page, resourceId, testResults);
            } else {
                console.log(`\n[SKIP] Skipping EDIT test for ${resourceId} - ADD test failed`);
            }

            // 3. Test DELETE functionality (only if add was successful)
            if (addResult.submissionSuccess) {
                await testDeleteResource(page, resourceId, testResults);
            } else {
                console.log(`\n[SKIP] Skipping DELETE test for ${resourceId} - ADD test failed`);
            }
        }

        // Print summary
        printSummary(testResults);

    } catch (e) {
        console.error('[FATAL ERROR]', e);
    } finally {
        await browser.close();
    }
}

// Run the script
main().catch(console.error);