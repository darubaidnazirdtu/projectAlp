/**
 * Duplicate Detection Service for IQAC
 * Reuses the APAR duplicate detection API
 * 
 * Usage in IQAC forms:
 * 
 * import { checkDuplicateIqac } from '../services/iqac-duplicate.service';
 * 
 * const handleSubmit = async (formData) => {
 *     const dupCheck = await checkDuplicateIqac('journal', faculty_id, ay, formData);
 *     if (dupCheck.isDuplicate) {
 *         // Show modal
 *         setShowDuplicateModal(true);
 *     } else {
 *         // Submit normally
 *     }
 * };
 */

import { Api } from '../api/Api.js';

const api = new Api(import.meta.env.VITE_BASEURL);

/**
 * Check for duplicate entries in IQAC before adding
 * 
 * @param {string} entity_type - Type: 'journal', 'conference', 'book', 'patent', 'funding', 'consultancy'
 * @param {string} faculty_id - Faculty ID (from form or current user)
 * @param {string} academic_year - Academic year (e.g., "2023-2024")
 * @param {object} data - Form data to check
 * @returns {Promise} Response with isDuplicate, existingEntry, matchedFields
 */
export const checkDuplicateIqac = async (entity_type, faculty_id, academic_year, data) => {
    try {
        const response = await api.post('/apar/mongo/check-duplicate', {
            entity_type,
            faculty_id,
            ay: academic_year,
            data
        });

        return response.data || response;
    } catch (error) {
        console.error('Duplicate check failed:', error);
        // Return no duplicate on error to allow submission
        return { isDuplicate: false };
    }
};

/**
 * Batch check for duplicates (for multiple faculty members)
 * Useful when adding entries with multiple authors/investigators
 * 
 * @param {string} entity_type - Entity type
 * @param {Array} faculty_ids - Array of faculty IDs
 * @param {string} academic_year - Academic year
 * @param {object} data - Form data
 * @returns {Promise} Array of check results per faculty
 */
export const checkDuplicateBatch = async (entity_type, faculty_ids, academic_year, data) => {
    try {
        const checks = await Promise.all(
            faculty_ids.map(id => checkDuplicateIqac(entity_type, id, academic_year, data))
        );

        // Return any duplicates found
        return checks.filter(check => check.isDuplicate);
    } catch (error) {
        console.error('Batch duplicate check failed:', error);
        return [];
    }
};

export default {
    checkDuplicateIqac,
    checkDuplicateBatch
};
