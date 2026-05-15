import React from 'react';
import { useSelector } from 'react-redux';
import { selectAparUser } from '../../store/slices/aparAuthSlice';
import DynamicTableSection from '../../components/DynamicTableSection';

export default function PartIII({ formData, addItem, removeItem, updateArrayField, updateArrayItem, updateField, readOnly }) {
    const user = useSelector(selectAparUser);

    // Helper handlers generator
    const createHandlers = (field) => ({
        onAdd: (item) => addItem('research', field, item),
        onUpdate: (index, newItem) => updateArrayItem('research', field, index, newItem)
        // onRemove: (index) => removeItem('research', field, index)
    });

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-10">
            <h3 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4">Part III - RESEARCH & DEVELOPMENT</h3>

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
                    type_of_project: '',
                    funding_agency_name: '',
                    funding_type: '',
                    sanction_number: '',
                    year_of_sanction: '',
                    academic_year: '',
                    start_date: '',
                    end_date: '',
                    amount: '',
                    status: '',
                    outcome: '',
                    remarks: '',
                    link: '',
                    faculty_involved: [],
                    students_involved: []
                }}
                fields={[
                    { label: 'Research Title', key: 'title_research', fullWidth: true, required: true, placeholder: 'Enter research title' },
                    { label: 'Project Type', key: 'type_of_project', type: 'select', options: ['Research', 'Consultancy', 'Innovation', 'Startup', 'Other'], required: true, placeholder: 'Select type' },
                    { label: 'Funding Agency', key: 'funding_agency_name', required: true, placeholder: 'Enter funding agency' },
                    { label: 'Funding Type', key: 'funding_type', type: 'select', options: ['Government', 'Non-Government', 'Industry'], required: true, placeholder: 'Select funding type' },
                    { label: 'Sanction Number', key: 'sanction_number', placeholder: 'Enter sanction number' },
                    { label: 'Year of Sanction', key: 'year_of_sanction', type: 'number', required: true, placeholder: 'e.g., 2024' },
                    { label: 'Academic Year', key: 'academic_year', required: true, placeholder: 'e.g., 2023-24' },
                    { label: 'Start Date', key: 'start_date', type: 'date', required: true },
                    { label: 'End Date', key: 'end_date', type: 'date', required: true },
                    { label: 'Amount (INR)', key: 'amount', type: 'number', placeholder: 'Enter amount' },
                    { label: 'Status', key: 'status', type: 'select', options: ['Ongoing', 'Completed', 'Submitted'], required: true, placeholder: 'Select status' },
                    { label: 'Outcome', key: 'outcome', placeholder: 'Describe outcome' },
                    { label: 'Remarks', key: 'remarks', placeholder: 'Enter remarks' },
                    { label: 'PDF', key: 'link', type: 'file' },
                    {
                        label: 'Faculty Involved', key: 'faculty_involved', type: 'objectList', subFields: [
                            { label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty', defaultValue: user?.faculty_id },
                            { label: 'Role', key: 'role', type: 'select', options: ['Principal Investigator', 'Co-Principal Investigator', 'Research Collaborator'] }
                        ]
                    },
                    {
                        label: 'Students Involved', key: 'students_involved', type: 'objectList', subFields: [
                            { label: 'Student ID', key: 'student_id', type: 'entitySelect', entityType: 'student' },
                            { label: 'Role', key: 'role', type: 'select', options: ['Research Assistant', 'Intern', 'Contributor'] }
                        ]
                    },
                    {
                        label: 'External Collaborators', key: 'external_collaborators', type: 'objectList', subFields: [
                            { label: 'Name', key: 'name' }, { label: 'Role', key: 'role', type: 'select', options: ['Principal Investigator', 'Co-PI', 'Research Collaborator', 'Other'] },
                            { label: 'Affiliation', key: 'affiliation' }, { label: 'Email', key: 'email' }
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
                initialItem={{ title: '', author_names: '', name_of_journal: '', volume: '', issue: '', issn: '', page_numbers: '', year_of_publication: '', indexing: '', doi: '', link_to_paper: '' }}
                fields={[
                    { label: 'Title', key: 'title', fullWidth: true, required: true, placeholder: 'Enter paper title' },
                    { label: 'Paper ID', key: 'paper_id', placeholder: 'Enter paper ID' },
                    { label: 'Authors', key: 'author_names', required: true, placeholder: 'Enter author names' },
                    { label: 'Journal', key: 'name_of_journal', required: true, placeholder: 'Enter journal name' },
                    { label: 'Volume', key: 'volume', placeholder: 'Volume' },
                    { label: 'Issue', key: 'issue', placeholder: 'Issue' },
                    { label: 'ISSN', key: 'issn', placeholder: 'Enter ISSN' },
                    { label: 'Pages', key: 'page_numbers', placeholder: 'Page numbers' },
                    { label: 'Year', key: 'year_of_publication', required: true, placeholder: 'e.g., 2024' },
                    { label: 'Indexing', key: 'indexing', placeholder: 'Indexing' },
                    { label: 'Impact Factor', key: 'impact_factor', placeholder: 'IF' },
                    { label: 'Citation Count', key: 'citation_count', placeholder: 'Citations' },
                    { label: 'UGC Listed', key: 'is_ugc_care_listed', type: 'select', options: ['Yes', 'No'], required: true, placeholder: 'Select' },
                    { label: 'Status', key: 'paper_status', type: 'select', options: ['Published', 'Presented', 'Accepted', 'Under Review'], required: true, placeholder: 'Select status' },
                    { label: 'DOI', key: 'doi', placeholder: 'DOI' },
                    { label: 'Paper PDF', key: 'link_to_paper', type: 'file' },
                    { label: 'Proof PDF', key: 'link', type: 'file' },
                    { label: 'Faculty Members', key: 'faculty_members', type: 'objectList', subFields: [{ label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty', defaultValue: user?.faculty_id }] },
                    { label: 'Students', key: 'students', type: 'objectList', subFields: [{ label: 'Student ID', key: 'student_id', type: 'entitySelect', entityType: 'student' }] },
                    {
                        label: 'External Contributors', key: 'external_contributors', type: 'objectList', subFields: [
                            { label: 'Name', key: 'name' }, { label: 'Role', key: 'role' }, { label: 'Affiliation', key: 'affiliation' }
                        ]
                    }
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
                    { label: 'Title of Book', key: 'title_of_book', required: true, placeholder: 'Enter book title' },
                    { label: 'Title of Chapter', key: 'title_of_chapter', placeholder: 'Enter chapter title' },
                    { label: 'Role', key: 'role', type: 'select', options: ['Author', 'Co-Author', 'Editor'], required: true, placeholder: 'Select role' },
                    { label: 'Year', key: 'year', type: 'number', required: true, placeholder: 'e.g., 2024' },
                    { label: 'ISBN', key: 'isbn_number', placeholder: 'ISBN' },
                    { label: 'Publisher', key: 'name_of_publisher', required: true, placeholder: 'Enter publisher' },
                    { label: 'Publisher Type', key: 'publisher_type', type: 'select', options: ['National', 'International'], required: true, placeholder: 'Select type' },
                    { label: 'DOI', key: 'doi', placeholder: 'DOI' },
                    { label: 'Indexing', key: 'indexing', placeholder: 'Indexing' },
                    { label: 'Affiliation', key: 'same_institute_affiliation', type: 'boolean' },
                    { label: 'PDF', key: 'link_to_publication', type: 'file' },
                    { label: 'Faculty Members', key: 'faculty_members', type: 'objectList', subFields: [{ label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty', defaultValue: user?.faculty_id }] },
                    { label: 'Students', key: 'students', type: 'objectList', subFields: [{ label: 'Student ID', key: 'student_id', type: 'entitySelect', entityType: 'student' }] },
                    {
                        label: 'External Contributors', key: 'external_contributors', type: 'objectList', subFields: [
                            { label: 'Name', key: 'name' }, { label: 'Role', key: 'role' }, { label: 'Affiliation', key: 'affiliation' }
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
                    paper_status: '',
                    publisher: '',
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
                    { label: 'Level', key: 'conference_level', type: 'select', options: ['State', 'National', 'International'], required: true, placeholder: 'Select level' },
                    { label: 'Organizer', key: 'organizer', required: true, placeholder: 'Enter organizer' },
                    { label: 'Venue', key: 'venue', required: true, placeholder: 'Enter venue' },
                    { label: 'Paper Status', key: 'paper_status', type: 'select', options: ['Published', 'Accepted', 'Presented', 'Under Review'], required: true, placeholder: 'Select status' },
                    { label: 'Publisher', key: 'publisher', placeholder: 'Publisher' },
                    { label: 'ISSN', key: 'issn', placeholder: 'ISSN' },
                    { label: 'ISBN', key: 'isbn', placeholder: 'ISBN' },
                    { label: 'Volume', key: 'volume', placeholder: 'Volume' },
                    { label: 'Page Numbers', key: 'page_numbers', placeholder: 'Pages' },
                    { label: 'Year', key: 'year_of_publication', type: 'number', required: true, placeholder: 'e.g., 2024' },
                    { label: 'DOI', key: 'doi', placeholder: 'DOI' },
                    { label: 'Indexing', key: 'indexing', placeholder: 'Indexing' },
                    { label: 'Award Received', key: 'award_received', placeholder: 'Award details' },
                    { label: 'PDF', key: 'link_to_paper', type: 'file' },
                    { label: 'Faculty Members', key: 'faculty_members', type: 'objectList', subFields: [{ label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty' }] },
                    { label: 'Students', key: 'students', type: 'objectList', subFields: [{ label: 'Student ID', key: 'student_id', type: 'entitySelect', entityType: 'student' }] },
                    {
                        label: 'External Contributors', key: 'external_contributors', type: 'objectList', subFields: [
                            { label: 'Name', key: 'name' }, { label: 'Role', key: 'role' }, { label: 'Affiliation', key: 'affiliation' }
                        ]
                    }
                ]}
            />

            {/* PhD Supervision */}
            < DynamicTableSection
                title="Details of PhD Supervision / Defence"
                data={formData.research.phd_supervision || []}
                uniqueKey="thesis_title"
                {...createHandlers('phd_supervision')}
                readOnly={readOnly}
                initialItem={{
                    department_id: '',
                    supervisor_id: '',
                    supervisor_name: '',
                    student_id: '',
                    student_name: '',
                    enrollment_no: '',
                    thesis_title: '',
                    thesis_type: '',
                    supervisor_role: '',
                    status: '',
                    result_outcome: '',
                    registration_year: '',
                    academic_year: '',
                    date_of_defence: '',
                    date_of_result_notification: '',
                    remarks: '',
                    link: ''
                }}
                fields={[


                    { label: 'Supervisor ID', key: 'supervisor_id', type: 'entitySelect', entityType: 'faculty', required: true },
                    { label: 'Supervisor Name', key: 'supervisor_name', required: true, placeholder: 'Enter supervisor name' },
                    { label: 'Student ID', key: 'student_id', type: 'entitySelect', entityType: 'student', required: true },
                    { label: 'Student Name', key: 'student_name', required: true, placeholder: 'Enter student name' },
                    { label: 'Enrollment No', key: 'enrollment_no', required: true, placeholder: 'Enter enrollment no' },
                    { label: 'Thesis Title', key: 'thesis_title', required: true, placeholder: 'Enter thesis title' },
                    { label: 'Thesis Type', key: 'thesis_type', type: 'select', options: ['Full-time', 'Part-time', 'Sponsored', 'Industry-linked', 'Other'], required: true, placeholder: 'Select type' },
                    { label: 'Supervisor Role', key: 'supervisor_role', placeholder: 'Enter role' },
                    { label: 'Status', key: 'status', type: 'select', options: ['Ongoing', 'Submitted', 'Awarded'], required: true, placeholder: 'Select status' },
                    { label: 'Result Outcome', key: 'result_outcome', type: 'select', options: ['Accepted', 'Minor Revision', 'Major Revision', 'Rejected', 'Other'], placeholder: 'Select outcome' },
                    { label: 'Reg. Year', key: 'registration_year', type: 'number', required: true, placeholder: 'YYYY' },
                    { label: 'Academic Year', key: 'academic_year', required: true, placeholder: '20XX-YY' },
                    { label: 'Defence Date', key: 'date_of_defence', type: 'date' },
                    { label: 'Notification Date', key: 'date_of_result_notification', type: 'date' },
                    { label: 'Remarks', key: 'remarks', placeholder: 'Remarks' },
                    { label: 'PDF', key: 'link', type: 'file' },
                    {
                        label: 'Co-Supervisors', key: 'co_supervisors', type: 'objectList', subFields: [
                            { label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty' },
                            { label: 'Role', key: 'role' }
                        ]
                    },
                    {
                        label: 'External Examiners', key: 'external_examiners', type: 'objectList', subFields: [
                            { label: 'Name', key: 'name' }, { label: 'Affiliation', key: 'affiliation' }
                        ]
                    }
                ]}
            />

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
                    { label: 'Year', key: 'year', type: 'number', required: true, placeholder: 'YYYY' },
                    { label: 'Value (INR)', key: 'monetary_value', type: 'number', placeholder: 'Enter amount' },
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
                    faculty_id: '',
                    course_id: '',
                    name_of_module: '',
                    type_of_content: '',
                    platform: '',
                    platform_type: '',
                    target_audience: '',
                    academic_year: '',
                    semester: '',
                    date_of_launching: '',
                    duration_hours: '',
                    learning_outcome: '',
                    remarks: '',
                    link: ''
                }}
                fields={[


                    { label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty', required: true },
                    { label: 'Course ID', key: 'course_id', type: 'entitySelect', entityType: 'course', required: true },
                    { label: 'Module Name', key: 'name_of_module', required: true, placeholder: 'Enter module name' },
                    { label: 'Type', key: 'type_of_content', type: 'select', options: ['Video', 'Module', 'Quiz', 'PPT', 'Simulation', 'eBook', 'Other'], required: true, placeholder: 'Select type' },
                    { label: 'Platform', key: 'platform', required: true, placeholder: 'Enter platform' },
                    { label: 'Platform Type', key: 'platform_type', type: 'select', options: ['LMS', 'MOOC', 'YouTube', 'SWAYAM', 'Internal', 'Other'], required: true, placeholder: 'Select platform type' },
                    { label: 'Target Audience', key: 'target_audience', type: 'select', options: ['UG', 'PG', 'PhD', 'Faculty', 'Students', 'Mixed'], required: true, placeholder: 'Select audience' },
                    { label: 'Academic Year', key: 'academic_year', required: true, placeholder: 'YYYY-YY' },
                    { label: 'Semester', key: 'semester', required: true, placeholder: 'e.g., Odd' },
                    { label: 'Date', key: 'date_of_launching', type: 'date', required: true },
                    { label: 'Duration (Hours)', key: 'duration_hours', type: 'number', placeholder: 'Hours' },
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
                    academic_year: '',
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
                    { label: 'Participants', key: 'number_of_participants', type: 'number', placeholder: 'Count' },
                    { label: 'Funding', key: 'funding_amount', type: 'number', placeholder: 'Amount' },
                    { label: 'Funding Source', key: 'source_of_financial_support', placeholder: 'Source' },
                    { label: 'Duration', key: 'duration', placeholder: 'e.g., 2 days' },
                    { label: 'Year', key: 'year', type: 'number', required: true, placeholder: 'YYYY' },
                    { label: 'Academic Year', key: 'academic_year', required: true, placeholder: 'YYYY-YY' },
                    { label: 'Start Date', key: 'start_date', type: 'date', required: true },
                    { label: 'End Date', key: 'end_date', type: 'date', required: true },
                    { label: 'Outcome', key: 'outcome', placeholder: 'Outcome' },
                    { label: 'Remarks', key: 'remarks', placeholder: 'Remarks' },
                    { label: 'PDF', key: 'link', type: 'file' },
                    {
                        label: 'Faculty Involved', key: 'faculty_involved', type: 'objectList', subFields: [
                            { label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty' },
                            { label: 'Role', key: 'role' }
                        ]
                    },
                    {
                        label: 'Students Involved', key: 'students_involved', type: 'objectList', subFields: [
                            { label: 'Student ID', key: 'student_id', type: 'entitySelect', entityType: 'student' },
                            { label: 'Role', key: 'role' }
                        ]
                    },
                    {
                        label: 'External Collaborators', key: 'external_collaborators', type: 'objectList', subFields: [
                            { label: 'Name', key: 'name' }, { label: 'Role', key: 'role' }, { label: 'Affiliation', key: 'affiliation' }
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
                    { label: 'Student IDs', key: 'student_ids', type: 'objectList', subFields: [{ label: 'Student ID', key: 'student_id', type: 'entitySelect', entityType: 'student' }] },
                    {
                        label: 'External Contributors', key: 'external_contributors', type: 'objectList', subFields: [
                            { label: 'Name', key: 'name' }, { label: 'Role', key: 'role' }, { label: 'Affiliation', key: 'affiliation' }
                        ]
                    }
                ]}
            />

            {/* FDPs / Events */}
            < DynamicTableSection
                title="FDPs / Workshops / Seminars Attended"
                data={formData.research.fdps || []}
                uniqueKey="program_title"
                {...createHandlers('fdps')}
                readOnly={readOnly}
                initialItem={{
                    department_id: '',
                    program_title: '',
                    type_of_program: '',
                    level: '',
                    mode: '',
                    organising_body: '',
                    venue: '',
                    duration_days: '',
                    academic_year: '',
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
                    { label: 'Level', key: 'level', type: 'select', options: ['Institutional', 'National', 'International'], required: true, placeholder: 'Select level' },
                    { label: 'Mode', key: 'mode', type: 'select', options: ['Online', 'Offline', 'Hybrid'], required: true, placeholder: 'Select mode' },
                    { label: 'Organizer', key: 'organising_body', required: true, placeholder: 'Enter organizer' },
                    { label: 'Venue', key: 'venue', placeholder: 'Venue' },
                    { label: 'Duration (Days)', key: 'duration_days', type: 'number', required: true, placeholder: 'No. of days' },
                    { label: 'Academic Year', key: 'academic_year', required: true, placeholder: 'YYYY-YY' },
                    { label: 'Funding Agency', key: 'funding_agency', placeholder: 'Agency' },
                    { label: 'Start Date', key: 'start_date', type: 'date', required: true },
                    { label: 'End Date', key: 'end_date', type: 'date', required: true },
                    { label: 'Outcome', key: 'outcome', placeholder: 'Outcome' },
                    { label: 'Remarks', key: 'remarks', placeholder: 'Remarks' },
                    { label: 'Certificate PDF', key: 'certificate_link', type: 'file' },
                    { label: 'PDF', key: 'link', type: 'file' },
                    {
                        label: 'Faculty Participants', key: 'faculty_participants', type: 'objectList', subFields: [
                            { label: 'Faculty ID', key: 'faculty_id', type: 'entitySelect', entityType: 'faculty' },
                            { label: 'Role', key: 'role' }
                        ]
                    },
                    {
                        label: 'External Participants', key: 'external_participants', type: 'objectList', subFields: [
                            { label: 'Name', key: 'name' }, { label: 'Role', key: 'role' }, { label: 'Affiliation', key: 'affiliation' }
                        ]
                    }
                ]}
            />

            {/* 3.. Textareas */}
            < div className="space-y-6 pt-6 border-t border-gray-100" >
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">3) Summer institutes, refresher or orientation courses attended or conducted.</label>
                    <textarea rows="3" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-50 disabled:text-gray-500 transition-colors" value={(formData.research && formData.research.summer_institutes) || ''} onChange={(e) => updateField('research', 'summer_institutes', e.target.value)}></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">4) Details of Guidance for: i) U.G. and P.G. Project Guidance</label>
                    <textarea rows="3" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-50 disabled:text-gray-500 transition-colors" value={(formData.research && formData.research.ug_pg_guidance) || ''} onChange={(e) => updateField('research', 'ug_pg_guidance', e.target.value)}></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">ii) Ph.D Guidance</label>
                    <textarea rows="3" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-50 disabled:text-gray-500 transition-colors" value={(formData.research && formData.research.phd_guidance_text) || ''} onChange={(e) => updateField('research', 'phd_guidance_text', e.target.value)}></textarea>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">iii) Research guidance</label>
                    <textarea rows="3" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-50 disabled:text-gray-500 transition-colors" value={(formData.research && formData.research.research_guidance) || ''} onChange={(e) => updateField('research', 'research_guidance', e.target.value)}></textarea>
                </div>
            </div>

            {/* 5) Patents & Consultancy */}
            <div className="pt-6 border-t border-gray-100 space-y-8">
                <div>
                    <label className="block text-md font-semibold text-gray-800 mb-2">5) Details of industrial interaction/professional consultancy/patent obtained or applied for</label>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-1">General Description</label>
                        <textarea rows="3" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-50 disabled:text-gray-500 transition-colors" value={(formData.research && formData.research.industry_interaction) || ''} onChange={(e) => updateField('research', 'industry_interaction', e.target.value)}></textarea>
                    </div>

                    <DynamicTableSection
                        title="Patents (obtained or applied for)"
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
                            { label: 'Students', key: 'students', type: 'objectList', subFields: [{ label: 'Student ID', key: 'student_id', type: 'entitySelect', entityType: 'student' }] },
                            {
                                label: 'External Inventors', key: 'external_inventors', type: 'objectList', subFields: [
                                    { label: 'Name', key: 'name' }, { label: 'Role', key: 'role' }, { label: 'Affiliation', key: 'affiliation' }
                                ]
                            }
                        ]}
                    />

                    <div className="mt-8"></div>

                    <DynamicTableSection
                        title="Professional Consultancy"
                        data={formData.research.consultancy || []}
                        uniqueKey="name_of_project"
                        {...createHandlers('consultancy')}
                        readOnly={readOnly}
                        initialItem={{ name_of_project: '', agency_name: '', grant_amount: '', start_date: '', end_date: '' }}
                        fields={[
                            { label: 'Project Name', key: 'name_of_project', required: true, placeholder: 'Enter project name' },
                            { label: 'Agency', key: 'agency_name', required: true, placeholder: 'Enter agency' },
                            { label: 'Type', key: 'type_of_agency', type: 'select', options: ['Government', 'Private'], required: true, placeholder: 'Select type' },
                            { label: 'Grant', key: 'grant_amount', type: 'number', required: true, placeholder: 'Amount' },
                            { label: 'Revenue', key: 'revenue_generated', type: 'number', placeholder: 'Revenue' },
                            { label: 'Start Date', key: 'start_date', type: 'date', required: true },
                            { label: 'PDF', key: 'link', type: 'file' }
                        ]}
                    />
                </div>
            </div>

            {/* 6 & 7 Textareas */}
            <div className="space-y-6 pt-6 border-t border-gray-100">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">6) Membership or fellowship of professional/academic Bodies, Societies etc. give details</label>
                    <textarea rows="3" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-50 disabled:text-gray-500 transition-colors" value={(formData.research && formData.research.memberships_text) || ''} onChange={(e) => updateField('research', 'memberships_text', e.target.value)}></textarea>
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">7) Any other information regarding academic activities not covered</label>
                    <textarea rows="3" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-50 disabled:text-gray-500 transition-colors" value={(formData.research && formData.research.other_activities) || ''} onChange={(e) => updateField('research', 'other_activities', e.target.value)}></textarea>
                </div>
            </div>
        </div >
    );
}
