/**
 * Auto-Sync Service
 * Automatically syncs new IQAC entries to relevant APAR forms
 */

import { AparForm } from '../models/aparForm.model.js';
import { Notification } from '../models/notification.model.js';
import { User } from '../models/user.model.js';
import { Faculty } from '../models/faculty.model.js';
import { emitNewEntry, emitUpdateEntry, emitDeleteEntry, emitNotification } from '../config/socket.js';

/**
 * Triggers auto-sync for faculty members with Draft APAR forms
 * Called after creating/updating IQAC records
 * 
 * @param {string} faculty_id - Faculty ID associated with the new/updated entry
 * @param {string} academic_year - Academic year of the entry (optional)
 * @param {object} entryData - The new/updated entry data for Socket emission
 */
export const triggerAparAutoSync = async (faculty_id, academic_year = null, entryData = null) => {
    try {
        if (!faculty_id) return;

        // Find all Draft APAR forms for this faculty
        const query = {
            faculty_id,
            status: { $in: ['Draft', 'Query Raised', null] }
        };

        // Don't filter by academic_year here strictly, as format (2024-25 vs 2024-2025) might differ.
        // We will sync all 'Draft' forms for this faculty. The sync function handles data matching.

        const draftForms = await AparForm.find(query);

        if (draftForms.length === 0) {
            console.log(`No draft APAR forms found for faculty ${faculty_id}`);
            return;
        }

        // Import sync function dynamically to avoid circular dependency
        const { syncIqacToAparForm } = await import('../controllers/apar.mongo.controller.js');

        // Track unique notifications sent in this batch to prevent duplicates if user has multiple drafts
        const notifiedRecipients = new Set();

        for (const form of draftForms) {
            try {
                const modified = await syncIqacToAparForm(form, faculty_id, form.ay);

                if (modified) {
                    form.markModified('research');
                    await form.save();
                    console.log(`✅ Auto-synced IQAC data to APAR form for ${faculty_id}, AY: ${form.ay}`);

                    // 🚀 Emit Socket.io event for real-time update
                    if (entryData) {
                        // Resolve submitter name
                        let submittedBy = 'System';
                        if (entryData.metadata && entryData.metadata.created_by) {
                            try {
                                const creatorId = entryData.metadata.created_by;
                                let creator = await User.findOne({ user_id: creatorId }).select('name');
                                if (!creator) {
                                    creator = await Faculty.findOne({ faculty_id: creatorId }).select('name');
                                }
                                submittedBy = creator?.name || creatorId || 'System';
                            } catch (e) {
                                console.error('Error resolving submitter name:', e);
                            }
                        }

                        // Determine action type from entryData or default to 'created'
                        const action = entryData.action || 'created';

                        // Create Persistent Notification
                        // Only send if we haven't already notified this faculty in this sync batch
                        if (!notifiedRecipients.has(faculty_id)) {
                            try {
                                // Import helper to extract entry details
                                const { getEntryDetails } = await import('./notification-helpers.js');
                                const entryInfo = getEntryDetails(entryData);

                                let notifTitle = 'New IQAC Entry Synced';
                                let notifMsg = `A new ${entryInfo.displayType} was added by ${submittedBy}.`;

                                if (action === 'updated') {
                                    notifTitle = 'IQAC Entry Updated';
                                    notifMsg = `A ${entryInfo.displayType} was updated by ${submittedBy}.`;
                                } else if (action === 'deleted') {
                                    notifTitle = 'IQAC Entry Deleted';
                                    notifMsg = `A ${entryInfo.displayType} was deleted by ${submittedBy}.`;
                                }

                                const newNotif = await Notification.create({
                                    recipient: faculty_id,
                                    type: 'IQAC_UPDATE',
                                    title: notifTitle,
                                    message: notifMsg,
                                    link: `/apar-form`,
                                    isRead: false,
                                    metadata: {
                                        entryType: entryInfo.type,
                                        displayType: entryInfo.displayType,
                                        entryId: entryData.publication_id || entryData.project_id || entryData.patent_id || entryData.activity_id || null,
                                        submittedBy: submittedBy,
                                        details: entryInfo.details,
                                        academicYear: form.ay,
                                        action: action
                                    }
                                });

                                // Emit Notification to User's Bell
                                emitNotification(faculty_id, newNotif);

                                notifiedRecipients.add(faculty_id);

                            } catch (notifErr) {
                                console.error('Failed to create notification:', notifErr);
                            }
                        }

                        // Emit specific socket event based on action
                        if (action === 'updated') {
                            emitUpdateEntry(faculty_id, form.ay, {
                                type: entryData.type || 'journal',
                                action: 'updated',
                                data: entryData,
                                submittedBy: submittedBy
                            });
                        } else if (action === 'deleted') {
                            emitDeleteEntry(faculty_id, form.ay, {
                                type: entryData.type || 'journal',
                                action: 'deleted',
                                data: entryData,
                                submittedBy: submittedBy
                            });
                        } else {
                            // Default to created
                            emitNewEntry(faculty_id, form.ay, {
                                type: entryData.type || 'journal',
                                action: 'created',
                                data: entryData,
                                submittedBy: submittedBy
                            });
                        }
                    }
                }
            } catch (syncErr) {
                console.error(`Auto-sync failed for ${faculty_id}, AY ${form.ay}:`, syncErr.message);
            }
        }
    } catch (error) {
        console.error('Auto-sync trigger error:', error);
        // Don't throw - this is a background operation
    }
};

/**
 * Triggers auto-sync for multiple faculty members
 * Used when an entry has multiple faculty associations
 * 
 * @param {Array} faculty_ids - Array of faculty IDs
 * @param {string} academic_year - Academic year
 * @param {object} entryData - The entry data for Socket emission
 */
export const triggerAparAutoSyncMultiple = async (faculty_ids, academic_year = null, entryData = null) => {
    if (!faculty_ids || faculty_ids.length === 0) return;

    // Run syncs in parallel for better performance
    await Promise.all(
        faculty_ids.map(id => triggerAparAutoSync(id, academic_year, entryData))
    );
};
