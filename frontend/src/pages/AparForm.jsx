import React, { useState, useCallback } from 'react';
import { FiArrowLeft, FiPrinter, FiCheck, FiAlertCircle, FiFileText, FiGrid } from 'react-icons/fi';
import { Document, HeadingLevel, Packer, Paragraph, Table, TableCell, TableRow, TextRun, WidthType } from 'docx';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';
import ProfileDropdown from '../components/ProfileDropdown.jsx';
import { toast, Toaster } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectAparAcademicYear } from '../store/slices/aparAuthSlice.js';
import { AparFormGradedService } from '../services/apar_form_graded.services.js'
import { aparFormReportingService } from '../services/apar_form_reporting.service.js'
import AparLogin from '../components/AparLogin.jsx';
import PartIPersonal from './Apar/PartIPersonal.jsx';
import PartII from './Apar/PartII.jsx';
import PartIII from './Apar/PartIII.jsx';
import PartIV from './Apar/PartIV.jsx';
import PartV from './Apar/PartV.jsx';
import PartVIRemarks from './Apar/PartVIRemarks.jsx';
import AparTimeline from '../components/AparTimeline.jsx';
import { mergeNewEntry } from '../hooks/useAparRealTimeSync';
import NotificationBell from '../components/NotificationBell.jsx';
import { DepartmentService } from '../services/department.services.js';
import { facultyProfileService } from '../services/faculty_profile.service.js';
import { useSocket } from '../context/SocketContext.jsx'; 
import { normalizeQualifications, hasRequiredGraduation } from '../utils/qualification.util.js';
import { getAcademicYearFromAparForm, normalizeAcademicYear } from '../utils/academicYear.util.js';
import { validatePersonalData } from '../utils/personal.validation.util.js';
// import {validateOptionalDocuments } from './Apar/PartII.jsx';

const toTitle = (value) => String(value || '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, char => char.toUpperCase());

const sectionLabels = {
    personal: 'Part I - Personal Data',
    teaching: 'Part II - Self Appraisal & Teaching',
    research: 'Part III - Research & Development',
    corporate: 'Part IV - Corporate Life',
    assessment: 'Part V - Numerical Assessment',
    remarks: 'Part VI - Remarks',
    timeline: 'Timeline'
};

const requiredCourseFields = [
    { key: 'name_of_course', label: 'Name of the course', idPrefix: 'course-name' },
    { key: 'course_code', label: 'Course Code', idPrefix: 'course-code' },
    { key: 'degree_type', label: 'Degree type of course', idPrefix: 'degree-type' },
    { key: 'total_lectures_scheduled', label: 'Total lectures Scheduled', idPrefix: 'lectures-sch' },
    { key: 'total_lectures_engaged', label: 'Total lectures engaged', idPrefix: 'lectures-eng' },
    { key: 'tutorials_scheduled', label: 'Tutorials Scheduled', idPrefix: 'tut-sch' },
    { key: 'tutorials_engaged', label: 'Tutorials engaged', idPrefix: 'tut-eng' },
    { key: 'labs_scheduled', label: 'Labs Scheduled', idPrefix: 'labs-sch' },
    { key: 'labs_engaged', label: 'Labs engaged', idPrefix: 'labs-eng' }
];

const isBlankCourseValue = (value) => value === null || value === undefined || String(value).trim() === '';

const courseEngagementLimits = [
    {
        scheduledKey: 'total_lectures_scheduled',
        engagedKey: 'total_lectures_engaged',
        scheduledLabel: 'Total lectures Scheduled',
        engagedLabel: 'Total lectures engaged',
        idPrefix: 'lectures-eng'
    },
    {
        scheduledKey: 'tutorials_scheduled',
        engagedKey: 'tutorials_engaged',
        scheduledLabel: 'Tutorials Scheduled',
        engagedLabel: 'Tutorials engaged',
        idPrefix: 'tut-eng'
    },
    {
        scheduledKey: 'labs_scheduled',
        engagedKey: 'labs_engaged',
        scheduledLabel: 'Labs Scheduled',
        engagedLabel: 'Labs engaged',
        idPrefix: 'labs-eng'
    }
];

const hasEngagedLessThanScheduled = (course = {}) => courseEngagementLimits.some(({ scheduledKey, engagedKey }) => {
    if (isBlankCourseValue(course[scheduledKey]) || isBlankCourseValue(course[engagedKey])) return false;
    const scheduled = Number(course[scheduledKey]);
    const engaged = Number(course[engagedKey]);
    return Number.isFinite(scheduled) && Number.isFinite(engaged) && engaged < scheduled;
});

const getCourseValidationIssues = (coursesTaught = []) => coursesTaught.flatMap((course = {}, index) => {
    const missingIssues = requiredCourseFields
        .filter(({ key }) => {
            const value = key === 'degree_type' ? (course[key] || 'UG') : course[key];
            return isBlankCourseValue(value);
        })
        .map((field) => ({
            ...field,
            index,
            message: `Please fill ${field.label} at S.No. ${index + 1}.`,
            submitMessage: `S.No. ${index + 1}: ${field.label} is required`
        }));

    if (missingIssues.length > 0) return missingIssues;

    const exceededIssues = courseEngagementLimits
        .filter(({ scheduledKey, engagedKey }) => {
            const scheduled = Number(course[scheduledKey]);
            const engaged = Number(course[engagedKey]);
            return Number.isFinite(scheduled) && Number.isFinite(engaged) && engaged > scheduled;
        })
        .map((field) => ({
            ...field,
            index,
            message: `${field.engagedLabel} cannot exceed ${field.scheduledLabel} at S.No. ${index + 1}.`,
            submitMessage: `S.No. ${index + 1}: ${field.engagedLabel} cannot exceed ${field.scheduledLabel}`
        }));

    if (exceededIssues.length > 0) return exceededIssues;

    if (hasEngagedLessThanScheduled(course) && isBlankCourseValue(course.reasons_not_engaged)) {
        return [{
            key: 'reasons_not_engaged',
            label: 'Reasons for not engaging all scheduled classes',
            idPrefix: 'reasons',
            index,
            message: `Please fill reasons for not engaging all scheduled classes at S.No. ${index + 1}.`,
            submitMessage: `S.No. ${index + 1}: Reasons for not engaging all scheduled classes is required`
        }];
    }

    return [];
});

const getTimeTableValidationIssues = (timeTable = {}) => {
    const pairs = [
        {
            semester: 'odd',
            label: 'odd semester',
            provided: timeTable?.provided?.odd_semester,
            actual: timeTable?.actual?.odd_semester,
            id: 'time-table-actual-odd'
        },
        {
            semester: 'even',
            label: 'even semester',
            provided: timeTable?.provided?.even_semester,
            actual: timeTable?.actual?.even_semester,
            id: 'time-table-actual-even'
        }
    ];

    return pairs
        .filter(({ provided, actual }) => {
            if (isBlankCourseValue(provided) || isBlankCourseValue(actual)) return false;
            const providedNumber = Number(provided);
            const actualNumber = Number(actual);
            return Number.isFinite(providedNumber) && Number.isFinite(actualNumber) && actualNumber > providedNumber;
        })
        .map(({ label, id }) => ({
            id,
            message: `Actually taken for ${label} cannot exceed provided hours/periods.`
        }));
};

const isPlainObject = (value) => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const flattenRecord = (record, prefix = '') => {
    if (!isPlainObject(record)) {
        return { [prefix || 'Value']: toDisplayValue(record) };
    }

    return Object.entries(record).reduce((acc, [key, value]) => {
        const label = prefix ? `${prefix} - ${toTitle(key)}` : toTitle(key);
        if (isPlainObject(value)) {
            return { ...acc, ...flattenRecord(value, label) };
        }
        acc[label] = toDisplayValue(value);
        return acc;
    }, {});
};

// IMPROVED: Better formatting for exports (Excel/Word)
const toDisplayValue = (value) => {
    if (value === null || value === undefined || value === '') return 'N/A';
    
    // Handle Booleans explicitly
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (value === 'true') return 'Yes';
    if (value === 'false') return 'No';

    // Handle Dates properly
    if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value))) {
        try {
            return new Date(value).toLocaleDateString('en-GB'); // Formats to DD/MM/YYYY
        } catch(e) {
            return value;
        }
    }

    if (Array.isArray(value)) {
        if (!value.length) return 'None';
        return value.map((item, index) => {
            if (isPlainObject(item)) {
                const details = Object.entries(flattenRecord(item))
                    .map(([key, val]) => `${key}: ${val}`)
                    .join(' | '); // Better separator for Excel/Word
                return `${index + 1}. ${details}`;
            }
            return `${index + 1}. ${String(item)}`;
        }).join('\n\n'); // Add double line break for readability
    }
    
    if (isPlainObject(value)) {
        return Object.entries(flattenRecord(value))
            .map(([key, val]) => `${key}: ${val}`)
            .join('\n');
    }
    return String(value);
};

const sanitizeSheetName = (name) => {
    const sanitized = String(name || 'Sheet').replace(/[\\/?*[\]:]/g, ' ').replace(/\s+/g, ' ').trim();
    return (sanitized || 'Sheet').slice(0, 31);
};

const sanitizeFileName = (name) => String(name || 'APAR_Form')
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_');

const getAcademicYearFromDates = (start, end) => {
    if (!start || !end) return '';
    const startYear = new Date(start).getFullYear();
    const endYear = new Date(end).getFullYear();
    if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return '';
    return `${startYear}-${String(endYear).slice(-2)}`;
};

const hasCompleteAbsencePeriods = (absencePeriod) => String(absencePeriod || '')
    .split('\n')
    .filter(row => row.trim())
    .every(row => (row.match(/\d{4}-\d{2}-\d{2}/g) || []).length >= 2);

const getColumns = (rows) => {
    const columns = [];
    rows.forEach(row => {
        Object.keys(row || {}).forEach(key => {
            if (!columns.includes(key)) columns.push(key);
        });
    });
    if (columns.includes('S. No.')) {
        return ['S. No.', ...columns.filter(column => column !== 'S. No.')];
    }
    if (columns.includes('Field') && columns.includes('Value')) {
        return ['Field', 'Value', ...columns.filter(column => column !== 'Field' && column !== 'Value')];
    }
    return columns.length ? columns : ['Message'];
};

const createExportTables = (data, sectionName = 'APAR Form') => {
    if (Array.isArray(data)) {
        const rows = data.length
            ? data.map((item, index) => ({ 'S. No.': index + 1, ...flattenRecord(item) }))
            : [{ Message: 'No entries' }];
        return [{
            title: sectionName,
            columns: getColumns(rows),
            rows
        }];
    }

    if (!isPlainObject(data)) {
        const rows = [{ Field: sectionName, Value: toDisplayValue(data) }];
        return [{ title: sectionName, columns: ['Field', 'Value'], rows }];
    }

    const fieldRows = [];
    const childTables = [];

    Object.entries(data).forEach(([key, value]) => {
        const label = toTitle(key);
        const nestedName = sectionName === 'APAR Form' ? (sectionLabels[key] || label) : `${sectionName} - ${label}`;

        if (Array.isArray(value)) {
            childTables.push(...createExportTables(value, nestedName));
            return;
        }

        if (isPlainObject(value)) {
            const hasChildTables = Object.values(value).some(item => Array.isArray(item));
            if (hasChildTables) {
                childTables.push(...createExportTables(value, nestedName));
                return;
            }
            Object.entries(flattenRecord(value, label)).forEach(([field, val]) => {
                fieldRows.push({ Field: field, Value: val });
            });
            return;
        }

        fieldRows.push({ Field: label, Value: toDisplayValue(value) });
    });

    const tables = [];
    if (fieldRows.length) {
        tables.push({
            title: sectionLabels[sectionName] || sectionName,
            columns: ['Field', 'Value'],
            rows: fieldRows
        });
    }

    return [...tables, ...childTables];
};

