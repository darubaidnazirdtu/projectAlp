import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser, selectRole } from '../store/slices/authSlice';
import { ROLES } from '../config/rolePermissions';
import { resourceMap } from '../config/tableConfig';
import * as Services from '../services';
import { FiSave, FiX, FiLoader } from 'react-icons/fi';
import NotFound from './NotFound';
import SearchableSelect from './SearchableSelect';
import { checkDuplicateIqac } from '../services/iqac-duplicate.service';
import DuplicateVerificationModal from './DuplicateVerificationModal';
import {
    isDuplicateDetectionEnabled,
    calculateAcademicYear,
    extractFacultyId
} from '../config/duplicateDetectionConfig';
import { shouldUseFacultyApproval } from '../utils/iqacApproval.util.js';
import { iqacApprovalService } from '../services/iqacApproval.service.js';
import { toast } from 'sonner';
import FormPageHeader from './FormPageHeader.jsx';
import { useIqacFilter } from '../context/IqacFilterContext.jsx';
import { getCurrentAcademicYear } from '../utils/academicYears.js';

const InputField = ({ label, name, type = 'text', placeholder, value, onChange, required, className = '', ...inputProps }) => (
    <div>
        {label && (
            <label className="form-field-label-iqac">
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
            </label>
        )}
        <input
            name={name}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={onChange}
            required={required}
            className={`form-field-input-iqac ${className}`}
            {...inputProps}
        />
    </div>
);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseAcademicYearRange = (academicYear) => {
    const match = String(academicYear || '').trim().match(/^(\d{4})-(\d{2}|\d{4})$/);
    if (!match) {
        return null;
    }

    const startYear = Number(match[1]);
    let endYear = Number(match[2]);

    if (match[2].length === 2) {
        endYear = Math.floor(startYear / 100) * 100 + endYear;
        if (endYear < startYear) {
            endYear += 100;
        }
    }

    return Number.isInteger(startYear) && Number.isInteger(endYear) ? { startYear, endYear } : null;
};

const getEffectiveSessionYear = (academicYear) => {
    return academicYear && academicYear !== 'All' ? academicYear : getCurrentAcademicYear();
};

const getSessionBounds = (academicYear) => {
    const range = parseAcademicYearRange(getEffectiveSessionYear(academicYear));
    if (!range) {
        return {};
    }

    return {
        startDate: `${range.startYear}-07-01`,
        endDate: `${range.endYear}-08-31`,
        startMonth: `${range.startYear}-07`,
        endMonth: `${range.endYear}-08`,
    };
};

const formatMonthOptionLabel = (year, monthIndex) => {
    const label = new Date(year, monthIndex - 1, 1).toLocaleString('en-US', {
        month: 'long',
        year: 'numeric'
    });
    return label;
};

const getSessionMonthYearOptions = (academicYear) => {
    const range = parseAcademicYearRange(getEffectiveSessionYear(academicYear));
    if (!range) {
        return [];
    }

    const options = [];
    for (let year = range.startYear; year <= range.endYear; year += 1) {
        const firstMonth = year === range.startYear ? 7 : 1;
        const lastMonth = year === range.endYear ? 8 : 12;

        for (let month = firstMonth; month <= lastMonth; month += 1) {
            const monthText = String(month).padStart(2, '0');
            options.push({
                value: `${monthText}-${year}`,
                label: formatMonthOptionLabel(year, month)
            });
        }
    }

    return options;
};

const isNonNegativeIntegerValue = (value) => {
    if (value === '' || value === null || value === undefined) {
        return true;
    }
    return /^\d+$/.test(String(value));
};

const isMonthYearField = (field) => {
    if (!field) {
        return false;
    }

    if (field.type === 'monthYear' || field.type === 'year') {
        return true;
    }

    const label = String(field.header || field.label || '').toLowerCase();
    const accessor = String(field.accessor || field.key || '').toLowerCase();

    return (
        field.type === 'number' &&
        accessor !== 'duration_years' &&
        (
            label === 'year' ||
            label.includes('year of') ||
            label.includes('sanction year') ||
            accessor.startsWith('year_') ||
            accessor.includes('_year') ||
            accessor.includes('year_of')
        )
    );
};

const toMonthInputValue = (value) => {
    if (!value) {
        return '';
    }

    const text = String(value);
    const monthYearMatch = text.match(/^(\d{2})-(\d{4})$/);
    if (monthYearMatch) {
        return `${monthYearMatch[2]}-${monthYearMatch[1]}`;
    }

    const yearMonthMatch = text.match(/^(\d{4})-(\d{2})$/);
    if (yearMonthMatch) {
        return text;
    }

    const yearOnlyMatch = text.match(/^\d{4}$/);
    if (yearOnlyMatch) {
        return `${text}-01`;
    }

    return '';
};

