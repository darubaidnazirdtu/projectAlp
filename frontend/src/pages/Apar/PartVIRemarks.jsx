import React from 'react';

export default function PartVI_Remarks({ formData, updateRemarks, formStatus }) {
    const isDisabled = formStatus !== 'Forwarded by Reporting officer';
    const requiredProps = !isDisabled ? { required: true, 'aria-required': 'true' } : {};

    return (
        <div className="p-2 space-y-8">
            <div className="border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg mr-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path></svg>
                    </span>
                    Part VII – REMARKS OF THE REVIEWING OFFICER
                </h3>
            </div>

            <fieldset disabled={isDisabled}>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">1. LENGTH OF SERVICE UNDER THE REVIEWING OFFICER</label>
                        <input {...requiredProps} type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 transition-colors" value={formData.remarks.length_of_service} onChange={(e) => updateRemarks('length_of_service', e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">2. IS THE REVIEWING OFFICER SATISFIED THAT THE REPORTING OFFICER HAS MADE HIS/HER REPORT WITH DUE CARE AND ATTENTION?</label>
                        <textarea {...requiredProps} rows="3" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 transition-colors" value={formData.remarks.satisfied_with_reporting} onChange={(e) => updateRemarks('satisfied_with_reporting', e.target.value)}></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">3. DO YOU AGREE WITH THE ASSESSMENT OF THE OFFICER GIVEN BY THE REPORTING OFFICER?</label>
                        <select {...requiredProps} className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 mb-2 transition-colors" value={formData.remarks.agree_with_assessment} onChange={(e) => updateRemarks('agree_with_assessment', e.target.value)}>
                            <option>Yes</option>
                            <option>No</option>
                        </select>
                        {formData.remarks.agree_with_assessment === 'No' && (
                            <textarea {...requiredProps} placeholder="Please specify reasons for disagreement..." rows="3" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 mt-2 transition-colors" value={formData.remarks.disagreement_reason} onChange={(e) => updateRemarks('disagreement_reason', e.target.value)}></textarea>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">4. GENERAL REMARKS WITH SPECIFIC COMMENTS</label>
                        <textarea {...requiredProps} rows="4" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 transition-colors" value={formData.remarks.general_remarks} onChange={(e) => updateRemarks('general_remarks', e.target.value)}></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">5. HAS THE OFFICER ANY SPECIFIC CHARACTERISTICS/ABILITIES FOR SPECIAL ASSIGNMENT/PROMOTION?</label>
                        <textarea {...requiredProps} rows="4" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 transition-colors" value={formData.remarks.specific_characteristics} onChange={(e) => updateRemarks('specific_characteristics', e.target.value)}></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Signature Place</label>
                            <input {...requiredProps} type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 transition-colors" value={formData.remarks.signature_place || ''} onChange={(e) => updateRemarks('signature_place', e.target.value)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input {...requiredProps} type="date" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 transition-colors" value={formData.remarks.signature_date || ''} onChange={(e) => updateRemarks('signature_date', e.target.value)} />
                        </div>
                    </div>
                </div>
            </fieldset>
        </div>
    );
}
