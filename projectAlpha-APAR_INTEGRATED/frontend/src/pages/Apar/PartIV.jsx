import React from 'react';

export default function PartIV({ formData, updateField, readOnly }) {
    const corporate = formData.corporate || {};
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-8">
            <h3 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4">PART IV - CONTRIBUTION TO INSTITUTE CORPORATE LIFE</h3>

            {/* Box: 1 a) and 1 b) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1(a) */}
                <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                    1) a) Curriculum Development
                </label>

                <input
                    type="text"
                    disabled={readOnly}
                    value={corporate.curriculum_development || ''}
                    onChange={(e) =>
                    updateField(
                        'corporate',
                        'curriculum_development',
                        e.target.value
                    )
                    }
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    placeholder="Curriculum Development"
                />
                </div>

                {/* 1(b) */}
                <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                    1) b) Courses Development
                </label>

                <input
                    type="text"
                    disabled={readOnly}
                    value={corporate.course_development_details || ''}
                    onChange={(e) =>
                    updateField(
                        'corporate',
                        'course_development_details',
                        e.target.value
                    )
                    }
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    placeholder="Details of courses development/revised"
                />
                </div>

            </div>
            </div>

            {/* 2) Laboratory Development */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">2) Laboratory Development and experimental set up</label>
                <textarea rows={4} disabled={readOnly} value={corporate.lab_development || ''} onChange={(e) => updateField('corporate', 'lab_development', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-50 disabled:text-gray-500 transition-colors" placeholder="Describe laboratory development and experimental setup"></textarea>
            </div>

            {/* Box: 3 a)-d) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <div className="grid grid-cols-1 gap-6">

                {/* 3(a) */}
                <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                    3) a) Cultural / Extracurricular Activities
                </label>

                <input
                    type="text"
                    disabled={readOnly}
                    value={corporate.cultural_activities || ''}
                    onChange={(e) =>
                    updateField(
                        'corporate',
                        'cultural_activities',
                        e.target.value
                    )
                    }
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    placeholder="Cultural/extracurricular activities"
                />
                </div>

                {/* 3(b) */}
                <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                    3) b) Sports / Community / Extension Services / N.S.S
                </label>

                <input
                    type="text"
                    disabled={readOnly}
                    value={corporate.sports_community || ''}
                    onChange={(e) =>
                    updateField(
                        'corporate',
                        'sports_community',
                        e.target.value
                    )
                    }
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    placeholder="Sports/Community and Extension services/N.S.S"
                />
                </div>

                {/* 3(c) */}
                <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                    3) c) Administrative Assignment
                </label>

                <input
                    type="text"
                    disabled={readOnly}
                    value={corporate.admin_assignment || ''}
                    onChange={(e) =>
                    updateField(
                        'corporate',
                        'admin_assignment',
                        e.target.value
                    )
                    }
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    placeholder="Administrative Assignment"
                />
                </div>

                {/* 3(d) */}
                <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-gray-700">
                    3) d) Any Other
                </label>

                <input
                    type="text"
                    disabled={readOnly}
                    value={corporate.any_other || ''}
                    onChange={(e) =>
                    updateField(
                        'corporate',
                        'any_other',
                        e.target.value
                    )
                    }
                    className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
                    placeholder="Any other"
                />
                </div>

            </div>
            </div>

            {/* Certification footer */}
            <div className="flex items-center gap-4 bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
                <div className="flex items-center h-5">
                    <input id="certify" type="checkbox" disabled={readOnly} checked={!!corporate.certify} onChange={(e) => updateField('corporate', 'certify', e.target.checked)} className="focus:ring-indigo-500 h-5 w-5 text-indigo-600 border-gray-300 rounded" />
                </div>
                <div className="text-sm">
                    <label htmlFor="certify" className="font-medium text-indigo-900">I certify that the information's given above are correct and factual to the best of my knowledge</label>
                </div>
            </div>
        </div>
    );
}
