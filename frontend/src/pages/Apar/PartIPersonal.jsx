import React, { useState, useEffect } from 'react';
import { validateDateOfBirth, validateJoiningDate, getFieldError } from '../../utils/personal.validation.util.js';
import { FiAlertCircle, FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'sonner';
export default function PartIPersonal({ personal, onChange, readOnly, departments = [], validationErrors = [], qualifications = [] }) {
  const [dateErrors, setDateErrors] = useState({});

  // Removed old onBlur validations

  const parseAbsenceRow = (row = '') => {
    const dates = String(row).match(/\d{4}-\d{2}-\d{2}/g) || [];
    const leaveTypeMatch = String(row).match(/\((.*)\)$/);
    return {
      start_date: dates[0] || '',
      end_date: dates[1] || '',
      leave_type: leaveTypeMatch ? leaveTypeMatch[1] : ''
    };
  };

  const serializeAbsenceRow = (row) => {
    if (!row.start_date && !row.end_date) return '';
    const dates = `${row.start_date || ''} to ${row.end_date || ''}`.trim();
    return row.leave_type ? `${dates} (${row.leave_type})` : dates;
  };

  const absenceRows = String(personal.absence_period || '')
    .split('\n')
    .filter(row => row.trim() !== '')
    .map(parseAbsenceRow);

  const [newAbsenceRow, setNewAbsenceRow] = useState({ start_date: '', end_date: '', leave_type: '' });

  const updateAbsenceRows = (rows) => {
    onChange({
      target: {
        name: 'absence_period',
        value: rows.map(serializeAbsenceRow).join('\n')
      }
    });
  };

  const handleNewAbsenceChange = (field, value) => {
    setNewAbsenceRow(prev => ({ ...prev, [field]: value }));
  };

  const handleAddRow = () => {
    if (!newAbsenceRow.start_date || !newAbsenceRow.end_date || !newAbsenceRow.leave_type) {
      toast.error('Please fill all fields (Start Date, End Date, Leave Type)');
      return;
    }

    const start = new Date(newAbsenceRow.start_date);
    const end = new Date(newAbsenceRow.end_date);
    
    if (personal.joining_date) {
      const joining = new Date(personal.joining_date);
      if (start < joining) {
        toast.error('Start date cannot be earlier than joining date');
        return;
      }
    }

    if (end <= start) {
      toast.error('End date must be later than start date');
      return;
    }

    const hasOverlap = absenceRows.some(row => {
      const existingStart = new Date(row.start_date);
      const existingEnd = new Date(row.end_date);
      return start <= existingEnd && end >= existingStart;
    });

    if (hasOverlap) {
      toast.error('This leave period overlaps with an existing leave');
      return;
    }

    const updatedRows = [...absenceRows, newAbsenceRow];
    updateAbsenceRows(updatedRows);
    setNewAbsenceRow({ start_date: '', end_date: '', leave_type: '' });
  };

  const removeAbsenceRow = (index) => {
    const updatedRows = absenceRows.filter((_, rowIndex) => rowIndex !== index);
    updateAbsenceRows(updatedRows);
  };

  const handleAbsenceTakenChange = (e) => {
    onChange(e);
    if (e.target.value === 'No') {
      onChange({
        target: {
          name: 'absence_period',
          value: ''
        }
      });
    }
  };

  // Validate dates whenever they change
  useEffect(() => {
    const errors = {};

    if (personal.date_of_birth) {
      const dobValidation = validateDateOfBirth(personal.date_of_birth);
      if (!dobValidation.valid) {
        errors.date_of_birth = dobValidation.error;
      }
    }

    if (personal.joining_date) {
      const joiningValidation = validateJoiningDate(personal.joining_date, personal.date_of_birth);
      if (!joiningValidation.valid) {
        errors.joining_date = joiningValidation.error;
      }
    }

    setDateErrors(errors);
  }, [personal.date_of_birth, personal.joining_date]);

  const renderFieldError = (fieldName) => {
    const error = dateErrors[fieldName];
    if (!error) return null;
    return (
      <div className="mt-1 flex items-center gap-1 text-red-600 text-sm">
        <FiAlertCircle size={16} />
        <span>{error}</span>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
      <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">PART I - PERSONAL DATA</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">1) Enter your name <span className="text-red-500">*</span></label>
          <input required aria-required="true" type="text" name="name" value={personal.name} onChange={onChange} disabled={true} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">2) Enter the name of the department <span className="text-red-500">*</span></label>
          <select
            required
            aria-required="true"
            name="department_id"
            value={personal.department_id}
            onChange={onChange}
            disabled={true}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 bg-gray-50 text-gray-500 transition-colors"
          >
            <option value="">Select Department</option>
            {departments.map((dept) => (
              <option key={dept.department_id || dept.department_name} value={dept.department_id || dept.department_name}>
                {dept.department_name}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-gray-500">Department is auto-filled from your profile and cannot be changed here.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">3) Designation <span className="text-red-500">*</span></label>
          <input
            required
            aria-required="true"
            type="text"
            name="designation"
            value={personal.designation}
            disabled={true}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 bg-gray-50 text-gray-500 transition-colors"
          />
          <p className="mt-1 text-xs text-gray-500">Fetched from your profile. Update in Profile section.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">4) Date of birth <span className="text-red-500">*</span></label>
          <input
            required
            aria-required="true"
            type="date"
            name="date_of_birth"
            value={personal.date_of_birth}
            disabled={true}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 bg-gray-50 text-gray-500 transition-colors"
          />
          <p className="mt-1 text-xs text-gray-500">Fetched from your profile. Update in Profile section.</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">5) Academic Qualifications <span className="text-red-500">*</span></label>
          <p className="text-xs text-gray-500 mb-2">Fetched from your faculty profile. Update qualifications in Profile section.</p>
          {qualifications.length > 0 ? (
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Degree</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Field of Study</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Institution</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Year</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Percentage/CGPA</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {qualifications.map((q, idx) => (
                    <tr key={idx}>
                      <td className="px-4 py-2 text-sm text-gray-900">{q.degree || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{q.field_of_study || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{q.institution_name || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{q.year_of_passing || '-'}</td>
                      <td className="px-4 py-2 text-sm text-gray-900">{q.percentage_cgpa || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">No qualifications found in your profile. Please add at least a Graduation qualification in your Profile section.</p>
            </div>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">6) Category <span className="text-red-500">*</span></label>
          <input
            required
            aria-required="true"
            type="text"
            name="sc_st_status"
            value={personal.sc_st_status || ''}
            disabled={true}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 bg-gray-50 text-gray-500 transition-colors"
          />
          <p className="mt-1 text-xs text-gray-500">Fetched from your profile. Update in Profile section.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">7) Date of continuous employment <span className="text-red-500">*</span></label>
          <input
            required
            aria-required="true"
            type="date"
            name="joining_date"
            value={personal.joining_date}
            disabled={true}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 bg-gray-50 text-gray-500 transition-colors"
          />
          <p className="mt-1 text-xs text-gray-500">Fetched from your profile. Update in Profile section.</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">8) Present Grade <span className="text-red-500">*</span></label>
          <input
            required
            aria-required="true"
            type="text"
            name="grade"
            value={personal.grade || ''}
            disabled={true}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 bg-gray-50 text-gray-500 transition-colors"
          />
          <p className="mt-1 text-xs text-gray-500">Fetched from your profile. Update in Profile section.</p>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            9) Have you taken any leave or remained absent during the appraisal period? <span className="text-red-500">*</span>
          </label>
          <select
            required
            aria-required="true"
            name="absence_taken"
            value={personal.absence_taken || ''}
            onChange={handleAbsenceTakenChange}
            disabled={readOnly}
            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
          >
            <option value="">Select Option</option>
            <option value="Yes">Yes</option>
            <option value="No">No</option>
          </select>

          {personal.absence_taken === 'Yes' && (
            <div className="mt-4 space-y-3">
              <label className="block text-sm font-medium text-gray-700">Period of absence from duty <span className="text-red-500">*</span></label>

              {absenceRows.length > 0 && (
                <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Leave Type</th>
                        {!readOnly && <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {absenceRows.map((row, index) => (
                        <tr key={index}>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.start_date}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.end_date}</td>
                          <td className="px-4 py-2 text-sm text-gray-900">{row.leave_type}</td>
                          {!readOnly && (
                            <td className="px-4 py-2 text-sm text-gray-900">
                              <button
                                type="button"
                                onClick={() => removeAbsenceRow(index)}
                                className="text-red-600 hover:text-red-900"
                              >
                                <FiTrash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!readOnly && (
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-3 items-end bg-gray-50 p-4 rounded-lg border border-gray-200">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start date{absenceRows.length === 0 && <span className="text-red-500">*</span>}</label>
                    <input
                      type="date"
                      value={newAbsenceRow.start_date}
                      min={personal.joining_date || undefined}
                      onChange={(e) => handleNewAbsenceChange('start_date', e.target.value)}
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 transition-colors"
                      required={absenceRows.length === 0 || newAbsenceRow.end_date !== '' || newAbsenceRow.leave_type !== ''}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End date{absenceRows.length === 0 && <span className="text-red-500">*</span>}</label>
                    <input
                      type="date"
                      value={newAbsenceRow.end_date}
                      min={newAbsenceRow.start_date || undefined}
                      onChange={(e) => handleNewAbsenceChange('end_date', e.target.value)}
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 transition-colors"
                      required={absenceRows.length === 0 || newAbsenceRow.start_date !== '' || newAbsenceRow.leave_type !== ''}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Type of Leave{absenceRows.length === 0 && <span className="text-red-500">*</span>}</label>
                    <select
                      value={newAbsenceRow.leave_type}
                      onChange={(e) => handleNewAbsenceChange('leave_type', e.target.value)}
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 transition-colors"
                      required={absenceRows.length === 0 || newAbsenceRow.start_date !== '' || newAbsenceRow.end_date !== ''}
                    >
                      <option value="">Select leave type</option>
                      <option value="Casual Leave (CL)">Casual Leave (CL)</option>
                      <option value="Special Casual Leave (SCL)">Special Casual Leave (SCL)</option>
                      <option value="Duty Leave (DL)">Duty Leave (DL)</option>
                      <option value="Earned Leave (EL)">Earned Leave (EL)</option>
                      <option value="Half Pay Leave (HPL)">Half Pay Leave (HPL)</option>
                      <option value="Commuted Leave">Commuted Leave</option>
                      <option value="Extraordinary Leave (EOL)">Extraordinary Leave (EOL)</option>
                      <option value="Leave Not Due (LND)">Leave Not Due (LND)</option>
                      <option value="Maternity Leave">Maternity Leave</option>
                      <option value="Paternity Leave">Paternity Leave</option>
                      <option value="Child Care Leave (CCL)">Child Care Leave (CCL)</option>
                      <option value="Adoption Leave">Adoption Leave</option>
                      <option value="Study Leave">Study Leave</option>
                      <option value="Sabbatical Leave">Sabbatical Leave</option>
                      <option value="Academic Leave">Academic Leave</option>
                      <option value="Medical Leave (availed through applicable leave rules such as HPL/Commuted Leave)">Medical Leave (availed through applicable leave rules such as HPL/Commuted Leave)</option>
                      <option value="Vacation (Summer/Winter Vacation for eligible teaching faculty)">Vacation (Summer/Winter Vacation for eligible teaching faculty)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddRow}
                    className="inline-flex items-center justify-center gap-2 md:self-end md:w-auto w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow-sm transition-colors font-medium h-[46px]"
                  >
                    <FiPlus className="h-4 w-4" />
                    Add
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
