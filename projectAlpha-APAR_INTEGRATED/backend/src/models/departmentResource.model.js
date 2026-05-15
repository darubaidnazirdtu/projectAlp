import mongoose from 'mongoose';

/**
 * Department Resource Model
 * Supports: dept_library_books, it_infrastructure_stock_items, 
 *           dept_professional_schemes (tableConfig.js)
 * Uses 'type' discriminator: 'library' | 'it_stock' | 'scheme'
 */
const DepartmentResourceSchema = new mongoose.Schema({
    resource_id: {
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
        enum: ['library', 'it_stock', 'scheme'],
        required: true,
        index: true
    },

    // -------------------------------------------------------------------------
    // Common fields
    // -------------------------------------------------------------------------
    remarks: String,
    link: String,

    // -------------------------------------------------------------------------
    // Library-specific (type: 'library')
    // tableConfig: book_id, title_of_book, author, publisher, etc.
    // -------------------------------------------------------------------------
    book_id: String, // Alternate key
    title_of_book: String,
    author: String,
    publisher: String,
    year_of_publication: Number,
    isbn_number: String,
    edition: String,
    type_of_book: String, // Textbook/Reference/eBook/Journal/Other
    no_of_copies: Number,
    no_of_students_using: Number,

    // -------------------------------------------------------------------------
    // IT Stock-specific (type: 'it_stock')
    // tableConfig: stock_id, lab_name, faculty_id, no_of_desktops, etc.
    // -------------------------------------------------------------------------
    stock_id: String, // Alternate key
    lab_name: String,
    faculty_id: String,
    no_of_desktops: Number,
    no_of_servers: Number,
    no_of_workstations: Number,
    no_of_hpcs: Number,
    total_storage_tb: String,
    internet_bandwidth_mbps: String,
    software_list: String,
    total_cost: Number,
    funding_source: String,
    year_of_installation: Number,
    year_of_purchase: Number,
    condition_status: String, // Working/Under Maintenance/Obsolete
    usage_purpose: String, // Teaching/Research/Administration/Mixed

    // -------------------------------------------------------------------------
    // Scheme-specific (type: 'scheme')
    // tableConfig: scheme_id, name_of_scheme, type_of_scheme, funding_agency, etc.
    // -------------------------------------------------------------------------
    scheme_id: String, // Alternate key
    name_of_scheme: String,
    type_of_scheme: String, // Research Project/Consultancy/FDP/Innovation/Training/Other
    name_of_organisation: String,
    funding_agency: String,
    sanction_number: String,
    principal_investigator: String,
    co_investigators: String,
    year_of_sanction: Number,
    academic_year: String,
    funds_amount: Number,
    duration_start_date: Date,
    end_date: Date,
    status: String, // Ongoing/Completed/Submitted
    outcome: String,

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
    collection: 'department_resources'
});

// Compound indexes for type-based queries
DepartmentResourceSchema.index({ type: 1, department_id: 1 });

export const DepartmentResource = mongoose.model('DepartmentResource', DepartmentResourceSchema);
