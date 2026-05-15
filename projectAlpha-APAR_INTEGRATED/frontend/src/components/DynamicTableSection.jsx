import React, { useState } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiX, FiSave } from 'react-icons/fi';
import { toast } from 'sonner';
import SearchableSelect from './SearchableSelect';
import FileUpload from './FileUpload';

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

    const handleStartAdd = () => {
        setTempItem(initialItem);
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
        setTempItem(item);
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
        const missingFields = [];
        fields.forEach(field => {
            if (field.required) {
                const val = tempItem[field.key];
                if (!val || (typeof val === 'string' && !val.trim())) {
                    missingFields.push(field.label);
                }
            }
        });

        if (missingFields.length > 0) {
            toast.error(`Please fill all required fields: ${missingFields.join(', ')}`);
            return;
        }

        if (editingIndex !== null) {
            // Updated to pass the full item to avoid partial state update race conditions
            onUpdate(editingIndex, tempItem);
        } else {
            // Add new
            onAdd(tempItem);
        }
        handleCancel();
    };

    const handleChange = (key, value) => {
        setTempItem(prev => ({ ...prev, [key]: value }));
    };

    const handleSubItemChange = (parentKey, subKey, value) => {
        setTempSubItems(prev => ({
            ...prev,
            [parentKey]: {
                ...(prev[parentKey] || {}),
                [subKey]: value
            }
        }));
    };

    const handleAddSubItem = (parentKey, subFields) => {
        const newItem = tempSubItems[parentKey] || {};
        const currentList = tempItem[parentKey] || [];

        // Check for duplicates
        // We assume uniqueness based on 'entitySelect' fields or specific ID keys
        const duplicate = currentList.some(existing => {
            return subFields.some(subF => {
                if (subF.type === 'entitySelect' && newItem[subF.key]) {
                    return existing[subF.key] === newItem[subF.key];
                }
                return false;
            });
        });

        if (duplicate) {
            alert("This entity has already been added."); // Simple feedback
            return;
        }

        // Simple validation: Ensure at least one field is filled
        if (Object.keys(newItem).length === 0) {
            return;
        }

        handleChange(parentKey, [...currentList, newItem]);

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
                <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {fields.map(f => (
                                    <th key={f.key} scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                                        {f.label} {f.required && <span className="text-red-500">*</span>}
                                    </th>
                                ))}
                                <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {data.map((item, idx) => (
                                <tr key={idx} className="hover:bg-gray-50">
                                    {fields.map(f => (
                                        <td key={f.key} className="px-4 py-4 whitespace-nowrap text-sm text-gray-700">
                                            {f.type === 'file' ? (
                                                (item[f.key] || item.link) ? (
                                                    <a href={item[f.key] || item.link} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">View File</a>
                                                ) : <span className="text-gray-400">No file</span>
                                            ) : f.type === 'date' ? (
                                                item[f.key] ? new Date(item[f.key]).toLocaleDateString() : ''
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
            )}

            {/* Add/Edit Form */}
            {isAdding && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-bold text-gray-800 mb-4">{editingIndex !== null ? 'Edit Entry' : 'Add New Entry'}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {fields.map(f => (
                            <div key={f.key} className={f.fullWidth ? "md:col-span-2" : ""}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    {f.label} {f.required && <span className="text-red-600">*</span>}
                                </label>
                                {f.type === 'textarea' ? (
                                    <textarea
                                        rows={3}
                                        value={tempItem[f.key] || ''}
                                        onChange={(e) => handleChange(f.key, e.target.value)}
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5"
                                    />
                                ) : f.type === 'select' ? (
                                    <select
                                        value={tempItem[f.key] || ''}
                                        onChange={(e) => handleChange(f.key, e.target.value)}
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5"
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
                                        onChange={(val) => handleChange(f.key, val)}
                                        className="w-full"
                                    />
                                ) : f.type === 'file' ? (
                                    <div>
                                        <FileUpload
                                            value={tempItem[f.key] || ''}
                                            onChange={(url) => handleChange(f.key, url)}
                                            disabled={false}
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
                                                        return (
                                                            <div key={subF.key}>
                                                                <label className="block text-xs font-medium text-gray-500 mb-1">{subF.label}</label>
                                                                {subF.type === 'select' ? (
                                                                    <select
                                                                        value={(tempSubItems[f.key] || {})[subF.key] || ''}
                                                                        onChange={(e) => handleSubItemChange(f.key, subF.key, e.target.value)}
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
                                                                                value={(tempSubItems[f.key] || {})[subF.key] || ''}
                                                                                onChange={(val) => handleSubItemChange(f.key, subF.key, val)}
                                                                                className="w-full"
                                                                                excludeValues={alreadySelected}
                                                                            />
                                                                        );
                                                                    })()
                                                                ) : (
                                                                    <input
                                                                        type="text"
                                                                        value={(tempSubItems[f.key] || {})[subF.key] || ''}
                                                                        onChange={(e) => handleSubItemChange(f.key, subF.key, e.target.value)}
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
                                    <input
                                        type={f.type || 'text'}
                                        value={tempItem[f.key] || ''}
                                        onChange={(e) => handleChange(f.key, e.target.value)}
                                        className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5"
                                    />
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