const toStoredMonthYear = (value) => {
    if (!value) {
        return null;
    }

    const text = String(value);
    const yearMonthMatch = text.match(/^(\d{4})-(\d{2})$/);
    if (yearMonthMatch) {
        return `${yearMonthMatch[2]}-${yearMonthMatch[1]}`;
    }

    return text;
};

const ListField = ({ label, name, values, onChange }) => {
    const handleAddItem = () => {
        onChange({ target: { name, value: [...(values || []), ''] } });
    };

    const handleRemoveItem = (index) => {
        const newValues = [...values];
        newValues.splice(index, 1);
        onChange({ target: { name, value: newValues } });
    };

    const handleItemChange = (index, value) => {
        const newValues = [...values];
        newValues[index] = value;
        onChange({ target: { name, value: newValues } });
    };

    return (
        <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">{label}</label>
            {(values || []).map((item, index) => (
                <div key={index} className="flex items-center mb-2">
                    <input
                        type="text"
                        value={item}
                        onChange={(e) => handleItemChange(index, e.target.value)}
                        className="form-field-input-iqac"
                    />
                    <button type="button" onClick={() => handleRemoveItem(index)} className="ml-2 text-red-500">Remove</button>
                </div>
            ))}
            <button type="button" onClick={handleAddItem} className="text-indigo-600">Add Item</button>
        </div>
    );
};

