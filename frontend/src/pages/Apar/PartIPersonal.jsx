import React, { useState, useEffect } from 'react';
import { validateDateOfBirth, validateJoiningDate, getFieldError } from '../../utils/personal.validation.util.js';
import { FiAlertCircle, FiPlus, FiTrash2 } from 'react-icons/fi';
import { toast } from 'sonner';
export default function PartIPersonal({ personal, onChange, readOnly, departments = [], validationErrors = [], qualifications = [] }) {
  const [dateErrors, setDateErrors] = useState({});

  const validateAbsenceStartDate = (startDate, index) => {  
  if (!personal.joining_date || !startDate) return;

  if (new Date(startDate) < new Date(personal.joining_date)) {
    toast.error('Absence start date cannot be earlier than joining date');

    handleAbsenceChange(index, 'start_date', '');

    window.setTimeout(() => {
      const field = document.getElementsByName('absence_period_start')[index];
      if (field) field.focus();
    }, 0);
  }
};

  const validateAbsenceEndDateBlur = (startDate, endDate, index) => {
    if (!startDate || !endDate) return;

    if (new Date(endDate) < new Date(startDate)) {
      toast.error('Absence end date cannot be earlier than start date');

      handleAbsenceChange(index, 'end_date', '');

      window.setTimeout(() => {
        const field = document.getElementsByName('absence_period_end')[index];
        if (field) field.focus();
      }, 0);
    }
  };

  const parseAbsenceRow = (row = '') => {
    const dates = String(row).match(/\d{4}-\d{2}-\d{2}/g) || [];
    return {
      start_date: dates[0] || '',
      end_date: dates[1] || ''
    };
  };

  const serializeAbsenceRow = (row) => {
    if (!row.start_date && !row.end_date) return '';
    return `${row.start_date || ''} to ${row.end_date || ''}`.trim();
  };

  const absenceRows = String(personal.absence_period || '')
    .split('\n')
    .map(parseAbsenceRow);
  const displayAbsenceRows = absenceRows.length ? absenceRows : [{ start_date: '', end_date: '' }];
  const canAddAbsenceRow = displayAbsenceRows.every(row => row.start_date && row.end_date);

  const updateAbsenceRows = (rows) => {
    onChange({
      target: {
        name: 'absence_period',
        value: rows.map(serializeAbsenceRow).join('\n')
      }
    });
  };

  const handleAbsenceChange = (index, field, value) => {
    const updatedRows = [...displayAbsenceRows];
    updatedRows[index] = { ...updatedRows[index], [field]: value };
    updateAbsenceRows(updatedRows);
  };

  const addAbsenceRow = () => {
    updateAbsenceRows([...displayAbsenceRows, { start_date: '', end_date: '' }]);
  };

  const removeAbsenceRow = (index) => {
    const updatedRows = displayAbsenceRows.filter((_, rowIndex) => rowIndex !== index);
    updateAbsenceRows(updatedRows.length ? updatedRows : [{ start_date: '', end_date: '' }]);
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
          <input required aria-required="true" type="text" name="name" value={personal.name} onChange={onChange} disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors" />
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
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
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
              {displayAbsenceRows.map((row, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Start date<span className="text-red-500">*</span></label>
                    <input
                      required
                      aria-required="true"
                      type="date"
                      name="absence_period_start"
                      value={row.start_date}
                      min={personal.joining_date || undefined}
                      onChange={(e) => handleAbsenceChange(index, 'start_date', e.target.value)}
                      onBlur={(e) => validateAbsenceStartDate(e.target.value, index)}
                      disabled={readOnly}
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">End date<span className="text-red-500">*</span></label>
                    <input
                      required
                      aria-required="true"
                      type="date"
                      name="absence_period_end"
                      value={row.end_date}
                      min={row.start_date || undefined}
                      onChange={(e) => handleAbsenceChange(index, 'end_date', e.target.value)}  
                      onBlur={(e) => validateAbsenceEndDateBlur(row.start_date, e.target.value, index)}
                      disabled={readOnly}
                      className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    />
                  </div>
                  {!readOnly && displayAbsenceRows.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeAbsenceRow(index)}
                      className="inline-flex items-center justify-center gap-2 md:self-end md:w-auto w-full px-4 py-2.5 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 font-medium transition-colors"
                    >
                      <FiTrash2 className="h-4 w-4" />
                      Remove
                    </button>
                  )}
                </div>
              ))}
              {!readOnly && (
                <button
                  type="button"
                  onClick={addAbsenceRow}
                  disabled={!canAddAbsenceRow}
                  className="inline-flex items-center justify-center gap-2 w-full md:w-auto bg-indigo-600 text-white rounded-lg px-6 py-2.5 hover:bg-indigo-700 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed shadow-sm transition-colors font-medium"
                >
                  <FiPlus className="h-4 w-4" />
                  Add Row
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
