import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { FacultyService } from '../services/faculty.services';
import { FiPlus, FiX } from 'react-icons/fi';

/**
 * Multi-select component for adding faculty members with roles
 * Replaces text inputs (PI/Co-PI names, author names) with structured faculty selectors
 * 
 * @param {string} label - Field label
 * @param {Array} value - Array of {faculty_id, role} objects
 * @param {Function} onChange - Callback when value changes
 * @param {Array} roles - Available roles (e.g., ['PI', 'Co-PI', 'Author'])
 * @param {boolean} required - Whether field is required
 * @param {number} minSelections - Minimum number of selections required
 * @param {boolean} piRequired - Whether at least one PI is required
 */
export const FacultyMultiSelect = ({
    label,
    value = [],
    onChange,
    roles = ['Member'],
    required = false,
    minSelections = 0,
    piRequired = false,
    className = ''
}) => {
    const [facultyOptions, setFacultyOptions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadFaculty();
    }, []);

    const loadFaculty = async () => {
        try {
            const response = await FacultyService.getAllData();
            const options = response.data.data.map(f => ({
                value: f.faculty_id,
                label: `${f.name} (${f.faculty_id})`
            }));
            setFacultyOptions(options);
            setError('');
        } catch (error) {
            console.error('Failed to load faculty:', error);
            setError('Failed to load faculty list');
        } finally {
            setLoading(false);
        }
    };

    const handleFacultyChange = (selectedOption, index) => {
        const newValue = [...value];
        newValue[index] = {
            ...newValue[index],
            faculty_id: selectedOption?.value || ''
        };
        onChange(newValue);
    };

    const handleRoleChange = (role, index) => {
        const newValue = [...value];
        newValue[index] = {
            ...newValue[index],
            role: role
        };
        onChange(newValue);
    };

    const addFaculty = () => {
        onChange([...value, { faculty_id: '', role: roles[0] }]);
    };

    const removeFaculty = (index) => {
        const newValue = value.filter((_, i) => i !== index);
        onChange(newValue);
    };

    // Validation
    const hasPI = value.some(v => v.role === 'PI');
    const showPIError = piRequired && value.length > 0 && !hasPI;
    const showMinError = required && value.length < minSelections;

    return (
        <div className={`mb-4 ${className}`}>
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} {required && <span className="text-red-500">*</span>}
            </label>

            {error && (
                <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                    {error}
                </div>
            )}

            {value.length === 0 && !loading && (
                <div className="p-4 bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg text-center text-gray-500">
                    No faculty members added yet
                </div>
            )}

            <div className="space-y-2">
                {value.map((item, index) => (
                    <div key={index} className="flex gap-2 items-start">
                        <div className="flex-1">
                            <Select
                                options={facultyOptions}
                                value={facultyOptions.find(o => o.value === item.faculty_id)}
                                onChange={(opt) => handleFacultyChange(opt, index)}
                                placeholder="Select faculty..."
                                isLoading={loading}
                                isClearable
                                className="text-sm"
                                styles={{
                                    control: (base) => ({
                                        ...base,
                                        minHeight: '38px',
                                        borderColor: '#d1d5db'
                                    })
                                }}
                            />
                        </div>
                        <select
                            value={item.role}
                            onChange={(e) => handleRoleChange(e.target.value, index)}
                            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            {roles.map(role => (
                                <option key={role} value={role}>{role}</option>
                            ))}
                        </select>
                        <button
                            type="button"
                            onClick={() => removeFaculty(index)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
                            title="Remove faculty"
                        >
                            <FiX size={20} />
                        </button>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={addFaculty}
                disabled={loading}
                className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
                <FiPlus size={16} />
                Add Faculty Member
            </button>

            {/* Validation messages */}
            {showPIError && (
                <p className="mt-2 text-sm text-red-600">
                    At least one PI (Principal Investigator) is required
                </p>
            )}
            {showMinError && (
                <p className="mt-2 text-sm text-red-600">
                    At least {minSelections} faculty {minSelections === 1 ? 'member is' : 'members are'} required
                </p>
            )}
        </div>
    );
};

export default FacultyMultiSelect;