const createAparExportTables = (formData) => {
    if (!isPlainObject(formData)) return createExportTables(formData);
    return Object.entries(formData).flatMap(([key, value]) => {
        const sectionName = sectionLabels[key] || toTitle(key);
        return createExportTables(value, sectionName);
    });
};

const createWordCell = (text, bold = false, width = 50) => new TableCell({
    width: { size: width, type: WidthType.PERCENTAGE },
    children: String(text ?? '').split('\n').map(line => new Paragraph({
        children: [new TextRun({ text: line || ' ', bold })]
    }))
});

const createWordTable = (columns, rows) => {
    const safeRows = rows.length ? rows : [{ Message: 'No entries' }];
    const safeColumns = columns.length ? columns : getColumns(safeRows);
    const width = Math.max(8, Math.floor(100 / safeColumns.length));
    return new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
            new TableRow({
                children: safeColumns.map(column => createWordCell(column, true, width))
            }),
            ...safeRows.map(row => new TableRow({
                children: safeColumns.map(column => createWordCell(row[column], false, width))
            }))
        ]
    });
};

const createExcelWorksheet = (table) => {
    const rows = table.rows.length ? table.rows : [{ Message: 'No entries' }];
    const columns = table.columns.length ? table.columns : getColumns(rows);
    const data = [
        [table.title],
        [],
        columns,
        ...rows.map(row => columns.map(column => row[column] ?? ''))
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    worksheet['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: Math.max(columns.length - 1, 0) } }];
    worksheet['!cols'] = columns.map((column, index) => {
        const maxLength = rows.reduce((max, row) => Math.max(max, String(row[column] ?? '').length), String(column).length);
        return { wch: Math.min(Math.max(index === 0 ? 12 : maxLength + 2, 14), 50) };
    });
    return worksheet;
};

const createSummaryTable = (formData, aparUser, ay) => ({
    title: 'APAR Summary',
    columns: ['Field', 'Value'],
    rows: [
        { Field: 'Faculty Name', Value: formData?.personal?.name || aparUser?.name || '' },
        { Field: 'Faculty ID', Value: aparUser?.teacherId || aparUser?.faculty_id || aparUser?.userId || aparUser?.user_id || aparUser?.id || '' },
        { Field: 'Designation', Value: formData?.personal?.designation || aparUser?.designation || '' },
        { Field: 'Department', Value: formData?.personal?.department_id || aparUser?.departmentId || aparUser?.department || '' },
        { Field: 'Academic Year', Value: ay || '' },
        { Field: 'Report Period', Value: [formData?.personal?.report_start_date, formData?.personal?.report_end_date].filter(Boolean).join(' to ') }
    ]
});

export default function AparForm() {
    const { socket } = useSocket(); 
    const navigate = useNavigate();
    const location = useLocation();
    const [currentStep, setCurrentStep] = useState(1);
    
    const [loginData, setLoginData] = useState({ id: '', password: '', role: 'Officer (Graded)' });
    const aparUser = useSelector((state) => state.aparAuth.user);
    const aparRole = useSelector((state) => state.aparAuth.role);
    const reduxAy = useSelector(selectAparAcademicYear);
    const activeRole = aparRole || loginData.role;
    
    const getSteps = () => {
        if (activeRole === 'Reporting Officer') return 6;
        if (activeRole === 'Reviewing Officer') return 7;
        return 5;
    };

    const handleSaveMonthly = async () => {
        if (isReadOnlyMode()) return;
        try {
            const ay = reduxAy || loginData.academic_year || (location.state?.ay) || (() => {
                const start = formData.personal.report_start_date
                const end = formData.personal.report_end_date
                return getAcademicYearFromDates(start, end)
            })()

            const facultyId = (aparUser && (aparUser.teacherId || aparUser.faculty_id || aparUser.id));
            if (!ay || !facultyId || ay === 'undefined') {
                toast.error("Invalid Academic Year or Faculty ID");
                return;
            }

            const payload = { ay, faculty_id: facultyId, formData };
            const res = await AparFormGradedService.saveToMonthly(payload);
            toast.success('Saved Section III to monthly collections');

            if (res?.research) {
                setFormData(prev => ({
                    ...prev,
                    research: res.research
                }));
            }
        } catch (e) {
            console.error('Save monthly failed:', e);
            const msg = e.response?.data?.message || 'Failed to save to monthly collections';
            toast.error(msg);
        }
    };

    React.useEffect(() => {
        if (!aparUser) return;
        const role = aparRole || loginData?.role;
        if (role === 'Reporting Officer' || role === 'Reviewing Officer') return; // Do not fetch officer's profile for the form
        (async () => {
            try {
                const profile = await facultyProfileService.getSelf();
                if (profile) {
                    const basicInfo = profile.basic_info || {};
                    const professionalInfo = profile.professional_info || {};
                    const qualifications = profile.educational_qualifications || [];
                    
                    // Map educational qualifications to undergraduate, postgraduate, phd
                    let undergrad = '', postgrad = '', phd = '';
                    qualifications.forEach(q => {
                        const degree = (q.degree || '').toLowerCase();
                        if (degree.includes('graduation') || degree.includes('bachelor') || degree.includes('b.')) {
                            undergrad = q.field_of_study || q.degree || '';
                        } else if (degree.includes('master') || degree.includes('m.')) {
                            postgrad = q.field_of_study || q.degree || '';
                        } else if (degree.includes('phd') || degree.includes('doctorate')) {
                            phd = q.field_of_study || q.degree || '';
                        }
                    });

                    setFormData(prev => ({
                        ...prev,
                        personal: {
                            ...prev.personal,
                            name: basicInfo.full_name || prev.personal.name,
                            designation: professionalInfo.designation || prev.personal.designation,
                            email: profile.contact_info?.email_address || prev.personal.email,
                            phone: profile.contact_info?.mobile_number || prev.personal.phone,
                            department_id: professionalInfo.department || prev.personal.department_id,
                            qualification_undergraduate: undergrad || prev.personal.qualification_undergraduate,
                            qualification_postgraduate: postgrad || prev.personal.qualification_postgraduate,
                            qualification_phd: phd || prev.personal.qualification_phd,
                            joining_date: professionalInfo.date_of_continuous_employment
                                ? new Date(professionalInfo.date_of_continuous_employment).toISOString().substring(0, 10)
                                : prev.personal.joining_date,
                            date_of_birth: basicInfo.date_of_birth
                                ? new Date(basicInfo.date_of_birth).toISOString().substring(0, 10)
                                : prev.personal.date_of_birth,
                            sc_st_status: basicInfo.caste_category || prev.personal.sc_st_status,
                            grade: professionalInfo.present_grade || prev.personal.grade
                        },
                        profileQualifications: qualifications || []
                    }));
                    // Evaluate profile completeness
                    try {
                        const issues = computeProfileIssues(profile);
                        setProfileGate({ checked: true, ok: issues.length === 0, issues, loading: false });
                    } catch (_) {
                        setProfileGate({ checked: true, ok: false, issues: ['Unable to evaluate profile completeness'], loading: false });
                    }
                    console.log('Prefilled faculty information from faculty profile');
                }
            } catch (err) {
                console.error('Failed to prefill faculty information from profile', err);
                setProfileGate({ checked: true, ok: false, issues: ['Unable to load profile. Please update your profile first.'], loading: false });
            }
        })();
    }, [aparUser]);

    const [viewMode, setViewMode] = useState('form');
    const [formStatus, setFormStatus] = useState('Draft');
    const [departments, setDepartments] = useState([]);

    React.useEffect(() => {
        (async () => {
            try {
                if (!departments || departments.length === 0) {
                    const deptRes = await DepartmentService.getDepartments();
                    const depts = deptRes?.data || deptRes || [];
                    setDepartments(depts);
                }
            } catch (deptErr) {
                console.error('Failed to fetch departments', deptErr);
            }
        })();
    }, []);

    React.useEffect(() => {
        if (aparUser) {
            const roleToUse = aparRole || loginData.role;
            if (roleToUse === 'Reporting Officer' || roleToUse === 'Reviewing Officer') {
                setViewMode('list');
            } else {
                setViewMode('form');
            }
        }
    }, [aparUser, aparRole]);

    React.useEffect(() => {
        if (
            departments.length > 0 &&
            aparUser &&
            (!formData.personal.department_id || !departments.some(d => d.department_id === formData.personal.department_id))
        ) {
            const userDeptId = aparUser.department_id || aparUser.departmentId;
            const userDeptName = aparUser.department;
            const matchingDept = departments.find(d => d.department_id === userDeptId || d.department_name === userDeptName);

            if (matchingDept) {
                setFormData(prev => ({
                    ...prev,
                    personal: {
                        ...prev.personal,
                        department_id: matchingDept.department_id
                    }
                }));
            }
        }
    }, [departments, aparUser]);

    React.useEffect(() => {
        if (!aparUser) return;
        const role = aparRole || loginData.role;
        if (!(role === 'Reporting Officer' || role === 'Reviewing Officer')) return;
        if (viewMode !== 'list') return;
        (async () => {
            try {
                let rows = []
                if (role === 'Reporting Officer') {
                    const resp = await aparFormReportingService.getAssigned()
                    rows = resp?.rows || resp?.data || resp || []
                } else if (role === 'Reviewing Officer') {
                    const resp = await aparFormReportingService.getPendingReviews()
                    rows = resp?.rows || resp?.data || resp || []
                } else {
                    const ay = loginData.academic_year || ''
                    if (!ay) return
                    const res = await AparFormGradedService.listAllForms(ay)
                    rows = res.data || res || []
                }
                const mapped = (rows || []).map(r => ({ id: `${r.faculty_id}-${r.ay}`, name: r.name || r.title || r.faculty_id, designation: r.designation, department: r.dept_name || r.department || r.dept, submissionDate: r.date || null, raw: r }))
                setSubmittedForms(mapped)
            } catch (err) {
                console.error('failed to fetch pending submissions', err)
            }
        })()
    }, [aparUser, aparRole, viewMode, loginData.academic_year, reduxAy])

    const handleNewEntry = useCallback((data) => {
        setFormData(prev => ({
            ...prev,
            research: mergeNewEntry(prev.research, data)
        }));
    }, []);

    const gradedId = aparUser?.teacherId || aparUser?.faculty_id || aparUser?.id;

    const totalSteps = getSteps();
    const [personalOpen, setPersonalOpen] = useState(true);

    const [submittedForms, setSubmittedForms] = useState([]);
    const [certified, setCertified] = useState(false);
    const [selectedFacultyRaw, setSelectedFacultyRaw] = useState(null);

    // Profile completeness gate
    const [profileGate, setProfileGate] = useState({ checked: false, ok: false, issues: [], loading: false });
    const getByPath = (obj, path) => path.split('.').reduce((o,k)=>o && o[k]!==undefined ? o[k] : undefined, obj);
    const isFilled = (v) => v !== null && v !== undefined && String(v).trim() !== '';
    const hasGraduationIn = (quals = []) => (quals||[]).some((q) => {
        const d = String(q?.degree || '').toLowerCase();
        return d.includes('graduation') || d.includes('bachelor') || d.includes('b.');
    });
    const computeProfileIssues = (profile) => {
        const issues = [];
        const req = [
            ['basic_info.gender','Gender'],
            ['basic_info.date_of_birth','Date of Birth'],
            ['basic_info.nationality','Nationality'],
            ['basic_info.marital_status','Marital Status'],
            ['contact_info.mobile_number','Mobile Number'],
            ['contact_info.current_address','Current Address'],
            ['contact_info.city','Current City'],
            ['contact_info.state','Current State'],
            ['contact_info.postal_code','Current Postal Code'],
            ['contact_info.permanent_address','Permanent Address'],
            ['contact_info.permanent_city','Permanent City'],
            ['contact_info.permanent_state','Permanent State'],
            ['contact_info.permanent_postal_code','Permanent Postal Code'],
            ['professional_info.date_of_joining','Date of Joining'],
            ['professional_info.date_of_continuous_employment','Date of Continuous Employment'],
            ['professional_info.employment_type','Employment Type'],
            ['professional_info.present_grade','Present Grade']
        ];
        req.forEach(([path,label]) => { if (!isFilled(getByPath(profile, path))) issues.push(`${label} is required in Profile`); });
        return issues;
    };
    const recheckProfile = async () => {
        try {
            setProfileGate(prev => ({ ...prev, loading: true }));
            const prof = await facultyProfileService.getSelf();
            const issues = computeProfileIssues(prof || {});
            setProfileGate({ checked: true, ok: issues.length === 0, issues, loading: false });
        } catch (e) {
            console.error('Profile recheck failed', e);
            setProfileGate({ checked: true, ok: false, issues: ['Unable to load profile. Please try again.'], loading: false });
        }
    };

    const [queryModalOpen, setQueryModalOpen] = useState(false);
    const [queryComment, setQueryComment] = useState('');
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); 
    const [deleteModal, setDeleteModal] = useState({ open: false, section: null, field: null, index: null });
    const [submitConfirmModal, setSubmitConfirmModal] = useState({ open: false, type: null, status: null });

    const lastEventRef = React.useRef(0);

    const requestDelete = (section, field, index) => {
        setDeleteModal({ open: true, section, field, index });
    };

    // Runtime sanitization helpers for APAR inputs
    const sanitizeAlpha = (s) => String(s || '').replace(/[^A-Za-z ]+/g, '');
    const sanitizeAlphaNum = (s) => String(s || '').replace(/[^A-Za-z0-9 ]+/g, '');
    const sanitizeLoose = (s) => String(s || '').replace(/[^A-Za-z0-9 .,\-\/()]+/g, '');
    const sanitizeEmail = (s) => String(s || '').replace(/[^A-Za-z0-9@._+\-]+/g, '');
    const sanitizeUrl = (s) => String(s || '').replace(/[^A-Za-z0-9:/?&=._#%\-]+/g, '');
    const sanitizeNumeric = (s) => String(s || '').replace(/[^0-9]+/g, '');

    const sanitizeForApar = (value, path = '') => {
        const v = String(value ?? '');
        if (v === '') return v;
        const lower = path.toLowerCase();
        if (lower.includes('email')) return sanitizeEmail(v);
        if (
            lower.includes('url') || lower.includes('link') || lower.includes('http') || lower.includes('website') ||
            lower.includes('immovable_property_return') || lower.includes('health_checkup_file') || lower.includes('document') || lower.includes('doi')
        ) return sanitizeUrl(v);
        if (lower.includes('absence_period')) return v;
        if (lower.includes('date')) return v; // native date inputs restrict format
        // Research-specific: stricter rules to disallow special characters broadly
        if (lower.startsWith('research.')) {
            // Preserve hyphen for Month-Year fields in research entries
            if (/(^|\.)((year_of_publication)|(registration_year)|(year_of_sanction)|(academic_year)|year)(\.|$)/.test(lower)) {
                return v.replace(/[^0-9\-]+/g, '');
            }
            // Numeric-only for common quantitative research fields
            if (/\.(amount|volume|page_numbers|citation_count|duration_hours|duration_days|number_of_participants|monetary_value|impact_factor)\b/.test(lower)) {
                return sanitizeNumeric(v);
            }
            // Remarks/description-like fields in research: alphanumeric only (strip punctuation)
            if (/\.(remarks|outcome|reason|description|details)\b/.test(lower)) {
                return sanitizeAlphaNum(v);
            }
        }
        if (lower.includes('assessment.')) return sanitizeNumeric(v);
        if (
            lower.includes('time_table') ||
            lower.includes('workload_week') ||
            lower.includes('tutorials_tests') ||
            (lower.includes('courses_taught') && (lower.includes('lectures') || lower.includes('tutorials') || lower.includes('labs')))
        ) return sanitizeNumeric(v);
        if (lower.includes('phone') || lower.includes('mobile') || lower.includes('contact_number')) return sanitizeNumeric(v);
        if (lower.includes('id') || lower.includes('code') || lower.includes('number') || lower.includes('year')) return sanitizeAlphaNum(v);
        if (lower.includes('address') || lower.includes('remarks') || lower.includes('reason') || lower.includes('description') || lower.includes('details')) return sanitizeLoose(v);
        return sanitizeAlphaNum(v);
    };

    const sanitizeDeep = (obj, basePath = '') => {
        if (obj === null || obj === undefined) return obj;
        if (typeof obj === 'string') return sanitizeForApar(obj, basePath);
        if (Array.isArray(obj)) return obj.map((it, i) => sanitizeDeep(it, `${basePath}[${i}]`));
        if (typeof obj === 'object') {
            const out = {};
            Object.keys(obj).forEach((k) => {
                out[k] = sanitizeDeep(obj[k], basePath ? `${basePath}.${k}` : k);
            });
            return out;
        }
        return obj;
    };

    const collectAparDocumentPaths = (value, paths = new Set()) => {
        if (typeof value === 'string') {
            if (/^document\//.test(value)) paths.add(value);
            return paths;
        }
        if (Array.isArray(value)) value.forEach(item => collectAparDocumentPaths(item, paths));
        else if (value && typeof value === 'object') Object.values(value).forEach(item => collectAparDocumentPaths(item, paths));
        return paths;
    };

    const confirmDelete = async () => {
        if (deleteModal.section && deleteModal.field && deleteModal.index !== null) {
            const deleted = await removeItem(deleteModal.section, deleteModal.field, deleteModal.index);
            if (deleted) toast.success("Item and its PDF, if any, were deleted");
            else toast.error("The entry was not deleted because the APAR draft could not be saved");
        }
        setDeleteModal({ open: false, section: null, field: null, index: null });
    };

    const requestSubmitConfirmation = (type, status = null) => {
        setSubmitConfirmModal({ open: true, type, status });
    };

    const closeSubmitConfirmation = () => {
        setSubmitConfirmModal({ open: false, type: null, status: null });
    };

    const confirmSubmitAction = async () => {
        const action = submitConfirmModal;
        closeSubmitConfirmation();

        if (action.type === 'officer') {
            await handleSubmit();
        } else if (action.type === 'reporting') {
            await finalizeReportingSubmit(action.status);
        } else if (action.type === 'reviewing') {
            await finalizeReviewingSubmit(action.status);
        }
    };

    const getSubmitConfirmationText = () => {
        if (submitConfirmModal.type === 'reporting') {
            return {
                title: 'Verify & Forward APAR',
                message: 'Are you sure you want to verify this APAR and forward it to the Reviewing Officer?'
            };
        }

        if (submitConfirmModal.type === 'reviewing') {
            return {
                title: 'Submit APAR Review',
                message: 'Are you sure you want to submit this review? This will finalize your reviewing action.'
            };
        }

        return {
            title: 'Submit APAR Form',
            message: 'Are you sure you want to submit this APAR form? After submission, it will move to the officer review workflow.'
        };
    };

    const confirmQuerySubmission = async () => {
        if (!queryComment.trim()) {
            toast.error("Please enter a reason for the query");
            return;
        }

        if (pendingAction?.type === 'reporting') {
            await finalizeReportingSubmit(pendingAction.status, queryComment);
        } else if (pendingAction?.type === 'reviewing') {
            await finalizeReviewingSubmit(pendingAction.status, queryComment);
        }
        setQueryModalOpen(false);
        setQueryComment('');
        setPendingAction(null);
    };


    const [formData, setFormData] = useState({
        personal: {
            name: '',
            designation: '',
            date_of_birth: '',
            email: '',
            phone: '',
            department_id: '',
            qualification: '',
            qualification_undergraduate: '',
            qualification_postgraduate: '',
            qualification_phd: '',
            joining_date: '',
            report_start_date: '',
            report_end_date: '',
            section_officer: '',
            sc_st_status: '',
            absence_taken: '',
            absence_period: '',
            title: '',
            academics: '',
            caste: '',
            grade: ''
        },
        profileQualifications: [],
        teaching: {
            immovable_property_return: '',
            health_checkup_file: null,
            description_of_duties_department: [],
            description_of_duties_admin: [],
            courses_taught: [
                { name_of_course: '', course_code: '', total_lectures_scheduled: '', total_lectures_engaged: '', tutorials_scheduled: '', tutorials_engaged: '', labs_scheduled: '', labs_engaged: '', reasons_not_engaged: '', degree_type: 'UG' }
            ],
            time_table: {
                provided: { odd_semester: '', even_semester: '' },
                actual: { odd_semester: '', even_semester: '' }
            },
            workload_week: {
                odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' },
                even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }
            },
            teaching_methods: [],
            ict_tools: [],
            student_centric_methods: [],
            tutorials_tests: {
                ug_odd: { number_of_tests: '', assignment_checked: '' },
                ug_even: { number_of_tests: '', assignment_checked: '' },
                pg_odd: { number_of_tests: '', assignment_checked: '' },
                pg_even: { number_of_tests: '', assignment_checked: '' }
            },
            academic_planning: []
        },
        research: {
            journals: [],
            conferences: [],
            events: [], 
            projects: [],
            phd_guidance: [],
            phd_supervision: [], 
            books: [],
            fdps: [],
            consultancy: [],
            patents: [],
            awards: [],
            e_content: [],
            collaborations: [],
            faculty_visits: [],
            memberships: [],
            summer_institutes_attended: [],
            summer_institutes_organized: [],
            ug_pg_guidance: [],
            phd_guidance_text: [], 
            research_guidance: [],
            industry_interaction: [],
            memberships_text: [],
            other_activities: []
        },
        corporate: {
            curriculum_development: '',
            course_development_details: '',
            lab_development: '',
            cultural_activities: '',
            sports_community: '',
            admin_assignment_university: '',
            admin_assignment_department: '',
            admin_assignment_external: '',
            any_other: '',
            certify: false
        },
        assessment: {
            section_a: { q1: '', q2: '', q3: '', q4: '', overall_grading: '' },
            section_b: { q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7a: '', q7b: '', q8: '', q9: '', q10: '', q11: '', overall_grading: '' },
            section_c: { q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', overall_grading: '' },
            general: { q1: '', q2: '', q3: '', q4: '', q5: '', q6: '' }
        },
        remarks: {
            length_of_service: '',
            satisfied_with_reporting: '',
            agree_with_assessment: 'Yes',
            disagreement_reason: '',
            general_remarks: '',
            specific_characteristics: '',
            signature_place: '',
            signature_date: ''
        },
        timeline: {}
    });

    const fetchFormData = useCallback(async (gradedId, ay) => {
        if (!gradedId) return;
        try {
            let facultyInfo = null;
            try {
                const infoRes = await AparFormGradedService.getFacultyInfo();
                facultyInfo = infoRes.data || infoRes;
            } catch (infoErr) {
                console.error('Failed to fetch faculty info:', infoErr);
            }

            if (facultyInfo) {
                setFormData(prev => ({
                    ...prev,
                    personal: {
                        ...prev.personal,
                        name: facultyInfo.name || prev.personal.name,
                        designation: facultyInfo.designation || prev.personal.designation,
                        email: facultyInfo.email || prev.personal.email,
                        phone: facultyInfo.phone || prev.personal.phone,
                        department_id: facultyInfo.department_id || prev.personal.department_id,
                        ...normalizeQualifications(facultyInfo),
                        joining_date: facultyInfo.joining_date ? facultyInfo.joining_date.substring(0, 10) : prev.personal.joining_date,
                        date_of_birth: facultyInfo.date_of_birth ? facultyInfo.date_of_birth.substring(0, 10) : prev.personal.date_of_birth,
                        sc_st_status: facultyInfo.sc_st_status || prev.personal.sc_st_status,
                        grade: facultyInfo.grade || prev.personal.grade
                    }
                }));
            }

            try {
                const deptRes = await DepartmentService.getDepartments();
                const depts = deptRes.data || deptRes || [];
                setDepartments(depts);
            } catch (deptErr) {
                console.error('Failed to fetch departments', deptErr);
            }

            const mongoRes = await AparFormGradedService.getForm(gradedId, ay)
            const mongoData = mongoRes.data || mongoRes
            if (mongoData && mongoData.faculty_id) {
                if (mongoData.status) {
                    setFormStatus(mongoData.status);
                }

                if (!ay && mongoData.ay) {
                    ay = mongoData.ay
                    setLoginData(prev => ({ ...prev, academic_year: ay }))
                }

                setFormData(prev => ({
                    ...prev,
                    timeline: mongoData.timeline || {},
                    personal: {
                        ...prev.personal,
                        ...(mongoData.personal || {}),
                        ...normalizeQualifications(mongoData.personal || {}),
                        date_of_birth: mongoData.personal?.date_of_birth ? mongoData.personal.date_of_birth.substring(0, 10) : prev.personal.date_of_birth,
                        joining_date: mongoData.personal?.joining_date ? mongoData.personal.joining_date.substring(0, 10) : prev.personal.joining_date,
                    },
                    teaching: { ...prev.teaching, ...(mongoData.teaching || {}) },
                    research: { ...prev.research, ...(mongoData.research || {}) }, 
                    corporate: { ...prev.corporate, ...(mongoData.corporate || {}) },
                    assessment: { ...prev.assessment, ...(mongoData.assessment || {}) },
                    remarks: { ...prev.remarks, ...(mongoData.remarks || {}) },
                    reporting_query: mongoData.reporting_query,
                    reviewing_query: mongoData.reviewing_query,
                    profileQualifications: mongoData.profileQualifications || prev.profileQualifications || []
                }))
                console.log('✅ Form overlaid with MongoDB data');
            } 

        } catch (e) {
            console.error("Auto-refresh failed", e);
        }
    }, []); 

    React.useEffect(() => {
        if (!socket || !aparUser) return;

        const facultyId = aparUser.teacherId || aparUser.faculty_id || aparUser.id;

        let rawAy = reduxAy || loginData.academic_year || (location.state?.ay);
        if (!rawAy && formData.personal?.report_start_date && formData.personal?.report_end_date) {
            rawAy = getAcademicYearFromDates(formData.personal.report_start_date, formData.personal.report_end_date);
        }

        const normalizeAy = (val) => {
            if (!val || typeof val !== 'string') return '';
            const cleanVal = val.trim();
            const parts = cleanVal.split(/[\s-]+/);
            if (parts.length === 2 && parts[0].length === 4 && parts[1].length === 4) {
                return `${parts[0]}-${parts[1].substring(2)}`;
            }
            return cleanVal;
        };

        const ay = normalizeAy(rawAy);

        if (facultyId && ay) {
            socket.emit('join_apar_room', { faculty_id: facultyId, ay });
            fetchFormData(facultyId, ay);
        }

        const handleDataUpdate = () => {
            fetchFormData(facultyId, ay);
        };

        const handleNewEntrySocket = () => {
            const now = Date.now();
            if (now - lastEventRef.current < 1000) return;
            lastEventRef.current = now;
            setTimeout(() => {
                const facultyId = aparUser?.teacherId || aparUser?.faculty_id || aparUser?.id;
                if (facultyId && ay) {
                    fetchFormData(facultyId, ay);
                }
            }, 500);
        };

        const handleUpdateEntrySocket = (data) => {
            const now = Date.now();
            if (now - lastEventRef.current < 1000) return;
            lastEventRef.current = now;
            console.log('[FRONTEND] 📬 Real-time UPDATE ENTRY received:', data);
            setTimeout(() => {
                const facultyId = aparUser?.teacherId || aparUser?.faculty_id || aparUser?.id;
                if (facultyId && ay) {
                    fetchFormData(facultyId, ay);
                }
            }, 500);
        };

        const handleDeleteEntrySocket = () => {
            const now = Date.now();
            if (now - lastEventRef.current < 1000) return;
            lastEventRef.current = now;
            setTimeout(() => {
                const facultyId = aparUser?.teacherId || aparUser?.faculty_id || aparUser?.id;
                if (facultyId && ay) {
                    fetchFormData(facultyId, ay);
                }
            }, 500);
        };

        const handleBulkEntries = (data) => {
            toast.success(`${data.count} new entries synced`);
            if (data.entries && Array.isArray(data.entries)) {
                data.entries.forEach(e => handleNewEntry(e));
            }
        };

        const handleRoomJoined = () => {};

        socket.on('apar_data_updated', handleDataUpdate);
        socket.on('new_entry', handleNewEntrySocket);
        socket.on('update_entry', handleUpdateEntrySocket);
        socket.on('delete_entry', handleDeleteEntrySocket);
        socket.on('bulk_entries', handleBulkEntries);
        socket.on('room_joined', handleRoomJoined);

        socket.on('connect_error', (err) => {
            console.error('[FRONTEND] Socket connection error:', err);
        });

        return () => {
            socket.off('apar_data_updated', handleDataUpdate);
            socket.off('new_entry', handleNewEntrySocket);
            socket.off('update_entry', handleUpdateEntrySocket);
            socket.off('delete_entry', handleDeleteEntrySocket);
            socket.off('bulk_entries', handleBulkEntries);
            socket.off('room_joined', handleRoomJoined);
            if (facultyId && ay) socket.emit('leave_apar_room', { faculty_id: facultyId, ay });
        };
    }, [socket, aparUser, reduxAy, loginData.academic_year, location.state?.ay, formData.personal.report_start_date, formData.personal.report_end_date, fetchFormData]);

    const handlePrint = () => window.print();

    const getExportFileBaseName = () => {
        const facultyId = aparUser?.teacherId || aparUser?.faculty_id || aparUser?.userId || aparUser?.user_id || aparUser?.id || 'faculty';
        const ay = reduxAy || loginData.academic_year || location.state?.ay || formData?.personal?.academic_year || 'apar';
        const name = formData?.personal?.name || aparUser?.name || 'APAR_Form';
        return sanitizeFileName(`${name}_${facultyId}_${ay}`);
    };

    const handleExportExcel = () => {
        try {
            const workbook = XLSX.utils.book_new();
            const usedNames = new Map();
            const ay = reduxAy || loginData.academic_year || location.state?.ay || getAcademicYearFromDates(formData.personal?.report_start_date, formData.personal?.report_end_date);
            const tables = [
                createSummaryTable(formData, aparUser, ay),
                ...createAparExportTables(formData)
            ];

            tables.forEach((table) => {
                const baseName = sanitizeSheetName(table.title);
                const count = usedNames.get(baseName) || 0;
                usedNames.set(baseName, count + 1);
                const suffix = count ? `_${count + 1}` : '';
                const sheetName = `${baseName.slice(0, 31 - suffix.length)}${suffix}`;
                const worksheet = createExcelWorksheet(table);
                XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
            });

            XLSX.writeFile(workbook, `${getExportFileBaseName()}.xlsx`);
            toast.success('Excel file downloaded');
        } catch (error) {
            console.error('Excel export failed', error);
            toast.error('Excel export failed');
        }
    };

    const handleExportWord = async () => {
        try {
            const ay = reduxAy || loginData.academic_year || location.state?.ay || getAcademicYearFromDates(formData.personal?.report_start_date, formData.personal?.report_end_date);
            const tables = [
                createSummaryTable(formData, aparUser, ay),
                ...createAparExportTables(formData)
            ];
            const children = [
                new Paragraph({
                    text: 'Annual Performance Assessment Report Form',
                    heading: HeadingLevel.TITLE
                }),
                new Paragraph({
                    children: [
                        new TextRun({ text: `Faculty: ${formData?.personal?.name || aparUser?.name || ''}` }),
                        new TextRun({ text: ` | Academic Year: ${ay || ''}` })
                    ]
                })
            ];

            tables.forEach((table) => {
                children.push(
                    new Paragraph({ text: table.title, heading: HeadingLevel.HEADING_1 }),
                    createWordTable(table.columns, table.rows),
                    new Paragraph({ text: '' })
                );
            });

            const document = new Document({ sections: [{ children }] });
            const blob = await Packer.toBlob(document);
            saveAs(blob, `${getExportFileBaseName()}.docx`);
            toast.success('Word file downloaded');
        } catch (error) {
            console.error('Word export failed', error);
            toast.error('Word export failed');
        }
    };

    const isReadOnlyMode = () => {
        const role = aparRole || loginData.role;
        if (role === 'Reporting Officer' || role === 'Reviewing Officer') return true;

        if (formStatus === 'Submitted') return true;
        const isEditable = !formStatus || ['Draft', 'Query Raised', 'not_filled', 'Query Raised by Reporting officer', 'Query Raised by Reviewing officer'].includes(formStatus);
        return !isEditable;
    };

    React.useEffect(() => {
        if (!gradedId) return;
        let ay = reduxAy || loginData.academic_year || (location.state?.ay);
        if (!ay && formData.personal?.report_start_date && formData.personal?.report_end_date) {
            ay = getAcademicYearFromDates(formData.personal.report_start_date, formData.personal.report_end_date);
        }
        if (gradedId && ay) {
            fetchFormData(gradedId, ay);
        }
    }, [gradedId, reduxAy, loginData.academic_year, location.state]);

    const focusFirstInvalidCourseField = (issue) => {
        if (!issue || typeof document === 'undefined') return;
        const field = document.getElementById(`${issue.idPrefix}-${issue.index}`);
        if (field) {
            field.focus();
            if (typeof field.reportValidity === 'function') field.reportValidity();
        }
    };

    const validateCoursesTaught = (customFormData = null, { focus = true, navigateToPart = false } = {}) => {
        const data = customFormData || formData;
        const issues = getCourseValidationIssues(data?.teaching?.courses_taught || []);
        if (issues.length === 0) return true;

        const firstIssue = issues[0];
        toast.error(firstIssue.message);

        if (navigateToPart && currentStep !== 2) {
            setCurrentStep(2);
            window.setTimeout(() => focusFirstInvalidCourseField(firstIssue), 0);
        } else if (focus) {
            focusFirstInvalidCourseField(firstIssue);
        }

        return false;
    };

    const validateTimeTable = (customFormData = null, { focus = true, navigateToPart = false } = {}) => {
        const data = customFormData || formData;
        const issues = getTimeTableValidationIssues(data?.teaching?.time_table || {});
        if (issues.length === 0) return true;

        const firstIssue = issues[0];
        toast.error(firstIssue.message);

        const focusInvalidField = () => {
            const field = typeof document !== 'undefined' ? document.getElementById(firstIssue.id) : null;
            if (field) {
                field.focus();
                if (typeof field.reportValidity === 'function') field.reportValidity();
            }
        };

        if (navigateToPart && currentStep !== 2) {
            setCurrentStep(2);
            window.setTimeout(focusInvalidField, 0);
        } else if (focus) {
            focusInvalidField();
        }

        return false;
    };

    const handleSaveDraft = async (silent = false, customFormData = null) => {
        if (isReadOnlyMode()) return true;

        const dataToSave = customFormData || formData;

        // Table edits use silent autosave. They must not be blocked by unrelated,
        // still-incomplete fields in Parts I/II; otherwise a removed/replaced PDF
        // remains in storage while the row appears changed in the browser.
        if (!silent) {
            if (currentStep === 1 && !validatePersonalDataStep(dataToSave)) {
                return false;
            }

            if (!validateCoursesTaught(dataToSave, { navigateToPart: true })) {
                return false;
            }

            if (!validateTimeTable(dataToSave, { navigateToPart: true })) {
                return false;
            }
        }

        setIsSavingDraft(true);
        try {
            const ay = reduxAy || loginData.academic_year || (location.state?.ay) || (() => {
                const start = dataToSave.personal.report_start_date
                const end = dataToSave.personal.report_end_date
                return getAcademicYearFromDates(start, end)
            })()

            const facultyId = (aparUser && (aparUser.teacherId || aparUser.faculty_id || aparUser.id));

            if (!ay || !facultyId || ay === 'undefined') {
                if (!silent) toast.error("Invalid Academic Year or Faculty ID. Please verify your selection.");
                console.error("[APAR SAVE] Validation Failed:", { ay, facultyId });
                return false;
            }

            const payload = {
                ay: ay,
                faculty_id: facultyId,
                formData: dataToSave
            };

            await AparFormGradedService.saveDraft(payload);
            if (!silent) toast.success('Progress saved and synced to profile');
            return true;
        } catch (e) {
            console.error('Save draft failed:', e.response?.data || e);
            if (!silent) {
                const msg = e.response?.data?.message || 'Failed to auto-save progress';
                toast.error(msg);
            }
            return false;
        } finally {
            setIsSavingDraft(false);
        }
    };

    const validateStepFields = (step = currentStep) => {
        try {
            const container = typeof document !== 'undefined' ? document.getElementById(`apar-step-${step}`) : null;
            if (!container) return true;

            const nodes = Array.from(container.querySelectorAll('[required], [aria-required="true"]')).filter(el => !el.disabled);
            const missing = [];

            for (const el of nodes) {
                let valid = true;
                const tag = (el.tagName || '').toLowerCase();
                const type = el.type || '';

                if (type === 'checkbox') {
                    valid = el.checked;
                } else if (tag === 'select') {
                    valid = el.value !== '' && el.value !== null && el.value !== undefined;
                } else {
                    valid = el.value !== null && el.value !== undefined && String(el.value).trim() !== '';
                }

                if (!valid) {
                    let labelText = '';
                    const parent = el.closest('div') || el.parentElement;
                    if (parent) {
                        const label = parent.querySelector('label');
                        if (label) labelText = label.textContent.replace('*', '').trim();
                    }
                    if (!labelText) labelText = el.name || el.placeholder || 'Required field';
                    missing.push(labelText);
                }
            }

            if (missing.length > 0) {
                const firstInvalid = nodes.find(el => {
                    const tag = (el.tagName || '').toLowerCase();
                    const type = el.type || '';
                    if (type === 'checkbox') return !el.checked;
                    if (tag === 'select') return !(el.value !== '' && el.value !== null && el.value !== undefined);
                    return !(el.value !== null && el.value !== undefined && String(el.value).trim() !== '');
                });
                if (firstInvalid && typeof firstInvalid.reportValidity === 'function') firstInvalid.reportValidity();
                else if (firstInvalid && firstInvalid.focus) firstInvalid.focus();

                toast.error(`Please fill required fields: ${[...new Set(missing)].slice(0, 5).join(', ')}`);
                return false;
            }

            return true;
        } catch (e) {
            console.error('Validation error:', e);
            return true;
        }
    };

    /**
     * Validate Personal Data specific business rules
     * Checks DOB and Joining Date validations
     */
    const validatePersonalDataStep = (customFormData = null) => {
        const data = customFormData || formData;
        const personal = data.personal || {};
        const validation = validatePersonalData(personal);

        if (!validation.valid) {
            const errorMessages = validation.errors.map(err => err.message).join('; ');
            toast.error(errorMessages);
            return false;
        }

        return true;
    };

    const validateOfficerAction = (type) => {
        if (type === 'reporting' && !validateStepFields(5)) return false;
        if (type === 'reviewing' && !validateStepFields(6)) return false;
        if (!certified) {
            toast.error('Please confirm the certification checkbox before submitting.');
            return false;
        }
        return true;
    };

    // STRICT VALIDATION FIX: Checks React state and trims whitespaces
    const nextStep = async () => {
        if (currentStep < totalSteps) {
            // Special validation for Personal Data step (step 1)
            
            if (currentStep === 2) { // Assuming PartII is step 2
                // Part II specific validation handled below
            }
           
           
            if (currentStep === 1 && !validatePersonalDataStep()) return;
            
            if (currentStep === 2 && !validateCoursesTaught()) return;
            if (currentStep === 2 && !validateTimeTable()) return;
            // 1. Run standard DOM validation for basic inputs
            if (!validateStepFields(currentStep)) return;
            
           
            // 2. STRICT STATE VALIDATION FOR STEP 4 (Corporate Life)
            if (currentStep === 4 && !isReadOnlyMode()) {
                const corporate = formData.corporate || {};
                
                // Helper to check if a string exists and isn't just blank spaces
                const isFilled = (val) => val !== null && val !== undefined && String(val).trim() !== '';

                const hasContribution = isFilled(corporate.curriculum_development) || 
                                        isFilled(corporate.course_development_details) || 
                                        isFilled(corporate.lab_development) || 
                                        isFilled(corporate.cultural_activities) || 
                                        isFilled(corporate.sports_community) || 
                                        isFilled(corporate.admin_assignment_university) || 
                                        isFilled(corporate.admin_assignment_department) || 
                                        isFilled(corporate.admin_assignment_external) || 
                                        isFilled(corporate.any_other);

                if (!hasContribution) {
                    toast.error('Please provide details for at least one contribution in Part IV.');
                    return; // HARD STOP: Prevents moving to Step 5
                }

                // Explicitly verify the certification checkbox state
                if (corporate.certify !== 'true' && corporate.certify !== true) {
                    toast.error('You must certify the Corporate Life section before proceeding.');
                    return; // HARD STOP: Prevents moving to Step 5
                }
            }

            // 3. Save draft and proceed
            if (activeRole === 'Officer (Graded)') {
                const saved = await handleSaveDraft(true);
                if (saved) toast.success('Draft saved');
            }
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
        }
    };

    // STRICT VALIDATION FIX: Submission check using trim
    const validateFormData = () => {
        const errors = [];

        // Helper to check for empty spaces
        const isFilled = (val) => val !== null && val !== undefined && String(val).trim() !== '';

        // Validate Personal Data (Part I)
        const personal = formData.personal || {};
        if (!isFilled(personal.name)) errors.push('Name is required');
        if (!isFilled(personal.department_id)) errors.push('Department is required');
        if (!isFilled(personal.designation)) errors.push('Designation is required');
        if (!personal.date_of_birth) errors.push('Date of birth is required');
        if (!isFilled(personal.sc_st_status)) errors.push('Caste category is required');
        if (!personal.joining_date) errors.push('Joining date is required');
        if (!personal.grade || !personal.grade.trim()) errors.push('Grade is required');
        //if (!personal.absence_taken || !personal.absence_taken.trim()) errors.push('Leave/absence option is required');
        if (personal.absence_taken === 'Yes' && (!personal.absence_period || !personal.absence_period.trim())) errors.push('Absence period is required');
        if (personal.absence_taken === 'Yes' && personal.absence_period && !hasCompleteAbsencePeriods(personal.absence_period)) errors.push('Start and end date are required for each absence period');

        if (isFilled(personal.email)) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(personal.email.trim())) {
                errors.push('Invalid email format');
            }
        }

        // Validate DOB and Joining Date business rules
        const personalValidation = validatePersonalData(personal);
        if (!personalValidation.valid) {
            personalValidation.errors.forEach(err => {
                errors.push(err.message);
            });
        }

        // Validate course rows added in Part II
        getCourseValidationIssues(formData?.teaching?.courses_taught || []).forEach(({ submitMessage }) => {
            errors.push(submitMessage);
        });

        // // Validate DOB and Joining Date business rules
        // const personalValidation = validatePersonalData(personal);
        // if (!personalValidation.valid) {
        //     personalValidation.errors.forEach(err => {
        //         errors.push(err.message);
        //     });
        // }

        // Validate course rows added in Part II
        getCourseValidationIssues(formData?.teaching?.courses_taught || []).forEach(({ submitMessage }) => {
            errors.push(submitMessage);
        });

        // Validate Corporate Life (Part IV)
        const corporate = formData.corporate || {};
        const hasContribution = isFilled(corporate.curriculum_development) || 
                                isFilled(corporate.course_development_details) || 
                                isFilled(corporate.lab_development) || 
                                isFilled(corporate.cultural_activities) || 
                                isFilled(corporate.sports_community) || 
                                isFilled(corporate.admin_assignment_university) || 
                                isFilled(corporate.admin_assignment_department) || 
                                isFilled(corporate.admin_assignment_external) || 
                                isFilled(corporate.any_other);
        
        if (!hasContribution) {
            errors.push('Please fill at least one field in Part IV - Corporate Life');
        }
        
        if (corporate.certify !== 'true' && corporate.certify !== true && !certified) {
             errors.push('You must certify the Corporate Life section in Part IV');
        }

        //  // Validate Corporate Life (Part IV)
        // const corporate = formData.corporate || {};
        // const hasContribution = isFilled(corporate.curriculum_development) || 
        //                         isFilled(corporate.course_development_details) || 
        //                         isFilled(corporate.lab_development) || 
        //                         isFilled(corporate.cultural_activities) || 
        //                         isFilled(corporate.sports_community) || 
        //                         isFilled(corporate.admin_assignment) || 
        //                         isFilled(corporate.any_other);
        
        // if (!hasContribution) {
        //     errors.push('Please fill at least one field in Part IV - Corporate Life');
        // }
        
        // if (corporate.certify !== 'true' && corporate.certify !== true && !certified) {
        //      errors.push('You must certify the Corporate Life section in Part IV');
        // }

        // Validate Assessment Scores (Part V)
        const assessment = formData.assessment || {};
        const validateScore = (value, fieldName) => {
            if (isFilled(value)) {
                const num = parseInt(value);
                if (isNaN(num) || num < 1 || num > 10) {
                    errors.push(`${fieldName} must be between 1 and 10`);
                }
            }
        };

        if (assessment.section_a) {
            validateScore(assessment.section_a.q1, 'Section A Q1');
            validateScore(assessment.section_a.q2, 'Section A Q2');
            validateScore(assessment.section_a.q3, 'Section A Q3');
            validateScore(assessment.section_a.q4, 'Section A Q4');
            validateScore(assessment.section_a.overall_grading, 'Section A Overall Grading');
        }

        if (assessment.section_b) {
            ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7a', 'q7b', 'q8', 'q9', 'q10', 'overall_grading'].forEach(q => {
                validateScore(assessment.section_b[q], `Section B ${q.toUpperCase()}`);
            });
        }

        if (assessment.section_c) {
            ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'overall_grading'].forEach(q => {
                validateScore(assessment.section_c[q], `Section C ${q.toUpperCase()}`);
            });
        }

        if (assessment.general) {
            validateScore(assessment.general.q6, 'Overall Numerical Grading');
        }

        // Validate Remarks (Part VI)
        const remarks = formData.remarks || {};
        if (remarks.agree_with_assessment === 'No' && (!isFilled(remarks.disagreement_reason))) {
            errors.push('Please provide reason for disagreement with assessment');
        }

        return errors;
    };

    const handleSubmit = async () => {
        try {
            const ay = reduxAy || loginData.academic_year || (location.state?.ay) || (() => {
                const start = formData.personal.report_start_date
                const end = formData.personal.report_end_date
                return getAcademicYearFromDates(start, end)
            })()

            const facultyId = (aparUser && (aparUser.teacherId || aparUser.faculty_id || aparUser.id));
            if (!ay || !facultyId || ay === 'undefined') {
                toast.error("Invalid Academic Year or Faculty ID");
                return;
            }

            const validationErrors = validateFormData();
            if (validationErrors.length > 0) {
                toast.error(`Validation errors: ${validationErrors.slice(0, 5).join(', ')}${validationErrors.length > 5 ? '...' : ''}`);
                return;
            }

            if (!isReadOnlyMode() && !certified) {
                toast.error('Please certify the form before submitting.');
                return;
            }

            const payload = {
                ay: ay,
                faculty_id: facultyId,
                formData: formData
            };
            let submitPayload = payload;

            try {
                const monthlyRes = await AparFormGradedService.saveToMonthly(payload);
                if (monthlyRes?.research) {
                    const formDataWithMonthlyIds = {
                        ...formData,
                        research: monthlyRes.research
                    };
                    submitPayload = {
                        ...payload,
                        formData: formDataWithMonthlyIds
                    };
                    setFormData(formDataWithMonthlyIds);
                }
            } catch (e) {
                console.error('Monthly save before submit failed:', e);
                const msg = e.response?.data?.message || 'Failed to save monthly data before submission';
                toast.error(msg);
                return; 
            }

            await AparFormGradedService.submit(submitPayload);
            toast.success('APAR Form Submitted Successfully!');
            navigate('/apar/dashboard');
        } catch (e) {
            console.error(e);
            const msg = e.response?.data?.message || 'Failed to submit form';
            toast.error(msg);
        }
    };

    const prevStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
            window.scrollTo(0, 0);
        }
    };

    const handlePersonalChange = (e) => {
        const { name, value } = e.target;
        const sanitized = sanitizeForApar(value, `personal.${name}`);
        setFormData(prev => ({ ...prev, personal: { ...prev.personal, [name]: sanitized } }));
    };

    const addItem = (section, field, initialItem) => {
        setFormData(prev => {
            const next = {
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: [...prev[section][field], initialItem]
                }
            };
            handleSaveDraft(true, next);
            return next;
        });
    };

    const removeItem = async (section, field, index) => {
        const itemToRemove = formData?.[section]?.[field]?.[index];
        const documentPaths = [...collectAparDocumentPaths(itemToRemove)];

        try {
            // Delete the row's files first. The endpoint also clears the stored
            // APAR references, so deleting a row cannot leave orphan PDFs.
            await Promise.all(documentPaths.map(path => AparFormGradedService.deleteDocument(path)));
        } catch (error) {
            console.error('Row PDF deletion failed:', error);
            toast.error('Could not delete the row PDF. The row was kept unchanged.');
            return false;
        }

        const next = {
            ...formData,
            [section]: {
                ...formData[section],
                [field]: (formData[section][field] || []).filter((_, i) => i !== index)
            }
        };

        // Persist first: saveForm compares old and new document paths and removes
        // the file from object storage only after the row deletion succeeds.
        const saved = await handleSaveDraft(true, next);
        if (saved) setFormData(next);
        return saved;
    };

    const updateArrayField = (section, field, index, key, value) => {
        setFormData(prev => {
            const updatedArray = [...prev[section][field]];
            const sanitized = sanitizeForApar(value, `${section}.${field}.${key}`);
            updatedArray[index] = { ...updatedArray[index], [key]: sanitized };
            const next = {
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: updatedArray
                }
            };
            handleSaveDraft(true, next);
            return next;
        });
    };

    const updateArrayItem = (section, field, index, newItem) => {
        setFormData(prev => {
            const updatedArray = [...prev[section][field]];
            const sanitizedItem = sanitizeDeep(newItem, `${section}.${field}`);
            updatedArray[index] = sanitizedItem;
            const next = {
                ...prev,
                [section]: {
                    ...prev[section],
                    [field]: updatedArray
                }
            };
            handleSaveDraft(true, next);
            return next;
        });
    };

    const updateAssessment = (section, key, value) => {
        const sanitizedVal = sanitizeForApar(value, `assessment.${section}.${key}`);
        setFormData(prev => {
            const next = {
                ...prev,
                assessment: {
                    ...prev.assessment,
                    [section]: {
                        ...prev.assessment[section],
                        [key]: sanitizedVal
                    }
                }
            };

            const numericKeys = {
                section_a: ['q1', 'q2', 'q3', 'q4'],
                section_b: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7a', 'q7b', 'q8', 'q9', 'q10'],
                section_c: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6']
            };

            if (section in numericKeys) {
                const vals = numericKeys[section]
                    .map((k) => parseInt((next.assessment[section]?.[k] ?? '').toString(), 10))
                    .filter((n) => Number.isFinite(n));
                if (vals.length > 0) {
                    const avg = Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
                    next.assessment[section].overall_grading = String(avg);
                } else {
                    next.assessment[section].overall_grading = '';
                }
            }

            const a = parseInt((next.assessment.section_a?.overall_grading ?? '').toString(), 10);
            const b = parseInt((next.assessment.section_b?.overall_grading ?? '').toString(), 10);
            const c = parseInt((next.assessment.section_c?.overall_grading ?? '').toString(), 10);

            const parts = [];
            if (Number.isFinite(a)) parts.push({ val: a, w: 0.4 });
            if (Number.isFinite(b)) parts.push({ val: b, w: 0.3 });
            if (Number.isFinite(c)) parts.push({ val: c, w: 0.3 });

            if (parts.length > 0) {
                const wsum = parts.reduce((s, p) => s + p.w, 0);
                const weighted = parts.reduce((s, p) => s + p.val * p.w, 0) / (wsum || 1);
                next.assessment.general = {
                    ...next.assessment.general,
                    q6: String(Math.round(weighted))
                };
            }

            const bOverall = parseInt((next.assessment.section_b?.overall_grading ?? '').toString(), 10);
            if (Number.isFinite(bOverall)) {
                let gradeText = '';
                if (bOverall >= 9) gradeText = 'Outstanding';
                else if (bOverall >= 8) gradeText = 'Very Good';
                else if (bOverall >= 6) gradeText = 'Good';
                else if (bOverall >= 4) gradeText = 'Average';
                else gradeText = 'Below Average';
                next.assessment.section_b = {
                    ...next.assessment.section_b,
                    q11: gradeText
                };
            } else {
                next.assessment.section_b = {
                    ...next.assessment.section_b,
                    q11: ''
                };
            }

            return next;
        });
    };

    const updateField = (section, key, value) => {
        const sanitized = (value !== null && typeof value === 'object')
            ? sanitizeDeep(value, `${section}.${key}`)
            : sanitizeForApar(value, `${section}.${key}`);
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: sanitized
            }
        }));
    };

    const updateRemarks = (key, value) => {
        const sanitized = sanitizeForApar(value, `remarks.${key}`);
        setFormData(prev => ({
            ...prev,
            remarks: {
                ...prev.remarks,
                [key]: sanitized
            }
        }));
    };

    const finalizeReportingSubmit = async (status, comment) => {
        try {
            const payload = {
                faculty_id: selectedFacultyRaw?.faculty_id || selectedFacultyRaw?.id?.split('-')[0],
                ay: selectedFacultyRaw?.ay || selectedFacultyRaw?.id?.split('-').slice(1).join('-'),
                assessment: formData.assessment,
                status: status,
                query_comment: comment
            };
            await aparFormReportingService.submit(payload);
            if (status === 'Query Raised' || status === 'Query Raised by Reporting officer') {
                toast.success('Form returned to faculty with query');
            } else if (status === 'Forwarded by Reporting officer') {
                toast.success('Form verified and forwarded successfully');
            } else {
                toast.success('Form status updated');
            }
            setFormStatus(status);
            navigate('/apar/reporting');
        } catch (err) {
            console.error(err);
            toast.error('Submission failed');
        }
    };

    const handleReportingSubmit = async (status) => {
        if (!validateOfficerAction('reporting')) return;
        if (status === 'Query Raised' || status === 'Query Raised by Reporting officer') {
            setPendingAction({ type: 'reporting', status: 'Query Raised by Reporting officer' });
            setQueryModalOpen(true);
        } else {
            requestSubmitConfirmation('reporting', status);
        }
    };

    const finalizeReviewingSubmit = async (status, comment) => {
        try {
            const payload = {
                faculty_id: selectedFacultyRaw?.faculty_id || selectedFacultyRaw?.id,
                ay: selectedFacultyRaw?.ay || selectedFacultyRaw?.id?.split('-').slice(1).join('-'),
                remarks: formData.remarks,
                status: status,
                query_comment: comment
            };
            await aparFormReportingService.submitReview(payload);
            if (status.includes('Query')) {
                toast.success('Query raised successfully');
            } else {
                toast.success('Review verified and forwarded successfully');
            }
            setFormStatus(status);
            navigate('/apar/reporting');
        } catch (err) {
            console.error(err);
            toast.error('Review submission failed');
        }
    };

    const handleReviewingSubmit = async (statusOverride = 'Accepted by Reviewing officer') => {
        if (!validateOfficerAction('reviewing')) return;
        if (statusOverride.includes('Query')) {
            setPendingAction({ type: 'reviewing', status: statusOverride });
            setQueryModalOpen(true);
        } else {
            requestSubmitConfirmation('reviewing', statusOverride);
        }
    };

    const handleLoadForm = async (faculty) => {
        try {
            const facultyId = faculty.raw?.faculty_id || faculty.faculty_id || faculty.id?.split('-')[0];
            const ay = faculty.raw?.ay || faculty.ay || faculty.id?.split('-').slice(1).join('-');

            if (!facultyId || !ay) {
                toast.error("Missing ID or AY");
                return;
            }

            const res = await aparFormReportingService.getForm(facultyId, ay);
            const mongoData = res.data || res;

            if (!mongoData) {
                toast.error("Form data not found");
                return;
            }

            setFormData(prev => ({
                ...prev,
                personal: {
                    ...prev.personal,
                    ...(mongoData.personal || {}),
                    date_of_birth: mongoData.personal?.date_of_birth ? mongoData.personal.date_of_birth.substring(0, 10) : prev.personal.date_of_birth,
                    joining_date: mongoData.personal?.joining_date ? mongoData.personal.joining_date.substring(0, 10) : prev.personal.joining_date,
                },
                profileQualifications: mongoData.profileQualifications || prev.profileQualifications || [],
                teaching: { ...prev.teaching, ...(mongoData.teaching || {}) },
                research: { ...prev.research, ...(mongoData.research || {}) },
                corporate: { ...prev.corporate, ...(mongoData.corporate || {}) },
                assessment: { ...prev.assessment, ...(mongoData.assessment || {}) },
                remarks: { ...prev.remarks, ...(mongoData.remarks || {}) }
            }));

            if (mongoData.status) {
                setFormStatus(mongoData.status);
            }

            setViewMode('form');
            setCurrentStep(1);
            setCertified(false);
            setSelectedFacultyRaw(faculty.raw || faculty);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load form data");
        }
    };

    React.useEffect(() => {
        const sf = location.state?.selectedFaculty;
        if (sf) {
            handleLoadForm(sf);
        }
    }, [location.state]);

    const getStepTitle = (step) => {
        switch (step) {
            case 1: return "Personal Data";
            case 2: return "Self Appraisal";
            case 3: return "Research & Development";
            case 4: return "Corporate Life";
            case 5: return (activeRole === 'Reporting Officer' || activeRole === 'Reviewing Officer') ? "Assessment (Part V)" : "Review & Submit";
            case 6: return activeRole === 'Reviewing Officer' ? "Remarks (Part VII)" : "Review & Submit";
            case 7: return "Review & Submit";
            default: return "";
        }
    };

    if (!aparUser) {
        return (
            <div className="min-h-screen bg-gray-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
                <div className="sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="text-center">
                        <img src="/dtu_logo.jpeg" alt="DTU Logo" className="h-28 w-auto mx-auto object-contain mb-4" />
                        <h2 className="text-3xl font-extrabold text-gray-900">DTU APAR System</h2>
                        <p className="mt-2 text-sm text-gray-600">Please sign in to access the form</p>
                    </div>
                </div>

                <AparLogin loginData={loginData} setLoginData={setLoginData} />

                <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md">
                    <div className="relative flex justify-center text-sm">
                        <span className="px-2 bg-white text-gray-500">
                            <button onClick={() => navigate('/')} className="text-indigo-600 hover:text-indigo-500">Back to Home</button>
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    const submitConfirmationCopy = getSubmitConfirmationText();
    const certificationLocked = (
        (activeRole === 'Reporting Officer' && formStatus === 'Forwarded by Reporting officer') ||
        (activeRole === 'Reviewing Officer' && formStatus === 'Accepted by Reviewing officer') ||
        (activeRole === 'Officer (Graded)' && isReadOnlyMode())
    );
    const activeAparAcademicYear = getAcademicYearFromAparForm(
        formData,
        normalizeAcademicYear(reduxAy || loginData.academic_year || location.state?.ay)
    );

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white">
            <Toaster richColors position="top-right" />
            <div className="max-w-7xl mx-auto mb-6">
                <div className="flex justify-between items-center print:hidden mb-4">
                    <button
                        onClick={() => {
                            if (activeRole === 'Officer (Graded)') {
                                navigate('/apar/dashboard');
                            } else {
                                navigate('/apar/reporting');
                            }
                        }}
                        className="flex items-center text-gray-600 hover:text-gray-900"
                    >
                        <FiArrowLeft className="mr-2" /> Back to Dashboard
                    </button>
                    <div className="flex items-center space-x-3">
                        <NotificationBell />
                        <button
                            onClick={handlePrint}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                            <FiPrinter className="mr-2" /> Print Form
                        </button>
                        <button
                            type="button"
                            onClick={handleExportWord}
                            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                        >
                            <FiFileText className="mr-2" /> Word
                        </button>
                        <button
                            type="button"
                            onClick={handleExportExcel}
                            className="flex items-center px-4 py-2 bg-emerald-600 text-white rounded-md hover:bg-emerald-700 transition-colors"
                        >
                            <FiGrid className="mr-2" /> Excel
                        </button>
                        <ProfileDropdown />
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden p-8 print:shadow-none print:p-0">
                {viewMode === 'list' && (activeRole === 'Reporting Officer' || activeRole === 'Reviewing Officer') ? (
                    <>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {activeRole === 'Reporting Officer' ? "Pending Assessments" : "Pending Reviews"}
                            </h2>
                            <div className="overflow-hidden border border-gray-200 rounded-lg shadow">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Faculty Name</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Designation</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted On</th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {submittedForms.map((form) => (
                                            <tr key={form.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{form.name}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{form.designation}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{form.department}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{form.submissionDate}</td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                    <button onClick={() => handleLoadForm(form)} className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-200">Review Form</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                ) : (
                    <>
                        {(activeRole === 'Officer (Graded)') && profileGate.checked && !profileGate.ok ? (
                            <div className="p-6 mb-6 border border-amber-200 bg-amber-50 rounded-lg">
                                <h3 className="text-lg font-semibold text-amber-800 mb-2">Please complete your Profile before filling the APAR form</h3>
                                <p className="text-sm text-amber-800 mb-3">Update your Profile with the required information, then return here.</p>
                                {Array.isArray(profileGate.issues) && profileGate.issues.length > 0 && (
                                    <ul className="list-disc pl-5 text-sm text-amber-900 space-y-1">
                                        {profileGate.issues.map((m,i) => (<li key={`${i}-${m}`}>{m}</li>))}
                                    </ul>
                                )}
                                <div className="mt-4 flex gap-3">
                                    <button type="button" onClick={() => navigate('/apar/profile')} className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700">Go to Profile</button>
                                    <button type="button" onClick={recheckProfile} disabled={profileGate.loading} className="px-4 py-2 rounded-md bg-gray-100 text-gray-800 text-sm font-semibold hover:bg-gray-200 disabled:opacity-60">{profileGate.loading ? 'Checking…' : 'Recheck'}</button>
                                </div>
                            </div>
                        ) : null}
                        {(!(activeRole === 'Officer (Graded)') || !profileGate.checked || profileGate.ok) && (
                        <>
                        <div className="border-b-2 border-gray-200 pb-6 mb-8">
                            <div className="flex items-center justify-center gap-6 mb-6">
                                <img src="/dtu_logo.jpeg" alt="DTU Logo" className="h-28 w-auto object-contain" />
                                <div className="text-center">
                                    <h1 className="text-2xl font-bold text-gray-900 uppercase">Delhi Technological University</h1>
                                    <p className="text-sm text-gray-600 mt-1">Estd. By Govt. of NCT of Delhi vide Act 6 of 2009</p>
                                    <p className="text-sm text-gray-600">(Formerly: Delhi College of Engineering)</p>
                                    <p className="text-sm text-gray-600">Shahbad Daulatpur, Bawana Road, Delhi -110042</p>
                                </div>
                            </div>

                            <div className="text-center">
                                <h2 className="text-xl font-bold text-gray-800 uppercase">Annual Performance Assessment Report Form</h2>
                                <p className="text-md font-medium text-gray-700 mt-2">For Professor/ Associate Professor/ Assistant Professor</p>
                            </div>
                        </div>

                        <div className="mb-8 print:hidden">
                            <div className="flex justify-between mb-2">
                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200">
                                    Step {currentStep} of {totalSteps}: {getStepTitle(currentStep)}
                                </span>
                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase text-indigo-600">
                                    {Math.round(((currentStep - 1) / totalSteps) * 100)}% Completed
                                </span>
                            </div>
                            <div className="flex w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                    className="flex flex-col justify-center overflow-hidden bg-indigo-500 text-xs text-white text-center whitespace-nowrap transition-all duration-500 ease-out"
                                    style={{ width: `${(currentStep / totalSteps) * 100}%` }}
                                ></div>
                            </div>
                            <div className="hidden sm:flex justify-between mt-4">
                                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => (
                                    <div key={step} className={`flex flex-col items-center ${step <= currentStep ? 'text-indigo-600' : 'text-gray-400'}`}>
                                        <div className={`rounded-full h-8 w-8 flex items-center justify-center border-2 ${step <= currentStep ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200'}`}>
                                            {step < currentStep ? <FiCheck /> : step}
                                        </div>
                                        <div className="text-xs mt-1 text-center font-medium">{getStepTitle(step)}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <form className="space-y-8" onSubmit={(e) => e.preventDefault()}>
                            <div id="apar-step-1" className={currentStep === 1 ? 'block' : 'hidden print:block'}>
                                <div className="shadow-lg">
                                    <div>
                                        <button onClick={() => setPersonalOpen(p => !p)} className="text-sm text-indigo-600 mb-3">{personalOpen ? 'Hide' : 'Show'} Personal Data</button>
                                        {personalOpen && <PartIPersonal personal={formData.personal} onChange={handlePersonalChange} readOnly={isReadOnlyMode()} departments={departments} qualifications={formData.profileQualifications} />}
                                    </div>
                                </div>
                            </div>

                            <div id="apar-step-2" className={currentStep === 2 ? 'block' : 'hidden print:block'}>
                                <PartII formData={formData} addItem={addItem} removeItem={requestDelete} updateArrayField={updateArrayField} updateArrayItem={updateArrayItem} updateAssessment={updateAssessment} updateField={updateField} readOnly={isReadOnlyMode()} />
                            </div>

                            <div id="apar-step-3" className={currentStep === 3 ? 'block' : 'hidden print:block'}>
                                <PartIII formData={formData} academicYear={activeAparAcademicYear} addItem={addItem} removeItem={requestDelete} updateArrayField={updateArrayField} updateArrayItem={updateArrayItem} updateField={updateField} readOnly={isReadOnlyMode()} onSaveMonthly={handleSaveMonthly} />
                            </div>

                            <div id="apar-step-4" className={currentStep === 4 ? 'block' : 'hidden print:block'}>
                                <PartIV formData={formData} addItem={addItem} removeItem={requestDelete} updateArrayField={updateArrayField} updateArrayItem={updateArrayItem} updateField={updateField} readOnly={isReadOnlyMode()} />
                            </div>

                            {(activeRole === 'Reporting Officer' || activeRole === 'Reviewing Officer') && (
                                <div id="apar-step-5" className={currentStep === 5 ? 'block' : 'hidden print:block'}>
                                    <PartV formData={formData} updateAssessment={updateAssessment} activeRole={activeRole} formStatus={formStatus} />
                                </div>
                            )}

                            {activeRole === 'Reviewing Officer' && (
                                <div id="apar-step-6" className={currentStep === 6 ? 'block' : 'hidden print:block'}>
                                    <PartVIRemarks formData={formData} updateRemarks={updateRemarks} formStatus={formStatus} />
                                </div>
                            )}

                            <div id={`apar-step-${totalSteps}`} className={currentStep === totalSteps ? 'block' : 'hidden print:block'}>
                                <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
                                    <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">One Final Check</h3>
                                    <p className="text-sm text-gray-600 mb-6">
                                        {activeRole === 'Reporting Officer' || activeRole === 'Reviewing Officer'
                                            ? "Please review your entries. By submitting, you confirm the details are final."
                                            : "Please review all the information provided. All data entered corresponds to the institutional IQAC standards."}
                                    </p>

                                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8 max-h-[60vh] overflow-y-auto shadow-inner">
                                        <div className="space-y-12">
                                            <div>
                                                <h4 className="text-xl font-bold text-gray-900 border-b-2 border-indigo-200 pb-2 mb-6">Part I: Personal Data</h4>
                                                <PartIPersonal personal={formData.personal} onChange={() => {}} readOnly={true} departments={departments} qualifications={formData.profileQualifications} />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-gray-900 border-b-2 border-indigo-200 pb-2 mb-6 mt-8">Part II: Self Appraisal</h4>
                                                <PartII formData={formData} addItem={() => {}} removeItem={() => {}} updateArrayField={() => {}} updateArrayItem={() => {}} updateAssessment={() => {}} updateField={() => {}} readOnly={true} />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-gray-900 border-b-2 border-indigo-200 pb-2 mb-6 mt-8">Part III: Research & Development</h4>
                                                <PartIII formData={formData} academicYear={activeAparAcademicYear} addItem={() => {}} removeItem={() => {}} updateArrayField={() => {}} updateArrayItem={() => {}} updateField={() => {}} readOnly={true} onSaveMonthly={() => {}} />
                                            </div>
                                            <div>
                                                <h4 className="text-xl font-bold text-gray-900 border-b-2 border-indigo-200 pb-2 mb-6 mt-8">Part IV: Corporate Life</h4>
                                                <PartIV formData={formData} addItem={() => {}} removeItem={() => {}} updateArrayField={() => {}} updateArrayItem={() => {}} updateField={() => {}} readOnly={true} />
                                            </div>
                                            {(activeRole === 'Reporting Officer' || activeRole === 'Reviewing Officer') && (
                                                <div>
                                                    <h4 className="text-xl font-bold text-gray-900 border-b-2 border-indigo-200 pb-2 mb-6 mt-8">Part V: Assessment</h4>
                                                    <PartV formData={formData} updateAssessment={() => {}} activeRole={activeRole} formStatus={formStatus} readOnly={true} />
                                                </div>
                                            )}
                                            {activeRole === 'Reviewing Officer' && (
                                                <div>
                                                    <h4 className="text-xl font-bold text-gray-900 border-b-2 border-indigo-200 pb-2 mb-6 mt-8">Part VI: Remarks</h4>
                                                    <PartVIRemarks formData={formData} updateRemarks={() => {}} formStatus={formStatus} readOnly={true} />
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="mt-8 pt-4 border-t border-gray-100">
                                        <div className="flex bg-gray-50 p-4 rounded-md">
                                            <input
                                                type="checkbox"
                                                id="certification"
                                                name="certification"
                                                disabled={certificationLocked}
                                                required={!certificationLocked}
                                                aria-required={!certificationLocked}
                                                className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                                                checked={certified}
                                                onChange={(e) => setCertified(e.target.checked)}
                                            />
                                            <div className="ml-3">
                                                <label htmlFor="certification" className="text-sm font-medium text-gray-900 cursor-pointer">I certify that the information given above is correct and factual to the best of my knowledge.</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {(
                                <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 print:hidden">
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        disabled={currentStep === 1}
                                        className={`px-6 py-2 border rounded-md text-sm font-medium flex items-center shadow-sm ${currentStep === 1 ? 'border-gray-200 text-gray-400 cursor-not-allowed' : 'border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                                    >
                                        <FiArrowLeft className="mr-2" /> Previous
                                    </button>

                                    <div className="flex gap-4">
                                        {(activeRole === 'Officer (Graded)' && ['Draft', 'Query Raised', 'Query Raised by Reporting officer', 'Query Raised by Reviewing officer', 'not_filled'].includes(formStatus || 'Draft')) && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveDraft(false)}
                                                    disabled={isSavingDraft}
                                                    className={`px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center ${isSavingDraft ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {isSavingDraft ? 'Saving...' : 'Save Draft'}
                                                </button>
                                            </>
                                        )}

                                        {currentStep === totalSteps ? (
                                            <>
                                                {activeRole === 'Reporting Officer' && formStatus === 'Submitted' && (
                                                    <div className="flex gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReportingSubmit('Query Raised')}
                                                            className="px-6 py-2 bg-yellow-500 text-white font-semibold rounded hover:bg-yellow-600 transition-colors flex items-center"
                                                        >
                                                            Raise Query
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReportingSubmit('Forwarded by Reporting officer')}
                                                            className="px-6 py-2 bg-green-600 text-white font-semibold rounded hover:bg-green-700 transition-colors flex items-center"
                                                        >
                                                            <FiCheck className="mr-2" /> Verify & Forward
                                                        </button>
                                                    </div>
                                                )}

                                                {activeRole === 'Reviewing Officer' && formStatus === 'Forwarded by Reporting officer' && (
                                                    <div className="flex gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReviewingSubmit('Query Raised by Reviewing officer')}
                                                            className="px-6 py-2 bg-yellow-500 text-white font-semibold rounded hover:bg-yellow-600 transition-colors flex items-center"
                                                        >
                                                            Raise Query
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleReviewingSubmit('Accepted by Reviewing officer')}
                                                            className="px-8 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                                                        >
                                                            <FiCheck className="mr-2" /> Submit Review
                                                        </button>
                                                    </div>
                                                )}

                                                {activeRole === 'Officer (Graded)' && ['Draft', 'Query Raised', 'Query Raised by Reporting officer', 'Query Raised by Reviewing officer', 'not_filled'].includes(formStatus || 'Draft') && (
                                                    <button
                                                        type="button"
                                                        className="px-8 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
                                                        onClick={() => {
                                                            if (!certified) {
                                                                toast.error('Please certify the form before submitting.');
                                                                return;
                                                            }
                                                            requestSubmitConfirmation('officer');
                                                        }}
                                                    >
                                                        <FiCheck className="mr-2" /> Submit APAR
                                                    </button>
                                                )}
                                            </>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={nextStep}
                                                className="px-8 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 flex items-center"
                                            >
                                                Next
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </form>
                        </>
                        )}
                    </>
                )}
            </div>

            {submitConfirmModal.open && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 p-4 backdrop-blur-sm print:hidden">
                    <div className="w-full max-w-md rounded-2xl border border-emerald-100 bg-white p-6 shadow-2xl">
                        <div className="mb-4 flex items-start gap-3">
                            <div className="rounded-full bg-emerald-100 p-2 text-emerald-700">
                                <FiCheck className="h-5 w-5" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{submitConfirmationCopy.title}</h3>
                                <p className="mt-1 text-sm text-gray-600">{submitConfirmationCopy.message}</p>
                            </div>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={closeSubmitConfirmation}
                                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-200"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={confirmSubmitAction}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                            >
                                Confirm Submit
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {queryModalOpen && (
                <div className="fixed inset-0 bg-transparent overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-md">
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 overflow-hidden transform transition-all border border-gray-100">
                        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                <FiAlertCircle className="mr-2" /> Raise Query
                            </h3>
                            <button onClick={() => setQueryModalOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        <div className="p-6">
                            <p className="text-gray-600 text-sm mb-4">
                                Please provide a detailed reason for raising this query. This comment will be visible to the Officer to help them address the issue.
                            </p>

                            <label className="block text-sm font-medium text-gray-700 mb-2">Query Remarks / Comments</label>
                            <textarea
                                className="w-full border-gray-300 rounded-xl shadow-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 p-3 min-h-[120px] text-gray-800"
                                placeholder="Enter specific details about the corrections needed..."
                                value={queryComment}
                                onChange={(e) => setQueryComment(e.target.value)}
                                autoFocus
                            ></textarea>
                        </div>

                        <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-gray-100">
                            <button
                                onClick={confirmQuerySubmission}
                                className="inline-flex justify-center rounded-lg border border-transparent shadow-sm px-5 py-2.5 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all"
                            >
                                Submit Query
                            </button>
                            <button
                                onClick={() => { setQueryModalOpen(false); setQueryComment(''); }}
                                className="inline-flex justify-center rounded-lg border border-gray-300 shadow-sm px-5 py-2.5 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto mt-8 text-center text-gray-500 text-sm print:hidden">
                <p>Annual Performance Assessment Report System &copy; {new Date().getFullYear()} DTU</p>
            </div>
            
            {deleteModal.open && (
                <div className="fixed inset-0 z-[100] overflow-y-auto print:hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setDeleteModal({ ...deleteModal, open: false })}></div>

                    <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                        <div className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg">
                            <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                                <div className="sm:flex sm:items-start">
                                    <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                                        <FiAlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                                        <h3 className="text-lg font-semibold leading-6 text-gray-900" id="modal-title">Delete Item</h3>
                                        <div className="mt-2">
                                            <p className="text-sm text-gray-500">Are you sure you want to delete this item? This action cannot be undone.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                                <button
                                    type="button"
                                    className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 sm:ml-3 sm:w-auto"
                                    onClick={confirmDelete}
                                >
                                    Delete
                                </button>
                                <button
                                    type="button"
                                    className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                                    onClick={() => setDeleteModal({ ...deleteModal, open: false })}
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
