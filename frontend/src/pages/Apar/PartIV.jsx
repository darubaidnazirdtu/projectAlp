import React from 'react';
import { FiCheckCircle, FiInfo } from 'react-icons/fi';
import DynamicTableSection from '../../components/DynamicTableSection';

export default function PartIV({ formData, addItem, removeItem, updateArrayItem, updateField, readOnly }) {
    const corporate = formData.corporate || {};

    // Helper handlers generator for DynamicTableSection
    const createHandlers = (category, field) => ({
        onAdd: (item) => addItem(category, field, item),
        onUpdate: (index, newItem) => updateArrayItem(category, field, index, newItem),
        onRemove: removeItem ? (index) => removeItem(category, field, index) : undefined
    });

    return (
        <div className="p-2 space-y-8">
            
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4">
                <div>
                    <h3 className="text-xl font-bold text-gray-800 flex items-center">
                        <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg mr-3">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                        </span>
                        PART IV - CONTRIBUTION TO INSTITUTE CORPORATE LIFE
                    </h3>
                    {!readOnly && (
                        <p className="text-sm text-gray-500 mt-2 flex items-center">
                            <FiInfo className="mr-1.5" /> Please provide details for applicable contributions. At least one entry is expected.
                        </p>
                    )}
                </div>
            </div>

            <div className="space-y-6">
                <DynamicTableSection
                    title="1.1 Curriculum Development"
                    data={corporate.curriculum_development || []}
                    uniqueKey="description"
                    {...createHandlers('corporate', 'curriculum_development')}
                    readOnly={readOnly}
                    initialItem={{ description: '' }}
                    fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Details of curriculum development...' }]}
                />

                <DynamicTableSection
                    title="1.2 Course Development OR Courses Developed"
                    data={corporate.course_development_details || []}
                    uniqueKey="description"
                    {...createHandlers('corporate', 'course_development_details')}
                    readOnly={readOnly}
                    initialItem={{ description: '' }}
                    fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Details of courses development/revised...' }]}
                />

                <DynamicTableSection
                    title="2.1 Laboratory Development and experimental set up"
                    data={corporate.lab_development || []}
                    uniqueKey="description"
                    {...createHandlers('corporate', 'lab_development')}
                    readOnly={readOnly}
                    initialItem={{ description: '' }}
                    fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Describe laboratory development and experimental setup...' }]}
                />

                <DynamicTableSection
                    title="3.1 Cultural / Extracurricular Activities"
                    data={corporate.cultural_activities || []}
                    uniqueKey="description"
                    {...createHandlers('corporate', 'cultural_activities')}
                    readOnly={readOnly}
                    initialItem={{ description: '' }}
                    fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Details of cultural or extracurricular activities...' }]}
                />

                <DynamicTableSection
                    title="3.2 Sports / Community / Extension Services / N.S.S"
                    data={corporate.sports_community || []}
                    uniqueKey="description"
                    {...createHandlers('corporate', 'sports_community')}
                    readOnly={readOnly}
                    initialItem={{ description: '' }}
                    fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Details of sports or community extension services...' }]}
                />

                <DynamicTableSection
                    title="3.3 Administrative Assignment (University Level)"
                    data={corporate.admin_assignment_university || []}
                    uniqueKey="description"
                    {...createHandlers('corporate', 'admin_assignment_university')}
                    readOnly={readOnly}
                    initialItem={{ description: '' }}
                    fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'e.g., Dean, Committee Chair...' }]}
                />

                <DynamicTableSection
                    title="3.4 Administrative Assignment (Department Level)"
                    data={corporate.admin_assignment_department || []}
                    uniqueKey="description"
                    {...createHandlers('corporate', 'admin_assignment_department')}
                    readOnly={readOnly}
                    initialItem={{ description: '' }}
                    fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'e.g., Head of Department, Coordinator...' }]}
                />

                <DynamicTableSection
                    title="3.5 Administrative Assignment (External)"
                    data={corporate.admin_assignment_external || []}
                    uniqueKey="description"
                    {...createHandlers('corporate', 'admin_assignment_external')}
                    readOnly={readOnly}
                    initialItem={{ description: '' }}
                    fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'e.g., External Examiner, Board Member...' }]}
                />

                <DynamicTableSection
                    title="3.6 Any Other"
                    data={corporate.any_other || []}
                    uniqueKey="description"
                    {...createHandlers('corporate', 'any_other')}
                    readOnly={readOnly}
                    initialItem={{ description: '' }}
                    fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Any other institutional contributions...' }]}
                />
            </div>

            {/* Certification footer */}
            <div className={`flex items-center gap-4 border p-4 rounded-lg transition-colors ${corporate.certify === 'true' || corporate.certify === true ? 'bg-green-50 border-green-200' : 'bg-indigo-50 border-indigo-200'}`}>
                <div className="flex items-center h-5">
                    <input
                        id="certify"
                        name="certify"
                        type="checkbox"
                        disabled={readOnly}
                        required={!readOnly}
                        aria-required={!readOnly}
                        checked={corporate.certify === 'true' || corporate.certify === true}
                        onChange={(e) => updateField('corporate', 'certify', e.target.checked ? 'true' : '')}
                        className="focus:ring-indigo-500 h-5 w-5 text-indigo-600 border-gray-300 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                </div>
                <div className="text-sm flex items-center">
                    <label htmlFor="certify" className="font-medium text-gray-900 cursor-pointer select-none">
                        I certify that the information given above is correct and factual to the best of my knowledge
                        {!readOnly && <span className="text-red-500 ml-1" title="Required">*</span>}
                    </label>
                    {(corporate.certify === 'true' || corporate.certify === true) && (
                        <FiCheckCircle className="ml-2 text-green-600" size={18} />
                    )}
                </div>
            </div>
        </div>
    );
}
