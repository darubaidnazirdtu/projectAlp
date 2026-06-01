import React, { useState, useRef } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiX, FiSave } from 'react-icons/fi';
import { toast } from 'sonner';
import SearchableSelect from './SearchableSelect';
import FileUpload from './FileUpload';
import { StudentService } from '../services/student.services.js';

// ... (existing imports)



export default function DynamicTableSection({
    title,
    fields,
    data,
    onAdd,
    onUpdate,
    onRemove,
    readOnly,
    initialItem = {},
    uniqueKey
}) {
    const [isAdding, setIsAdding] = useState(false);
    const [editingIndex, setEditingIndex] = useState(null);
    const [tempItem, setTempItem] = useState(initialItem);
    const [tempSubItems, setTempSubItems] = useState({}); // State for nested objectList forms
    const [activeSubForms, setActiveSubForms] = useState({}); // State to toggle visibility of sub-item forms

    const studentsByEnrollRef = useRef(null);
    const buildEnrollIndex = (list) => {
        const idx = new Map();
        (list || []).forEach((s) => {
            const raw = String(s?.enrollment_no || '').trim().toLowerCase();
            const key = raw.replace(/[^a-z0-9]/g, '');
            if (key) idx.set(key, s);
        });
        return idx;
    };
    const lookupStudentByEnrollment = async (value) => {
        const enroll = String(value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        if (!enroll) return null;
        let idx = studentsByEnrollRef.current;
        if (!idx) {
            try {
                const res = await StudentService.getStudentDetails();
                let list = [];
                if (Array.isArray(res)) list = res;
                else if (Array.isArray(res?.data)) list = res.data;
                else if (Array.isArray(res?.data?.data)) list = res.data.data;
                else if (Array.isArray(res?.rows)) list = res.rows;
                else list = [];
                idx = buildEnrollIndex(list);
                studentsByEnrollRef.current = idx;
            } catch (e) {
                toast.error('Unable to load students');
                return null;
            }
        }
        return idx.get(enroll) || null;
    };
    const handleEnrollmentLookup = async (value) => {
        const found = await lookupStudentByEnrollment(value);
        if (!found) {
            toast.error('No student found for entered enrollment');
            return;
        }
        if (found.student_id || found._id) {
            handleChange('student_id', found.student_id || found._id);
        }
        if (fields.some(f => f.key === 'student_name')) {
            handleChange('student_name', found.name || '');
        }
    };

    const sanitizeAlphaNum = (s) => String(s || '').replace(/[^A-Za-z0-9 ]+/g, '');
    const sanitizeEmail = (s) => String(s || '').replace(/[^A-Za-z0-9@._+\-]+/g, '');
    const sanitizeUrl = (s) => String(s || '').replace(/[^A-Za-z0-9:\/?&=._#%\-]+/g, '');
    const sanitizeNumeric = (s) => String(s || '').replace(/[^0-9]+/g, '');
    const sanitizeForResearchKey = (key, value, type) => {
        const v = String(value ?? '');
        if (v === '') return v;
        const lower = String(key || '').toLowerCase();
        if (type === 'email' || lower.includes('email')) return sanitizeEmail(v);
        if (lower.includes('url') || lower.includes('link') || lower.includes('http') || lower.includes('doi')) return sanitizeUrl(v);
        if (type === 'date') return v;
        if (type === 'month' || /(^|_)(year_of_publication|registration_year|year_of_sanction|academic_year|year)($|_)/.test(lower)) return v.replace(/[^0-9\-]+/g, '');
        if (type === 'number' || /(amount|volume|page_numbers|citation_count|duration_hours|duration_days|number_of_participants|monetary_value|impact_factor)\b/.test(lower)) return sanitizeNumeric(v);
        if (/(remarks|outcome|reason|description|details)\b/.test(lower)) return sanitizeAlphaNum(v);
        return sanitizeAlphaNum(v);
    };

    const formatMonthYearValue = (value) => {
        const normalized = String(value || '').trim();
        if (!normalized) return '';
        const monthYearMatch = normalized.match(/^(\d{2})-(\d{4})$/);
        if (monthYearMatch) return normalized;
        const inputMonthMatch = normalized.match(/^(\d{4})-(\d{2})$/);
        if (inputMonthMatch) return `${inputMonthMatch[2]}-${inputMonthMatch[1]}`;
        if (/^\d{4}$/.test(normalized)) return `01-${normalized}`;
        return normalized;
    };

    const getMonthInputValue = (value) => {
        const formatted = formatMonthYearValue(value);
        const match = formatted.match(/^(\d{2})-(\d{4})$/);
        return match ? `${match[2]}-${match[1]}` : '';
    };

    const formatInputMonthToMonthYear = (value) => {
        const match = String(value || '').match(/^(\d{4})-(\d{2})$/);
        return match ? `${match[2]}-${match[1]}` : '';
    };

    const getMonthInputBoundary = (value, month) => {
        if (value === undefined || value === null || value === '') return undefined;
        const normalized = String(value).trim();
        if (/^\d{4}$/.test(normalized)) return `${normalized}-${month}`;
        const inputMonthMatch = normalized.match(/^(\d{4})-(\d{2})$/);
        if (inputMonthMatch) return normalized;
        const monthYearMatch = normalized.match(/^(\d{2})-(\d{4})$/);
        return monthYearMatch ? `${monthYearMatch[2]}-${monthYearMatch[1]}` : undefined;
    };

    const getMonthIndex = (value, fallbackMonth) => {
        if (value === undefined || value === null || value === '') return null;
        const normalized = String(value).trim();
        const boundary = getMonthInputBoundary(normalized, fallbackMonth);
        const match = boundary?.match(/^(\d{4})-(\d{2})$/);
        if (!match) return null;
        return Number(match[1]) * 12 + Number(match[2]);
    };

    const isValidMonthYearValue = (value, field) => {
        const formatted = formatMonthYearValue(value);
        const match = formatted.match(/^(\d{2})-(\d{4})$/);
        if (!match) return false;
        const monthNum = Number(match[1]);
        const yearNum = Number(match[2]);
        if (monthNum < 1 || monthNum > 12 || Number.isNaN(yearNum)) return false;

        const valueIndex = yearNum * 12 + monthNum;
        const minIndex = getMonthIndex(field.min, '01') ?? 0;
        const maxIndex = getMonthIndex(field.max, '12') ?? 9999 * 12 + 12;

        return valueIndex >= minIndex && valueIndex <= maxIndex;
    };

    const normalizeMonthYearFields = (item, fieldsList = fields) => {
        const nextItem = { ...item };
        fieldsList.forEach(field => {
            if (field.type === 'monthYear' && nextItem[field.key]) {
                nextItem[field.key] = formatMonthYearValue(nextItem[field.key]);
            }
            if (field.type === 'objectList' && Array.isArray(nextItem[field.key]) && Array.isArray(field.subFields)) {
                nextItem[field.key] = nextItem[field.key].map(subItem => normalizeMonthYearFields(subItem, field.subFields));
            }
        });
        return nextItem;
    };

    const handleStartAdd = () => {
        const itemWithDefaults = { ...initialItem };
        fields.forEach(field => {
            if (field.defaultValue !== undefined && (itemWithDefaults[field.key] === undefined || itemWithDefaults[field.key] === '')) {
                itemWithDefaults[field.key] = field.defaultValue;
            }
        });
        setTempItem(normalizeMonthYearFields(itemWithDefaults));
        // Reset sub-forms visibility: all hidden by default
        setActiveSubForms({});

        // Initialize tempSubItems with default values from fields configuration
        const defaultSubItems = {};
        fields.forEach(field => {
            if (field.type === 'objectList' && field.subFields) {
                const fieldDefaults = {};
                field.subFields.forEach(subField => {
                    if (subField.defaultValue !== undefined) {
                        fieldDefaults[subField.key] = subField.defaultValue;
                    }
                });
                if (Object.keys(fieldDefaults).length > 0) {
                    defaultSubItems[field.key] = fieldDefaults;
                }
            }
        });

        setTempSubItems(defaultSubItems);
        setIsAdding(true);
        setEditingIndex(null);
    };

    const handleStartEdit = (index, item) => {
        setTempItem(normalizeMonthYearFields(item));
        setTempSubItems({});
        setActiveSubForms({});
        setEditingIndex(index);
        setIsAdding(true);
    };

    const toggleSubForm = (fieldKey, show) => {
        setActiveSubForms(prev => ({ ...prev, [fieldKey]: show }));
        if (show) {
            // Smart Pre-fill: If this is 'faculty_involved' or similar, check if we should pre-fill
            const currentList = tempItem[fieldKey] || [];
            const fieldConfig = fields.find(f => f.key === fieldKey);

            if (fieldConfig && fieldConfig.subFields) {
                const newDefaults = {};
                fieldConfig.subFields.forEach(subF => {
                    // Check if there is a default value and if it's an entitySelect
                    if (subF.defaultValue && subF.type === 'entitySelect') {
                        // Check if this entity is already in the list
                        const isAlreadyAdded = currentList.some(item => item[subF.key] === subF.defaultValue);

                        if (!isAlreadyAdded) {
                            newDefaults[subF.key] = subF.defaultValue;
                            // Also try to set default role if available? (harder to know which one)
                        }
                    } else if (subF.defaultValue) {
                        // For non-entity fields with defaults (e.g. Role)
                        newDefaults[subF.key] = subF.defaultValue;
                    }
                });

                setTempSubItems(prev => ({
                    ...prev,
                    [fieldKey]: { ...newDefaults }
                }));
            }
        }
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingIndex(null);
        setTempItem(initialItem);
        setTempSubItems({});
        setActiveSubForms({});
    };

    const getAssociatedStartKey = (endKey) => {
        if (endKey === 'end_date') return 'start_date';
        if (endKey === 'duration_end_date') return 'duration_start_date';
        if (endKey.endsWith('_end_date')) return endKey.replace('_end_date', '_start_date');
        if (endKey.startsWith('end_')) return `start_${endKey.slice(4)}`;
        return null;
    };

    const handleSave = () => {
        // Validation: Check for duplicates if uniqueKey is provided
        if (uniqueKey && tempItem[uniqueKey]) {
            const isDuplicate = data.some((item, idx) => {
                // Skip the item currently being edited
                if (editingIndex !== null && idx === editingIndex) return false;

                // Case-insensitive comparison
                const val1 = (item[uniqueKey] || '').toString().toLowerCase().trim();
                const val2 = (tempItem[uniqueKey] || '').toString().toLowerCase().trim();
                return val1 === val2 && val1 !== '';
            });

            if (isDuplicate) {
                toast.error(`Duplicate entry: "${tempItem[uniqueKey]}" already exists.`);
                return;
            }
        }

        // Validation Logic
        const validationErrors = [];
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        fields.forEach(field => {
            const val = tempItem[field.key];
            if (
    field.type === 'select' &&
    (!val || val === '')
) {
    validationErrors.push(`${field.label} is required`);
    return;
}
            const isRequired = field.required || (typeof field.requiredIf === 'function' && field.requiredIf(tempItem));

            if (isRequired) {
    if (
        val === undefined ||
        val === null ||
        val === '' ||
        (typeof val === 'string' && !val.trim()) ||
        val === 'Select...'
    ) {
        validationErrors.push(field.label);
        return;
    }
}

            if (field.type === 'year' && val) {
                const normalized = String(val).trim();
                const yearNum = Number(normalized);
                const minYear = field.min || 0;
                const maxYear = field.max || 9999;
                if (!/^\d{4}$/.test(normalized) || Number.isNaN(yearNum) || yearNum < minYear || yearNum > maxYear) {
                    validationErrors.push(`${field.label} must be a 4-digit year between ${minYear} and ${maxYear}`);
                }
            }
            if (field.type === 'monthYear' && val) {
                const minYear = field.min || 0;
                const maxYear = field.max || 9999;
                if (!isValidMonthYearValue(val, field)) {
                    validationErrors.push(`${field.label} must be a valid month-year in MM-YYYY format between ${minYear} and ${maxYear}`);
                }
            }
            if (field.type === 'email' && val) {
                const normalized = String(val).trim();
                if (!emailRegex.test(normalized)) {
                    validationErrors.push(`${field.label} must be a valid email address`);
                }
            }
            
           
        });

        // Validate nested objectList items for required sub-fields
        // Validate nested objectList items for required sub-fields; 
        fields.forEach(field => {
            if (field.type === 'objectList' && Array.isArray(tempItem[field.key]) && Array.isArray(field.subFields)) {
                tempItem[field.key].forEach((subItem, sIdx) => {
                    field.subFields.forEach(subF => {
                        const isSubRequired = subF.required || (typeof subF.requiredIf === 'function' && subF.requiredIf(subItem));
                        const subVal = subItem[subF.key];
                        const isEmpty =
    subVal === undefined ||
    subVal === null ||
    subVal === '' ||
    (typeof subVal === 'string' && !subVal.toString().trim()) ||
    subVal === 'Select...';
                        if (isSubRequired && isEmpty) {
                            validationErrors.push(`${field.label} (item ${sIdx + 1}): ${subF.label}`);
                        }
                        // Email format validation for nested email fields
                        if (!isEmpty && subF.type === 'email') {
                            const normalizedSub = String(subVal).trim();
                            if (!emailRegex.test(normalizedSub)) {
                                validationErrors.push(`${field.label} (item ${sIdx + 1}): ${subF.label} must be a valid email address`);
                            }
                        }
                    });
                });
            }

            if (field.type === 'objectList' && activeSubForms[field.key] && Array.isArray(field.subFields)) {
                const pendingItem = tempSubItems[field.key] || {};
                field.subFields.forEach(subF => {
                    const isSubRequired = subF.required || (typeof subF.requiredIf === 'function' && subF.requiredIf(pendingItem));
                    const subVal = pendingItem[subF.key];
                    const isEmpty =
    subVal === undefined ||
    subVal === null ||
    subVal === '' ||
    (typeof subVal === 'string' && !subVal.toString().trim()) ||
    subVal === 'Select...';
                    if (isSubRequired && isEmpty) {
                        validationErrors.push(`${field.label}: ${subF.label}`);
                    }
                });
            }
        });
       /* fields.forEach(field => {
            if (field.type === 'objectList' && Array.isArray(tempItem[field.key]) && Array.isArray(field.subFields)) {
                tempItem[field.key].forEach((subItem, sIdx) => {
                    field.subFields.forEach(subF => {
                        const isSubRequired = subF.required || (typeof subF.requiredIf === 'function' && subF.requiredIf(subItem));
                        const subVal = subItem[subF.key];
                        const isEmpty = subVal === undefined || subVal === null || (typeof subVal === 'string' && !subVal.toString().trim());
                        if (isSubRequired && isEmpty) {
                            validationErrors.push(`${field.label} (item ${sIdx + 1}): ${subF.label}`);
                        }
                        // Email format validation for nested email fields
                        if (!isEmpty && subF.type === 'email') {
                            const normalizedSub = String(subVal).trim();
                            if (!emailRegex.test(normalizedSub)) {
                                validationErrors.push(`${field.label} (item ${sIdx + 1}): ${subF.label} must be a valid email address`);
                            }
                        }
                        if (!isEmpty && subF.type === 'monthYear' && !isValidMonthYearValue(subVal, subF)) {
                            validationErrors.push(`${field.label} (item ${sIdx + 1}): ${subF.label} must be a valid month-year in MM-YYYY format`);
                        }
                    });
                });
            }
        });*/

        const startKey = getAssociatedStartKey('end_date');
        if (startKey && tempItem.start_date && tempItem.end_date) {
            const startDate = new Date(tempItem.start_date);
            const endDate = new Date(tempItem.end_date);
            if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate < startDate) {
                validationErrors.push('End Date must be the same as or after Start Date.');
            }
        }

        if (validationErrors.length > 0) {
            toast.error(`Please resolve the following errors: ${validationErrors.join(', ')}`);
            return;
        }

        const itemToSave = normalizeMonthYearFields(tempItem);

        if (editingIndex !== null) {
            // Updated to pass the full item to avoid partial state update race conditions
            onUpdate(editingIndex, itemToSave);
        } else {
            // Add new
            onAdd(itemToSave);
        }
        handleCancel();
    };

    const handleChange = (key, value) => {
        setTempItem(prev => ({ ...prev, [key]: value }));
    };

    const getStudentName = (studentData) => {
        return String(studentData?.name || studentData?.student_name || '').trim();
    };

    const handleEntityChange = (field, value, selectedData) => {
        setTempItem(prev => {
            const next = { ...prev, [field.key]: value };
            const hasStudentNameField = fields.some(f => f.key === 'student_name');

            if (field.entityType === 'student' && field.key === 'student_id' && hasStudentNameField) {
                next.student_name = value ? getStudentName(selectedData) : '';
            }

            return next;
        });
    };

    const handleSubItemChange = (parentKey, subKey, value, selectedData = null) => {
        setTempSubItems(prev => ({
            ...prev,
            [parentKey]: {
                ...(prev[parentKey] || {}),
                [subKey]: value,
                ...(() => {
                    const parentField = fields.find(field => field.key === parentKey);
                    const subField = parentField?.subFields?.find(field => field.key === subKey);
                    const hasStudentNameField = parentField?.subFields?.some(field => field.key === 'student_name');

                    if (subField?.entityType === 'student' && subKey === 'student_id' && hasStudentNameField) {
                        return { student_name: value ? getStudentName(selectedData) : '' };
                    }

                    return {};
                })()
            }
        }));
    };

    const handleAddSubItem = (parentKey, subFields) => {
        const newItem = tempSubItems[parentKey] || {};
        const currentList = tempItem[parentKey] || [];

        // Validate required sub-fields
        const missing = [];
        subFields.forEach(subF => {
            const isReq = subF.required || (typeof subF.requiredIf === 'function' && subF.requiredIf(newItem));
            if (isReq) {
                const val = newItem[subF.key];
                const empty = val === undefined || val === null || (typeof val === 'string' && !val.trim());
                if (empty) missing.push(subF.label);
            }
        });
        if (missing.length > 0) {
            toast.error(`Please fill required fields: ${missing.join(', ')}`);
            return;
        }

        // Validate email format for any email sub-fields
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const invalidEmails = [];
        subFields.forEach(subF => {
            if (subF.type === 'email') {
                const val = (newItem[subF.key] || '').toString().trim();
                if (val && !emailRegex.test(val)) invalidEmails.push(subF.label);
            }
        });
        if (invalidEmails.length > 0) {
            toast.error(`Invalid email format: ${invalidEmails.join(', ')}`);
            return;
        }

        const invalidMonthYears = [];
        subFields.forEach(subF => {
            if (subF.type === 'monthYear') {
                const val = (newItem[subF.key] || '').toString().trim();
                if (val && !isValidMonthYearValue(val, subF)) invalidMonthYears.push(subF.label);
            }
        });
        if (invalidMonthYears.length > 0) {
            toast.error(`Invalid month-year format: ${invalidMonthYears.join(', ')}`);
            return;
        }

        // Check for duplicates (uniqueness based on entitySelect fields)
        const duplicate = currentList.some(existing => {
            return subFields.some(subF => {
                if (subF.type === 'entitySelect' && newItem[subF.key]) {
                    return existing[subF.key] === newItem[subF.key];
                }
                return false;
            });
        });

        if (duplicate) {
            toast.error('This entity has already been added.');
            return;
        }

        // Simple validation: Ensure at least one field is filled
        if (Object.keys(newItem).length === 0) {
            return;
        }

        handleChange(parentKey, [...currentList, normalizeMonthYearFields(newItem, subFields)]);

        // Reset sub-item form for this parent field, preserving defaults if any? 
        // User request implies they want to add themselves, then maybe others. 
        // If we reset to empty, they can add others. If we reset to default (themselves), it might be annoying.
        // Let's reset to empty.
        setTempSubItems(prev => ({
            ...prev,
            [parentKey]: {}
        }));
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <label className="block text-md font-semibold text-gray-800">{title}</label>
            </div>

            {/* List View (Table) */}
            {!isAdding && (
                <div className="data-table-wrapper">
                    <div className="data-table-scroll">
                    <table className="data-table text-left">
                        <thead>
                            <tr>
                                {fields.map(f => (
                                    <th key={f.key} scope="col" className="!text-left whitespace-nowrap">
                                        {f.label} {f.required && <span className="text-red-500">*</span>}
                                    </th>
                                ))}
                                <th scope="col" className="!text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.map((item, idx) => (
                                <tr key={idx}>
                                    {fields.map(f => (
                                        <td key={f.key} className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {f.type === 'file' ? (
                                                (item[f.key] || item.link) ? (
                                                    <a href={item[f.key] || item.link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">View File</a>
                                                ) : <span className="text-gray-400">No file</span>
                                            ) : f.type === 'date' ? (
                                                item[f.key] ? new Date(item[f.key]).toLocaleDateString() : ''
                                            ) : f.type === 'monthYear' ? (
                                                formatMonthYearValue(item[f.key])
                                            ) : f.type === 'objectList' ? (
                                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                                    {(item[f.key] || []).slice(0, 2).map((sub, sIdx) => (
                                                        <span key={sIdx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100 truncate max-w-[80px]" title={sub.name || sub.faculty_id || sub.student_id}>
                                                            {sub.name || sub.faculty_id || sub.student_id || sub.email || 'Item'}
                                                        </span>
                                                    ))}
                                                    {(item[f.key] || []).length > 2 && (
                                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 cursor-help"
                                                            title={(item[f.key] || []).slice(2).map(sub => sub.name || sub.faculty_id || sub.student_id || sub.email).join(', ')}>
                                                            +{(item[f.key] || []).length - 2}
                                                        </span>
                                                    )}
                                                    {(item[f.key] || []).length === 0 && <span className="text-gray-400 text-xs">-</span>}
                                                </div>
                                            ) : (
                                                <div className="truncate max-w-xs" title={item[f.key]}>{item[f.key]}</div>
                                            )}
                                        </td>
                                    ))}
                                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        {!readOnly && (
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => handleStartEdit(idx, item)} className="text-indigo-600 hover:text-indigo-900"><FiEdit2 /></button>
                                                {onRemove && (
                                                    <button onClick={() => onRemove(idx)} className="text-red-600 hover:text-red-900"><FiTrash2 /></button>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {data.length === 0 && (
                                <tr>
                                    <td colSpan={fields.length + 1} className="px-4 py-8 text-center text-gray-500 italic">
                                        No entries found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                    </div>
                </div>
            )}

            {/* Add/Edit Form */}
            {isAdding && (
                <div className="form-card-body rounded-xl border border-indigo-100 bg-indigo-50/30 p-6">
                    <h4 className="text-md font-bold text-gray-800 mb-4">{editingIndex !== null ? 'Edit Entry' : 'Add New Entry'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.map(f => (
                            <div key={f.key} className={f.fullWidth ? "md:col-span-2" : ""}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {f.label} {(f.required || (typeof f.requiredIf === 'function' && f.requiredIf(tempItem))) && <span className="text-red-600">*</span>}
                                </label>
                                {f.type === 'textarea' ? (
                                    <textarea
                                        rows={3}
                                        value={tempItem[f.key] || ''}
                                        onChange={(e) => handleChange(f.key, sanitizeForResearchKey(f.key, e.target.value, 'text'))}
                                        required={f.required || (typeof f.requiredIf === 'function' && f.requiredIf(tempItem))}
                                        disabled={f.disabled || f.readOnly || readOnly}
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5"
                                    />
                                ) : f.type === 'select' ? (
                                    <select
    value={tempItem[f.key] || ''}
    onChange={(e) => handleChange(f.key, e.target.value)}
    required={f.required || (typeof f.requiredIf === 'function' && f.requiredIf(tempItem))}
    disabled={f.disabled || f.readOnly || readOnly}
    className={`w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 ${
        f.key === 'academic_year' ? 'appearance-none bg-gray-100 cursor-not-allowed' : ''
    }`}
>
                                        <option value="">Select...</option>
                                        {f.options.map(opt => (
                                            <option key={opt} value={opt}>{opt}</option>
                                        ))}
                                    </select>
                                ) : f.type === 'entitySelect' ? (
                                    <SearchableSelect
                                        entityType={f.entityType}
                                        value={tempItem[f.key] || ''}
                                        onChange={(val, selectedData) => handleEntityChange(f, val, selectedData)}
                                        required={f.required || (typeof f.requiredIf === 'function' && f.requiredIf(tempItem))}
                                        disabled={f.disabled || f.readOnly || readOnly}
                                        optionsOverride={f.optionsOverride || []}
                                        className="w-full"
                                    />
                                ) : f.type === 'file' ? (
                                    <div>
                                        <FileUpload
                                            value={tempItem[f.key] || ''}
                                            onChange={(url) => handleChange(f.key, sanitizeForResearchKey(f.key, url, 'url'))}
                                            disabled={f.disabled || f.readOnly || readOnly}
                                            required={f.required || (typeof f.requiredIf === 'function' && f.requiredIf(tempItem))}
                                        />
                                        {f.description && (
                                            <p className="text-xs text-gray-500 mt-1 italic">{f.description}</p>
                                        )}
                                    </div>
                                ) : f.type === 'objectList' ? (
                                    <div className="border border-gray-200 rounded-lg p-3 bg-white mt-1">
                                        <div className="mb-2 text-sm font-medium text-gray-600">Items: {(tempItem[f.key] || []).length}</div>

                                        {/* List of existing sub-items */}
                                        <div className="space-y-2 mb-3">
                                            {(tempItem[f.key] || []).map((subItem, subIdx) => (
                                                <div key={subIdx} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm border border-gray-100">
                                                    <div className="truncate flex-1" title={subItem.faculty_id || subItem.user_id || subItem.student_id || ''}>
                                                        {Object.keys(subItem).map(k => subItem[k]).join(', ')}
                                                    </div>
                                                    <button
                                                        onClick={() => {
                                                            const newList = [...(tempItem[f.key] || [])];
                                                            newList.splice(subIdx, 1);
                                                            handleChange(f.key, newList);
                                                        }}
                                                        className="text-red-500 hover:text-red-700 ml-2"
                                                    >
                                                        <FiTrash2 size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Mini Form Toggle or Form */}
                                        {!activeSubForms[f.key] ? (
                                            <button
                                                type="button"
                                                onClick={() => toggleSubForm(f.key, true)}
                                                className="w-full py-2 text-sm text-indigo-700 bg-indigo-50 border border-indigo-100 rounded hover:bg-indigo-100 flex justify-center items-center"
                                            >
                                                <FiPlus className="mr-1" /> Add {f.label}
                                            </button>
                                        ) : (
                                            <div className="p-3 bg-gray-50 rounded border border-gray-200">
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="text-xs font-semibold text-gray-500 uppercase">New Item</span>
                                                    <button type="button" onClick={() => toggleSubForm(f.key, false)} className="text-gray-400 hover:text-gray-600"><FiX size={14} /></button>
                                                </div>
                                                <div className="grid grid-cols-1 gap-2 mb-2">
                                                    {f.subFields.map(subF => {
                                                        const isVisible = !subF.showIf || subF.showIf(tempSubItems[f.key] || {});
                                                        if (!isVisible) return null;
                                                        const subDefaults = (tempSubItems[f.key] || {});
                                                        const isRequired = subF.required || (typeof subF.requiredIf === 'function' && subF.requiredIf(subDefaults));
                                                        return (
                                                            <div key={subF.key}>
                                                                <label className="block text-xs font-medium text-gray-500 mb-1">
                                                                    {subF.label} {isRequired && <span className="text-red-600 ml-1">*</span>}
                                                                </label>
                                                                {subF.type === 'select' ? (
                                                                    <select
                                                                        value={subDefaults[subF.key] || ''}
                                                                        onChange={(e) => handleSubItemChange(f.key, subF.key, e.target.value)}
                                                                        disabled={subF.disabled || subF.readOnly || readOnly}
                                                                        required={isRequired}
                                                                        className="w-full text-sm border-gray-300 rounded p-1.5"
                                                                    >
                                                                        <option value="">Select...</option>
                                                                        {subF.options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                                                    </select>
                                                                ) : subF.type === 'entitySelect' ? (
                                                                    (() => {
                                                                        const currentList = tempItem[f.key] || [];
                                                                        const alreadySelected = currentList
                                                                            .map(item => item[subF.key])
                                                                            .filter(Boolean);

                                                                        return (
                                                                            <SearchableSelect
                                                                                entityType={subF.entityType}
                                                                                value={subDefaults[subF.key] || ''}
                                                                                onChange={(val, selectedData) => handleSubItemChange(f.key, subF.key, val, selectedData)}
                                                                                className="w-full"
                                                                                excludeValues={alreadySelected}
                                                                                disabled={subF.disabled || subF.readOnly || readOnly}
                                                                                required={isRequired}
                                                                            />
                                                                        );
                                                                    })()
                                                                ) : (
                                                                    <input
                                                                        type={subF.type === 'year' ? 'text' : subF.type === 'monthYear' ? 'month' : subF.type || 'text'}
                                                                        value={subF.type === 'monthYear' ? getMonthInputValue(subDefaults[subF.key]) : subDefaults[subF.key] || ''}
                                                                        onChange={(e) => {
                                                                            let inputValue = e.target.value;
                                                                            if (subF.type === 'monthYear') {
                                                                                inputValue = formatInputMonthToMonthYear(inputValue);
                                                                            } else if (subF.type === 'year') {
                                                                                inputValue = inputValue.replace(/\D/g, '').slice(0, 4);
                                                                            } else if (subF.type === 'number') {
                                                                                inputValue = inputValue.replace(/[^0-9]/g, '');
                                                                            } else if (subF.pattern === '^[0-9-]+$') {
                                                                                inputValue = inputValue.replace(/[^0-9-]/g, '');
                                                                            }
                                                                            inputValue = sanitizeForResearchKey(subF.key, inputValue, subF.type);
                                                                            handleSubItemChange(f.key, subF.key, inputValue);
                                                                        }}
                                                                        min={subF.type === 'monthYear' ? getMonthInputBoundary(subF.min, '01') : subF.min}
                                                                        max={subF.type === 'monthYear' ? getMonthInputBoundary(subF.max, '12') : subF.max}
                                                                        step={subF.step}
                                                                        inputMode={subF.inputMode}
                                                                        pattern={subF.pattern}
                                                                        maxLength={subF.maxLength}
                                                                        placeholder={subF.placeholder}
                                                                        readOnly={subF.readOnly || readOnly}
                                                                        disabled={subF.disabled || readOnly}
                                                                        required={isRequired}
                                                                        className="w-full text-sm border-gray-300 rounded p-1.5"
                                                                    />
                                                                )}
                                                            </div>
                                                        )
                                                    })}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        handleAddSubItem(f.key, f.subFields);
                                                        toggleSubForm(f.key, false); // Close form after adding
                                                    }}
                                                    className="w-full py-1 text-xs bg-indigo-100 text-indigo-700 rounded hover:bg-indigo-200 flex justify-center items-center"
                                                >
                                                    <FiPlus className="mr-1" /> Add to List
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <input
                                            type={f.type === 'year' ? 'text' : f.type === 'monthYear' ? 'month' : f.type || 'text'}
                                            value={f.type === 'monthYear' ? getMonthInputValue(tempItem[f.key]) : tempItem[f.key] || ''}
                                            onChange={(e) => {
                                                let inputValue = e.target.value;
                                                if (f.type === 'monthYear') {
                                                    inputValue = formatInputMonthToMonthYear(inputValue);
                                                } else if (f.type === 'year') {
                                                    inputValue = inputValue.replace(/\D/g, '').slice(0, 4);
                                                } else if (f.type === 'number') {
                                                    inputValue = inputValue.replace(/[^0-9]/g, '');
                                                } else if (f.pattern === '^[0-9-]+$') {
                                                    inputValue = inputValue.replace(/[^0-9-]/g, '');
                                                }
                                                inputValue = sanitizeForResearchKey(f.key, inputValue, f.type);
                                                handleChange(f.key, inputValue);
                                            }}
                                            min={f.type === 'monthYear' ? getMonthInputBoundary(f.min, '01') : f.min}
                                            max={f.type === 'monthYear' ? getMonthInputBoundary(f.max, '12') : f.max}
                                            step={f.step}
                                            inputMode={f.inputMode}
                                            pattern={f.pattern}
                                            maxLength={f.maxLength}
                                            placeholder={f.placeholder}
                                            readOnly={f.readOnly || readOnly}
                                            disabled={f.disabled || readOnly}
                                            required={f.required || (typeof f.requiredIf === 'function' && f.requiredIf(tempItem))}
                                            className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5"
                                            onBlur={() => {
                                                if (title.includes('PhD') && f.key === 'enrollment_no' && tempItem.enrollment_no) {
                                                    handleEnrollmentLookup(tempItem.enrollment_no);
                                                }
                                            }}
                                        />
                                        {title.includes('PhD') && f.key === 'enrollment_no' && (
                                            <div className="mt-1 flex justify-end">
                                                <button type="button" onClick={() => handleEnrollmentLookup(tempItem.enrollment_no)} className="px-3 py-1 text-xs text-indigo-700 bg-indigo-50 border border-indigo-200 rounded hover:bg-indigo-100">Find Student</button>
                                            </div>
                                        )}
                                        {(() => {
                                            const associatedStartKey = getAssociatedStartKey(f.key);
                                            const startValue = associatedStartKey ? tempItem[associatedStartKey] : null;
                                            const endValue = tempItem[f.key];
                                            if (associatedStartKey && startValue && endValue) {
                                                const startDate = new Date(startValue);
                                                const endDate = new Date(endValue);
                                                if (!Number.isNaN(startDate.getTime()) && !Number.isNaN(endDate.getTime()) && endDate < startDate) {
                                                    return (
                                                        <p className="text-sm text-red-600 mt-1">End date must not be earlier than start date.</p>
                                                    );
                                                }
                                            }
                                            return null;
                                        })()}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-end gap-3 mt-6">
                        <button onClick={handleCancel} className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50">Cancel</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 flex items-center">
                            <FiSave className="mr-2" /> Save Entry
                        </button>
                    </div>
                </div>
            )}

            {!isAdding && !readOnly && (
                <button
                    type="button"
                    onClick={handleStartAdd}
                    className="flex items-center justify-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                    <FiPlus className="mr-2" />
                    Add Entry
                </button>
            )}
        </div>
    );
}
