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
import { toast } from 'sonner';
console.log("dtu college")

const InputField = ({ label, name, type = 'text', placeholder, value, onChange, required }) => (
    <div>
        {label && (
            <label className="block text-sm font-semibold mb-2 text-gray-700">
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
            className="w-full h-12 px-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
    </div>
);

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
                        className="w-full h-12 px-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
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

                            return (
                                <div key={field.accessor} className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-semibold mb-1 text-gray-700">{field.header}</label>
                                    <input
                                        className="w-full h-11 px-3 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                        name={`${name}_${index}_${field.accessor}`}
                                        type={field.type || 'text'}
                                        placeholder={field.placeholder || ''}
                                        value={item[field.accessor] || ''}
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

const AddPage = () => {
    const { resourceId } = useParams();
    const [searchParams] = useSearchParams();
    const editMode = searchParams.get('edit') === 'true';
    const editId = searchParams.get('id');
    const resource = resourceMap.get(resourceId);

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

                            setFormData({ ...initialData, ...data });
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
                    setFormData(initialData);
                }
            };

            loadData();
        }
    }, [resource, role, user, editMode, editId]);

    if (!resource) {
        return <NotFound />;
    }

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (Array.isArray(value)) {
            setFormData(prev => ({ ...prev, [name]: value }));
        } else {
            setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
        }
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        setFiles(prev => ({ ...prev, [name]: files[0] }));
    };

    const navigate = useNavigate(); // Hook for navigation

    const handleSubmit = async (e, forceCreate = false) => {
        if (e) e.preventDefault();
        setError(null);
        setSuccess(null);
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
                    if (column.type === 'number') {
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
                setFiles({});
                setFormData(getInitialFormData(resource));
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
        const isDisabled = false; // All fields are always editable (department_id is pre-filled for HODs but editable)

        const commonProps = {
            name: col.accessor,
            onChange: handleChange,
            placeholder: col.placeholder || '',
            required: col.required || false,
            disabled: isDisabled
        };

        switch (col.type) {
            case 'boolean':
                return (
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            {col.header}
                            {col.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <div className={`flex items-center h-12 px-4 bg-gray-100 rounded-lg ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
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
                return (
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            {col.header}
                            {col.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <select {...commonProps} value={formData[col.accessor] || ''} className="w-full h-12 px-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-gray-200">
                            <option value="">{col.placeholder || 'Select...'}</option>
                            {col.options?.map(option => (
                                <option key={option.value || option} value={option.value || option}>
                                    {option.label || option}
                                </option>
                            ))}
                        </select>
                    </div>
                );
            case 'textarea':
                return (
                    <div>
                        <label className="block text-sm font-semibold mb-2 text-gray-700">
                            {col.header}
                            {col.required && <span className="text-red-500 ml-1">*</span>}
                        </label>
                        <textarea
                            {...commonProps}
                            value={formData[col.accessor] || ''}
                            rows={col.rows || 3}
                            className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 disabled:bg-gray-200"
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
                        value={formData[col.accessor] || ''}
                        required={col.required}
                        {...commonProps}
                        className={`w-full h-12 px-4 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 ${isDisabled ? 'opacity-50 bg-gray-200 cursor-not-allowed' : ''}`}
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
                return (
                    <SearchableSelect
                        entityType={col.entityType}
                        value={formData[col.accessor] || ''}
                        onChange={(value) => handleChange({ target: { name: col.accessor, value } })}
                        required={col.required}
                        label={col.header}
                        disabled={isDisabled}
                    />
                );
            default:
                return (
                    <InputField
                        label={col.header}
                        type={col.type || 'text'}
                        value={formData[col.accessor] || ''}
                        required={col.required}
                        {...commonProps}
                    />
                );
        }
    };

    return (
        <div>
            <h1 className="text-4xl font-bold mb-8">{editMode ? `Edit ${resource.title}` : resource.addLabel}</h1>
            <div className="p-8 bg-white rounded-lg shadow-md">
                {success && <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-800 rounded">{success}</div>}
                {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-800 rounded">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {resource.columns
                            .filter(col => !col.hideInForm) // Exclude columns hidden from form
                            .map(col => (
                                col.accessor && <div key={col.accessor}>{renderField(col)}</div>
                            ))}
                    </div>
                    <div className="flex justify-end space-x-4 mt-8">
                        <Link
                            to={resource.tablePath}
                            className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                        >
                            <FiX />
                            <span>Cancel</span>
                        </Link>
                        <button
                            type="submit"
                            className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <FiLoader className="animate-spin" />
                                    <span>{editMode ? 'Updating...' : 'Saving...'}</span>
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
