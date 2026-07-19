import React from 'react';
import { toast } from 'sonner';
import SearchableSelect from './SearchableSelect';

// Upgraded InputField with Number Validation & Min/Max bounds
const InputField = ({ label, name, type = 'text', placeholder, value, onChange, required, min, max, disabled, className }) => {
    // Prevent typing 'e', '+', '-' in number fields
    const handleKeyDown = (e) => {
        if (type === 'number' && ['e', 'E', '+', '-'].includes(e.key)) {
            e.preventDefault();
        }
    };

    return (
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
                onKeyDown={handleKeyDown}
                required={required}
                min={min}
                max={max}
                disabled={disabled}
                className={className || "w-full h-12 px-4 bg-gray-50/50 border border-gray-200/60 rounded-xl focus:outline-none transition-all duration-300 hover:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-sm hover:shadow-md"}
            />
        </div>
    );
};

const ListField = ({ label, name, values, onChange, disabled }) => {
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
                        disabled={disabled}
                        className="w-full h-12 px-4 bg-gray-50/50 border border-gray-200/60 rounded-xl focus:outline-none transition-all duration-300 hover:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-sm hover:shadow-md"
                    />
                    {!disabled && (
                        <button type="button" onClick={() => handleRemoveItem(index)} className="ml-2 text-red-500">Remove</button>
                    )}
                </div>
            ))}
            {!disabled && (
                <button type="button" onClick={handleAddItem} className="text-indigo-600">Add Item</button>
            )}
        </div>
    );
};

const ObjectListField = ({ label, name, values = [], subFields = [], onChange, disabled }) => {
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
                {!disabled && (
                    <button
                        type="button"
                        onClick={handleAddItem}
                        className="flex items-center space-x-2 px-3 py-1 bg-green-600 text-white rounded text-sm"
                    >
                        <span>+ Add Item</span>
                    </button>
                )}
            </div>

            {values.length === 0 && <div className="text-gray-500 mb-4 text-sm">No items added.</div>}

            <div className="space-y-4">
                {values.map((item, index) => (
                    <div key={index} className="flex flex-wrap gap-4 p-4 bg-white/60 border border-indigo-100/60 rounded-xl shadow-sm backdrop-blur-sm items-start relative pr-10 shadow-sm">
                        {/* Remove Button */}
                        {!disabled && (
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
                        )}

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
                                            required={field.required}
                                            disabled={disabled}
                                            className="w-full h-11 px-3 bg-white border border-gray-300 rounded-md focus:outline-none transition-all duration-300 hover:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-sm hover:shadow-md text-sm"
                                        >
                                            <option value="" disabled>{field.placeholder || 'Select...'}</option>
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
                                                disabled={disabled}
                                            />
                                        </div>
                                    </div>
                                );
                            }

                            return (
                                <div key={field.accessor} className="flex-1 min-w-[200px]">
                                    <label className="block text-sm font-semibold mb-1 text-gray-700">{field.header}</label>
                                    <input
                                        className="w-full h-11 px-3 bg-white border border-gray-300 rounded-md focus:outline-none transition-all duration-300 hover:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-sm hover:shadow-md text-sm"
                                        name={`${name}_${index}_${field.accessor}`}
                                        type={field.type || 'text'}
                                        placeholder={field.placeholder || ''}
                                        value={item[field.accessor] || ''}
                                        onChange={(e) => handleItemChange(index, field.accessor, e.target.value)}
                                        disabled={disabled}
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

export default function DynamicForm({ resource, formData, onChange, files = {}, onFileChange = () => {}, hideFileUploads = false }) {
    const getDateBounds = () => {
        const ay = formData.academic_year;
        if (!ay) return { min: undefined, max: undefined };
        
        const startYear = parseInt(ay.substring(0, 4));
        return { 
            min: `${startYear}-07-01`, 
            max: `${startYear + 1}-06-30` 
        };
    };

    const renderField = (col) => {
        const isDisabled = false;
        const dateBounds = col.type === 'date' ? getDateBounds() : {};

        const commonProps = {
            name: col.accessor,
            onChange,
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
                        <div className={`flex items-center h-12 px-4 bg-gray-50/50 border border-gray-200/60 rounded-xl ${isDisabled ? 'opacity-50 pointer-events-none' : ''}`}>
                            <input
                                type="checkbox"
                                name={col.accessor}
                                id={col.accessor}
                                checked={formData[col.accessor] || false}
                                onChange={(e) => onChange({ target: { name: col.accessor, type: 'checkbox', checked: e.target.checked }})}
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
                        <select {...commonProps} value={formData[col.accessor] || ''} className="w-full h-12 px-4 bg-gray-50/50 border border-gray-200/60 rounded-xl focus:outline-none transition-all duration-300 hover:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-sm hover:shadow-md disabled:opacity-50 disabled:bg-gray-200">
                            <option value="" disabled>{col.placeholder || 'Select...'}</option>
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
                            className="w-full px-4 py-2 bg-gray-50/50 border border-gray-200/60 rounded-xl focus:outline-none transition-all duration-300 hover:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-sm hover:shadow-md disabled:opacity-50 disabled:bg-gray-200"
                        />
                    </div>
                );
            case 'hyperlink':
                if (col.fileKey) {
                    if (hideFileUploads) {
                        return null; // Skip rendering file inputs entirely
                    }
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
                                onChange={onFileChange}
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
                        className={`w-full h-12 px-4 bg-gray-50/50 border border-gray-200/60 rounded-xl focus:outline-none transition-all duration-300 hover:border-indigo-300 focus:bg-white focus:outline-none focus:ring-4 focus:ring-indigo-500/20 shadow-sm hover:shadow-md ${isDisabled ? 'opacity-50 bg-gray-200 cursor-not-allowed' : ''}`}
                    />
                );
            case 'list':
                return (
                    <ListField
                        label={col.header}
                        name={col.accessor}
                        values={formData[col.accessor]}
                        onChange={onChange}
                        disabled={isDisabled}
                    />
                );
            case 'objectList':
                return (
                    <ObjectListField
                        label={col.header}
                        name={col.accessor}
                        values={formData[col.accessor] || []}
                        subFields={col.subFields || []}
                        onChange={onChange}
                        disabled={isDisabled}
                    />
                );
            case 'entitySelect':
                return (
                    <SearchableSelect
                        entityType={col.entityType}
                        value={formData[col.accessor] || ''}
                        onChange={(value) => onChange({ target: { name: col.accessor, value } })}
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
                        min={col.type === 'date' ? dateBounds.min : (col.type === 'number' ? 0 : undefined)}
                        max={col.type === 'date' ? dateBounds.max : undefined}
                        {...commonProps}
                    />
                );
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {resource.columns
                .filter(col => !col.hideInForm)
                .map(col => {
                    const rendered = renderField(col);
                    if (!rendered) return null;
                    return <div key={col.accessor}>{rendered}</div>;
                })}
        </div>
    );
}
