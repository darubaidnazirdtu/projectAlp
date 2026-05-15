/**
 * Notification Helper Utilities
 * Extracts relevant details from different entry types for notification metadata
 */

/**
 * Extract details from a journal publication entry
 */
export const extractJournalDetails = (entry) => {
    return {
        title: entry.title || entry.title_of_paper || 'Untitled',
        journal: entry.journal_name || entry.name_of_journal || 'N/A',
        year: entry.year_of_publication || entry.year || 'N/A',
        doi: entry.doi || null,
        issn: entry.issn || null,
        authors: entry.faculty_members?.length || 0,
        students: entry.students?.length || 0
    };
};

/**
 * Extract details from a conference paper entry
 */
export const extractConferenceDetails = (entry) => {
    return {
        title: entry.title_of_paper || entry.title || 'Untitled',
        conference: entry.name_of_conference || entry.title_of_conference || 'N/A',
        year: entry.year_of_publication || entry.year || 'N/A',
        venue: entry.venue || null,
        level: entry.conference_level || null,
        isbn: entry.isbn || null,
        authors: entry.faculty_members?.length || 0,
        students: entry.students?.length || 0
    };
};

/**
 * Extract details from a book/chapter entry
 */
export const extractBookDetails = (entry) => {
    return {
        bookTitle: entry.title_of_book || 'Untitled',
        chapterTitle: entry.title_of_chapter || null,
        publisher: entry.name_of_publisher || entry.publisher || 'N/A',
        year: entry.year || entry.year_of_publication || 'N/A',
        isbn: entry.isbn_number || entry.isbn || null,
        type: entry.publication_type || 'Book',
        authors: entry.faculty_members?.length || entry.faculty_ids?.length || 0
    };
};

/**
 * Extract details from a research project entry
 */
export const extractProjectDetails = (entry) => {
    return {
        title: entry.title_research || entry.title || 'Untitled',
        agency: entry.funding_agency_name || entry.agency_name || entry.funding_agency || 'N/A',
        amount: entry.amount || 0,
        startDate: entry.start_date || null,
        endDate: entry.end_date || null,
        status: entry.status || 'Ongoing',
        type: entry.type_of_project || 'Research',
        faculty: entry.faculty_involved?.length || 0,
        students: entry.students_involved?.length || 0
    };
};

/**
 * Extract details from a consultancy entry
 */
export const extractConsultancyDetails = (entry) => {
    return {
        title: entry.title || entry.name_of_project || 'Untitled',
        agency: entry.agency_name || 'N/A',
        revenue: entry.revenue_generated || entry.revenue || entry.grant_amount || 0,
        startDate: entry.start_date || entry.duration_start_date || null,
        endDate: entry.end_date || null,
        type: entry.consultancy_type || 'Consultancy',
        faculty: entry.faculty_involved?.length || 0
    };
};

/**
 * Extract details from a patent entry
 */
export const extractPatentDetails = (entry) => {
    return {
        title: entry.patent_title || entry.title || 'Untitled',
        applicationNumber: entry.application_number || entry.patent_number || 'N/A',
        patentNumber: entry.patent_number || null,
        status: entry.status || 'Filed',
        filingDate: entry.date_of_filing || null,
        awardDate: entry.date_of_award || null,
        inventors: entry.faculty_members?.length || 0
    };
};

/**
 * Extract details from an award entry
 */
export const extractAwardDetails = (entry) => {
    return {
        name: entry.name_of_award || entry.award_name || 'Untitled',
        agency: entry.awarding_agency || entry.agency || 'N/A',
        date: entry.date_of_award || entry.date || null,
        level: entry.level || null,
        category: entry.category_of_award || entry.type_of_award || null,
        monetaryValue: entry.monetary_value || 0,
        recipients: entry.faculty_recipients?.length || 0
    };
};

/**
 * Extract details from an FDP/Workshop entry
 */
export const extractFdpDetails = (entry) => {
    return {
        title: entry.program_title || entry.title || 'Untitled',
        organizer: entry.organising_body || entry.organizer || 'N/A',
        duration: entry.duration_days || null,
        startDate: entry.start_date || null,
        endDate: entry.end_date || null,
        type: entry.type_of_program || 'FDP',
        mode: entry.mode || null,
        participants: entry.faculty_participants?.length || 0
    };
};

/**
 * Main function to extract entry details based on type
 * @param {object} entryData - The entry data object
 * @returns {object} Extracted details with type and fields
 */
export const getEntryDetails = (entryData) => {
    if (!entryData || !entryData.type) {
        return {
            type: 'entry',
            displayType: 'Entry',
            details: {}
        };
    }

    const type = entryData.type.toLowerCase();
    let details = {};
    let displayType = entryData.type;

    switch (type) {
        case 'journal':
            details = extractJournalDetails(entryData);
            displayType = 'Journal Publication';
            break;
        case 'conference':
            details = extractConferenceDetails(entryData);
            displayType = 'Conference Paper';
            break;
        case 'book':
            details = extractBookDetails(entryData);
            displayType = 'Book/Chapter';
            break;
        case 'funding':
        case 'project':
            details = extractProjectDetails(entryData);
            displayType = 'Research Project';
            break;
        case 'consultancy':
            details = extractConsultancyDetails(entryData);
            displayType = 'Consultancy';
            break;
        case 'patent':
            details = extractPatentDetails(entryData);
            displayType = 'Patent';
            break;
        case 'award':
            details = extractAwardDetails(entryData);
            displayType = 'Award';
            break;
        case 'fdp':
        case 'workshop':
            details = extractFdpDetails(entryData);
            displayType = 'FDP/Workshop';
            break;
        default:
            details = {
                title: entryData.title || entryData.name || 'N/A'
            };
            displayType = entryData.type;
    }

    return {
        type,
        displayType,
        details
    };
};
