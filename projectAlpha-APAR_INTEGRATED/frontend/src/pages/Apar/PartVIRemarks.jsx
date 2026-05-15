import React from 'react';

export default function PartVI_Remarks({ formData, updateRemarks, formStatus }) {
    const isForwarded = formStatus === 'Accepted by Reviewing officer';

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-8">
            <div className="border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-800">Part VII – REMARKS OF THE REVIEWING OFFICER</h3>
            </div>

            <fieldset disabled={isForwarded}>
                <div className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">1. Length of service under the Reviewing Officer</label>
                        <input type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 transition-colors" value={formData.remarks.length_of_service} onChange={(e) => updateRemarks('length_of_service', e.target.value)} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">2. Is the Reviewing Officer satisfied that the Reporting Officer has made his/ her report with due care and attention?</label>
                        <textarea rows="3" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 transition-colors" value={formData.remarks.satisfied_with_reporting} onChange={(e) => updateRemarks('satisfied_with_reporting', e.target.value)}></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">3. Do you agree with the assessment of the officer given by the Reporting Officer?</label>
                        <select className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 mb-2 transition-colors" value={formData.remarks.agree_with_assessment} onChange={(e) => updateRemarks('agree_with_assessment', e.target.value)}>
                            <option>Yes</option>
                            <option>No</option>
                        </select>
                        {formData.remarks.agree_with_assessment === 'No' && (
                            <textarea placeholder="Please specify reasons for disagreement..." rows="3" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 mt-2 transition-colors" value={formData.remarks.disagreement_reason} onChange={(e) => updateRemarks('disagreement_reason', e.target.value)}></textarea>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">4. General Remarks with specific comments</label>
                        <textarea rows="4" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 transition-colors" value={formData.remarks.general_remarks} onChange={(e) => updateRemarks('general_remarks', e.target.value)}></textarea>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">5. Has the officer any specific characteristics/abilities for special assignment/promotion?</label>
                        <textarea rows="4" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 transition-colors" value={formData.remarks.specific_characteristics} onChange={(e) => updateRemarks('specific_characteristics', e.target.value)}></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-gray-100">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Signature Place</label>
                            <input type="text" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 transition-colors" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                            <input type="date" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 transition-colors" />
                        </div>
                    </div>
                </div>
            </fieldset>
        </div>
    );
}
