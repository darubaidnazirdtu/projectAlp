// import React from 'react';

// export default function PartIV({ formData, updateField, readOnly }) {
//     const corporate = formData.corporate || {};
//     return (
//         <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-8">
//             <h3 className="text-xl font-bold text-gray-800 border-b border-gray-100 pb-4">PART IV - CONTRIBUTION TO INSTITUTE CORPORATE LIFE</h3>

//             {/* Box: 1 a) and 1 b) */}
//             <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

//                 {/* 1(a) */}
//                 <div className="flex flex-col gap-2">
//                 <label className="text-sm font-semibold text-gray-700">
//                     1) a) Curriculum Development
//                 </label>

//                 <input
//                     type="text"
//                     disabled={readOnly}
//                     value={corporate.curriculum_development || ''}
//                     onChange={(e) =>
//                     updateField(
//                         'corporate',
//                         'curriculum_development',
//                         e.target.value
//                     )
//                     }
//                     className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
//                     placeholder="Curriculum Development"
//                 />
//                 </div>

//                 {/* 1(b) */}
//                 <div className="flex flex-col gap-2">
//                 <label className="text-sm font-semibold text-gray-700">
//                     1) b) Courses Development
//                 </label>

//                 <input
//                     type="text"
//                     disabled={readOnly}
//                     value={corporate.course_development_details || ''}
//                     onChange={(e) =>
//                     updateField(
//                         'corporate',
//                         'course_development_details',
//                         e.target.value
//                     )
//                     }
//                     className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
//                     placeholder="Details of courses development/revised"
//                 />
//                 </div>

//             </div>
//             </div>

//             {/* 2) Laboratory Development */}
//             <div>
//                 <label className="block text-sm font-medium text-gray-700 mb-2">2) Laboratory Development and experimental set up</label>
//                 <textarea rows={4} disabled={readOnly} value={corporate.lab_development || ''} onChange={(e) => updateField('corporate', 'lab_development', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-50 disabled:text-gray-500 transition-colors" placeholder="Describe laboratory development and experimental setup"></textarea>
//             </div>

//             {/* Box: 3 a)-d) */}
//             <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
//             <div className="grid grid-cols-1 gap-6">

//                 {/* 3(a) */}
//                 <div className="flex flex-col gap-2">
//                 <label className="text-sm font-semibold text-gray-700">
//                     3) a) Cultural / Extracurricular Activities
//                 </label>

//                 <input
//                     type="text"
//                     disabled={readOnly}
//                     value={corporate.cultural_activities || ''}
//                     onChange={(e) =>
//                     updateField(
//                         'corporate',
//                         'cultural_activities',
//                         e.target.value
//                     )
//                     }
//                     className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
//                     placeholder="Cultural/extracurricular activities"
//                 />
//                 </div>

//                 {/* 3(b) */}
//                 <div className="flex flex-col gap-2">
//                 <label className="text-sm font-semibold text-gray-700">
//                     3) b) Sports / Community / Extension Services / N.S.S
//                 </label>

//                 <input
//                     type="text"
//                     disabled={readOnly}
//                     value={corporate.sports_community || ''}
//                     onChange={(e) =>
//                     updateField(
//                         'corporate',
//                         'sports_community',
//                         e.target.value
//                     )
//                     }
//                     className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
//                     placeholder="Sports/Community and Extension services/N.S.S"
//                 />
//                 </div>

//                 {/* 3(c) */}
//                 <div className="flex flex-col gap-2">
//                 <label className="text-sm font-semibold text-gray-700">
//                     3) c) Administrative Assignment
//                 </label>

//                 <input
//                     type="text"
//                     disabled={readOnly}
//                     value={corporate.admin_assignment || ''}
//                     onChange={(e) =>
//                     updateField(
//                         'corporate',
//                         'admin_assignment',
//                         e.target.value
//                     )
//                     }
//                     className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
//                     placeholder="Administrative Assignment"
//                 />
//                 </div>

//                 {/* 3(d) */}
//                 <div className="flex flex-col gap-2">
//                 <label className="text-sm font-semibold text-gray-700">
//                     3) d) Any Other
//                 </label>

//                 <input
//                     type="text"
//                     disabled={readOnly}
//                     value={corporate.any_other || ''}
//                     onChange={(e) =>
//                     updateField(
//                         'corporate',
//                         'any_other',
//                         e.target.value
//                     )
//                     }
//                     className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-50 disabled:text-gray-500 transition-colors"
//                     placeholder="Any other"
//                 />
//                 </div>

//             </div>
//             </div>

//             {/* Certification footer */}
//             <div className="flex items-center gap-4 bg-indigo-50 border border-indigo-100 p-4 rounded-lg">
//                 <div className="flex items-center h-5">
//                     <input id="certify" type="checkbox" disabled={readOnly} checked={!!corporate.certify} onChange={(e) => updateField('corporate', 'certify', e.target.checked)} className="focus:ring-indigo-500 h-5 w-5 text-indigo-600 border-gray-300 rounded" />
//                 </div>
//                 <div className="text-sm">
//                     <label htmlFor="certify" className="font-medium text-indigo-900">I certify that the information's given above are correct and factual to the best of my knowledge</label>
//                 </div>
//             </div>
//         </div>
//     );
// }


import React, { useMemo } from 'react';
import { FiAward, FiCheckCircle } from 'react-icons/fi';

