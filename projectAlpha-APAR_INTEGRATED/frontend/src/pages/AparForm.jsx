import React, { useState, useCallback } from 'react';
import { FiArrowLeft, FiPrinter, FiCheck, FiAlertCircle } from 'react-icons/fi';
import ProfileDropdown from '../components/ProfileDropdown.jsx';
import { toast, Toaster } from 'sonner';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { aparLogout, selectAparAcademicYear } from '../store/slices/aparAuthSlice.js';
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
import { useAparRealTimeSync, mergeNewEntry } from '../hooks/useAparRealTimeSync';
import NotificationBell from '../components/NotificationBell.jsx';
import { DepartmentService } from '../services/department.services.js';
import { useSocket } from '../context/SocketContext.jsx'; // Import the hook

export default function AparForm() {
    const { socket } = useSocket(); // Get socket from context
    const navigate = useNavigate();
    const location = useLocation();
    const [currentStep, setCurrentStep] = useState(1);
    // auth state moved up to use in totalSteps logic
    const [loginData, setLoginData] = useState({ id: '', password: '', role: 'Officer (Graded)' });
    const aparUser = useSelector((state) => state.aparAuth.user);
    const aparRole = useSelector((state) => state.aparAuth.role);
    const reduxAy = useSelector(selectAparAcademicYear);
    const activeRole = aparRole || loginData.role;
    const dispatch = useDispatch();
    const getSteps = () => {
        if (activeRole === 'Reporting Officer') return 6;
        if (activeRole === 'Reviewing Officer') return 7;
        return 5;
    };

    // Prefill faculty profile info on user change (ensures prefill even if AY is not yet set)
    React.useEffect(() => {
        if (!aparUser) return;
        (async () => {
            try {
                const infoRes = await AparFormGradedService.getFacultyInfo();
                const info = infoRes?.data || infoRes;
                if (info) {
                    setFormData(prev => ({
                        ...prev,
                        personal: {
                            ...prev.personal,
                            name: info.name || prev.personal.name,
                            designation: info.designation || prev.personal.designation,
                            email: info.email || prev.personal.email,
                            phone: info.phone || prev.personal.phone,
                            department_id: info.department_id || prev.personal.department_id,
                            qualification: info.qualification || prev.personal.qualification,
                            joining_date: info.joining_date ? info.joining_date.substring(0, 10) : prev.personal.joining_date,
                            date_of_birth: info.date_of_birth ? info.date_of_birth.substring(0, 10) : prev.personal.date_of_birth,
                            sc_st_status: info.sc_st_status || prev.personal.sc_st_status,
                            grade: info.grade || prev.personal.grade
                        }
                    }));
                    console.log('Prefilled faculty information from /apar/mongo/info');
                }
            } catch (err) {
                console.error('Failed to prefill faculty information', err);
            }
        })();
    }, [aparUser]);
    const [viewMode, setViewMode] = useState('form');
    // Track form status for completion screen
    const [formStatus, setFormStatus] = useState('Draft');
    const [departments, setDepartments] = useState([]);

    console.log("Hello DTU!!!")

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

    // Ensure department_id is set from user info if not already set after departments are loaded
    React.useEffect(() => {
        if (
            departments.length > 0 &&
            aparUser &&
            (!formData.personal.department_id || !departments.some(d => d.department_id === formData.personal.department_id))
        ) {
            // Try to set department_id from user info if available
            const userDeptId = aparUser.department_id || aparUser.departmentId;
            if (userDeptId && departments.some(d => d.department_id === userDeptId)) {
                setFormData(prev => ({
                    ...prev,
                    personal: {
                        ...prev.personal,
                        department_id: userDeptId
                    }
                }));
            }
        }
    }, [departments, aparUser]);





    // Reporting/Reviewing officer: fetch pending submissions for dashboard
    React.useEffect(() => {
        if (!aparUser) return;
        const role = aparRole || loginData.role;
        if (!(role === 'Reporting Officer' || role === 'Reviewing Officer')) return;
        if (viewMode !== 'list') return;
        (async () => {
            try {
                let rows = []
                if ((loginData.role === 'Reporting Officer' || aparRole === 'Reporting Officer')) {
                    // assignments are fixed; fetch assigned officers via reporting service
                    const resp = await aparFormReportingService.getAssigned()
                    rows = resp?.rows || resp?.data || resp || []
                } else if ((loginData.role === 'Reviewing Officer' || aparRole === 'Reviewing Officer')) {
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

    // WebSocket Real-Time Sync - automatically updates form when IQAC adds new entries
    const handleNewEntry = useCallback((data) => {
        console.log('📬 Real-time update received:', data);
        setFormData(prev => ({
            ...prev,
            research: mergeNewEntry(prev.research, data)
        }));
        // Optional: Set a flag to indicate unsaved changes
        // setHasUnsavedChanges(true);
    }, []);

    // (Logic moved to main useEffect)
    const gradedId = aparUser?.teacherId || aparUser?.faculty_id || aparUser?.id;
    // const currentAy = reduxAy || loginData.academic_year;
    // useAparRealTimeSync call removed to avoid double-joining/conditional issues

    const totalSteps = getSteps();
    const [personalOpen, setPersonalOpen] = useState(true);

    // Submitted forms (for Reporting/Reviewing Officer dashboard)
    const [submittedForms, setSubmittedForms] = useState([]);
    const [certified, setCertified] = useState(false);
    const [selectedFacultyRaw, setSelectedFacultyRaw] = useState(null);
    const [logoutLoading, setLogoutLoading] = useState(false);

    // Popup State
    const [queryModalOpen, setQueryModalOpen] = useState(false);
    const [queryComment, setQueryComment] = useState('');
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [pendingAction, setPendingAction] = useState(null); // { type: 'reporting' | 'reviewing', status: string }
    const [deleteModal, setDeleteModal] = useState({ open: false, section: null, field: null, index: null });

    // Deduplication ref for socket events
    const lastEventRef = React.useRef(0);

    const requestDelete = (section, field, index) => {
        setDeleteModal({ open: true, section, field, index });
    };

    const confirmDelete = () => {
        if (deleteModal.section && deleteModal.field && deleteModal.index !== null) {
            removeItem(deleteModal.section, deleteModal.field, deleteModal.index);
            toast.success("Item deleted");
        }
        setDeleteModal({ open: false, section: null, field: null, index: null });
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


    // Form State
    const [formData, setFormData] = useState({
        // Step 1: Faculty (Personal Data)
        personal: {
            name: '',
            designation: '',
            date_of_birth: '',
            email: '',
            phone: '',
            department_id: '',
            qualification: '',
            joining_date: '',
            report_start_date: '',
            report_end_date: '',
            section_officer: '',
            sc_st_status: '',
            absence_period: '',
            title: '',
            academics: '',
            caste: '',
            grade: ''
        },
        // Step 2: Self Appraisal & Teaching
        teaching: {
            immovable_property_return: '',
            health_checkup_file: null,
            description_of_duties: '',
            courses_taught: [
                { name_of_course: '', total_lectures_scheduled: '', total_lectures_engaged: '', tutorials_scheduled: '', tutorials_engaged: '', labs_scheduled: '', labs_engaged: '', reasons_not_engaged: '', degree_type: 'UG' }
            ],
            // total hours/periods provided in timetable vs actually taken
            time_table: {
                provided: { odd_semester: '', even_semester: '' },
                actual: { odd_semester: '', even_semester: '' }
            },
            // workload per week for odd/even semesters
            workload_week: {
                odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' },
                even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }
            },
            teaching_methods: '',
            ict_tools: '',
            student_centric_methods: '',
            tutorials_tests: {
                ug_odd: { number_of_tests: '', assignment_checked: '' },
                ug_even: { number_of_tests: '', assignment_checked: '' },
                pg_odd: { number_of_tests: '', assignment_checked: '' },
                pg_even: { number_of_tests: '', assignment_checked: '' }
            },
            academic_planning: ''
        },
        // Step 3: Research
        research: {
            journals: [],
            conferences: [],
            events: [], // Keep for now or rename to fdp_participation
            projects: [],
            phd_guidance: [], // legacy array
            phd_supervision: [], // New IQAC structure
            books: [],
            fdps: [],
            consultancy: [],
            patents: [],
            awards: [],
            e_content: [],
            collaborations: [],
            faculty_visits: [],
            memberships: [],
            // Text fields
            summer_institutes: '',
            ug_pg_guidance: '',
            phd_guidance_text: 'See PhD Supervision table above', // Helper text or default
            research_guidance: '',
            industry_interaction: '',
            memberships_text: '',
            other_activities: ''
        },
        // Step 4: Corporate Life
        corporate: {
            curriculum_development: '',
            course_development_details: '',
            lab_development: '',
            cultural_activities: '',
            sports_community: '',
            admin_assignment: '',
            any_other: '',
            certify: false
        },
        // Step 6: Numerical Assessment (Reporting Officer Only)
        assessment: {
            section_a: { q1: '', q2: '', q3: '', q4: '', overall_grading: '' },
            section_b: { q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', q7a: '', q7b: '', q8: '', q9: '', q10: '', q11: '', overall_grading: '' },
            section_c: { q1: '', q2: '', q3: '', q4: '', q5: '', q6: '', overall_grading: '' },
            general: { q1: '', q2: '', q3: '', q4: '', q5: '', q6: '' }
        },
        // Step 7: Remarks (Reviewing Officer Only)
        remarks: {
            length_of_service: '',
            satisfied_with_reporting: '',
            agree_with_assessment: 'Yes',
            disagreement_reason: '',
            general_remarks: '',
            specific_characteristics: ''
        },
        timeline: {}
    });

    // --- Refactored Fetch Logic to be Reusable ---
    const fetchFormData = useCallback(async (gradedId, ay) => {
        if (!gradedId) return;
        try {
            // 1. FIRST: Fetch Faculty Info from Faculty table (baseline data)
            let facultyInfo = null;
            try {
                const infoRes = await AparFormGradedService.getFacultyInfo();
                facultyInfo = infoRes.data || infoRes;
                console.log('📋 Faculty Info fetched:', facultyInfo);
            } catch (infoErr) {
                console.error('Failed to fetch faculty info:', infoErr);
            }

            // 2. Pre-fill form with faculty data first
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
                        qualification: facultyInfo.qualification || prev.personal.qualification,
                        joining_date: facultyInfo.joining_date ? facultyInfo.joining_date.substring(0, 10) : prev.personal.joining_date,
                        date_of_birth: facultyInfo.date_of_birth ? facultyInfo.date_of_birth.substring(0, 10) : prev.personal.date_of_birth,
                        sc_st_status: facultyInfo.sc_st_status || prev.personal.sc_st_status,
                        grade: facultyInfo.grade || prev.personal.grade
                    }
                }));
                console.log('✅ Form pre-filled with faculty data');
            }

            // 3. Fetch Departments
            try {
                const deptRes = await DepartmentService.getDepartments();
                const depts = deptRes.data || deptRes || [];
                setDepartments(depts);
            } catch (deptErr) {
                console.error('Failed to fetch departments', deptErr);
            }

            // 4. THEN: Check Mongo Form and overlay it (mongo data takes precedence over faculty data)
            const mongoRes = await AparFormGradedService.getForm(gradedId, ay)
            const mongoData = mongoRes.data || mongoRes
            if (mongoData && mongoData.faculty_id) {
                // Found in Mongo! Populate state.
                if (mongoData.status) {
                    setFormStatus(mongoData.status);
                }

                // Restore AY if missing
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
                        date_of_birth: mongoData.personal?.date_of_birth ? mongoData.personal.date_of_birth.substring(0, 10) : prev.personal.date_of_birth,
                        joining_date: mongoData.personal?.joining_date ? mongoData.personal.joining_date.substring(0, 10) : prev.personal.joining_date,
                    },
                    teaching: { ...prev.teaching, ...(mongoData.teaching || {}) },
                    research: { ...prev.research, ...(mongoData.research || {}) }, // Crucial: Updates Research Tables
                    corporate: { ...prev.corporate, ...(mongoData.corporate || {}) },
                    assessment: { ...prev.assessment, ...(mongoData.assessment || {}) },
                    remarks: { ...prev.remarks, ...(mongoData.remarks || {}) },
                    reporting_query: mongoData.reporting_query,
                    reviewing_query: mongoData.reviewing_query
                }))
                console.log('✅ Form overlaid with MongoDB data');
            } else {
                console.log('ℹ️ No existing APAR form found in MongoDB');
            }

        } catch (e) {
            console.error("Auto-refresh failed", e);
        }
    }, []); // Empty deps - function is stable

    // --- Socket.IO Room Joining and Listener ---
    React.useEffect(() => {
        if (!socket || !aparUser) return;

        const facultyId = aparUser.teacherId || aparUser.faculty_id || aparUser.id;

        // Resolve AY
        let rawAy = reduxAy || loginData.academic_year || (location.state?.ay);
        // Fallback AY derivation
        if (!rawAy && formData.personal?.report_start_date && formData.personal?.report_end_date) {
            try {
                const s = new Date(formData.personal.report_start_date).getFullYear();
                const e = new Date(formData.personal.report_end_date).getFullYear();
                rawAy = `${s}-${e}`;
            } catch (e) { }
        }

        // Helper to normalize AY for consistent room names and API calls
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
            console.log(`[FRONTEND] Requesting join APAR Room: ${facultyId}, ${ay}`);

            // Initial Fetch on Load
            fetchFormData(facultyId, ay);
        }

        const handleDataUpdate = (data) => {
            console.log('[FRONTEND] Received Update:', data);
            // toast.info("New IQAC data received. Refreshing form...", { autoClose: 3000 }); // Removed to avoid double popup with NotificationBell
            fetchFormData(facultyId, ay);
        };

        const handleNewEntrySocket = (data) => {
            const now = Date.now();
            if (now - lastEventRef.current < 1000) return;
            lastEventRef.current = now;

            console.log('[FRONTEND] 📬 Real-time NEW ENTRY received:', data);

            // Small delay to ensure DB write propagates
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

        const handleDeleteEntrySocket = (data) => {
            const now = Date.now();
            if (now - lastEventRef.current < 1000) return;
            lastEventRef.current = now;

            console.log('[FRONTEND] 📬 Real-time DELETE ENTRY received:', data);

            setTimeout(() => {
                const facultyId = aparUser?.teacherId || aparUser?.faculty_id || aparUser?.id;
                if (facultyId && ay) {
                    fetchFormData(facultyId, ay);
                }
            }, 500);
        };

        const handleBulkEntries = (data) => {
            console.log('[FRONTEND] 📬 Bulk entries received:', data);
            toast.success(`${data.count} new entries synced`);
            if (data.entries && Array.isArray(data.entries)) {
                data.entries.forEach(e => handleNewEntry(e));
            }
        };

        const handleRoomJoined = (data) => {
            console.log('[FRONTEND] ✅ Successfully joined room:', data);
            // toast.success(`Connected to Sync Stream: ${data.roomName}`);
        };

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
            // Cleanup listener
            socket.off('apar_data_updated', handleDataUpdate);
            socket.off('new_entry', handleNewEntrySocket);
            socket.off('update_entry', handleUpdateEntrySocket);
            socket.off('delete_entry', handleDeleteEntrySocket);
            socket.off('bulk_entries', handleBulkEntries);
            socket.off('room_joined', handleRoomJoined);
            if (facultyId && ay) socket.emit('leave_apar_room', { faculty_id: facultyId, ay });
        };
    }, [socket, aparUser, reduxAy, loginData.academic_year, location.state?.ay, formData.personal.report_start_date, formData.personal.report_end_date, fetchFormData]);


    // authentication from redux (APAR)

    const handlePrint = () => window.print();

    const isReadOnlyMode = () => {
        const role = aparRole || loginData.role;
        // Reporting/Reviewing are always read-only for Parts I-IV
        if (role === 'Reporting Officer' || role === 'Reviewing Officer') return true;

        // Officer (Graded) is read-only if status is Submitted or not in editable statuses
        if (formStatus === 'Submitted') return true;
        const isEditable = !formStatus || ['Draft', 'Query Raised', 'not_filled', 'Query Raised by Reporting officer', 'Query Raised by Reviewing officer'].includes(formStatus);
        return !isEditable;
    };
    // Always fetch form data when component mounts or when ay changes (from dashboard navigation)
    React.useEffect(() => {
        if (!gradedId) return;
        let ay = reduxAy || loginData.academic_year || (location.state?.ay);
        if (!ay && formData.personal?.report_start_date && formData.personal?.report_end_date) {
            try {
                const s = new Date(formData.personal.report_start_date).getFullYear();
                const e = new Date(formData.personal.report_end_date).getFullYear();
                ay = `${s}-${e}`;
            } catch (e) { }
        }
        if (gradedId && ay) {
            fetchFormData(gradedId, ay);
        }
    }, [gradedId, reduxAy, loginData.academic_year, location.state]);

    const handleSaveDraft = async (silent = false) => {
        // Only save if in editable mode
        if (isReadOnlyMode()) return true;

        setIsSavingDraft(true);
        try {
            const ay = reduxAy || loginData.academic_year || (location.state?.ay) || (() => {
                const start = formData.personal.report_start_date
                const end = formData.personal.report_end_date
                if (start && end) {
                    try {
                        const s = new Date(start).getFullYear()
                        const e = new Date(end).getFullYear()
                        return `${s}-${e}`
                    } catch (e) { return '' }
                }
                return ''
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
                formData: formData
            };

            console.log('[APAR SAVE] Sending Draft Payload:', payload);

            await AparFormGradedService.saveDraft(payload);
            if (!silent) toast.success('Progress saved and synced to profile');
            return true;
        } catch (e) {
            console.error('Save draft failed:', e);
            if (!silent) {
                const msg = e.response?.data?.message || 'Failed to auto-save progress';
                toast.error(msg);
            }
            return false;
        } finally {
            setIsSavingDraft(false);
        }
    };

    const handleSaveToMonthly = async () => {
        setIsSyncing(true);
        try {
            // First save as draft
            await handleSaveDraft(true);

            // Then sync to monthly
            const ay = reduxAy || loginData.academic_year || (location.state?.ay) || (() => {
                const start = formData.personal.report_start_date
                const end = formData.personal.report_end_date
                if (start && end) {
                    try {
                        const s = new Date(start).getFullYear()
                        const e = new Date(end).getFullYear()
                        return `${s}-${e}`
                    } catch (e) { return '' }
                }
                return ''
            })();

            const facultyId = (aparUser && (aparUser.teacherId || aparUser.faculty_id || aparUser.id));

            if (!ay || !facultyId || ay === 'undefined') {
                toast.error("Invalid Academic Year or Faculty ID");
                return;
            }

            const payload = {
                faculty_id: facultyId,
                ay: ay,
                formData: formData
            };

            await AparFormGradedService.saveToMonthly(payload);
            toast.success('Synced to Monthly Data successfully');

            // Re-fetch logic or update needs to happen here ideally to get new IDs, 
            // but for now relying on user page refresh or subsequent edits working via ID/Title match
        } catch (e) {
            console.error('Save to monthly failed:', e);
            const msg = e.response?.data?.message || 'Failed to sync to monthly data';
            toast.error(msg);
        } finally {
            setIsSyncing(false);
        }
    };

    const nextStep = async () => {
        if (currentStep < totalSteps) {
            // Auto-save on next
            await handleSaveDraft(true);
            setCurrentStep(currentStep + 1);
            window.scrollTo(0, 0);
        }
    };

    const handleSubmit = async () => {
        try {
            const ay = reduxAy || loginData.academic_year || (location.state?.ay) || (() => {
                const start = formData.personal.report_start_date
                const end = formData.personal.report_end_date
                if (start && end) {
                    try {
                        const s = new Date(start).getFullYear()
                        const e = new Date(end).getFullYear()
                        return `${s}-${e}`
                    } catch (e) { return '' }
                }
                return ''
            })()

            const facultyId = (aparUser && (aparUser.teacherId || aparUser.faculty_id || aparUser.id));
            if (!ay || !facultyId || ay === 'undefined') {
                toast.error("Invalid Academic Year or Faculty ID");
                return;
            }

            const payload = {
                ay: ay,
                faculty_id: facultyId,
                formData: formData
            };

            await AparFormGradedService.submit(payload);
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
        setFormData({ ...formData, personal: { ...formData.personal, [e.target.name]: e.target.value } });
    };

    // Generic handler for array fields
    const addItem = (section, field, initialItem) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: [...prev[section][field], initialItem]
            }
        }));
    };

    const removeItem = (section, field, index) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: prev[section][field].filter((_, i) => i !== index)
            }
        }));
    };

    const updateArrayField = (section, field, index, key, value) => {
        const updatedArray = [...formData[section][field]];
        updatedArray[index] = { ...updatedArray[index], [key]: value };
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: updatedArray
            }
        }));
    };

    const updateArrayItem = (section, field, index, newItem) => {
        const updatedArray = [...formData[section][field]];
        updatedArray[index] = newItem;
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [field]: updatedArray
            }
        }));
    };

    const updateAssessment = (section, key, value) => {
        setFormData(prev => ({
            ...prev,
            assessment: {
                ...prev.assessment,
                [section]: {
                    ...prev.assessment[section],
                    [key]: value
                }
            }
        }));
    };

    // Generic updater for simple fields inside a named section (e.g., teaching.description_of_duties)
    const updateField = (section, key, value) => {
        setFormData(prev => ({
            ...prev,
            [section]: {
                ...prev[section],
                [key]: value
            }
        }));
    };

    const updateRemarks = (key, value) => {
        setFormData(prev => ({
            ...prev,
            remarks: {
                ...prev.remarks,
                [key]: value
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
        if (status === 'Query Raised' || status === 'Query Raised by Reporting officer') {
            setPendingAction({ type: 'reporting', status: 'Query Raised by Reporting officer' });
            setQueryModalOpen(true);
        } else {
            await finalizeReportingSubmit(status);
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
        if (statusOverride.includes('Query')) {
            setPendingAction({ type: 'reviewing', status: statusOverride });
            setQueryModalOpen(true);
        } else {
            finalizeReviewingSubmit(statusOverride);
        }
    };

    const handleLoadForm = async (faculty) => {
        try {
            // Fetch full form data
            // Prioritize raw data as string splitting is fragile
            const facultyId = faculty.raw?.faculty_id || faculty.faculty_id || faculty.id?.split('-')[0];
            const ay = faculty.raw?.ay || faculty.ay || faculty.id?.split('-').slice(1).join('-');

            if (!facultyId || !ay) {
                toast.error("Missing ID or AY");
                return;
            }

            const res = await aparFormReportingService.getForm(facultyId, ay);
            // API response structure: { statusCode, data, message, success }
            // So res is the JSON body. res.data is the form object.
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
            setSelectedFacultyRaw(faculty.raw || faculty);
        } catch (err) {
            console.error(err);
            toast.error("Failed to load form data");
        }
    };

    // If navigated here with a selected faculty (from reporting dashboard), load it
    // const location = useLocation();
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

    console.log('DEBUG: Timeline Check', { viewMode, activeRole, formStatus, timeline: formData.timeline });

    return (
        <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white">
            <Toaster richColors position="top-right" />
            {/* Navigation & Actions - Hidden in Print */}
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
                    {(loginData.role === 'Reporting Officer' || loginData.role === 'Reviewing Officer') && viewMode === 'form' && (
                        <button
                            onClick={() => setViewMode('list')}
                            className="flex items-center text-indigo-600 hover:text-indigo-900 ml-4 font-semibold"
                        >
                            Dashboard
                        </button>
                    )}
                    <div className="flex items-center space-x-3">
                        <NotificationBell />
                        <button
                            onClick={handlePrint}
                            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                        >
                            <FiPrinter className="mr-2" /> Print Form
                        </button>
                        <ProfileDropdown />
                    </div>
                </div>


            </div>

            <div className="max-w-7xl mx-auto bg-white shadow-xl rounded-lg overflow-hidden p-8 print:shadow-none print:p-0">

                {viewMode === 'list' && (loginData.role === 'Reporting Officer' || loginData.role === 'Reviewing Officer') ? (
                    <>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-6">
                                {loginData.role === 'Reporting Officer' ? "Pending Assessments" : "Pending Reviews"}
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
                        {/* Header - Always Visible */}
                        {/* Header - Always Visible */}
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

                        {/* Progress Bar - Hidden in Print */}
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

                            {/* Step 1: Personal Data - Mapped to 'faculty' table */}
                            <div className={currentStep === 1 ? 'block' : 'hidden print:block'}>
                                <div className="shadow-lg">
                                    {/* Import Part I component to render the personal data fields */}
                                    <div>
                                        <button onClick={() => setPersonalOpen(p => !p)} className="text-sm text-indigo-600 mb-3">{personalOpen ? 'Hide' : 'Show'} Personal Data</button>
                                        {personalOpen && <PartIPersonal personal={formData.personal} onChange={handlePersonalChange} readOnly={isReadOnlyMode()} departments={departments} />}
                                    </div>
                                </div>
                            </div>

                            {/* Step 2: Self Appraisal */}
                            <div className={currentStep === 2 ? 'block' : 'hidden print:block'}>
                                <PartII formData={formData} addItem={addItem} removeItem={requestDelete} updateArrayField={updateArrayField} updateAssessment={updateAssessment} updateField={updateField} readOnly={isReadOnlyMode()} />
                            </div>

                            {/* Step 3: Research - HEAVY Schema Mapping */}
                            <div className={currentStep === 3 ? 'block' : 'hidden print:block'}>
                                <PartIII formData={formData} addItem={addItem} removeItem={requestDelete} updateArrayField={updateArrayField} updateArrayItem={updateArrayItem} updateField={updateField} readOnly={isReadOnlyMode()} />
                            </div>

                            {/* Step 4: Corporate Life */}
                            <div className={currentStep === 4 ? 'block' : 'hidden print:block'}>
                                <PartIV formData={formData} addItem={addItem} removeItem={requestDelete} updateArrayField={updateArrayField} updateField={updateField} readOnly={isReadOnlyMode()} />
                            </div>

                            {/* Step 5: Numerical Assessment (Reporting Officer Only - Read/Write, Reviewing Officer - Read Only) */}
                            {(activeRole === 'Reporting Officer' || activeRole === 'Reviewing Officer') && (
                                <div className={currentStep === 5 ? 'block' : 'hidden print:block'}>
                                    <PartV formData={formData} updateAssessment={updateAssessment} activeRole={activeRole} formStatus={formStatus} />
                                </div>
                            )}


                            {/* Step 6: Remarks of the Reviewing Officer (Reviewing Officer Only) */}
                            {activeRole === 'Reviewing Officer' && (
                                <div className={currentStep === 6 ? 'block' : 'hidden print:block'}>
                                    <PartVIRemarks formData={formData} updateRemarks={updateRemarks} formStatus={formStatus} />
                                </div>
                            )}

                            {/* Step 5/6/7: Review & Submit */}
                            <div className={currentStep === totalSteps ? 'block' : 'hidden print:block'}>
                                <div className="border-2 border-gray-900 rounded-xl p-6 shadow-lg">
                                    <h3 className="text-lg font-bold text-gray-900 mb-4 border-b pb-2">One Final Check</h3>
                                    <p className="text-gray-600 mb-6 font-medium">
                                        {loginData.role === 'Reporting Officer' || loginData.role === 'Reviewing Officer'
                                            ? "Please review your entries. By submitting, you confirm the details are final."
                                            : "Please review all the information provided. All data entered corresponds to the institutional IQAC standards."}
                                    </p>

                                    <div className="mt-8 pt-4 border-t border-gray-100">
                                        <div className="flex bg-gray-50 p-4 rounded-md">
                                            <input type="checkbox" className="mt-1 h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500" id="certification" checked={certified} onChange={(e) => setCertified(e.target.checked)} />
                                            <div className="ml-3">
                                                <label htmlFor="certification" className="text-sm font-medium text-gray-900 cursor-pointer">I certify that the information’s given above are correct and factual to the best of my knowledge.</label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Navigation Buttons - Hidden in Print */}
                            {!((loginData.role === 'Reporting Officer') && currentStep === 5) && (
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
                                        {/* Save Draft/Monthly Buttons */}
                                        {(activeRole === 'Officer (Graded)' && ['Draft', 'Query Raised', 'not_filled'].includes(formStatus || 'Draft')) && (
                                            <>
                                                <button
                                                    type="button"
                                                    onClick={() => handleSaveDraft(false)}
                                                    disabled={isSavingDraft || isSyncing}
                                                    className={`px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center ${isSavingDraft ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {isSavingDraft ? 'Saving...' : 'Save Draft'}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={handleSaveToMonthly}
                                                    disabled={isSyncing || isSavingDraft}
                                                    className={`px-6 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center ${isSyncing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                >
                                                    {isSyncing ? (
                                                        <>
                                                            <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-indigo-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                                            </svg>
                                                            Syncing...
                                                        </>
                                                    ) : 'Save to Monthly Data'}
                                                </button>
                                            </>
                                        )}

                                        {/* {currentStep === 1 && (
                                            <button
                                                type="button"
                                                onClick={() => setCurrentStep(totalSteps)}
                                                className="px-6 py-2 border border-indigo-300 rounded-md shadow-sm text-sm font-medium text-indigo-700 bg-indigo-50 hover:bg-indigo-100 flex items-center"
                                            >
                                                {/* Go to Last Page */}
                                        {/* </button>
                                        )}} */}

                                        {currentStep === totalSteps ? (
                                            <>
                                                {/* Case 1: Reporting Officer Actions */}
                                                {/* Only show actions if NOT already forwarded (or can re-verify if needed, but user requested NO changes) */}
                                                {activeRole === 'Reporting Officer' && formStatus !== 'Forwarded by Reporting officer' && (
                                                    <div className="flex gap-4">
                                                        <button
                                                            type="button"
                                                            onClick={async () => {
                                                                try {
                                                                    const payload = {
                                                                        faculty_id: selectedFacultyRaw?.faculty_id || selectedFacultyRaw?.id?.split('-')[0],
                                                                        ay: selectedFacultyRaw?.ay || selectedFacultyRaw?.id?.split('-').slice(1).join('-'),
                                                                        assessment: formData.assessment,
                                                                        status: 'Submitted' // Keep status as Submitted (Draft mode for RO)
                                                                    };
                                                                    await aparFormReportingService.submit(payload);
                                                                    toast.success('Assessment saved as draft');
                                                                } catch (err) {
                                                                    console.error(err);
                                                                    toast.error('Failed to save draft');
                                                                }
                                                            }}
                                                            className="px-6 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 flex items-center"
                                                        >
                                                            Save Draft
                                                        </button>
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

                                                {/* Case 2: Reviewing Officer Actions */}
                                                {activeRole === 'Reviewing Officer' && formStatus !== 'Accepted by Reviewing officer' && (
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

                                                {/* Case 3: Officer (Graded) - Standard Submit */}
                                                {activeRole === 'Officer (Graded)' && ['Draft', 'Query Raised', 'Query Raised by Reporting officer', 'not_filled'].includes(formStatus || 'Draft') && (
                                                    <button
                                                        type="button"
                                                        className="px-8 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 flex items-center"
                                                        onClick={handleSubmit}
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
                )} {/* End of viewMode check */}
            </div>

            {/* Query Comment Modal */}
            {queryModalOpen && (
                <div className="fixed inset-0 bg-transparent overflow-y-auto h-full w-full flex items-center justify-center z-50 backdrop-blur-md">
                    <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full m-4 overflow-hidden transform transition-all border border-gray-100">
                        {/* Header */}
                        <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between">
                            <h3 className="text-xl font-bold text-white flex items-center">
                                <FiAlertCircle className="mr-2" /> Raise Query
                            </h3>
                            <button onClick={() => setQueryModalOpen(false)} className="text-indigo-200 hover:text-white transition-colors">
                                <span className="text-2xl">&times;</span>
                            </button>
                        </div>

                        {/* Body */}
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

                        {/* Footer */}
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

            {/* Footer Info */}
            <div className="max-w-7xl mx-auto mt-8 text-center text-gray-500 text-sm print:hidden">
                <p>Annual Performance Assessment Report System &copy; {new Date().getFullYear()} DTU</p>
            </div>
            {/* Delete Confirmation Modal */}
            {deleteModal.open && (
                <div className="fixed inset-0 z-[100] overflow-y-auto print:hidden" aria-labelledby="modal-title" role="dialog" aria-modal="true">

                    {/* Backdrop */}
                    <div className="fixed inset-0 bg-white/20 backdrop-blur-sm transition-opacity" aria-hidden="true" onClick={() => setDeleteModal({ ...deleteModal, open: false })}></div>

                    <div className="flex min-h-screen items-center justify-center p-4 text-center sm:p-0">
                        {/* Modal Panel */}
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
