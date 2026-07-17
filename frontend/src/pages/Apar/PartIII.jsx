import React from 'react';
import { useSelector } from 'react-redux';
import { selectAparUser } from '../../store/slices/aparAuthSlice';
import DynamicTableSection from '../../components/DynamicTableSection';
import {
    createAcademicYearSelectField,
    getAcademicYearBounds,
    getAcademicYearFromAparForm
} from '../../utils/academicYear.util.js';

export default function PartIII({ formData, academicYear, addItem, removeItem, updateArrayItem, updateField, readOnly, onSaveMonthly }) {
    const user = useSelector(selectAparUser);
    const currentFacultyId = user?.teacherId || user?.faculty_id || user?.userId || user?.user_id || '';
    const resolvedAcademicYear = getAcademicYearFromAparForm(formData, academicYear);
    const academicYearField = createAcademicYearSelectField(resolvedAcademicYear);
    const academicYearBounds = getAcademicYearBounds(resolvedAcademicYear);
    const academicCycleMonthYearBounds = {
        min: academicYearBounds.startMonth,
        max: academicYearBounds.endMonth
    };

    // Derive Course options from APAR draft (teaching.courses_taught)
    const draftCourses = (formData?.teaching?.courses_taught || []).filter(Boolean);
    // Build a map of { value: course_id (or name if no id), label: course_name }
    const coursePairs = draftCourses
        .map(c => {
            const value = String((c?.course_code ?? c?.course_id ?? c?.name_of_course ?? '') || '').trim();
            if (!value) return null;
            const label = String((c?.name_of_course ?? c?.course_name ?? value) || '').trim();
            return { value, label };
        })
        .filter(Boolean);
    const courseMap = new Map();
    coursePairs.forEach(({ value, label }) => { if (value && !courseMap.has(value)) courseMap.set(value, label); });
    const courseOptionsFromDraft = Array.from(courseMap.entries()).map(([value, label]) => ({ value, label }));

    // Helper handlers generator
    const createHandlers = (field) => ({
        onAdd: (item) => addItem('research', field, item),
        onUpdate: (index, newItem) => updateArrayItem('research', field, index, newItem),
        onRemove: removeItem ? (index) => removeItem('research', field, index) : undefined
    });

    return (
        <div className="p-2 space-y-10">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg mr-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                    </span>
                    Part III - RESEARCH & DEVELOPMENT
                </h3>
                {!readOnly && onSaveMonthly && (
                    <button type="button" onClick={onSaveMonthly} className="px-4 py-1.5 text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-md">
                        Save as Monthly
                    </button>
                )}
            </div>

            {/* 1 a) Research Projects */}
            <DynamicTableSection
                title="1) a) Details of Research Projects / Funding"
                data={formData.research.projects}
                uniqueKey="title_research"
                {...createHandlers('projects')}
                readOnly={readOnly}
                initialItem={{
                    department_id: '',
                    title_research: '',
                    role: '',
                    type_of_project: '',
                    funding_agency_name: '',
                    funding_type: '',
                    sanction_number: '',
                    year_of_sanction: '',
                    academic_year: resolvedAcademicYear,
                    start_date: '',
                    end_date: '',
                    total_amount_sanctioned: '',
                    total_amount_used_this_year: '',
                    remarks: '',
                    link: '',
                    faculty_involved: [],
                    students_involved: []
                }}
                fields={[
                    { label: 'Research Title', key: 'title_research', fullWidth: true, required: true, placeholder: 'Enter research title' },
                    { label: 'Role', key: 'role', type: 'select', options: ['Principal Investigator', 'Co-Principal Investigator', 'Research Collaborator'] ,required: true, placeholder: 'Select Role'},
                    { label: 'Project Type', key: 'type_of_project', type: 'select', options: ['Sponsored Research', 'Innovation', 'Startup', 'Other'], required: true, placeholder: 'Select type' },
                    { label: 'Funding Agency', key: 'funding_agency_name', required: true, placeholder: 'Enter funding agency' },
                    { label: 'Funding Type', key: 'funding_type', type: 'select', options: ['Government', 'Non-Government', 'Industry'], required: true, placeholder: 'Select funding type' },
                    { label: 'Sanction Number', key: 'sanction_number', placeholder: 'Enter sanction number' },
                    {
    label: 'Month-Year of Sanction',
    key: 'year_of_sanction',
    type: 'monthYear',
    required: true,
    min: academicYearBounds.startMonth,
    max: academicYearBounds.endMonth,
    placeholder: 'Select sanction month-year'
},
                    academicYearField,
                    {
    label: 'Start Date',
    key: 'start_date',
    type: 'date',
    required: true
},
                    {
    label: 'End Date',
    key: 'end_date',
    type: 'date',
    required: true,
    minDateField: 'start_date',
    validate: (value, formData) => {
        if (!value || !formData.start_date) return true;
        return new Date(value) >= new Date(formData.start_date);
    },
    validationMessage: 'End Date must be greater than or equal to Start Date'
},
                    
                    { label: 'Total Amount Sanctioned', key: 'total_amount_sanctioned', type: 'number', min: 0, placeholder: 'Enter total amount sanctioned', required: true },
                    { label: 'Total Amount Used in this academic year', key: 'total_amount_used_this_year', type: 'number', min: 0, placeholder: 'Enter total amount used', required: true },
                    { label: 'Remarks', key: 'remarks', placeholder: 'Enter remarks' },
                    { label: 'Proof of Sanction Letter', key: 'link', type: 'file', required: true },
                    {
                        label: 'Faculty Involved', key: 'faculty_involved', type: 'objectList', subFields: [
                            { label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty', required: true, defaultValue: user?.faculty_id },
                            { label: 'Role', key: 'role', type: 'select', options: ['Principal Investigator', 'Co-Principal Investigator', 'Research Collaborator'], required: true }
                        ]
                    },
                    {
                        label: 'Students Involved', key: 'students_involved', type: 'objectList', subFields: [
                            { label: 'Student Name', key: 'name', required: true, placeholder: 'Enter student name' }, { label: 'Student Roll No', key: 'roll_no', required: true, placeholder: 'Enter roll no' },
                            { label: 'Role', key: 'role', type: 'select', options: ['Research Assistant', 'Intern', 'Contributor'], required: true }
                        ]
                    }
                ]}
            />

            {/* 1 b) Journals */}
            <DynamicTableSection
                title="1) b) Research Papers in Journals"
                data={formData.research.journals}
                uniqueKey="title"
                {...createHandlers('journals')}
                readOnly={readOnly}
                initialItem={{ title: '', author_names: '', name_of_journal: '', publisher: '', other_publisher: '', volume: '', issue: '', issn: '', page_numbers: '', year_of_publication: '', indexing: '', impact_factor: '', doi: '', link_to_paper: '' }}
                fields={[
                    { label: 'Title', key: 'title', fullWidth: true, required: true, placeholder: 'Enter paper title' },
                    { label: 'Authors', key: 'author_names', required: true, placeholder: 'Enter author names' },
                    { label: 'Journal', key: 'name_of_journal', required: true, placeholder: 'Enter journal name' },
                    { label: 'Publisher', key: 'publisher', type: 'select', options: ['Elsevier', 'Springer', 'Wiley', 'IEEE', 'Taylor & Francis', 'MDPI', 'Others'], required: true, placeholder: 'Select publisher' },
                    { label: 'Other Publisher Name', key: 'other_publisher', requiredIf: (item) => item.publisher === 'Others', showIf: (item) => item.publisher === 'Others', placeholder: 'Enter publisher name' },
                    { label: 'Volume', key: 'volume', type: 'number', min: 0, required: true, placeholder: 'Volume' },
                    { label: 'Issue', key: 'issue', required: true, placeholder: 'Issue' },
                    { label: 'ISSN', key: 'issn', required: true, placeholder: 'Enter ISSN' },
                    { label: 'Pages', key: 'page_numbers',type: 'number', min: 0, required: true, placeholder: 'Page numbers' },
                    { label: 'Month-Year', key: 'year_of_publication',type: 'monthYear', ...academicCycleMonthYearBounds, required: true, placeholder: 'e.g., 02-2026' },
                    { label: 'Indexing', key: 'indexing', type: 'select', options: ['SCI', 'SCIE', 'Scopus', 'Web of Science', 'PubMed', 'UGC Care', 'Google Scholar', 'Other'], required: true, placeholder: 'Select Indexing' },
                    { label: 'Impact Factor', key: 'impact_factor', type: 'number', min: 0, required: true, placeholder: 'IF' },
                    { label: 'DOI', key: 'doi', required: true, placeholder: 'DOI' },
                    { label: 'First Page of Published Paper', key: 'link_to_paper', type: 'file', required: true },
                    { label: 'Co-Author', key: 'faculty_members', type: 'objectList', subFields: [
                        { label: 'Author Type', key: 'author_type', type: 'select', options: ['Internal Author', 'External Author'], required: true, placeholder: 'Select type' },
                        { label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty', showIf: (item) => item.author_type !== 'External Author', requiredIf: (item) => item.author_type !== 'External Author' },
                        { label: 'External Author Name', key: 'name', showIf: (item) => item.author_type === 'External Author', requiredIf: (item) => item.author_type === 'External Author', placeholder: 'Enter name' }
                    ] },
                    { label: 'Students', key: 'students', type: 'objectList', subFields: [
                        { label: 'Student Name', key: 'name', required: true, placeholder: 'Enter student name' },
                        { label: 'Student Roll No', key: 'roll_no', required: true, placeholder: 'Enter roll no' }
                    ] }
                ]}
            />

            {/* 1 c) Books */}
            < DynamicTableSection
                title="1) c) Books / Chapters in Edited Volumes"
                data={formData.research.books}
                uniqueKey="title_of_book"
                {...createHandlers('books')}
                readOnly={readOnly}
                initialItem={{
                    department_id: '',
                    publication_type: '',
                    title_of_book: '',
                    title_of_chapter: '',
                    role: '',
                    year: '',
                    isbn_number: '',
                    name_of_publisher: '',
                    publisher_type: '',
                    doi: '',
                    indexing: '',
                    same_institute_affiliation: '',
                    link_to_publication: '',
                    link: ''
                }}
                fields={[


                    { label: 'Publication Type', key: 'publication_type', type: 'select', options: ['Book', 'Chapter'], required: true, placeholder: 'Select type' },
                    { label: 'Title of Book', key: 'title_of_book', requiredIf: (item) => item.publication_type === 'Book', placeholder: 'Enter book title' },
                    { label: 'Title of Chapter', key: 'title_of_chapter', requiredIf: (item) => item.publication_type === 'Chapter', placeholder: 'Enter chapter title' },
                    { label: 'Role', key: 'role', type: 'select', options: ['Author', 'Co-Author', 'Editor'], required: true, placeholder: 'Select role' },
                    { label: 'Month-Year', key: 'year', type: 'monthYear', ...academicCycleMonthYearBounds, required: true, placeholder: 'e.g., 02-2026' },
                    { label: 'ISBN', key: 'isbn_number', placeholder: 'ISBN' },
                    { label: 'Publisher', key: 'name_of_publisher', required: true, placeholder: 'Enter publisher' },
                    { label: 'Publisher Type', key: 'publisher_type', type: 'select', options: ['National', 'International'], required: true, placeholder: 'Select type' },
                    { label: 'DOI', key: 'doi', placeholder: 'DOI' },
                    { label: 'Indexing', key: 'indexing', placeholder: 'Indexing' },
                    { label: 'Affiliation', key: 'same_institute_affiliation', type: 'boolean' },
                    { label: 'PDF', key: 'link_to_publication', type: 'file' },
                    { label: 'Faculty Members', key: 'faculty_members', type: 'objectList', subFields: [{ label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty', defaultValue: user?.faculty_id }] },
                    { label: 'Students', key: 'students', type: 'objectList', subFields: [{ label: 'Student Name', key: 'name', required: true, placeholder: 'Enter student name' }, { label: 'Student Roll No', key: 'roll_no', required: true, placeholder: 'Enter roll no' }] },
                    {
                        label: 'External Contributors', key: 'external_contributors', type: 'objectList', subFields: [
                            { label: 'Name', key: 'name',required: true }, { label: 'Role', key: 'role',required: true }, { label: 'Affiliation', key: 'affiliation' }
                        ]
                    }
                ]}
            />

            {/* 2) Conferences */}
            < DynamicTableSection
                title="2) Participation in Conferences / Seminars (Paper Presentation)"
                data={formData.research.conferences || []}
                uniqueKey="title"
                {...createHandlers('conferences')}
                readOnly={readOnly}
                initialItem={{
                    department_id: '',
                    title: '',
                    name_of_conference: '',
                    conference_level: '',
                    organizer: '',
                    venue: '',
                    publisher: '',
                    other_publisher: '',
                    issn: '',
                    isbn: '',
                    volume: '',
                    page_numbers: '',
                    year_of_publication: '',
                    doi: '',
                    indexing: '',
                    award_received: '',
                    link_to_paper: ''
                }}
                fields={[


                    { label: 'Title', key: 'title', fullWidth: true, required: true, placeholder: 'Enter title' },
                    { label: 'Conference', key: 'name_of_conference', required: true, placeholder: 'Enter conference name' },
                    { label: 'Level', key: 'conference_level', type: 'select', options: ['National', 'International'], required: true, placeholder: 'Select level' },
                    { label: 'Organizer', key: 'organizer', required: true, placeholder: 'Enter organizer' },
                    { label: 'Venue', key: 'venue', required: true, placeholder: 'Enter venue' },
                    { label: 'Publisher', key: 'publisher', type: 'select', options: ['Elsevier', 'Springer', 'Wiley', 'IEEE', 'Taylor & Francis', 'MDPI', 'Others'], required: true, placeholder: 'Select publisher' },
                    { label: 'Other Publisher Name', key: 'other_publisher', requiredIf: (item) => item.publisher === 'Others', showIf: (item) => item.publisher === 'Others', placeholder: 'Enter publisher name' },
                    { label: 'ISSN', key: 'issn', placeholder: 'ISSN' },
                    { label: 'ISBN', key: 'isbn', placeholder: 'ISBN' },
                    { label: 'Volume', key: 'volume', placeholder: 'Volume' },
                    { label: 'Page Numbers', key: 'page_numbers', type: 'number', min: 0, placeholder: 'Pages' },
                    { label: 'Month-Year', key: 'year_of_publication', type: 'monthYear', ...academicCycleMonthYearBounds, required: true, placeholder: 'e.g., 02-2026' },
                    { label: 'DOI', key: 'doi', placeholder: 'DOI' },
                    { label: 'Indexing', key: 'indexing', type: 'select', options: ['SCI', 'SCIE', 'Scopus', 'Web of Science', 'PubMed', 'UGC Care', 'Google Scholar', 'Other'], required: true, placeholder: 'Select Indexing' },
                    { label: 'Award Received', key: 'award_received', placeholder: 'Award details' },
                    { label: 'PDF', key: 'link_to_paper', type: 'file' },
                    { label: 'Faculty Members', key: 'faculty_members', type: 'objectList', subFields: [{ label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty' }] },
                    { label: 'Students', key: 'students', type: 'objectList', subFields: [{ label: 'Student Name', key: 'name', required: true, placeholder: 'Enter student name' }, { label: 'Student Roll No', key: 'roll_no', required: true, placeholder: 'Enter roll no' }] },
                    {
                        label: 'External Contributors', key: 'external_contributors', type: 'objectList', subFields: [
                            { label: 'Name', key: 'name',required: true }, { label: 'Role', key: 'role',required: true }, { label: 'Affiliation', key: 'affiliation'}
                        ]
                    }
                ]}
            />

            {/* PhD Supervision */}
            <div className="pt-6 border-t border-gray-100 space-y-8">
                <div>
                    <div className="flex items-center space-x-4 mb-4">
                        <label className="text-md font-semibold text-gray-800">Are you an Eligible Supervisor?</label>
                        <select
                            className="p-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                            value={formData.research?.is_eligible_supervisor || 'Yes'}
                            onChange={(e) => updateField('research', 'is_eligible_supervisor', e.target.value)}
                            disabled={readOnly}
                        >
                            <option value="Yes">Yes</option>
                            <option value="No">No</option>
                        </select>
                    </div>

                    {formData.research?.is_eligible_supervisor !== 'No' && (
                        <DynamicTableSection
                            title="Details of PhD Supervision / Defence"
                data={formData.research.phd_supervision || []}
                uniqueKey="thesis_title"
                {...createHandlers('phd_supervision')}
                readOnly={readOnly}
                initialItem={{
                    department_id: '',
                    supervisor_id: currentFacultyId,
                    supervisor_name: user?.name || '',
                    supervision_location: '',
                    student_name: '',
                    enrollment_no: '',
                    thesis_title: '',
                    thesis_type: '',
                    supervisor_role: '',
                    status: '',
                    date_of_registration: '',
                    academic_year: resolvedAcademicYear,
                    date_of_defence: '',
                    date_of_result_notification: '',
                    remarks: '',
                    link: ''
                }}
                fields={[


                    { label: 'Supervisor ID', key: 'supervisor_id', type: 'entitySelect', entityType: 'faculty', required: true, defaultValue: currentFacultyId, disabled: true },
                    { label: 'Supervisor Name', key: 'supervisor_name', required: true, placeholder: 'Enter supervisor name' },
                    { label: 'Student Name', key: 'student_name', required: true, placeholder: 'Enter student name' },
                    { label: 'Student Roll/Enrollment No', key: 'enrollment_no', required: true, placeholder: 'Enter enrollment no' },
                    { label: 'Student Thesis Title', key: 'thesis_title', required: true, placeholder: 'Enter thesis title' },
                    { label: 'Student Thesis Type', key: 'thesis_type', type: 'select', options: ['Full-time', 'Part-time', 'Sponsored', 'Industry-linked', 'Other'], required: true, placeholder: 'Select type' },
                    { label: 'Supervision Location', key: 'supervision_location', type: 'select', options: ['Internal (Within University)', 'External (Outside University)'], required: true, placeholder: 'Select location' },
                    { label: 'Supervisor Role', key: 'supervisor_role', required: true, placeholder: 'Enter role' },
                    { label: 'Status', key: 'status', type: 'select', options: ['Ongoing', 'Submitted', 'Awarded'], required: true, placeholder: 'Select status' },
                    { label: 'Student Date of Registration', key: 'date_of_registration', type: 'date', required: true },
                    academicYearField,
                    { label: 'Student Defence Date', key: 'date_of_defence', type: 'date', required: true },
                    { label: 'Result Notification Date', key: 'date_of_result_notification', type: 'date', required: true },
                    { label: 'Remarks', key: 'remarks', placeholder: 'Remarks' },
                    { label: 'Upload Result Notified for Defence', key: 'link', type: 'file', required: true },
                    {
                        label: 'Co-Supervisors', key: 'co_supervisors', type: 'objectList', subFields: [
                            { label: 'Faculty Name', key: 'name', required: true, placeholder: 'Enter name' },
                            { label: 'Emp Code', key: 'emp_code', required: true, placeholder: 'Enter emp code' },
                            { label: 'Supervision Location', key: 'supervision_location', type: 'select', options: ['Internal (Within University)', 'External (Outside University)'], required: true, placeholder: 'Select location' },
                            { label: 'Role', key: 'role', type: 'select', options: ['Co-Supervisor 1', 'Co-Supervisor 2', 'Other'], required: true }
                        ]
                    }
                ]}
            />
                    )}
                </div>
            </div>

            {/* Awards */}
            < DynamicTableSection
                title="Awards & Recognitions"
                data={formData.research.awards || []}
                uniqueKey="name_of_award"
                {...createHandlers('awards')}
                readOnly={readOnly}
                initialItem={{ name_of_award: '', awarding_agency: '', category_of_award: '', date_of_award: '', evidence_link: '' }}
                fields={[

                    { label: 'Award Name', key: 'name_of_award', required: true, placeholder: 'Enter award name' },
                    { label: 'Agency', key: 'awarding_agency', required: true, placeholder: 'Enter agency' },
                    { label: 'Organization', key: 'name_of_organisation', placeholder: 'Enter organization' },
                    { label: 'Category', key: 'category_of_award', placeholder: 'Enter category' },
                    { label: 'Type', key: 'type_of_award', type: 'select', options: ['International', 'National', 'State', 'University'], required: true, placeholder: 'Select type' },
                    { label: 'Month-Year', key: 'year', type: 'monthYear', ...academicCycleMonthYearBounds, required: true, placeholder: 'MM-YYYY' },
                    { label: 'Value (INR)', key: 'monetary_value',  type: 'number', min: 0, placeholder: 'Enter amount' },
                    { label: 'Date', key: 'date_of_award', type: 'date', required: true },
                    { label: 'Evidence PDF', key: 'evidence_link', type: 'file' },
                    { label: 'PDF', key: 'link', type: 'file' }
                ]}
            />

            {/* E-Content */}
            < DynamicTableSection
                title="E-Content Developed"
                data={formData.research.e_content || []}
                uniqueKey="name_of_module"
                {...createHandlers('e_content')}
                readOnly={readOnly}
                initialItem={{
                    department_id: '',
                    faculty_id: currentFacultyId,
                    course_id: '',
                    name_of_module: '',
                    type_of_content: '',
                    platform: '',
                    platform_type: '',
                    target_audience: '',
                    academic_year: resolvedAcademicYear,
                    semester: '',
                    date_of_launching: '',
                    duration_hours: '',
                    learning_outcome: '',
                    remarks: '',
                    link: ''
                }}
                fields={[


                    { label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty', required: true, defaultValue: currentFacultyId, disabled: true },
                    // Use draft-derived course IDs if available; fallback to global course list via entityType
                    { label: 'Course Name', key: 'course_id', type: 'entitySelect', entityType: 'course', required: true, optionsOverride: courseOptionsFromDraft },
                    { label: 'Module Name', key: 'name_of_module', required: true, placeholder: 'Enter module name' },
                    { label: 'Type', key: 'type_of_content', type: 'select', options: ['Video', 'Module', 'Quiz', 'PPT', 'Simulation', 'eBook', 'Other'], required: true, placeholder: 'Select type' },
                    { label: 'Platform', key: 'platform', required: true, placeholder: 'Enter platform' },
                    { label: 'Platform Type', key: 'platform_type', type: 'select', options: ['LMS', 'MOOC', 'YouTube', 'SWAYAM', 'Internal', 'Other'], required: true, placeholder: 'Select platform type' },
                    { label: 'Target Audience', key: 'target_audience', type: 'select', options: ['UG', 'PG', 'PhD', 'Faculty', 'Students', 'Mixed'], required: true, placeholder: 'Select audience' },
                    academicYearField,
                    { label: 'Semester', key: 'semester', required: true, placeholder: 'e.g., Odd' },
                    { label: 'Date', key: 'date_of_launching', type: 'date', required: true },
                    { label: 'Duration (Hours)', key: 'duration_hours', type: 'number', min: 0, placeholder: 'Hours' },
                    { label: 'Outcome', key: 'learning_outcome', required: true, placeholder: 'Enter outcome' },
                    { label: 'Remarks', key: 'remarks', placeholder: 'Remarks' },
                    { label: 'PDF', key: 'link', type: 'file' }
                ]}
            />

            {/* Collaborations */}
            < DynamicTableSection
                title="Collaborations / MoUs"
                data={formData.research.collaborations || []}
                uniqueKey="title_of_activity"
                {...createHandlers('collaborations')}
                readOnly={readOnly}
                initialItem={{
                    department_id: '',
                    title_of_activity: '',
                    type_of_activity: '',
                    name_of_collaborative_agency: '',
                    level: '',
                    nature_of_collaboration: '',
                    number_of_participants: '',
                    funding_amount: '',
                    source_of_financial_support: '',
                    duration: '',
                    year: '',
                    academic_year: resolvedAcademicYear,
                    start_date: '',
                    end_date: '',
                    outcome: '',
                    remarks: '',
                    link: ''
                }}
                fields={[


                    { label: 'Activity Title', key: 'title_of_activity', required: true, placeholder: 'Enter title' },
                    { label: 'Type', key: 'type_of_activity', type: 'select', options: ['Workshop', 'Seminar', 'Industrial Visit', 'Research Collaboration', 'MoU', 'Joint Program', 'Other'], required: true, placeholder: 'Select type' },
                    { label: 'Agency', key: 'name_of_collaborative_agency', required: true, placeholder: 'Enter agency' },
                    { label: 'Level', key: 'level', type: 'select', options: ['Institutional', 'National', 'International'], required: true, placeholder: 'Select level' },
                    { label: 'Nature', key: 'nature_of_collaboration', placeholder: 'Describe nature' },
                    { label: 'Participants', key: 'number_of_participants', type: 'number', min: 0, placeholder: 'Count' },
                    { label: 'Funding', key: 'funding_amount', type: 'number', min: 0, placeholder: 'Amount' },
                    { label: 'Funding Source', key: 'source_of_financial_support', placeholder: 'Source' },
                    { label: 'Duration', key: 'duration', placeholder: 'e.g., 2 days' },
                    { label: 'Month-Year', key: 'year', type: 'monthYear', ...academicCycleMonthYearBounds, required: true, placeholder: 'MM-YYYY' },
                    academicYearField,
                    { label: 'Start Date', key: 'start_date', type: 'date', required: true },
                    { label: 'End Date', key: 'end_date', type: 'date', required: true },
                    { label: 'Outcome', key: 'outcome', placeholder: 'Outcome' },
                    { label: 'Remarks', key: 'remarks', placeholder: 'Remarks' },
                    { label: 'PDF', key: 'link', type: 'file' },
                    {
                        label: 'Faculty Involved', key: 'faculty_involved', type: 'objectList', subFields: [
                            { label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty', required: true },
                            { label: 'Role', key: 'role', required: true }
                        ]
                    },
                    {
                        label: 'Students Involved', key: 'students_involved', type: 'objectList', subFields: [
                            { label: 'Student Name', key: 'name', required: true, placeholder: 'Enter student name' }, { label: 'Student Roll No', key: 'roll_no', required: true, placeholder: 'Enter roll no' },
                            { label: 'Role', key: 'role', required: true }
                        ]
                    },
                    {
                        label: 'External Collaborators', key: 'external_collaborators', type: 'objectList', subFields: [
                            { label: 'Name', key: 'name', required: true }, { label: 'Role', key: 'role', required: true }, { label: 'Affiliation', key: 'affiliation' }
                        ]
                    }
                ]}
            />

            {/* Faculty Visits */}
            < DynamicTableSection
                title="Faculty Visits / Expert Lectures"
                data={formData.research.faculty_visits || []}
                uniqueKey="title"
                {...createHandlers('faculty_visits')}
                readOnly={readOnly}
                initialItem={{ organisation_name: '', title: '', link: '' }}
                fields={[

                    { label: 'Organization', key: 'organisation_name', required: true, placeholder: 'Enter organization' },
                    { label: 'Title/Context', key: 'title', required: true, placeholder: 'Enter title' },
                    { label: 'Location', key: 'location', placeholder: 'Location' },
                    { label: 'Start Date', key: 'start_date', type: 'date', required: true },
                    { label: 'End Date', key: 'end_date', type: 'date', required: true },
                    { label: 'Institutional Affiliation', key: 'same_institute_affiliation', type: 'select', options: ['Yes', 'No'], placeholder: 'Select' },
                    { label: 'Pub PDF', key: 'link_to_publication', type: 'file' },
                    { label: 'Proof PDF', key: 'link', type: 'file' },
                    { label: 'Faculty IDs', key: 'faculty_ids', type: 'objectList', subFields: [{ label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty' }] },
                    { label: 'Student IDs', key: 'student_ids', type: 'objectList', subFields: [{ label: 'Student Name', key: 'name', required: true, placeholder: 'Enter student name' }, { label: 'Student Roll No', key: 'roll_no', required: true, placeholder: 'Enter roll no' }] },
                    {
                        label: 'External Contributors', key: 'external_contributors', type: 'objectList', subFields: [
                            { label: 'Name', key: 'name',required: true }, { label: 'Role', key: 'role', required: true }, { label: 'Affiliation', key: 'affiliation' }
                        ]
                    }
                ]}
            />

            {/* FDPs / Events */}
            < DynamicTableSection
                title="FDPs / Workshops / Seminars"
                data={formData.research.fdps || []}
                uniqueKey="program_title"
                {...createHandlers('fdps')}
                readOnly={readOnly}
                initialItem={{
                    department_id: '',
                    program_title: '',
                    type_of_program: '',
                    level: '',
                    participation_level: '',
                    amount_for_funding: '',
                    mode: '',
                    organising_body: '',
                    venue: '',
                    duration_days: '',
                    academic_year: resolvedAcademicYear,
                    funding_agency: '',
                    start_date: '',
                    end_date: '',
                    outcome: '',
                    remarks: '',
                    certificate_link: '',
                    link: ''
                }}
                fields={[


                    { label: 'Program Title', key: 'program_title', required: true, placeholder: 'Enter title' },
                    { label: 'Type', key: 'type_of_program', type: 'select', options: ['FDP', 'Workshop', 'Seminar', 'STTP', 'Training', 'Orientation', 'Other'], required: true, placeholder: 'Select type' },
                    { label: 'Specify Other Type', key: 'type_of_program_other', showIf: (item) => item.type_of_program === 'Other', requiredIf: (item) => item.type_of_program === 'Other', placeholder: 'Enter type', hideInTable: true },
                    { label: 'Level', key: 'level', type: 'select', options: ['Institutional', 'National', 'International'], required: true, placeholder: 'Select level' },
                    { label: 'Participation Level', key: 'participation_level', type: 'select', options: ['Attended', 'Organized'], placeholder: 'Select Attended/Organized' },
                    { label: 'Amount for Funding (INR)', key: 'amount_for_funding', type: 'number', min: 0, placeholder: 'Enter amount' },
                    { label: 'Mode', key: 'mode', type: 'select', options: ['Online', 'Offline', 'Hybrid'], required: true, placeholder: 'Select mode' },
                    { label: 'Organizer', key: 'organising_body', required: true, placeholder: 'Enter organizer' },
                    { label: 'Venue', key: 'venue', placeholder: 'Venue' },
                    { label: 'Duration (Days)', key: 'duration_days', type: 'number', min: 0, required: true, placeholder: 'No. of days' },
                    academicYearField,
                    { label: 'Funding Agency', key: 'funding_agency', placeholder: 'Agency' },
                    { label: 'Start Date', key: 'start_date', type: 'date', required: true }, 
                    { label: 'End Date', key: 'end_date', type: 'date', required: true },
                    { label: 'Outcome', key: 'outcome', placeholder: 'Outcome' },
                    { label: 'Remarks', key: 'remarks', placeholder: 'Remarks' },
                    { label: 'Certificate PDF', key: 'certificate_link', type: 'file' },
                    { label: 'PDF', key: 'link', type: 'file' },
                    {
                        label: 'Faculty Participants', key: 'faculty_participants', type: 'objectList', subFields: [
                            { label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty', required: true },
                            { label: 'Role', key: 'role', required: true }
                        ]
                    },
                    {
                        label: 'External Participants', key: 'external_participants', type: 'objectList', subFields: [
                            { label: 'Name', key: 'name', required: true }, { label: 'Role', key: 'role', required: true }, { label: 'Affiliation', key: 'affiliation' }
                        ]
                    }
                ]}
            />

            {/* 3.. Textareas */}
            < div className="space-y-6 pt-6 border-t border-gray-100" >
                <div>
                    <label className="block text-md font-semibold text-gray-800 mb-2">3) Summer institutes, refresher or orientation courses</label>
                    <div className="space-y-4">
                        <DynamicTableSection
                            title="a) Attended"
                            data={formData.research.summer_institutes_attended || []}
                            uniqueKey="description"
                            {...createHandlers('summer_institutes_attended')}
                            readOnly={readOnly}
                            initialItem={{ description: '' }}
                            fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Enter details' }]}
                        />
                        <DynamicTableSection
                            title="b) Organized / Conducted"
                            data={formData.research.summer_institutes_organized || []}
                            uniqueKey="description"
                            {...createHandlers('summer_institutes_organized')}
                            readOnly={readOnly}
                            initialItem={{ description: '' }}
                            fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Enter details' }]}
                        />
                    </div>
                </div>
                <div className="space-y-4">
                    <label className="block text-md font-semibold text-gray-800 mb-2">4) Details of Guidance for:</label>
                    <DynamicTableSection
                        title="i) U.G. and P.G. Project Guidance"
                        data={formData.research.ug_pg_guidance || []}
                        uniqueKey="description"
                        {...createHandlers('ug_pg_guidance')}
                        readOnly={readOnly}
                        initialItem={{ description: '' }}
                        fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Enter details' }]}
                    />

                    <DynamicTableSection
                        title="ii) Research guidance"
                        data={formData.research.research_guidance || []}
                        uniqueKey="description"
                        {...createHandlers('research_guidance')}
                        readOnly={readOnly}
                        initialItem={{ description: '' }}
                        fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Enter details' }]}
                    />
                </div>
            </div>

            {/* 5) Patents & Consultancy */}
            <div className="pt-6 border-t border-gray-100 space-y-8">
                <div>
                    <label className="block text-md font-semibold text-gray-800 mb-2">5) Details of industrial interaction/professional consultancy/patent obtained or applied for</label>

                    <div className="mb-6">
                        <DynamicTableSection
                            title="i) General Description"
                            data={formData.research.industry_interaction || []}
                            uniqueKey="description"
                            {...createHandlers('industry_interaction')}
                            readOnly={readOnly}
                            initialItem={{
                                description: ''
                            }}
                            fields={[
                                { label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Enter general description' }
                            ]}
                        />
                    </div>

                    <DynamicTableSection
                        title="ii) Patents (obtained or applied for)"
                        data={formData.research.patents || []}
                        uniqueKey="patent_title"
                        {...createHandlers('patents')}
                        readOnly={readOnly}
                        initialItem={{
                            department_id: '',
                            patent_title: '',
                            author_names: '',
                            application_number: '',
                            patent_number: '',
                            status: '',
                            country: '',
                            patent_awarding_agency: '',
                            date_of_filing: '',
                            date_of_award: '',
                            link_to_patent: '',
                            link: ''
                        }}
                        fields={[

                            { label: 'Department ID', key: 'department_id', type: 'entitySelect', entityType: 'department', required: true },
                            { label: 'Title', key: 'patent_title', required: true, placeholder: 'Enter patent title' },
                            { label: 'Authors', key: 'author_names', required: true, placeholder: 'Enter authors' },
                            { label: 'App No.', key: 'application_number', placeholder: 'App No' },
                            { label: 'Patent No.', key: 'patent_number', placeholder: 'Patent No' },
                            { label: 'Status', key: 'status', type: 'select', options: ['Filed', 'Published', 'Granted'], required: true, placeholder: 'Select status' },
                            { label: 'Country', key: 'country', placeholder: 'Country' },
                            { label: 'Awarding Agency', key: 'patent_awarding_agency', placeholder: 'Agency' },
                            { label: 'Filing Date', key: 'date_of_filing', type: 'date' },
                            { label: 'Award Date', key: 'date_of_award', type: 'date' },
                            { label: 'PDF', key: 'link_to_patent', type: 'file' },
                            { label: 'Faculty Members', key: 'faculty_members', type: 'objectList', subFields: [{ label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty' }] },
                            { label: 'Students', key: 'students', type: 'objectList', subFields: [{ label: 'Student Name', key: 'name', required: true, placeholder: 'Enter student name' }, { label: 'Student Roll No', key: 'roll_no', required: true, placeholder: 'Enter roll no' }] },
                            {
                                label: 'External Inventors', key: 'external_inventors', type: 'objectList', subFields: [
                                    { label: 'Name', key: 'name', required: true }, { label: 'Role', key: 'role', required: true }, { label: 'Affiliation', key: 'affiliation' }
                                ]
                            }
                        ]}
                    />

                    <div className="mt-8"></div>

                    <DynamicTableSection
                        title="iii) Professional Consultancy"
                        data={formData.research.consultancy || []}
                        uniqueKey="name_of_project"
                        {...createHandlers('consultancy')}
                        readOnly={readOnly}
                        initialItem={{ name_of_project: '', agency_name: '', grant_amount: '', start_date: '', end_date: '', type_of_agency: '', consultancy_type: '', year_of_consultancy: '', revenue_generated: '', link: '', faculty_involved: [], students_involved: [], external_collaborators: [], external_consultants: [] }}
                        fields={[
                            { label: 'Project Name', key: 'name_of_project', required: true, placeholder: 'Enter project name' },
                            { label: 'Agency', key: 'agency_name', required: true, placeholder: 'Enter agency' },
                            { label: 'Type', key: 'type_of_agency', type: 'select', options: ['Government', 'Private'], required: true, placeholder: 'Select type' },
                            { label: 'Grant', key: 'grant_amount', type: 'number', min: 0,required: true, placeholder: 'Amount' },
                            { label: 'Revenue', key: 'revenue_generated', type: 'number', min: 0, placeholder: 'Revenue' },
                            { label: 'Start Date', key: 'start_date', type: 'date', required: true },
                            { label: 'PDF', key: 'link', type: 'file' },
                            {
                                label: 'Faculty Involved', key: 'faculty_involved', type: 'objectList', subFields: [
                                    { label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty', required: true },
                                    { label: 'Role', key: 'role', required: true }
                                ]
                            },
                            {
                                label: 'Students Involved', key: 'students_involved', type: 'objectList', subFields: [
                                    { label: 'Student Name', key: 'name', required: true, placeholder: 'Enter student name' }, { label: 'Student Roll No', key: 'roll_no', required: true, placeholder: 'Enter roll no' },
                                    { label: 'Role', key: 'role', required: true }
                                ]
                            },
                            {
                                label: 'External Collaborators', key: 'external_collaborators', type: 'objectList', subFields: [
                                    { label: 'Name', key: 'name', required: true }, { label: 'Role', key: 'role', required: true }, { label: 'Affiliation', key: 'affiliation' }
                                ]
                            },
                            {
                                label: 'External Consultants', key: 'external_consultants', type: 'objectList', subFields: [
                                    { label: 'Name', key: 'name', required: true }, { label: 'Role', key: 'role', required: true }, { label: 'Affiliation', key: 'affiliation' }
                                ]
                            }
                        ]}
                    />
                </div>
            </div>

            {/* 6 & 7 Textareas */}
            <div className="space-y-6 pt-6 border-t border-gray-100">
                <DynamicTableSection
                    title="6) Membership or fellowship of professional/academic Bodies, Societies etc. give details"
                    data={formData.research.memberships_text || []}
                    uniqueKey="description"
                    {...createHandlers('memberships_text')}
                    readOnly={readOnly}
                    initialItem={{ description: '' }}
                    fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Enter details' }]}
                />

                <DynamicTableSection
                    title="7) Any other information regarding academic activities not covered"
                    data={formData.research.other_activities || []}
                    uniqueKey="description"
                    {...createHandlers('other_activities')}
                    readOnly={readOnly}
                    initialItem={{ description: '' }}
                    fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Enter details' }]}
                />
            </div>
        </div >
    );
}

