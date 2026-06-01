import React, { useEffect, useMemo, useRef, useState } from 'react';
import { facultyProfileService } from '../../services/faculty_profile.service.js';
import { toast } from 'sonner';
import AparShellHeader from '../../components/AparShellHeader.jsx';
import FileUpload from '../../components/FileUpload.jsx';

export default function Profile() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState('idle'); // idle | saving | saved | error
  const [errorSummary, setErrorSummary] = useState([]);
  const summaryRef = useRef(null);
  const [saveError, setSaveError] = useState(null);
  const [educationError, setEducationError] = useState('');
  const eduSectionRef = useRef(null);
  const [profile, setProfile] = useState({
    faculty_id: '',
    basic_info: {},
    contact_info: {},
    professional_info: { current_courses: [] },
    educational_qualifications: [],
    social_links: {}
  });
  const [errors, setErrors] = useState({});
  const [sameAddress, setSameAddress] = useState(false);
  const [newSpec, setNewSpec] = useState('');

  const GENDER_OPTIONS = ['Male', 'Female', 'Other', 'Prefer not to say'];
  const MARITAL_STATUS_OPTIONS = ['Single', 'Married', 'Divorced', 'Widowed', 'Other'];
  const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Visiting Faculty', 'Contract'];
  const CASTE_OPTIONS = ['General', 'OBC', 'SC', 'ST', 'EWS'];
  const INDIA_STATES = [
    'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat','Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh','Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab','Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand','West Bengal',
    'Andaman and Nicobar Islands','Chandigarh','Dadra and Nagar Haveli and Daman and Diu','Delhi','Jammu and Kashmir','Ladakh','Lakshadweep','Puducherry'
  ];
  const DESIGNATIONS = ['Professor','Associate Professor','Assistant Professor'];
  const DEGREE_OPTIONS = ['10th','12th','Diploma','Graduation','Masters','PhD','Postdoctoral','Certification'];
  const PRESENT_GRADE_OPTIONS = Array.from({ length: 11 }, (_, i) => 10 + i); // 10..20

  const inputBase = 'w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-200 focus:border-indigo-500 border-gray-300';
  const labelBase = 'block text-sm font-medium text-gray-700 mb-1';
  const errorText = 'mt-1 text-xs text-red-600';

  const todayISO = useMemo(() => new Date().toISOString().substring(0,10), []);

  const getByPath = (obj, path) => path.split('.').reduce((o,k)=>o?.[k], obj);
  const setByPath = (obj, path, value) => {
    const keys = path.split('.');
    const next = { ...obj };
    let o = next;
    for (let i=0;i<keys.length-1;i++) {
      const k = keys[i];
      o[k] = o[k] ? { ...o[k] } : {};
      o = o[k];
    }
    o[keys[keys.length-1]] = value;
    return next;
  };

  const handleRemoveQualification = async (idx) => {
    const prevList = Array.isArray(profile.educational_qualifications) ? profile.educational_qualifications : [];
    if (idx < 0 || idx >= prevList.length) return;
    const newList = prevList.slice();
    newList.splice(idx, 1);
    const updated = { ...profile, educational_qualifications: newList };

    // Optimistic UI update
    setProfile(updated);

    // Recompute education-related errors for new indices
    setErrors((prevErrs) => {
      const base = Object.fromEntries(
        Object.entries(prevErrs).filter(([k]) => !k.startsWith('educational_qualifications.'))
      );
      const eduErrs = {};
      newList.forEach((q, i) => {
        const yp = validateField(`educational_qualifications.${i}.year_of_passing`, q?.year_of_passing);
        if (yp) eduErrs[`educational_qualifications.${i}.year_of_passing`] = yp;
        const pc = validateField(`educational_qualifications.${i}.percentage_cgpa`, q?.percentage_cgpa);
        if (pc) eduErrs[`educational_qualifications.${i}.percentage_cgpa`] = pc;
      });
      return { ...base, ...eduErrs };
    });

    try {
      await facultyProfileService.upsertSelf(updated);
      toast.success('Education removed');
    } catch (e) {
      // revert on failure
      setProfile((prev) => ({ ...prev, educational_qualifications: prevList }));
      toast.error(e?.response?.data?.message || 'Failed to remove education');
    }
  };

  // Sanitizers
  const sanitizeAlpha = (v) => v.replace(/[^A-Za-z ]+/g, '').slice(0, 100);
  const sanitizeAlphaNum = (v) => v.replace(/[^A-Za-z0-9 ]+/g, '').slice(0, 100);
  const sanitizeAlphaNumLoose = (v) => v.replace(/[^A-Za-z0-9 .,-/]+/g, '').slice(0, 200);
  const sanitizeDesignation = (v) => v.replace(/[^A-Za-z .]+/g, '').slice(0, 80);
  const sanitizeDepartment = (v) => v.replace(/[^A-Za-z0-9 ]+/g, '').slice(0, 80);
  const sanitizeSpecialization = (v) => v.replace(/[^A-Za-z0-9 ]+/g, '').slice(0, 120);
  const sanitizePhone = (v) => v.replace(/[^0-9]+/g, '').slice(0, 10);
  const sanitizePostal = (v) => v.replace(/[^0-9]+/g, '').slice(0, 6);
  const sanitizeNumeric = (v) => v.replace(/[^0-9]+/g, '');
  const sanitizePercent = (v) => v.replace(/[^0-9.]+/g, '').slice(0, 6);
  const sanitizeCourses = (v) => v.split(',').map(s => s.replace(/[^A-Za-z0-9 \-]+/g, '').trim()).filter(Boolean);

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isUrl = (v) => /^https?:\/\//i.test(v) && /\./.test(v);
  const isPhone = (v) => /^[6-9]\d{9}$/.test(v);
  const isAadhaar = (v) => /^\d{12}$/.test(v);
  const isPostal = (v) => /^[1-9]\d{5}$/.test(v);
  const isOrcid = (v) => /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(v);
  const isScopusId = (v) => /^\d{5,}$/.test(v);
  const isPastOrToday = (iso) => {
    if (!iso) return true;
    try { return new Date(iso) <= new Date(); } catch { return false; }
  };

  const validateField = (path, value) => {
    const val = typeof value === 'string' ? value.trim() : value;
    const label = path.split('.').slice(-1)[0].replace(/_/g, ' ');
    switch (path) {
      case 'basic_info.full_name':
        if (!val) return 'Full Name is required';
        if (!/^[A-Za-z ]{2,100}$/.test(val)) return 'Only letters and spaces (2-100)';
        return '';
      case 'basic_info.gender':
        if (!val) return 'Gender is required';
        return '';
      case 'basic_info.aadhaar_card':
        if (!val) return '';
        if (!isAadhaar(val)) return 'Aadhaar must be 12 digits';
        return '';
      case 'basic_info.nationality':
        if (!val) return 'Nationality is required';
        if (!/^[A-Za-z ]+$/.test(val)) return 'Only letters and spaces allowed';
        return '';
      case 'basic_info.marital_status':
        if (!val) return 'Marital Status is required';
        return '';
      case 'contact_info.mobile_number':
        if (!val) return 'Mobile Number is required';
        if (!isPhone(val)) return 'Enter a valid 10-digit mobile (starts 6-9)';
        return '';
      case 'contact_info.alternate_mobile_number':
        if (val && !isPhone(val)) return 'Enter a valid 10-digit mobile';
        return '';
      case 'contact_info.email_address':
        if (!val) return 'Email is required';
        if (!isEmail(val)) return 'Enter a valid email';
        return '';
      case 'contact_info.alternate_email_address':
        if (val && !isEmail(val)) return 'Enter a valid email';
        return '';
      case 'contact_info.current_address':
        if (!val) return 'Current Address is required';
        if (val && /[^A-Za-z0-9 .,\-\/]/.test(val)) return 'Only letters, numbers, space, , . - / allowed';
        return '';
      case 'contact_info.city':
        if (!val) return 'City is required';
        if (val && !/^[A-Za-z ]+$/.test(val)) return 'Only letters and spaces allowed';
        return '';
      case 'contact_info.state':
        if (!val) return 'State is required';
        if (val && !/^[A-Za-z ]+$/.test(val)) return 'Only letters and spaces allowed';
        return '';
      case 'contact_info.postal_code':
        if (!val) return 'Postal Code is required';
        if (val && !isPostal(val)) return 'Enter a valid 6-digit PIN code';
        return '';
      case 'contact_info.emergency_contact_name':
        if (val && !/^[A-Za-z ]+$/.test(val)) return 'Only letters and spaces allowed';
        return '';
      case 'contact_info.emergency_contact_number':
        if (val && !isPhone(val)) return 'Enter a valid 10-digit mobile';
        return '';
      case 'contact_info.permanent_address':
        if (!val) return 'Permanent Address is required';
        if (val && /[^A-Za-z0-9 .,\-\/]/.test(val)) return 'Only letters, numbers, space, , . - / allowed';
        return '';
      case 'contact_info.permanent_city':
        if (!val) return 'Permanent City is required';
        if (val && !/^[A-Za-z ]+$/.test(val)) return 'Only letters and spaces allowed';
        return '';
      case 'contact_info.permanent_state':
        if (!val) return 'Permanent State is required';
        if (val && !/^[A-Za-z ]+$/.test(val)) return 'Only letters and spaces allowed';
        return '';
      case 'contact_info.permanent_postal_code':
        if (!val) return 'Permanent Postal Code is required';
        if (val && !isPostal(val)) return 'Enter a valid 6-digit PIN code';
        return '';
      case 'professional_info.faculty_staff_id':
        if (val && !/^[A-Za-z0-9]+$/.test(val)) return 'Only letters and numbers allowed';
        return '';
      case 'professional_info.designation':
        if (val && !/^[A-Za-z .]+$/.test(val)) return 'Only letters, spaces and dot';
        return '';
      case 'professional_info.department':
        if (val && !/^[A-Za-z0-9 ]+$/.test(val)) return 'Only letters, numbers and spaces';
        return '';
      case 'professional_info.specialization':
        if (val && !/^[A-Za-z0-9 ]+$/.test(val)) return 'Only letters, numbers and spaces';
        return '';
      case 'professional_info.date_of_joining':
        if (!val) return 'Date of Joining is required';
        if (val && !isPastOrToday(val)) return 'Date cannot be in the future';
        return '';
      case 'professional_info.date_of_continuous_employment':
        if (!val) return 'Date of Continuous Employment is required';
        if (val && !isPastOrToday(val)) return 'Date cannot be in the future';
        return '';
      case 'professional_info.employment_type':
        if (!val) return 'Employment Type is required';
        return '';
      case 'basic_info.date_of_birth':
        if (!val) return 'Date of Birth is required';
        if (val && !isPastOrToday(val)) return 'Date cannot be in the future';
        return '';
      case 'professional_info.years_of_experience':
        if (val !== null && val !== undefined && String(val) !== '') {
          const n = Number(val);
          if (!Number.isFinite(n) || n < 0 || n > 70) return 'Enter a number between 0 and 70';
        }
        return '';
      case 'professional_info.office_contact_number':
        if (val && !isPhone(val)) return 'Enter a valid 10-digit mobile';
        return '';
      case 'social_links.linkedin_profile':
      case 'social_links.personal_website':
      case 'social_links.google_scholar_profile':
      case 'social_links.researchgate_profile':
        if (val && !isUrl(val)) return 'Enter a valid http(s) URL';
        return '';
      case 'social_links.orcid_id':
        if (val && !isOrcid(val)) return 'Format: 0000-0000-0000-000X';
        return '';
      case 'social_links.scopus_author_id':
        if (val && !isScopusId(val)) return 'Digits only';
        return '';
      case 'basic_info.caste_category':
        if (!val) return 'Category is required';
        return '';
      case 'professional_info.present_grade':
        if (!val) return 'Present Grade is required';
        return '';
      default:
        if (path.startsWith('contact_info.current_address') || path.startsWith('contact_info.permanent_address')) {
          if (val && /[^A-Za-z0-9 .,\-\/]/.test(val)) return 'Only letters, numbers, space, , . - / allowed';
        }
        if (path.includes('educational_qualifications')) {
          if (path.endsWith('.year_of_passing')) {
            if (val) {
              const n = Number(val);
              const y = new Date().getFullYear();
              if (!Number.isInteger(n) || n < 1900 || n > y) return `Year between 1900 and ${y}`;
            }
          }
          if (path.endsWith('.percentage_cgpa')) {
            if (val) {
              const n = Number(val);
              if (!Number.isFinite(n) || n < 0 || n > 100) return 'Enter a number between 0 and 100';
            }
          }
        }
        return '';
    }
  };

  const setErrorFor = (path, message) => setErrors(prev => ({ ...prev, [path]: message }));
  const clearErrorFor = (path) => setErrors(prev => { const n = { ...prev }; delete n[path]; return n; });

  useEffect(() => {
    (async () => {
      try {
        const p = await facultyProfileService.getSelf();
        // Ensure specialization is an array
        const fixed = { ...p };
        const spec = p?.professional_info?.specialization;
        if (!Array.isArray(spec)) {
          fixed.professional_info = fixed.professional_info || {};
          fixed.professional_info.specialization = spec ? [String(spec)] : [];
        }
        console.info('[Profile] Loaded profile payload', fixed);
        setProfile(fixed);
      } catch (e) {
        console.error('[Profile] Failed to load profile', e?.response?.data || e);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const update = (path, value) => {
    setProfile((prev) => setByPath(prev, path, value));
    const msg = validateField(path, value);
    if (msg) setErrorFor(path, msg); else clearErrorFor(path);
    // keep permanent address in sync when checkbox is on
    if (sameAddress) {
      if (path === 'contact_info.current_address') {
        setProfile((prev) => setByPath(prev, 'contact_info.permanent_address', value || ''));
      }
      if (path === 'contact_info.city') {
        setProfile((prev) => setByPath(prev, 'contact_info.permanent_city', value || ''));
      }
      if (path === 'contact_info.state') {
        setProfile((prev) => setByPath(prev, 'contact_info.permanent_state', value || ''));
      }
      if (path === 'contact_info.postal_code') {
        setProfile((prev) => setByPath(prev, 'contact_info.permanent_postal_code', value || ''));
      }
    }
    // Auto-sync: Employee ID -> Faculty/Staff ID
    // No auto-sync from Aadhaar to Employee ID
  };

  const handleAddQualification = () => {
    setProfile((prev) => ({
      ...prev,
      educational_qualifications: [
        ...(prev.educational_qualifications || []),
        {
          degree: '',
          field_of_study: '',
          institution_name: '',
          university_board: '',
          year_of_passing: '',
          percentage_cgpa: '',
          certificate_url: ''
        }
      ]
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    // Final validation
    const pathsToValidate = [
      'basic_info.full_name','basic_info.aadhaar_card','basic_info.gender','basic_info.date_of_birth','basic_info.nationality','basic_info.marital_status','basic_info.caste_category',
      'contact_info.mobile_number','contact_info.email_address','contact_info.current_address','contact_info.city','contact_info.state','contact_info.postal_code','contact_info.emergency_contact_number','contact_info.emergency_contact_name',
      'contact_info.permanent_address','contact_info.permanent_city','contact_info.permanent_state','contact_info.permanent_postal_code',
      'professional_info.faculty_staff_id','professional_info.designation','professional_info.department','professional_info.date_of_joining','professional_info.years_of_experience','professional_info.office_contact_number',
      'professional_info.date_of_continuous_employment','professional_info.present_grade',
      'social_links.linkedin_profile','social_links.personal_website','social_links.google_scholar_profile','social_links.researchgate_profile','social_links.orcid_id','social_links.scopus_author_id'
    ];
    const newErrors = {};
    for (const pth of pathsToValidate) {
      const val = getByPath(profile, pth);
      const msg = validateField(pth, val);
      if (msg) newErrors[pth] = msg;
    }
    // Validate qualifications
    (profile.educational_qualifications||[]).forEach((q, idx) => {
      const yp = validateField(`educational_qualifications.${idx}.year_of_passing`, q?.year_of_passing);
      if (yp) newErrors[`educational_qualifications.${idx}.year_of_passing`] = yp;
      const pc = validateField(`educational_qualifications.${idx}.percentage_cgpa`, q?.percentage_cgpa);
      if (pc) newErrors[`educational_qualifications.${idx}.percentage_cgpa`] = pc;
    });
    setErrors(newErrors);
    if (Object.keys(newErrors).length) {
      console.warn('[Profile] Validation failed before save', newErrors);
      const list = Array.from(new Set(Object.values(newErrors).filter(Boolean)));
      setErrorSummary(list);
      toast.error('Please correct the highlighted fields');
      // Scroll to the error summary block
      try { summaryRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
      return;
    }

    try {
      setSaving(true);
      setSaveStatus('saving');
      // Ensure at least one 'Graduation' qualification is present (UX parity with backend requirement)
      const hasGraduation = (profile.educational_qualifications || []).some(
        (q) => String(q?.degree || '').trim().toLowerCase() === 'graduation'
      );
      if (!hasGraduation) {
        console.warn('[Profile] Blocking save: missing required Graduation qualification');
        setSaving(false);
        setSaveStatus('error');
        toast.error("Please add at least one 'Graduation' qualification");
        setEducationError("Please add at least one 'Graduation' qualification in Educational Qualifications.");
        try { eduSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch (_) {}
        setTimeout(() => setSaveStatus('idle'), 3000);
        return;
      }
      console.info('[Profile] Submitting profile payload', profile);
      const saved = await facultyProfileService.upsertSelf(profile);
      console.info('[Profile] Save success response', saved);
      setProfile(saved);
      toast.success('Profile saved');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 3000);
      setErrorSummary([]);
      setSaveError(null);
      setEducationError('');
    } catch (e) {
      const status = e?.response?.status;
      const data = e?.response?.data;
      console.group('[Profile] Save error');
      console.error('Status:', status);
      console.error('Message:', e?.message);
      console.error('Response data:', data);
      console.error('Full error:', e);
      console.groupEnd();
      try { if (typeof window !== 'undefined') window.__lastProfileSaveError = e; } catch (_) {}
      const msg = e?.response?.data?.message || 'Failed to save profile';
      toast.error(msg);
      let details = [];
      const raw = e?.response?.data;
      const arr = (raw && (raw.errors || raw.issues || raw.details)) || [];
      if (Array.isArray(arr)) {
        details = arr.map((it) => typeof it === 'string' ? it : (it?.message || JSON.stringify(it)));
      }
      setSaveError({ message: msg, details });
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 4000);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="apar-page-bg min-h-screen flex items-center justify-center">
        <div className="bg-white px-4 py-2 rounded shadow text-sm text-gray-600">Loading profile…</div>
      </div>
    );
  }

  return (
    <div className="apar-page-bg min-h-screen py-10 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <AparShellHeader
          title="My Profile"
          subtitle="Update your personal and professional information"
          backTo="/apar/dashboard"
          backLabel="Dashboard"
          actions={
            <div className="flex items-center gap-3">
              {saveStatus === 'saving' && (
                <span className="text-sm font-medium text-indigo-700">Saving...</span>
              )}
              {saveStatus === 'saved' && (
                <span className="text-sm font-medium text-emerald-700">Changes saved</span>
              )}
              {saveStatus === 'error' && (
                <span className="text-sm font-medium text-red-600">Save failed</span>
              )}
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          }
        />

        {saveError && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
            <div className="w-full max-w-md rounded-lg bg-white p-5 shadow-lg">
              <div className="text-lg font-semibold text-red-600">Save failed</div>
              <div className="mt-2 text-sm text-gray-700">{saveError.message}</div>
              {Array.isArray(saveError.details) && saveError.details.length > 0 && (
                <ul className="mt-3 list-disc pl-5 text-sm text-gray-700 space-y-1">
                  {saveError.details.map((d, i) => (
                    <li key={`${i}-${d}`}>{d}</li>
                  ))}
                </ul>
              )}
              <div className="mt-5 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSaveError(null)}
                  className="rounded-md bg-gray-200 px-3 py-1.5 text-sm font-medium text-gray-800 hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Error Summary */}
        {Array.isArray(errorSummary) && errorSummary.length > 0 && (
          <div ref={summaryRef} className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <div className="font-semibold mb-2">Please fix the following:</div>
            <ul className="list-disc pl-5 space-y-1">
              {errorSummary.map((msg, i) => (
                <li key={`${msg}-${i}`}>{msg}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-8">
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Basic Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className={labelBase}>Full Name</label>
                <input className={`${inputBase} ${errors['basic_info.full_name'] ? 'border-red-500' : ''}`} value={profile.basic_info?.full_name || ''} onChange={(e) => update('basic_info.full_name', sanitizeAlpha(e.target.value))} />
                {errors['basic_info.full_name'] && <div className={errorText}>{errors['basic_info.full_name']}</div>}
              </div>
              <div>
                <label className={labelBase}>Aadhaar Card (optional)</label>
                <input className={`${inputBase} ${errors['basic_info.aadhaar_card'] ? 'border-red-500' : ''}`} value={profile.basic_info?.aadhaar_card || ''} onChange={(e) => update('basic_info.aadhaar_card', e.target.value.replace(/[^0-9]/g, ''))} maxLength={12} />
                {errors['basic_info.aadhaar_card'] && <div className={errorText}>{errors['basic_info.aadhaar_card']}</div>}
              </div>
              <div>
                <label className={labelBase}>Gender</label>
                <select
                  className={`${inputBase} ${errors['basic_info.gender'] ? 'border-red-500' : ''}`}
                  value={profile.basic_info?.gender || ''}
                  onChange={(e) => update('basic_info.gender', e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  {GENDER_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {errors['basic_info.gender'] && <div className={errorText}>{errors['basic_info.gender']}</div>}
              </div>
              <div>
                <label className={labelBase}>Date of Birth</label>
                <input type="date" max={todayISO} className={`${inputBase} ${errors['basic_info.date_of_birth'] ? 'border-red-500' : ''}`} value={profile.basic_info?.date_of_birth ? String(profile.basic_info.date_of_birth).substring(0,10) : ''} onChange={(e) => update('basic_info.date_of_birth', e.target.value)} />
                {errors['basic_info.date_of_birth'] && <div className={errorText}>{errors['basic_info.date_of_birth']}</div>}
              </div>
              <div>
                <label className={labelBase}>Nationality</label>
                <input
                  className={`${inputBase} ${errors['basic_info.nationality'] ? 'border-red-500' : ''}`}
                  value={profile.basic_info?.nationality || ''}
                  onChange={(e) => update('basic_info.nationality', sanitizeAlpha(e.target.value))}
                  required
                />
                {errors['basic_info.nationality'] && <div className={errorText}>{errors['basic_info.nationality']}</div>}
              </div>
              <div>
                <label className={labelBase}>Marital Status</label>
                <select
                  className={`${inputBase} ${errors['basic_info.marital_status'] ? 'border-red-500' : ''}`}
                  value={profile.basic_info?.marital_status || ''}
                  onChange={(e) => update('basic_info.marital_status', e.target.value)}
                  required
                >
                  <option value="">Select</option>
                  {MARITAL_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
                {errors['basic_info.marital_status'] && <div className={errorText}>{errors['basic_info.marital_status']}</div>}
              </div>
              <div>
                <label className={labelBase}>Category</label>
                <select className={`${inputBase} ${errors['basic_info.caste_category'] ? 'border-red-500' : ''}`} value={profile.basic_info?.caste_category || ''} onChange={(e) => update('basic_info.caste_category', e.target.value)}>
                  <option value="">Select Category</option>
                  {CASTE_OPTIONS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {errors['basic_info.caste_category'] && <div className={errorText}>{errors['basic_info.caste_category']}</div>}
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Contact Information</h2>
            {/* Contact Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              {[
                ['contact_info.mobile_number','Mobile Number'],
                ['contact_info.alternate_mobile_number','Alternate Mobile Number'],
                ['contact_info.email_address','Email Address'],
                ['contact_info.alternate_email_address','Alternate Email Address'],
                ['contact_info.emergency_contact_name','Emergency Contact Name'],
                ['contact_info.emergency_contact_number','Emergency Contact Number']
              ].map(([path,label]) => (
                <div key={path}>
                  <label className={labelBase}>{label}</label>
                  <input
                    className={`${inputBase} ${errors[path] ? 'border-red-500' : ''}`}
                    value={getByPath(profile, path) || ''}
                    onChange={(e) => {
                      const raw = e.target.value;
                      let v = raw;
                      if (path.endsWith('mobile_number') || path.endsWith('emergency_contact_number')) v = sanitizePhone(raw);
                      else if (path.endsWith('emergency_contact_name')) v = sanitizeAlpha(raw);
                      update(path, v);
                    }}
                  />
                  {errors[path] && <div className={errorText}>{errors[path]}</div>}
                </div>
              ))}
            </div>

            {/* Current Address */}
            <div className="mb-4">
              <h3 className="text-md font-semibold text-gray-900 mb-2">Current Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelBase}>Address</label>
                  <input className={`${inputBase} ${errors['contact_info.current_address'] ? 'border-red-500' : ''}`} value={profile.contact_info?.current_address || ''} onChange={(e) => update('contact_info.current_address', sanitizeAlphaNumLoose(e.target.value))} />
                  {errors['contact_info.current_address'] && <div className={errorText}>{errors['contact_info.current_address']}</div>}
                </div>
                <div>
                  <label className={labelBase}>City</label>
                  <input className={`${inputBase} ${errors['contact_info.city'] ? 'border-red-500' : ''}`} value={profile.contact_info?.city || ''} onChange={(e) => update('contact_info.city', sanitizeAlpha(e.target.value))} />
                </div>
                <div>
                  <label className={labelBase}>State</label>
                  <select className={inputBase} value={profile.contact_info?.state || ''} onChange={(e) => update('contact_info.state', e.target.value)}>
                    <option value="">Select State</option>
                    {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelBase}>Postal Code</label>
                  <input className={`${inputBase} ${errors['contact_info.postal_code'] ? 'border-red-500' : ''}`} value={profile.contact_info?.postal_code || ''} onChange={(e) => update('contact_info.postal_code', sanitizePostal(e.target.value))} />
                </div>
                <div className="sm:col-span-2 flex items-center gap-2 mt-1">
                  <input id="same-address" type="checkbox" className="h-4 w-4" checked={sameAddress} onChange={(e) => {
                    const checked = e.target.checked;
                    setSameAddress(checked);
                    if (checked) {
                      update('contact_info.permanent_address', profile.contact_info?.current_address || '');
                      update('contact_info.permanent_city', profile.contact_info?.city || '');
                      update('contact_info.permanent_state', profile.contact_info?.state || '');
                      update('contact_info.permanent_postal_code', profile.contact_info?.postal_code || '');
                    }
                  }} />
                  <label htmlFor="same-address" className="text-sm text-gray-700">Permanent address is same as current</label>
                </div>
              </div>
            </div>

            {/* Permanent Address */}
            <div>
              <h3 className="text-md font-semibold text-gray-900 mb-2">Permanent Address</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className={labelBase}>Address</label>
                  <input className={`${inputBase} ${errors['contact_info.permanent_address'] ? 'border-red-500' : ''}`} value={profile.contact_info?.permanent_address || ''} onChange={(e) => update('contact_info.permanent_address', sanitizeAlphaNumLoose(e.target.value))} disabled={sameAddress} />
                  {errors['contact_info.permanent_address'] && <div className={errorText}>{errors['contact_info.permanent_address']}</div>}
                </div>
                <div>
                  <label className={labelBase}>City</label>
                  <input className={`${inputBase} ${errors['contact_info.permanent_city'] ? 'border-red-500' : ''}`} value={profile.contact_info?.permanent_city || ''} onChange={(e) => update('contact_info.permanent_city', sanitizeAlpha(e.target.value))} disabled={sameAddress} />
                  {errors['contact_info.permanent_city'] && <div className={errorText}>{errors['contact_info.permanent_city']}</div>}
                </div>
                <div>
                  <label className={labelBase}>State</label>
                  <select className={inputBase} value={profile.contact_info?.permanent_state || ''} onChange={(e) => update('contact_info.permanent_state', e.target.value)} disabled={sameAddress}>
                    <option value="">Select State</option>
                    {INDIA_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelBase}>Postal Code</label>
                  <input className={`${inputBase} ${errors['contact_info.permanent_postal_code'] ? 'border-red-500' : ''}`} value={profile.contact_info?.permanent_postal_code || ''} onChange={(e) => update('contact_info.permanent_postal_code', sanitizePostal(e.target.value))} disabled={sameAddress} />
                  {errors['contact_info.permanent_postal_code'] && <div className={errorText}>{errors['contact_info.permanent_postal_code']}</div>}
                </div>
              </div>
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Professional Information</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['professional_info.faculty_staff_id','Employee ID'],
                ['professional_info.designation','Designation'],
                ['professional_info.department','Department'],
                ['professional_info.date_of_joining','Date of Joining','date'],
                ['professional_info.date_of_continuous_employment','Date of Continuous Employment','date'],
                ['professional_info.employment_type','Employment Type'],
                ['professional_info.years_of_experience','Years of Experience','number'],
                ['professional_info.office_location','Office Location'],
                ['professional_info.office_contact_number','Office Contact Number'],
                ['professional_info.present_grade','Present Grade']
              ].map(([path,label,type]) => (
                <div key={path}>
                  <label className={labelBase}>{label}</label>
                  {path === 'professional_info.designation' ? (
                    <select className={inputBase} value={getByPath(profile, path) || ''} onChange={(e) => update(path, e.target.value)}>
                      <option value="">Select</option>
                      {DESIGNATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  ) : path === 'professional_info.department' ? (
                    <input className={inputBase} value={getByPath(profile, path) || ''} disabled onChange={() => {}} />
                  ) : path === 'professional_info.employment_type' ? (
                    <select className={inputBase} value={getByPath(profile, path) || ''} onChange={(e) => update(path, e.target.value)}>
                      <option value="">Select</option>
                      {EMPLOYMENT_TYPES.map(o => <option key={o} value={o}>{o}</option>)}
                    </select>
                  ) : path === 'professional_info.present_grade' ? (
                    <select className={inputBase} value={getByPath(profile, path) || ''} onChange={(e) => update(path, e.target.value)}>
                      <option value="">Select</option>
                      {PRESENT_GRADE_OPTIONS.map(g => <option key={g} value={String(g)}>{g}</option>)}
                    </select>
                  ) : (path === 'professional_info.date_of_joining' || path === 'professional_info.date_of_continuous_employment') ? (
                    <input type="date" max={todayISO} className={`${inputBase} ${errors[path] ? 'border-red-500' : ''}`} value={(() => { const v = getByPath(profile, path); return v ? String(v).substring(0,10) : ''; })()} onChange={(e) => update(path, e.target.value)} />
                  ) : (
                    <input
                      type={type||'text'}
                      className={`${inputBase} ${errors[path] ? 'border-red-500' : ''}`}
                      value={(() => { const v = getByPath(profile, path); if (!v && v !== 0) return ''; return type==='date' ? String(v).substring(0,10) : v; })()}
                      disabled={path==='professional_info.faculty_staff_id'}
                      onChange={(e) => {
                        const raw = e.target.value;
                        let v = raw;
                        if (path.endsWith('faculty_staff_id')) v = sanitizeAlphaNum(raw);
                        else if (path.endsWith('designation')) v = sanitizeDesignation(raw);
                        else if (path.endsWith('department')) v = sanitizeDepartment(raw);
                        else if (path.endsWith('office_location')) v = sanitizeAlphaNumLoose(raw);
                        else if (path.endsWith('office_contact_number')) v = sanitizePhone(raw);
                        else if (path.endsWith('years_of_experience')) v = sanitizeNumeric(raw);
                        update(path, type==='number' ? (v === '' ? '' : Number(v)) : v);
                      }}
                    />
                  )}
                  {errors[path] && <div className={errorText}>{errors[path]}</div>}
                </div>
              ))}
            </div>

            {/* Specialization list */}
            <div className="mt-4">
              <label className={labelBase}>Specialization</label>
              <div className="flex gap-2 mb-2">
                <input className={inputBase} placeholder="Add specialization" value={newSpec} onChange={(e) => setNewSpec(sanitizeSpecialization(e.target.value))} />
                <button type="button" className="rounded-md bg-emerald-600 text-white px-3 py-2 text-sm font-semibold hover:bg-emerald-700" onClick={() => {
                  const val = newSpec.trim();
                  if (!val) return;
                  setProfile(prev => {
                    const list = Array.isArray(prev?.professional_info?.specialization) ? [...prev.professional_info.specialization] : [];
                    if (list.includes(val)) return prev;
                    const next = { ...prev };
                    next.professional_info = next.professional_info || {};
                    next.professional_info.specialization = [...list, val];
                    return next;
                  });
                  setNewSpec('');
                }}>Add</button>
              </div>
              <div className="flex flex-wrap gap-2">
                {(profile.professional_info?.specialization || []).map((s, idx) => (
                  <span key={`${s}-${idx}`} className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-sm font-medium text-emerald-700 border border-emerald-200">
                    {s}
                    <button type="button" className="text-emerald-700 hover:text-emerald-900" onClick={() => {
                      setProfile(prev => {
                        const list = [...(prev.professional_info?.specialization || [])];
                        list.splice(idx, 1);
                        return setByPath(prev, 'professional_info.specialization', list);
                      });
                    }}>&times;</button>
                  </span>
                ))}
              </div>
            </div>
          </section>

          <section ref={eduSectionRef} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-bold text-gray-900">Educational Qualifications</h2>
              <button type="button" onClick={handleAddQualification} className="rounded-md bg-emerald-600 text-white px-3 py-1 text-sm font-semibold hover:bg-emerald-700">Add</button>
            </div>
            {educationError && (
              <div className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {educationError} (Tip: set Degree to <strong>Graduation</strong> in one entry.)
              </div>
            )}
            <div className="space-y-4">
              {(profile.educational_qualifications||[]).map((q, idx) => (
                <div key={idx} className="grid grid-cols-1 sm:grid-cols-2 gap-4 border border-gray-100 p-4 rounded-lg">
                  {[
                    ['degree','Degree'],
                    ['field_of_study','Field of Study'],
                    ['institution_name','Institution Name'],
                    ['university_board','University/Board'],
                    ['year_of_passing','Year of Passing'],
                    ['percentage_cgpa','Percentage/CGPA']
                  ].map(([k,label]) => (
                    <div key={k}>
                      <label className={labelBase}>{label}</label>
                      {k === 'degree' ? (
                        <select
                          className={`${inputBase} ${errors[`educational_qualifications.${idx}.${k}`] ? 'border-red-500' : ''}`}
                          value={q?.degree || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setProfile((prev) => {
                              const list = [...(prev.educational_qualifications||[])];
                              list[idx] = { ...list[idx], degree: val };
                              return { ...prev, educational_qualifications: list };
                            });
                            if (String(val).trim().toLowerCase() === 'graduation') setEducationError('');
                            const path = `educational_qualifications.${idx}.degree`;
                            const msg = validateField(path, val);
                            if (msg) setErrorFor(path, msg); else clearErrorFor(path);
                          }}
                        >
                          <option value="">Select</option>
                          {(q?.degree && !DEGREE_OPTIONS.includes(q.degree)) ? (
                            <option value={q.degree}>{q.degree}</option>
                          ) : null}
                          {DEGREE_OPTIONS.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                      ) : (
                        <input className={`${inputBase} ${errors[`educational_qualifications.${idx}.${k}`] ? 'border-red-500' : ''}`} value={q?.[k] || ''} onChange={(e) => {
                          setProfile((prev) => {
                            const list = [...(prev.educational_qualifications||[])];
                            let v = e.target.value;
                            if (k === 'year_of_passing') v = sanitizeNumeric(v);
                            else if (k === 'percentage_cgpa') v = sanitizePercent(v);
                            else v = sanitizeAlphaNumLoose(v);
                            list[idx] = { ...list[idx], [k]: k==='year_of_passing' ? (v === '' ? '' : Number(v)) : v };
                            return { ...prev, educational_qualifications: list };
                          });
                          const path = `educational_qualifications.${idx}.${k}`;
                          const msg = validateField(path, e.target.value);
                          if (msg) setErrorFor(path, msg); else clearErrorFor(path);
                        }} />
                      )}
                      {errors[`educational_qualifications.${idx}.${k}`] && <div className={errorText}>{errors[`educational_qualifications.${idx}.${k}`]}</div>}
                    </div>
                  ))}
                  <div className="sm:col-span-2">
                    <label className={labelBase}>Supporting Certificate Upload</label>
                    <FileUpload value={q?.certificate_url || ''} onChange={(url) => {
                      setProfile((prev) => {
                        const list = [...(prev.educational_qualifications||[])];
                        list[idx] = { ...list[idx], certificate_url: url };
                        return { ...prev, educational_qualifications: list };
                      });
                    }} />
                  </div>
                  <div className="sm:col-span-2 flex justify-end mt-1">
                    <button
                      type="button"
                      onClick={() => handleRemoveQualification(idx)}
                      className="rounded-md bg-red-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Social & Professional Links</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                ['social_links.linkedin_profile','LinkedIn Profile'],
                ['social_links.personal_website','Personal Website'],
                ['social_links.google_scholar_profile','Google Scholar Profile'],
                ['social_links.researchgate_profile','ResearchGate Profile'],
                ['social_links.orcid_id','ORCID ID'],
                ['social_links.scopus_author_id','Scopus Author ID']
              ].map(([path,label]) => (
                <div key={path}>
                  <label className={labelBase}>{label}</label>
                  <input
                    className={`${inputBase} ${errors[path] ? 'border-red-500' : ''}`}
                    value={getByPath(profile, path) || ''}
                    onChange={(e) => update(path, e.target.value.trim())}
                  />
                  {errors[path] && <div className={errorText}>{errors[path]}</div>}
                </div>
              ))}
            </div>
          </section>

          <div className="flex justify-end">
            <button type="submit" disabled={saving || Object.keys(errors).length>0} className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-60">
              {saving ? 'Saving…' : Object.keys(errors).length>0 ? 'Fix Errors to Save' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