export default function PartIV({ formData, updateField, readOnly }) {
    const corporate = formData.corporate || {};

    // ==========================================
    // Gamification: Corporate Impact Score
    // ==========================================
    const currentScore = useMemo(() => {
        let score = 0;
        
        // Award 15-20 points for each section they contributed to (must be > 10 chars)
        if (corporate.curriculum_development?.trim().length > 10) score += 15;
        if (corporate.course_development_details?.trim().length > 10) score += 15;
        if (corporate.lab_development?.trim().length > 10) score += 20; // Lab dev is high effort
        if (corporate.cultural_activities?.trim().length > 10) score += 15;
        if (corporate.sports_community?.trim().length > 10) score += 15;
        if (corporate.admin_assignment?.trim().length > 10) score += 20; // Admin is high effort

        return Math.min(score, 100); // Cap at 100
    }, [corporate]);

    const getScoreColor = () => {
        if (currentScore >= 70) return 'bg-green-100 text-green-800 border-green-200';
        if (currentScore >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-gray-100 text-gray-800 border-gray-200';
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-8">
            
            {/* Header & Score Badge */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-800">PART IV - CONTRIBUTION TO INSTITUTE CORPORATE LIFE</h3>
                <div className={`mt-4 md:mt-0 flex items-center px-4 py-2 rounded-full border ${getScoreColor()} shadow-sm transition-all duration-300`}>
                    <FiAward className="mr-2 text-lg" />
                    <span className="font-semibold text-sm">
                        Corporate Impact Score: {currentScore} / 100
                    </span>
                </div>
            </div>

            {/* Box: 1 a) and 1 b) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 1(a) - Changed to Textarea */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="curr-dev" className="text-sm font-semibold text-gray-700">1) a) Curriculum Development</label>
                        <textarea id="curr-dev" rows="3" disabled={readOnly} value={corporate.curriculum_development || ''} onChange={(e) => updateField('corporate', 'curriculum_development', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-200 disabled:text-gray-500 transition-colors" placeholder="Details of curriculum development..."></textarea>
                    </div>

                    {/* 1(b) - Changed to Textarea */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="course-dev" className="text-sm font-semibold text-gray-700">1) b) Courses Development</label>
                        <textarea id="course-dev" rows="3" disabled={readOnly} value={corporate.course_development_details || ''} onChange={(e) => updateField('corporate', 'course_development_details', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-200 disabled:text-gray-500 transition-colors" placeholder="Details of courses development/revised..."></textarea>
                    </div>
                </div>
            </div>

            {/* 2) Laboratory Development */}
            <div>
                <label htmlFor="lab-dev" className="block text-sm font-medium text-gray-700 mb-2">2) Laboratory Development and experimental set up</label>
                <textarea id="lab-dev" rows={4} disabled={readOnly} value={corporate.lab_development || ''} onChange={(e) => updateField('corporate', 'lab_development', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-50 disabled:text-gray-500 transition-colors" placeholder="Describe laboratory development and experimental setup..."></textarea>
            </div>

            {/* Box: 3 a)-d) */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 3(a) - Changed to Textarea */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="cultural" className="text-sm font-semibold text-gray-700">3) a) Cultural / Extracurricular Activities</label>
                        <textarea id="cultural" rows="3" disabled={readOnly} value={corporate.cultural_activities || ''} onChange={(e) => updateField('corporate', 'cultural_activities', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-200 disabled:text-gray-500 transition-colors" placeholder="Details of cultural or extracurricular activities..."></textarea>
                    </div>

                    {/* 3(b) - Changed to Textarea */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="sports" className="text-sm font-semibold text-gray-700">3) b) Sports / Community / Extension Services / N.S.S</label>
                        <textarea id="sports" rows="3" disabled={readOnly} value={corporate.sports_community || ''} onChange={(e) => updateField('corporate', 'sports_community', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-200 disabled:text-gray-500 transition-colors" placeholder="Details of sports or community extension services..."></textarea>
                    </div>

                    {/* 3(c) - Changed to Textarea */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="admin" className="text-sm font-semibold text-gray-700">3) c) Administrative Assignment</label>
                        <textarea id="admin" rows="3" disabled={readOnly} value={corporate.admin_assignment || ''} onChange={(e) => updateField('corporate', 'admin_assignment', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-200 disabled:text-gray-500 transition-colors" placeholder="e.g., Head of Department, Warden, Committee Chair..."></textarea>
                    </div>

                    {/* 3(d) - Changed to Textarea */}
                    <div className="flex flex-col gap-2">
                        <label htmlFor="other" className="text-sm font-semibold text-gray-700">3) d) Any Other</label>
                        <textarea id="other" rows="3" disabled={readOnly} value={corporate.any_other || ''} onChange={(e) => updateField('corporate', 'any_other', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-200 disabled:text-gray-500 transition-colors" placeholder="Any other institutional contributions..."></textarea>
                    </div>
                </div>
            </div>

            {/* Certification footer - BUG FIXED */}
            <div className={`flex items-center gap-4 border p-4 rounded-lg transition-colors ${corporate.certify === 'true' ? 'bg-green-50 border-green-200' : 'bg-indigo-50 border-indigo-100'}`}>
                <div className="flex items-center h-5">
                    {/* Send explicit string 'true' or '' instead of boolean to avoid DB cast issues */}
                    <input 
                        id="certify" 
                        type="checkbox" 
                        disabled={readOnly} 
                        checked={corporate.certify === 'true' || corporate.certify === true} 
                        onChange={(e) => updateField('corporate', 'certify', e.target.checked ? 'true' : '')} 
                        className="focus:ring-indigo-500 h-5 w-5 text-indigo-600 border-gray-300 rounded cursor-pointer" 
                    />
                </div>
                <div className="text-sm flex items-center">
                    <label htmlFor="certify" className="font-medium text-indigo-900 cursor-pointer select-none">
                        I certify that the information's given above are correct and factual to the best of my knowledge
                    </label>
                    {corporate.certify === 'true' && <FiCheckCircle className="ml-2 text-green-600" />}
                </div>
            </div>
        </div>
    );
}
