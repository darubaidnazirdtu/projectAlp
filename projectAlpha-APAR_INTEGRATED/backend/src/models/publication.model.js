import mongoose from 'mongoose';

/**
 * Publication Model
 * Supports: journal_research_papers, conference_research_papers, books_chapters_published (tableConfig.js)
 * Uses 'type' discriminator: 'journal' | 'conference' | 'book'
 */
const PublicationSchema = new mongoose.Schema({
    publication_id: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    department_id: {
        type: String,
        required: true,
        index: true
    },
    type: {
        type: String,
        enum: ['journal', 'conference', 'book'],
        required: true,
        index: true
    },

    // -------------------------------------------------------------------------
    // Common fields
    // -------------------------------------------------------------------------
    title: String,
    year_of_publication: Number,
    academic_year: String,
    doi: String,
    indexing: String,
    link: String,

    // -------------------------------------------------------------------------
    // Journal-specific (type: 'journal')
    // tableConfig accessor: paper_id, title, author_names, name_of_journal, etc.
    // -------------------------------------------------------------------------
    paper_id: String, // Alternate key for journals/conferences
    name_of_journal: String,
    author_names: String,
    issn: String,
    volume: String,
    issue: String,
    page_numbers: String,
    impact_factor: String,
    citation_count: Number,
    is_ugc_care_listed: Boolean,
    link_to_paper: String,

    // -------------------------------------------------------------------------
    // Conference-specific (type: 'conference')
    // tableConfig accessor: paper_id, title, name_of_conference, conference_level, etc.
    // -------------------------------------------------------------------------
    name_of_conference: String,
    conference_level: String, // National/International
    organizer: String,
    venue: String,
    publisher: String,
    paper_status: String, // Published, Accepted, Presented, Submitted
    isbn: String,
    award_received: String,

    // -------------------------------------------------------------------------
    // Book-specific (type: 'book')
    // tableConfig accessor: publication_id, title_of_book, title_of_chapter, role, etc.
    // -------------------------------------------------------------------------
    publication_type: {
        type: String,
        enum: ['Book', 'Chapter']
    },
    title_of_book: String,
    title_of_chapter: String,
    role: String, // Author/Editor
    year: Number, // Book uses 'year' instead of 'year_of_publication'
    isbn_number: String,
    name_of_publisher: String,
    publisher_type: String, // National/International
    same_institute_affiliation: Boolean,
    link_to_publication: String,

    // -------------------------------------------------------------------------
    // Many-to-many relationships (faculty and students involved)
    // -------------------------------------------------------------------------
    faculty_members: [{ faculty_id: String }],
    faculty_ids: [String], // Alternative format for books
    students: [{ student_id: String }],
    student_ids: [String], // Alternative format for books
    external_authors: [{
        name: String,
        email: String,
        role: String,
        affiliation: String
    }],
    external_contributors: [{
        name: String,
        email: String,
        role: String,
        affiliation: String
    }],

    metadata: {
        created_at: { type: Date, default: Date.now },
        updated_at: { type: Date, default: Date.now },
        created_by: { type: String, default: null },
        change_log: [{
            action: { type: String, enum: ['created', 'updated'] },
            user_id: String,
            timestamp: { type: Date, default: Date.now },
            changes: String
        }]
    }
}, {
    timestamps: { createdAt: 'metadata.created_at', updatedAt: 'metadata.updated_at' },
    collection: 'publications'
});

// Compound indexes for type-based queries
PublicationSchema.index({ type: 1, department_id: 1 });
PublicationSchema.index({ type: 1, year_of_publication: -1 });
PublicationSchema.index({ 'faculty_members.faculty_id': 1 });

export const Publication = mongoose.model('Publication', PublicationSchema);