const ObjectListField = ({ label, name, values = [], subFields = [], onChange }) => {

    const emptyItem = subFields.reduce((acc, field) => {
        acc[field.accessor] = '';
        return acc;
    }, {});

    // Helper: check if an item with the same entitySelect values already exists
    const isDuplicateEntity = (newItem, existingItems, skipIndex = -1) => {
        const entityFields = subFields.filter(f => f.type === 'entitySelect');
        if (entityFields.length === 0) return false;
        return existingItems.some((existing, idx) => {
            if (idx === skipIndex) return false;
            return entityFields.some(ef => {
                const newVal = (newItem[ef.accessor] || '').toString().trim();
                const existingVal = (existing[ef.accessor] || '').toString().trim();
                return newVal !== '' && existingVal !== '' && newVal === existingVal;
            });
        });
    };

    const handleAddItem = () => {
        onChange({ target: { name, value: [...values, emptyItem] } });
    };

    const handleRemoveItem = (index) => {
        const newValues = [...values];
        newValues.splice(index, 1);
        onChange({ target: { name, value: newValues } });
    };

    const handleItemChange = (index, subAccessor, subValue) => {
        const newValues = [...values];
        const updatedItem = {
            ...newValues[index],
            [subAccessor]: subValue
        };

        // Check for duplicate entity on entitySelect field change
        const changedField = subFields.find(f => f.accessor === subAccessor);
        if (changedField && changedField.type === 'entitySelect' && subValue) {
            if (isDuplicateEntity(updatedItem, newValues, index)) {
                toast.error(`This ${changedField.header || 'entity'} has already been added. Duplicates are not allowed.`);
                return;
            }
        }

        newValues[index] = updatedItem;
        onChange({ target: { name, value: newValues } });
    };

    return (
        <div className="border border-gray-200 p-4 rounded-lg col-span-1 md:col-span-2">
            <div className="flex items-center justify-between mb-4">
                <label className="text-lg font-semibold text-gray-800">
                    {label}
                    {subFields.some(f => f.required) && <span className="text-red-500 ml-1">*</span>}
                </label>
                <button
                    type="button"
                    onClick={handleAddItem}
                    className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded text-sm"
                >
                    <span>+ Add Item</span>
                </button>
            </div>

            {values.length === 0 && <div className="text-gray-500 mb-4 text-sm">No items added.</div>}

            <div className="space-y-4">
                {values.map((item, index) => (
                    <div key={index} className="flex flex-wrap gap-4 p-4 bg-gray-50 border border-gray-200 rounded-lg items-start relative pr-10 shadow-sm">
                        {/* Remove Button */}
                        <button
                            type="button"
                            onClick={() => handleRemoveItem(index)}
                            className="absolute top-2 right-2 text-red-500 hover:bg-red-100 hover:text-red-700 p-1.5 rounded transition-colors"
                            title="Remove Item"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>

                        {subFields.map(field => {
                            const isVisible = typeof field.showIf === 'function' ? field.showIf(item) : !field.showIf || field.showIf === true;
                            if (!isVisible) return null;

                            if (field.type === 'select') {
                                return (
                                    <div key={field.accessor} className="flex-1 min-w-[200px]">
                                        <label className="block text-sm font-semibold mb-1 text-gray-700">{field.header}</label>
                                        <select
                                            value={item[field.accessor] || ''}
                                            onChange={(e) => handleItemChange(index, field.accessor, e.target.value)}
                                            className="w-full h-11 px-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        >
                                            <option value="">{field.placeholder || 'Select...'}</option>
                                            {field.options?.map(option => (
                                                <option key={option.value || option} value={option.value || option}>
                                                    {option.label || option}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                );
                            }

                            if (field.type === 'entitySelect') {
                                // Collect already-selected values for this field from other rows
                                const alreadySelected = values
                                    .filter((_, idx) => idx !== index)
                                    .map(v => v[field.accessor])
                                    .filter(Boolean);
                                return (
                                    <div key={field.accessor} className="flex-1 min-w-[200px]">
                                        <label className="block text-sm font-semibold mb-1 text-gray-700">{field.header}</label>
                                        <div className="bg-white border-gray-300 rounded-md">
                                            <SearchableSelect
                                                entityType={field.entityType}
                                                value={item[field.accessor] || ''}
                                                onChange={(value) => handleItemChange(index, field.accessor, value)}
                                                label={null}
                                                required={field.required}
                                                excludeValues={alreadySelected}
                                            />
                                        </div>
                                    </div>
                                );
                            }

                            if (isMonthYearField(field)) {
                                return (
                                    <div key={field.accessor} className="flex-1 min-w-[200px]">
                                        <label className="block text-sm font-semibold mb-1 text-gray-700">{field.header}</label>
                                        <input
                                            className="w-full h-11 px-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                            name={`${name}_${index}_${field.accessor}`}
                                            type="month"
                                            value={toMonthInputValue(item[field.accessor])}
                                            onChange={(e) => handleItemChange(index, field.accessor, toStoredMonthYear(e.target.value))}
                                        />
                                    </div>
                                );
                            }

                            return (
                                <div key={field.accessor} className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-semibold mb-1 text-gray-700">{field.header}</label>
                                    <input
                                        className="w-full h-11 px-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        name={`${name}_${index}_${field.accessor}`}
                                        type={field.type || 'text'}
                                        placeholder={field.placeholder || ''}
                                        value={item[field.accessor] || ''}
                                        min={field.min}
                                        max={field.max}
                                        step={field.step}
                                        pattern={field.pattern}
                                        onChange={(e) => handleItemChange(index, field.accessor, e.target.value)}
                                    />
                                </div>
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};

const getInitialFormData = (resource) => {
    return resource.columns
        .filter(col => !col.hideInForm) // Exclude columns hidden from form
        .reduce((acc, col) => {
            if (col.accessor) {
                if (col.type === 'list' || col.type === 'objectList') {
                    acc[col.accessor] = [];
                } else if (col.type === 'boolean') {
                    acc[col.accessor] = false;
                } else {
                    acc[col.accessor] = '';
                }
            }
            return acc;
        }, {});
};

const applyCalculatedFields = (resource, data) => {
    if (!resource?.columns) {
        return data;
    }

    return resource.columns.reduce((nextData, col) => {
        if (col.accessor && typeof col.value === 'function') {
            try {
                nextData[col.accessor] = col.value(nextData);
            } catch (error) {
                console.warn(`Failed to calculate field ${col.accessor}`, error);
            }
        }
        return nextData;
    }, { ...data });
};

const getFacultyDisplayName = (faculty) => {
    if (!faculty) {
        return '';
    }

    return faculty.name || faculty.faculty_name || faculty.full_name || faculty.teacher_name || '';
};

const AddPage = () => {
    const { resourceId } = useParams();
    const [searchParams] = useSearchParams();
    const editMode = searchParams.get('edit') === 'true';
    const editId = searchParams.get('id');
    const resource = resourceMap.get(resourceId);
    const { academicYear: dashboardAcademicYear } = useIqacFilter();
    const navigate = useNavigate(); // Hook for navigation

    // Auth State
    const user = useSelector(selectUser);
    const role = useSelector(selectRole);

    const [formData, setFormData] = useState({});
    const [files, setFiles] = useState({});
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [loading, setLoading] = useState(false);

    // Duplicate Detection State
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);
    const [duplicateComparison, setDuplicateComparison] = useState(null);
    const [isBypassingDuplicate, setIsBypassingDuplicate] = useState(false);

    const sessionAcademicYear = getEffectiveSessionYear(dashboardAcademicYear);

    useEffect(() => {
        if (resource) {

            const loadData = async () => {
                if (editMode && editId) {
                    try {
                        setLoading(true);
                        const { serviceName, getByIdFunctionName } = resource;
                        console.log(`[AddPage] Loading data for edit. Service: ${serviceName}, Func: ${getByIdFunctionName}, ID: ${editId}`);
                        const service = Services[serviceName];
                        if (service && service[getByIdFunctionName]) {
                            const response = await service[getByIdFunctionName](editId);
                            console.log(`[AddPage] Response:`, response);
                            // Pre-fill form data
                            const data = response?.data || response;
                            console.log(`[AddPage] Data to set:`, data);

                            if (!data) throw new Error("No data returned from service");

                            // Merge with initial structure to ensure all fields exist
                            const initialData = getInitialFormData(resource);

                            // Format date fields and Normalize Object values
                            resource.columns.forEach(col => {
                                // 1. Handle Date Fields
                                if (col.type === 'date' && data[col.accessor]) {
                                    data[col.accessor] = new Date(data[col.accessor]).toISOString().split('T')[0];
                                }

                                // 2. Handle Normalize Single EntitySelect/Select (if backend returns object instead of ID)
                                const val = data[col.accessor];
                                if ((col.type === 'select' || col.type === 'entitySelect') && val && typeof val === 'object' && !Array.isArray(val)) {
                                    // Try to find the Key matching the accessor (e.g. department_id -> val.department_id)
                                    if (val[col.accessor] !== undefined) {
                                        data[col.accessor] = val[col.accessor];
                                    } else if (val.id !== undefined) {
                                        data[col.accessor] = val.id;
                                    } else if (val._id !== undefined) {
                                        data[col.accessor] = val._id;
                                    }
                                }

                                // 3. Handle Normalize Nested ObjectList Fields
                                if (col.type === 'objectList' && Array.isArray(val) && col.subFields) {
                                    data[col.accessor] = val.map(item => {
                                        // item is the row in the list, e.g. { faculty_id: {...}, role: "..." }
                                        const newItem = { ...item };
                                        col.subFields.forEach(subField => {
                                            const subVal = newItem[subField.accessor];
                                            if ((subField.type === 'select' || subField.type === 'entitySelect') && subVal && typeof subVal === 'object' && !Array.isArray(subVal)) {
                                                if (subVal[subField.accessor] !== undefined) {
                                                    newItem[subField.accessor] = subVal[subField.accessor];
                                                } else if (subVal.id !== undefined) {
                                                    newItem[subField.accessor] = subVal.id;
                                                } else if (subVal._id !== undefined) {
                                                    newItem[subField.accessor] = subVal._id;
                                                }
                                            }
                                        });
                                        return newItem;
                                    });
                                }
                            });

                            const nextData = { ...initialData, ...data };
                            resource.columns.forEach(col => {
                                if (col.readOnlyFromSession && col.accessor === 'academic_year') {
                                    nextData[col.accessor] = sessionAcademicYear;
                                }
                            });
                            setFormData(applyCalculatedFields(resource, nextData));
                        } else {
                            console.error(`[AddPage] Service or function not found. Service: ${!!service}, Func: ${!!service?.[getByIdFunctionName]}`);
                            throw new Error(`Service function ${getByIdFunctionName} not found in ${serviceName}`);
                        }
                    } catch (err) {
                        console.error("Failed to load edit data", err);
                        setError(`Failed to load data: ${err.message}`);
                    } finally {
                        setLoading(false);
                    }
                } else {
                    // ADD MODE
                    const initialData = getInitialFormData(resource);
                    // HOD Logic: Pre-fill department_id
                    if (role === ROLES.DEPARTMENT_HOD && (user?.departmentId || user?.department_id)) {
                        initialData.department_id = user.departmentId || user.department_id;
                    }
                    resource.columns.forEach(col => {
                        if (col.readOnlyFromSession && col.accessor === 'academic_year') {
                            initialData[col.accessor] = sessionAcademicYear;
                        }
                    });
                    setFormData(applyCalculatedFields(resource, initialData));
                }
            };

            loadData();
        }
    }, [resource, role, user, editMode, editId, sessionAcademicYear]);

    if (!resource) {
        return <NotFound />;
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const column = resource.columns.find(col => col.accessor === name);
        if (column?.readOnlyFromSession) {
            setFormData(prev => applyCalculatedFields(resource, { ...prev, [name]: sessionAcademicYear }));
            return;
        }

        if (Array.isArray(value)) {
            setFormData(prev => applyCalculatedFields(resource, { ...prev, [name]: value }));
        } else {
            setFormData(prev => applyCalculatedFields(resource, { ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFiles(prev => ({ ...prev, [name]: files[0] }));
    };

    const handleEntitySelectChange = (col, value, selectedOption = null) => {
        const updates = { [col.accessor]: value };

        if (resourceId === 'faculty_visits' && col.accessor === 'faculty_id') {
            updates.faculty_name = getFacultyDisplayName(selectedOption?.data);
        }

        setFormData(prev => applyCalculatedFields(resource, { ...prev, ...updates }));
    };

    const validateFormFields = () => {
        const missing = resource.columns
            .filter((col) => col.required && !col.hideInForm && col.accessor)
            .filter((col) => {
                const value = formData[col.accessor];
                if (value === null || value === undefined) return true;
                if (typeof value === 'string') return value.trim() === '';
                if (Array.isArray(value)) return value.length === 0;
                return false;
            })
            .map((col) => col.header || col.accessor);

        if (missing.length > 0) {
            toast.error(`Please fill required fields: ${missing.join(', ')}`);
            return false;
        }

        const validationErrors = [];

        resource.columns
            .filter((col) => !col.hideInForm && col.accessor)
            .forEach((col) => {
                const value = formData[col.accessor];

                if (col.integer && !isNonNegativeIntegerValue(value)) {
                    validationErrors.push(`${col.header || col.accessor} must be a positive integer or zero.`);
                }

                if (col.type === 'email' && value && !EMAIL_PATTERN.test(String(value).trim())) {
                    validationErrors.push(`${col.header || col.accessor} must be a valid email address.`);
                }

                const resolvedMin = typeof col.min === 'function' ? col.min(formData) : col.min;
                const resolvedMax = typeof col.max === 'function' ? col.max(formData) : col.max;

                if (col.type === 'date' && value) {
                    if (resolvedMin && value < resolvedMin) {
                        validationErrors.push(`${col.header || col.accessor} must be on or after ${resolvedMin}.`);
                    }
                    if (resolvedMax && value > resolvedMax) {
                        validationErrors.push(`${col.header || col.accessor} must be on or before ${resolvedMax}.`);
                    }
                } else if (col.type === 'monthYearSelect' && value) {
                    const monthValue = toMonthInputValue(value);
                    const { startMonth, endMonth } = getSessionBounds(formData.academic_year || sessionAcademicYear);
                    if (startMonth && endMonth && (monthValue < startMonth || monthValue > endMonth)) {
                        validationErrors.push(`${col.header || col.accessor} must be between ${startMonth} and ${endMonth}.`);
                    }
                } else if (resolvedMin !== undefined && value !== '' && value !== null && value !== undefined && Number(value) < Number(resolvedMin)) {
                    validationErrors.push(`${col.header || col.accessor} must be at least ${resolvedMin}.`);
                }

                if (col.type !== 'date' && col.type !== 'monthYearSelect' && resolvedMax !== undefined && value !== '' && value !== null && value !== undefined && Number(value) > Number(resolvedMax)) {
                    validationErrors.push(`${col.header || col.accessor} must be at most ${resolvedMax}.`);
                }

                if (col.validate) {
                    const message = col.validate(value, formData);
                    if (message) {
                        validationErrors.push(message);
                    }
                }

                if (col.type === 'objectList' && Array.isArray(value) && col.subFields) {
                    value.forEach((item, index) => {
                        col.subFields.forEach((subField) => {
                            const subValue = item?.[subField.accessor];
                            if (subField.required && (subValue === null || subValue === undefined || String(subValue).trim() === '')) {
                                validationErrors.push(`${col.header} row ${index + 1}: ${subField.header || subField.accessor} is required.`);
                            }
                            if (subField.type === 'email' && subValue && !EMAIL_PATTERN.test(String(subValue).trim())) {
                                validationErrors.push(`${col.header} row ${index + 1}: ${subField.header || subField.accessor} must be a valid email address.`);
                            }
                            if (subField.validate) {
                                const message = subField.validate(subValue, item, formData);
                                if (message) {
                                    validationErrors.push(`${col.header} row ${index + 1}: ${message}`);
                                }
                            }
                        });
                    });
                }
            });

        if (validationErrors.length > 0) {
            toast.error(validationErrors[0]);
            return false;
        }

        return true;
    };

    const handleSubmit = async (e, forceCreate = false) => {
        if (e) e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!validateFormFields()) {
            return;
        }

        setLoading(true);

        try {
            // DUPLICATE DETECTION CHECK
            if (!forceCreate && !isBypassingDuplicate && isDuplicateDetectionEnabled(resourceId) && !editMode) {
                console.log(`Checking duplicates for ${resourceId}...`);
                const ay = calculateAcademicYear(formData);
                const facultyId = extractFacultyId(formData, resourceId);

                const dupResult = await checkDuplicateIqac(resourceId, formData, ay, facultyId);

                if (dupResult.isDuplicate) {
                    setDuplicateComparison({
                        type: dupResult.type,
                        existing: dupResult.existing,
                        incoming: dupResult.incoming,
                        resourceId: resourceId
                    });
                    setIsDuplicateModalOpen(true);
                    setLoading(false);
                    return; // Stop and wait for user decision
                }
            }

            const { serviceName, addFunctionName, updateFunctionName, submission } = resource;

            const { payloadType = 'json', signature, fileUploadKey = 'doc', jsonPayloadKey } = submission || {};

            if (!serviceName || (!editMode && !addFunctionName) || (editMode && !updateFunctionName)) {
                throw new Error(`Service or function name not configured for ${resource.title}`);
            }

            const service = Services[serviceName];
            const targetFunction = editMode ? updateFunctionName : addFunctionName;

            if (!service || typeof service[targetFunction] !== 'function') {
                throw new Error(`Function ${targetFunction} not found for ${resource.title}`);
            }

            const processedData = Object.entries(formData).reduce((acc, [key, value]) => {
                const column = resource.columns.find(c => c.accessor === key);
                if (column) {
                    if (isMonthYearField(column)) {
                        acc[key] = toStoredMonthYear(value);
                    } else if (column.type === 'number') {
                        acc[key] = value === '' ? undefined : Number(value);
                    } else if (column.type === 'boolean') {
                        acc[key] = Boolean(value);
                    } else if (column.type === 'list' || column.type === 'objectList') {
                        acc[key] = value;
                    } else {
                        acc[key] = value === '' ? null : value;
                    }
                } else {
                    acc[key] = value;
                }
                return acc;
            }, {});

            if (shouldUseFacultyApproval({ resource, role, editMode, payload: processedData })) {
                await iqacApprovalService.createApprovalRequest(resourceId, processedData, files);
                setSuccess(`${resource.title} sent to associated faculty for approval. It will be saved permanently after approval.`);
                toast.success('Approval request sent to faculty');

                const nextInitialData = getInitialFormData(resource);
                if (role === ROLES.DEPARTMENT_HOD && (user?.departmentId || user?.department_id)) {
                    nextInitialData.department_id = user.departmentId || user.department_id;
                }
                resource.columns.forEach(col => {
                    if (col.readOnlyFromSession && col.accessor === 'academic_year') {
                        nextInitialData[col.accessor] = sessionAcademicYear;
                    }
                });
                setFiles({});
                setFormData(applyCalculatedFields(resource, nextInitialData));
                return;
            }

            let response;
            const hasFiles = Object.values(files).some(file => file);

            const useFormData = payloadType === 'formData' || (payloadType === 'auto' && hasFiles);

            // Log prepared data and files before sending (debugging)
            console.log('Submitting:', resource.title, { processedData, files, payloadType, signature, jsonPayloadKey });

            if (useFormData) {
                const data = new FormData();

                if (jsonPayloadKey) {
                    data.append(jsonPayloadKey, JSON.stringify(processedData));

                    for (const key in files) {
                        if (files[key]) {
                            const column = resource.columns.find(c => c.accessor === key);
                            const formFileKey = column?.fileKey || fileUploadKey;
                            data.append(formFileKey, files[key]);
                        }
                    }

                } else {
                    for (const key in processedData) {
                        if (processedData[key] !== null && processedData[key] !== undefined) {
                            if (Array.isArray(processedData[key])) {
                                data.append(key, JSON.stringify(processedData[key]));
                            } else if (typeof processedData[key] === 'boolean') {
                                data.append(key, String(processedData[key]));
                            } else {
                                data.append(key, processedData[key]);
                            }
                        }
                    }

                    for (const key in files) {
                        if (files[key]) {
                            const column = resource.columns.find(c => c.accessor === key);
                            const formFileKey = column?.fileKey || fileUploadKey;
                            data.append(formFileKey, files[key]);
                        }
                    }
                }
                // Log FormData contents for debugging before sending
                try {
                    for (const entry of data.entries()) {
                        // entry is [key, value]
                        console.log('FormData entry ->', entry[0], entry[1]);
                    }
                } catch (logErr) {
                    console.warn('Could not enumerate FormData entries for logging', logErr);
                }

                if (signature === 'formDataWithHeaders') {

                    // For update, we might need to pass ID as first arg?
                    // Usually updates are PUT(id, data).
                    // Let's assume the service method signature matches.
                    // BooksChaptersPublishedService.updateBooksChaptersPublished(id, data, headers)

                    if (editMode) {
                        response = await service[targetFunction](editId, data, { 'Content-Type': 'multipart/form-data' });
                    } else {
                        response = await service[targetFunction](data, { 'Content-Type': 'multipart/form-data' });
                    }

                } else if (signature === 'payloadAndFile') {
                    const fileAccessor = Object.keys(files)[0];
                    const file = files[fileAccessor];
                    const { [fileAccessor]: _, ...payload } = processedData;
                    // Log payload and file before calling
                    console.log('Calling payloadAndFile with payload:', payload, 'file:', file);
                    if (editMode) {
                        // Assuming update signature is (id, payload, file) or similar - verify service!
                        // Department update doesn't use file upload usually.
                        // If any service uses payloadAndFile AND supports update, we need to check signature.
                        // For now assuming: service.update(id, payload, file)
                        response = await service[targetFunction](editId, payload, file);
                    } else {
                        response = await service[targetFunction](payload, file);
                    }
                } else {
                    if (editMode) {
                        response = await service[targetFunction](editId, data);
                    } else {
                        response = await service[targetFunction](data);
                    }
                }

            } else {
                // Log JSON payload before sending
                console.log('Sending JSON payload for', resource.title, processedData);
                if (editMode) {
                    response = await service[targetFunction](editId, processedData);
                } else {
                    response = await service[targetFunction](processedData);
                }
            }

            setSuccess(`${resource.title} ${editMode ? 'updated' : 'added'} successfully!`);

            if (!editMode) {
                const nextInitialData = getInitialFormData(resource);
                if (role === ROLES.DEPARTMENT_HOD && (user?.departmentId || user?.department_id)) {
                    nextInitialData.department_id = user.departmentId || user.department_id;
                }
                resource.columns.forEach(col => {
                    if (col.readOnlyFromSession && col.accessor === 'academic_year') {
                        nextInitialData[col.accessor] = sessionAcademicYear;
                    }
                });
                setFiles({});
                setFormData(applyCalculatedFields(resource, nextInitialData));
            } else {
                // Determine what to do after edit - maybe stay or go back?
                // For now, let's just show success.
                // Redirect to table page after short delay
                setTimeout(() => {
                    navigate(resource.tablePath || '/actions/view'); // Fallback if tablePath missing
                }, 1000);
            }

        } catch (err) {
            const errorMessage = err.response?.data?.message || err.message;
            setError(`Failed to add ${resource.title}: ${errorMessage}`);
            console.error("Error details:", err.response?.data || err);
        } finally {
            setLoading(false);
        }
    };

    const renderField = (col) => {
        const isDisabled = Boolean(col.readOnlyFromSession || col.readOnly || col.disabled); // session-managed/calculated fields stay read-only
        const fieldValue = typeof col.value === 'function' ? col.value(formData) : formData[col.accessor];

        const commonProps = {
            name: col.accessor,
            onChange: handleChange,
            placeholder: col.placeholder || '',
            required: col.required || false,
            disabled: isDisabled,
            min: typeof col.min === 'function' ? col.min(formData) : col.min,
            max: typeof col.max === 'function' ? col.max(formData) : col.max,
            step: col.step,
            pattern: col.pattern,
        };

        switch (col.type) {
            case 'boolean':
                return (
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            {col.header}
                            {col.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className={`flex h-12 items-center rounded-xl border border-gray-200 bg-gray-50/80 px-4 ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input
                                type="checkbox"
                                name={col.accessor}
                                id={col.accessor}
                                checked={formData[col.accessor] || false}
                                onChange={handleChange}
                                disabled={isDisabled}
                                className="h-5 w-5 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded cursor-pointer"
                            />
                            <label htmlFor={col.accessor} className="ml-3 text-sm text-gray-700 cursor-pointer select-none">
                                Yes
                            </label>
                        </div>
                    </div>
                );
            case 'select':
                if (col.readOnlyFromSession) {
                    return (
                        <InputField
                            label={col.header}
                            type="text"
                            value={fieldValue || sessionAcademicYear}
                            required={col.required}
                            {...commonProps}
                            readOnly
                            disabled={false}
                            onChange={() => {}}
                            className="bg-gray-100 cursor-not-allowed"
                        />
                    );
                }
                return (
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            {col.header}
                            {col.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <select {...commonProps} value={formData[col.accessor] || ''} className="form-field-input-iqac disabled:opacity-50">
                            <option value="">{col.placeholder || 'Select...'}</option>
                            {col.options?.map(option => (
                                <option key={option.value || option} value={option.value || option}>
                                    {option.label || option}
                                </option>
                            ))}
                        </select>
                    </div>
                );
            case 'monthYearSelect': {
                const options = getSessionMonthYearOptions(formData.academic_year || sessionAcademicYear);
                return (
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            {col.header}
                            {col.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <select {...commonProps} value={formData[col.accessor] || ''} className="form-field-input-iqac disabled:opacity-50">
                            <option value="">{col.placeholder || 'Select month and year'}</option>
                            {options.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </select>
                    </div>
                );
            }
            case 'textarea':
                return (
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            {col.header}
                            {col.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <textarea
                            {...commonProps}
                            value={fieldValue || ''}
                            rows={col.rows || 3}
                            className="form-field-input-iqac disabled:opacity-50"
                        />
                    </div>
                );
            case 'hyperlink':
                if (col.fileKey) {
                    return (
                        <div>
                            <label className="block text-sm font-semibold mb-2 text-gray-700">
                                {col.header}
                                {col.required && <span className="text-red-500 ml-1">*</span>}
                            </label>
                            {col.description && (
                                <p className="text-xs text-gray-500 mb-2 italic">
                                    {col.description}
                                </p>
                            )}
                            <input
                                type="file"
                                name={col.accessor}
                                onChange={handleFileChange}
                                disabled={isDisabled}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 disabled:opacity-50"
                            />
                            {files[col.accessor] ? (
                                <div className="mt-2 text-sm text-gray-700">{files[col.accessor].name}</div>
                            ) : formData[col.accessor] ? (
                                <div className="mt-2 text-sm">
                                    <span className="text-gray-600 mr-2">Current File:</span>
                                    <a
                                        href={formData[col.accessor]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-indigo-600 hover:underline"
                                    >
                                        View Uploaded Document
                                    </a>
                                </div>
                            ) : null}
                        </div>
                    );
                }
                return (
                    <InputField
                        label={col.header}
                        type="url"
                        value={fieldValue || ''}
                        required={col.required}
                        {...commonProps}
                        className={`form-field-input-iqac ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                    />
                );
            case 'list':
                return (
                    <ListField
                        label={col.header}
                        name={col.accessor}
                        values={formData[col.accessor]}
                        onChange={handleChange}
                    />
                );
            case 'objectList':
                return (
                    <ObjectListField
                        label={col.header}
                        name={col.accessor}
                        values={formData[col.accessor] || []}
                        subFields={col.subFields || []}
                        onChange={handleChange}
                    />
                );
            case 'entitySelect':
                {
                    const shouldUseSelectedOption = resourceId === 'faculty_visits' && col.accessor === 'faculty_id';
                    return (
                    <SearchableSelect
                        entityType={col.entityType}
                        value={fieldValue || ''}
                        onChange={shouldUseSelectedOption ? () => {} : (value) => handleEntitySelectChange(col, value)}
                        onOptionChange={shouldUseSelectedOption ? (option) => handleEntitySelectChange(col, option?.value || '', option) : undefined}
                        required={col.required}
                        label={col.header}
                        disabled={isDisabled}
                    />
                    );
                }
            case 'monthYear':
            case 'year':
                return (
                    <InputField
                        label={col.header}
                        type="month"
                        value={toMonthInputValue(formData[col.accessor])}
                        required={col.required}
                        {...commonProps}
                        onChange={(event) => handleChange({
                            target: {
                                name: col.accessor,
                                value: toStoredMonthYear(event.target.value)
                            }
                        })}
                    />
                );
            default:
                if (isMonthYearField(col)) {
                    return (
                        <InputField
                            label={col.header}
                            type="month"
                            value={toMonthInputValue(formData[col.accessor])}
                            required={col.required}
                            {...commonProps}
                            onChange={(event) => handleChange({
                                target: {
                                    name: col.accessor,
                                    value: toStoredMonthYear(event.target.value)
                                }
                            })}
                        />
                    );
                }

                return (
                    <InputField
                        label={col.header}
                        type={col.type || 'text'}
                        value={fieldValue || ''}
                        required={col.required}
                        {...commonProps}
                    />
                );
        }
    };

    return (
        <div>
            <FormPageHeader
                badge={editMode ? 'Edit record' : 'New entry'}
                title={editMode ? `Edit ${resource.title}` : resource.addLabel}
                subtitle={`Fill in the required fields marked with * · ${resource.title}`}
                backTo={resource.tablePath}
                backLabel="Back to table"
            />
            <div className="form-card">
                <div className="form-card-body">
                    {success && <div className="form-alert-success">{success}</div>}
                    {error && <div className="form-alert-error">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
                            {resource.columns
                                .filter(col => !col.hideInForm)
                                .map(col => (
                                    col.accessor && <div key={col.accessor}>{renderField(col)}</div>
                                ))}
                        </div>
                        <div className="form-card-footer -mx-6 -mb-6 mt-8 sm:-mx-8 sm:-mb-8">
                            <Link to={resource.tablePath} className="form-btn-secondary">
                                <FiX />
                                <span>Cancel</span>
                            </Link>
                            <button type="submit" className="form-btn-primary" disabled={loading}>
                                {loading ? (
                                    <>
                                        <FiLoader className="animate-spin" />
                                        <span>{editMode ? 'Updating…' : 'Saving…'}</span>
                                    </>
                                ) : (
                                    <>
                                        <FiSave />
                                        <span>{editMode ? 'Update' : 'Save'}</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Duplicate Detection Modal */}
            <DuplicateVerificationModal
                isOpen={isDuplicateModalOpen}
                onClose={() => setIsDuplicateModalOpen(false)}
                comparisonData={duplicateComparison}
                onSelection={(action, data) => {
                    if (action === 'keep') {
                        setIsDuplicateModalOpen(false);
                        setSuccess('Duplicate found and verified. No new entry created.');
                        setFormData(getInitialFormData(resource));
                    } else if (action === 'create') {
                        setIsDuplicateModalOpen(false);
                        setIsBypassingDuplicate(true);
                        // Re-submit with forceCreate or bypass
                        handleSubmit(null, true);
                    }
                }}
            />
        </div>
    );
};

export default AddPage;
