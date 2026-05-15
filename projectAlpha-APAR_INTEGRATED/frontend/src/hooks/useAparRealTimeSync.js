import { useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { toast } from 'sonner';

/**
 * Custom hook for APAR real-time synchronization via WebSocket
 * Uses global SocketContext to listen for new IQAC entries
 */
export const useAparRealTimeSync = (faculty_id, ay, onNewEntry) => {
    const { socket, connected } = useSocket();
    const onNewEntryRef = useRef(onNewEntry);

    // Keep callback ref updated
    useEffect(() => {
        onNewEntryRef.current = onNewEntry;
    }, [onNewEntry]);

    useEffect(() => {
        if (!socket || !connected || !faculty_id || !ay) return;

        const normalizeAy = (val) => {
            if (!val) return '';
            if (val.includes('-')) {
                const parts = val.split('-');
                if (parts[1].length === 4) return `${parts[0]}-${parts[1].substring(2)}`;
            }
            return val;
        };

        const normalizedAy = normalizeAy(ay);
        console.log(`📡 Emitting join_apar_room for ${faculty_id}, AY: ${normalizedAy}`);
        socket.emit('join_apar_room', { faculty_id, ay: normalizedAy });

        // Listen for new entries from IQAC
        const handleNewEntry = (data) => {
            const entryType = data.type || 'entry';
            toast(`New ${entryType} synced from IQAC`, {
                description: `A new entry was automatically added to your research section.`
            });
            if (onNewEntryRef.current) onNewEntryRef.current(data);
        };

        const handleCrossFaculty = (data) => {
            toast(`Collaborative Update`, {
                description: `Dr. ${data.submittedBy || 'Colleague'} submitted "${data.entryTitle}". Auto-removed from your draft.`,
            });
            if (onNewEntryRef.current) onNewEntryRef.current({ ...data, isRemoval: true });
        };

        const handleBulk = (data) => {
            toast(`${data.count} new entries synced`, {
                description: `Successfully synced bulk data from IQAC.`
            });
            if (onNewEntryRef.current && data.entries) {
                data.entries.forEach(entry => onNewEntryRef.current(entry));
            }
        };

        socket.on('new_entry', handleNewEntry);
        socket.on('cross_faculty_update', handleCrossFaculty);
        socket.on('bulk_entries', handleBulk);

        return () => {
            socket.off('new_entry', handleNewEntry);
            socket.off('cross_faculty_update', handleCrossFaculty);
            socket.off('bulk_entries', handleBulk);
            socket.emit('leave_apar_room', { faculty_id, ay });
        };
    }, [socket, connected, faculty_id, ay]);

    return socket;
};

/**
 * Helper to merge new entry into research section
 * @param {object} currentResearch - Current research object from formData
 * @param {object} newEntryData - New entry data from Socket
 * @returns {object} Updated research object
 */
export const mergeNewEntry = (currentResearch, newEntryData) => {
    if (!newEntryData || !newEntryData.type || !newEntryData.data) {
        return currentResearch;
    }

    const { type, data } = newEntryData;

    // Mapping of IQAC types to APAR research keys
    const typeToKeyMap = {
        'journal': 'journals',
        'conference': 'conferences',
        'book': 'books',
        'project': 'projects',
        'patent': 'patents',
        'consultancy': 'consultancy',
        'award': 'awards',
        'econtent': 'e_content',
        'visit': 'faculty_visits',
        'activity': 'collaborations',
        'phd': 'phd_supervision',
        'mou': 'mous',
        'fdp': 'fdps'
    };

    const sectionKey = typeToKeyMap[type] || (type + 's');

    // Deep clone the research object
    const updated = JSON.parse(JSON.stringify(currentResearch || {}));

    // Initialize section if it doesn't exist
    if (!updated[sectionKey]) {
        updated[sectionKey] = [];
    }

    // Special handling for removals (e.g. collaborative updates)
    if (newEntryData.isRemoval) {
        const idField = type === 'journal' || type === 'conference' ? 'paper_id' :
            type === 'book' ? 'publication_id' :
                type === 'patent' ? 'patent_id' :
                    type === 'project' ? 'project_id' :
                        type === 'econtent' ? 'econtent_id' : '_id';

        updated[sectionKey] = updated[sectionKey].filter(item => item[idField] !== data[idField]);
        console.log(`🗑️ Removed ${type} entry due to collaborative update`);
        return updated;
    }

    // Check if entry already exists (by ID)
    const idField = type === 'journal' || type === 'conference' ? 'paper_id' :
        type === 'book' ? 'publication_id' :
            type === 'patent' ? 'patent_id' :
                type === 'project' ? 'project_id' :
                    type === 'econtent' ? 'econtent_id' : '_id';

    const existingIndex = updated[sectionKey].findIndex(
        item => item[idField] === data[idField]
    );

    if (existingIndex >= 0) {
        // Update existing entry
        updated[sectionKey][existingIndex] = { ...updated[sectionKey][existingIndex], ...data };
        console.log(`📝 Updated existing ${type} entry`);
    } else {
        // Add new entry - Ensure we spread current array to trigger React change detection
        updated[sectionKey] = [data, ...updated[sectionKey]];
        console.log(`➕ Added new ${type} entry to ${sectionKey}`);
    }

    return updated;
};
