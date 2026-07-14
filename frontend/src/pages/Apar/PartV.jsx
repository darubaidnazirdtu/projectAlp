import React from 'react';

export default function PartVAssessment({ formData, updateAssessment, activeRole, formStatus }) {
  const isDisabled = activeRole !== 'Reporting Officer' || formStatus !== 'Submitted';
  const requiresAssessment = !isDisabled;
  const requiredProps = requiresAssessment ? { required: true, 'aria-required': 'true' } : {};

  const validateScore = (value) => {
    if (!value || value.trim() === '') return true;
    const num = parseInt(value);
    return !isNaN(num) && num >= 1 && num <= 10;
  };

  const handleScoreChange = (section, key, value) => {
    if (value && !validateScore(value)) {
      return; // Reject invalid scores
    }
    updateAssessment(section, key, value);
  };

  return (
    <div className="p-2 space-y-8">
      <div className="border-b border-gray-100 pb-4">
        <h3 className="text-xl font-bold text-gray-800 flex items-center">
          <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg mr-3">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
          </span>
          Part V – NUMERICAL ASSESSMENT ({activeRole === 'Reviewing Officer' ? 'review' : 'fill'})
        </h3>
        <p className="text-sm text-gray-500 mt-2">Numerical grading is to be awarded on a scale of 1-10 (1: Lowest, 10: Highest).</p>
      </div>

      <fieldset disabled={isDisabled}>
        {/* Section A */}
        <div className="mb-8">
          <h4 className="text-md font-bold text-white bg-indigo-600 p-3 rounded-t-lg">[A] Assessment of work output (Weightage 40%)</h4>
          <div className="border-x border-b border-gray-200 rounded-b-lg p-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-200 pb-2">
              <div className="md:col-span-3 text-sm font-medium text-gray-700">1] Accomplishment of planned work/work allotted as per subjects allotted.</div>
              <input {...requiredProps} type="number" min="1" max="10" className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 text-center transition-colors" placeholder="1-10" value={formData.assessment.section_a.q1} onChange={(e) => handleScoreChange('section_a', 'q1', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-200 pb-2">
              <div className="md:col-span-3 text-sm font-medium text-gray-700">2] Quality of output</div>
              <input {...requiredProps} type="number" min="1" max="10" className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 text-center transition-colors" placeholder="1-10" value={formData.assessment.section_a.q2} onChange={(e) => handleScoreChange('section_a', 'q2', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-200 pb-2">
              <div className="md:col-span-3 text-sm font-medium text-gray-700">3] Analytical ability</div>
              <input {...requiredProps} type="number" min="1" max="10" className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 text-center transition-colors" placeholder="1-10" value={formData.assessment.section_a.q3} onChange={(e) => handleScoreChange('section_a', 'q3', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-200 pb-2">
              <div className="md:col-span-3 text-sm font-medium text-gray-700">4] Accomplishment of exceptional work/ Unforeseen tasks performed.</div>
              <input {...requiredProps} type="number" min="1" max="10" className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 text-center transition-colors" placeholder="1-10" value={formData.assessment.section_a.q4} onChange={(e) => handleScoreChange('section_a', 'q4', e.target.value)} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="md:col-span-3 text-sm font-bold text-gray-800">Overall Grading on "Work output"</div>
              <input {...requiredProps} type="number" min="1" max="10" readOnly className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 text-center font-bold transition-colors bg-gray-50" placeholder="Score" value={formData.assessment.section_a.overall_grading} />
            </div>
          </div>
        </div>

        {/* Section B */}
        <div className="mb-8">
          <h4 className="text-md font-bold text-white bg-indigo-600 p-3 rounded-t-lg">[B] Assessment of Personal attributes (Weightage 30%)</h4>
          <div className="border-x border-b border-gray-200 rounded-b-lg p-6 space-y-6">
            {[
              { id: 'q1', text: '1] Has the officer show himself able to do the work of his appointment?' },
              { id: 'q2', text: '2] Conduct' },
              { id: 'q3', text: '3] Regularity and Punctuality' },
              { id: 'q4', text: '4] Trustworthiness' },
              { id: 'q5', text: '5] Zeal' },
              { id: 'q6', text: '6] Performance of duties' },
              { id: 'q7a', text: '7a] Knowledge of the branch on which engaged and quality of work' },
              { id: 'q7b', text: '7b] Ability to manage the class and maintain discipline among the students' },
              { id: 'q8', text: '8] Has the officer published any original papers or conducted any research...' },
              { id: 'q9', text: '9] Fitness for promotion to the higher grade and for further advancement.' },
              { id: 'q10', text: '10] General assessment (personality, integrity, temperament)...' }
            ].map((q) => (
              <div key={q.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-200 pb-2">
                <div className="md:col-span-3 text-sm font-medium text-gray-700">{q.text}</div>
                <input {...requiredProps} type="number" min="1" max="10" className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 text-center transition-colors" placeholder="1-10" value={formData.assessment.section_b[q.id]} onChange={(e) => handleScoreChange('section_b', q.id, e.target.value)} />
              </div>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-200 pb-2">
              <div className="md:col-span-3 text-sm font-medium text-gray-700">11] Grading (Outstanding/ Very Good/ Good/ Average/ Below Average)</div>
              <select {...requiredProps} className="border border-gray-900 rounded-md p-2 bg-gray-50" value={formData.assessment.section_b.q11} disabled>
                <option value="">Auto (based on overall score)</option>
                <option>Outstanding</option>
                <option>Very Good</option>
                <option>Good</option>
                <option>Average</option>
                <option>Below Average</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="md:col-span-3 text-sm font-bold text-gray-800">Overall Grading on "Personal Attribute"</div>
              <input {...requiredProps} type="number" min="1" max="10" readOnly className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 text-center font-bold transition-colors bg-gray-50" placeholder="Score" value={formData.assessment.section_b.overall_grading} />
            </div>
          </div>
        </div>

        {/* Section C */}
        <div className="mb-8">
          <h4 className="text-md font-bold text-white bg-indigo-600 p-3 rounded-t-lg">[C] Assessment of Functional Competency (Weightage 30%)</h4>
          <div className="border-x border-b border-gray-200 rounded-b-lg p-6 space-y-6">
            {[
              { id: 'q1', text: '1] Professional knowledge in the area of function.' },
              { id: 'q2', text: '2] Strategic Planning ability.' },
              { id: 'q3', text: '3] Decision making ability.' },
              { id: 'q4', text: '4] Coordination ability' },
              { id: 'q5', text: '5] Ability to motivate and develop subordinates.' },
              { id: 'q6', text: '6] Initiative' }
            ].map((q) => (
              <div key={q.id} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center border-b border-gray-200 pb-2">
                <div className="md:col-span-3 text-sm font-medium text-gray-700">{q.text}</div>
                <input {...requiredProps} type="number" min="1" max="10" className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 text-center transition-colors" placeholder="1-10" value={formData.assessment.section_c[q.id]} onChange={(e) => handleScoreChange('section_c', q.id, e.target.value)} />
              </div>
            ))}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center bg-gray-50 p-4 rounded-lg border border-gray-200">
              <div className="md:col-span-3 text-sm font-bold text-gray-800">Overall Grading on "Functional Competency"</div>
              <input {...requiredProps} type="number" min="1" max="10" readOnly className="border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 text-center font-bold transition-colors bg-gray-50" placeholder="Score" value={formData.assessment.section_c.overall_grading} />
            </div>
          </div>
        </div>

        {/* General */}
        <div>
          <h4 className="text-md font-bold text-white bg-indigo-600 p-3 rounded-t-lg">GENERAL</h4>
          <div className="border-x border-b border-gray-200 rounded-b-lg p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">1. Relations with the public (Accessibility/Responsiveness)</label>
              <textarea {...requiredProps} rows="2" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 transition-colors" value={formData.assessment.general.q1} onChange={(e) => updateAssessment('general', 'q1', e.target.value)}></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">2. Training (Recommendations)</label>
              <textarea {...requiredProps} rows="2" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 transition-colors" value={formData.assessment.general.q2} onChange={(e) => updateAssessment('general', 'q2', e.target.value)}></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">3. State of Health</label>
              <textarea {...requiredProps} rows="2" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 transition-colors" value={formData.assessment.general.q3} onChange={(e) => updateAssessment('general', 'q3', e.target.value)}></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">4. Integrity</label>
              <textarea {...requiredProps} rows="2" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 transition-colors" value={formData.assessment.general.q4} onChange={(e) => updateAssessment('general', 'q4', e.target.value)}></textarea>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">5. Pen Picture by Reporting Officer (100 words)</label>
              <textarea {...requiredProps} rows="4" className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 transition-colors" value={formData.assessment.general.q5} onChange={(e) => updateAssessment('general', 'q5', e.target.value)}></textarea>
            </div>
            <div className="bg-gray-100 p-4 rounded border border-gray-300">
              <label className="block text-sm font-medium text-gray-700 mb-2">6. Overall numerical grading (Weighted A+B+C)</label>
              <input {...requiredProps} type="number" min="1" max="10" readOnly className="w-32 border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-2.5 font-bold text-lg transition-colors bg-gray-50" value={formData.assessment.general.q6} />
            </div>
          </div>
        </div>
      </fieldset>
    </div>
  );
}
