// import React from 'react';
// import { FiPlus, FiTrash2 } from 'react-icons/fi';

// export default function PartII({ formData, addItem, removeItem, updateArrayField, updateAssessment, updateField, readOnly }) {
//     const desc = (formData && formData.teaching && formData.teaching.description_of_duties) || '';
//     return (
//         <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
//             <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Part II - SELF APPRAISAL</h3>

//             <div className="space-y-6">
//                 {/* Description */}
//                 <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-2">Description of Duties</label>
//                     <textarea rows="3" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 text-sm disabled:bg-gray-50 disabled:text-gray-500 transition-colors" placeholder="Brief description of duties..." value={desc} onChange={(e) => updateField('teaching', 'description_of_duties', e.target.value)} ></textarea>
//                 </div>
//                 {/* i) Courses taught at various levels */}
//                 <div>
//                     <h4 className="text-md font-semibold text-gray-800 mb-2">i) Courses taught at various levels</h4>
//                     <div className="space-y-4">
//                         {formData.teaching.courses_taught.map((course, idx) => (
//                             <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
//                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
//                                     <div>
//                                         <label className="block text-sm font-medium text-gray-700 mb-1">Name of the course</label>
//                                         <input type="text" disabled={readOnly} value={course.name_of_course || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'name_of_course', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-gray-700 mb-1">Degree type of course</label>
//                                         <select disabled={readOnly} value={course.degree_type || 'UG'} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'degree_type', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors">
//                                             <option>UG</option>
//                                             <option>PG</option>
//                                         </select>
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-gray-700 mb-1">Total lectures Scheduled</label>
//                                         <input type="text" disabled={readOnly} value={course.total_lectures_scheduled || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'total_lectures_scheduled', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-gray-700 mb-1">Total lectures engaged</label>
//                                         <input type="text" disabled={readOnly} value={course.total_lectures_engaged || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'total_lectures_engaged', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-gray-700 mb-1">Tutorials Scheduled</label>
//                                         <input type="text" disabled={readOnly} value={course.tutorials_scheduled || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'tutorials_scheduled', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-gray-700 mb-1">Tutorials engaged</label>
//                                         <input type="text" disabled={readOnly} value={course.tutorials_engaged || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'tutorials_engaged', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-gray-700 mb-1">Labs Scheduled</label>
//                                         <input type="text" disabled={readOnly} value={course.labs_scheduled || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'labs_scheduled', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
//                                     </div>
//                                     <div>
//                                         <label className="block text-sm font-medium text-gray-700 mb-1">Labs engaged</label>
//                                         <input type="text" disabled={readOnly} value={course.labs_engaged || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'labs_engaged', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
//                                     </div>
//                                 </div>
//                                 <div className="mb-3">
//                                     <label className="block text-sm font-medium text-gray-700 mb-1">Reasons for not engaging the Remaining classes, if any</label>
//                                     <textarea rows="3" disabled={readOnly} value={course.reasons_not_engaged || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'reasons_not_engaged', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"></textarea>
//                                 </div>
//                                 {!readOnly && (
//                                     <div className="flex justify-end">
//                                         <button type="button" onClick={() => removeItem('teaching', 'courses_taught', idx)} className="text-red-600 hover:text-red-800">Remove</button>
//                                     </div>
//                                 )}
//                             </div>
//                         ))}
//                         {!readOnly && (
//                             <div className="pt-2">
//                                 <button type="button" onClick={() => addItem('teaching', 'courses_taught', { name_of_course: '', total_lectures_scheduled: '', total_lectures_engaged: '', tutorials_scheduled: '', tutorials_engaged: '', labs_scheduled: '', labs_engaged: '', reasons_not_engaged: '', degree_type: 'UG' })} className="w-full md:w-auto bg-indigo-600 text-white rounded-lg px-6 py-2.5 hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center font-medium"><FiPlus className="mr-2" /> Add Course</button>
//                             </div>
//                         )}
//                     </div>
//                 </div>


//                 {/* ii) Total of hours/periods provided in time table vs actually taken */}
//                 <div>
//                     <h4 className="text-md font-semibold text-gray-800 mb-2">ii) Total of hours/ periods provided in the time table for</h4>
//                     <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
//                         <div className="font-semibold mb-2">a) Lectures, Tutorials, Practical, Seminars/ Discussions in the academic year</div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">For odd semester</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.time_table && formData.teaching.time_table.provided && formData.teaching.time_table.provided.odd_semester) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.time_table) || { provided: { odd_semester: '', even_semester: '' }, actual: { odd_semester: '', even_semester: '' } };
//                                     updateField('teaching', 'time_table', { ...cur, provided: { ...cur.provided, odd_semester: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">For even semester</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.time_table && formData.teaching.time_table.provided && formData.teaching.time_table.provided.even_semester) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.time_table) || { provided: { odd_semester: '', even_semester: '' }, actual: { odd_semester: '', even_semester: '' } };
//                                     updateField('teaching', 'time_table', { ...cur, provided: { ...cur.provided, even_semester: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                         </div>

//                         <div className="mt-4 font-semibold mb-2">b) the number actually taken during the academic year</div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">For odd semester</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.time_table && formData.teaching.time_table.actual && formData.teaching.time_table.actual.odd_semester) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.time_table) || { provided: { odd_semester: '', even_semester: '' }, actual: { odd_semester: '', even_semester: '' } };
//                                     updateField('teaching', 'time_table', { ...cur, actual: { ...cur.actual, odd_semester: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">For even semester</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.time_table && formData.teaching.time_table.actual && formData.teaching.time_table.actual.even_semester) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.time_table) || { provided: { odd_semester: '', even_semester: '' }, actual: { odd_semester: '', even_semester: '' } };
//                                     updateField('teaching', 'time_table', { ...cur, actual: { ...cur.actual, even_semester: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* iii) Work load per week */}
//                 <div>
//                     <h4 className="text-md font-semibold text-gray-800 mb-2">iii) Work load per week</h4>
//                     <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
//                         <div className="font-semibold mb-2">For odd semester</div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Lectures</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.workload_week && formData.teaching.workload_week.odd_semester && formData.teaching.workload_week.odd_semester.lectures) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.workload_week) || { odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }, even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' } };
//                                     updateField('teaching', 'workload_week', { ...cur, odd_semester: { ...cur.odd_semester, lectures: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Tutorials</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.workload_week && formData.teaching.workload_week.odd_semester && formData.teaching.workload_week.odd_semester.tutorials) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.workload_week) || { odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }, even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' } };
//                                     updateField('teaching', 'workload_week', { ...cur, odd_semester: { ...cur.odd_semester, tutorials: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Practicals</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.workload_week && formData.teaching.workload_week.odd_semester && formData.teaching.workload_week.odd_semester.practicals) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.workload_week) || { odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }, even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' } };
//                                     updateField('teaching', 'workload_week', { ...cur, odd_semester: { ...cur.odd_semester, practicals: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Seminars/Group Discussions</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.workload_week && formData.teaching.workload_week.odd_semester && formData.teaching.workload_week.odd_semester.seminars) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.workload_week) || { odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }, even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' } };
//                                     updateField('teaching', 'workload_week', { ...cur, odd_semester: { ...cur.odd_semester, seminars: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                         </div>

//                         <div className="mt-4 font-semibold mb-2">For even semester</div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Lectures</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.workload_week && formData.teaching.workload_week.even_semester && formData.teaching.workload_week.even_semester.lectures) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.workload_week) || { odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }, even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' } };
//                                     updateField('teaching', 'workload_week', { ...cur, even_semester: { ...cur.even_semester, lectures: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Tutorials</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.workload_week && formData.teaching.workload_week.even_semester && formData.teaching.workload_week.even_semester.tutorials) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.workload_week) || { odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }, even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' } };
//                                     updateField('teaching', 'workload_week', { ...cur, even_semester: { ...cur.even_semester, tutorials: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Practicals</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.workload_week && formData.teaching.workload_week.even_semester && formData.teaching.workload_week.even_semester.practicals) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.workload_week) || { odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }, even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' } };
//                                     updateField('teaching', 'workload_week', { ...cur, even_semester: { ...cur.even_semester, practicals: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Seminars/Group Discussions</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.workload_week && formData.teaching.workload_week.even_semester && formData.teaching.workload_week.even_semester.seminars) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.workload_week) || { odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }, even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' } };
//                                     updateField('teaching', 'workload_week', { ...cur, even_semester: { ...cur.even_semester, seminars: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* 3) Details of teaching methods employed */}
//                 <div>
//                     <h4 className="text-md font-semibold text-gray-800 mb-2">3) Details of teaching methods employed by you: (Lectures, Tutorials, Seminars, Practicals etc.)</h4>
//                     <textarea rows="3" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" value={(formData.teaching && formData.teaching.teaching_methods) || ''} onChange={(e) => updateField('teaching', 'teaching_methods', e.target.value)}></textarea>
//                 </div>

//                 {/* ICT Tools */}
//                 <div>
//                     <h4 className="text-md font-semibold text-gray-800 mb-2">3.1) ICT Tools and Resources Used</h4>
//                     <textarea rows="2" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" value={(formData.teaching && formData.teaching.ict_tools) || ''} onChange={(e) => updateField('teaching', 'ict_tools', e.target.value)} placeholder="e.g., LCD Projector, Smart Board, Online Resources..."></textarea>
//                 </div>

//                 {/* Student Centric Methods */}
//                 <div>
//                     <h4 className="text-md font-semibold text-gray-800 mb-2">3.2) Student Centric Methods (Experiential/Participative/Problem Solving)</h4>
//                     <textarea rows="2" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" value={(formData.teaching && formData.teaching.student_centric_methods) || ''} onChange={(e) => updateField('teaching', 'student_centric_methods', e.target.value)} placeholder="Details of methods used..."></textarea>
//                 </div>

//                 {/* 4 a) Details of Tutorials/tests held during the academic year */}
//                 <div>
//                     <h4 className="text-md font-semibold text-gray-800 mb-2">4) a) Details of Tutorials/ tests held during the academic year</h4>
//                     <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
//                         <div className="font-semibold mb-2">Under-graduate Courses (Odd Semester)</div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Number of tests held</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.tutorials_tests && formData.teaching.tutorials_tests.ug_odd && formData.teaching.tutorials_tests.ug_odd.number_of_tests) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.tutorials_tests) || { ug_odd: { number_of_tests: '', assignment_checked: '' }, ug_even: { number_of_tests: '', assignment_checked: '' }, pg_odd: { number_of_tests: '', assignment_checked: '' }, pg_even: { number_of_tests: '', assignment_checked: '' } };
//                                     updateField('teaching', 'tutorials_tests', { ...cur, ug_odd: { ...cur.ug_odd, number_of_tests: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Assignment checked</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.tutorials_tests && formData.teaching.tutorials_tests.ug_odd && formData.teaching.tutorials_tests.ug_odd.assignment_checked) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.tutorials_tests) || { ug_odd: { number_of_tests: '', assignment_checked: '' }, ug_even: { number_of_tests: '', assignment_checked: '' }, pg_odd: { number_of_tests: '', assignment_checked: '' }, pg_even: { number_of_tests: '', assignment_checked: '' } };
//                                     updateField('teaching', 'tutorials_tests', { ...cur, ug_odd: { ...cur.ug_odd, assignment_checked: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                         </div>

//                         <div className="font-semibold mb-2">Under-graduate Courses (Even Semester)</div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Number of tests held</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.tutorials_tests && formData.teaching.tutorials_tests.ug_even && formData.teaching.tutorials_tests.ug_even.number_of_tests) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.tutorials_tests) || { ug_odd: { number_of_tests: '', assignment_checked: '' }, ug_even: { number_of_tests: '', assignment_checked: '' }, pg_odd: { number_of_tests: '', assignment_checked: '' }, pg_even: { number_of_tests: '', assignment_checked: '' } };
//                                     updateField('teaching', 'tutorials_tests', { ...cur, ug_even: { ...cur.ug_even, number_of_tests: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Assignment checked</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.tutorials_tests && formData.teaching.tutorials_tests.ug_even && formData.teaching.tutorials_tests.ug_even.assignment_checked) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.tutorials_tests) || { ug_odd: { number_of_tests: '', assignment_checked: '' }, ug_even: { number_of_tests: '', assignment_checked: '' }, pg_odd: { number_of_tests: '', assignment_checked: '' }, pg_even: { number_of_tests: '', assignment_checked: '' } };
//                                     updateField('teaching', 'tutorials_tests', { ...cur, ug_even: { ...cur.ug_even, assignment_checked: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                         </div>

//                         <div className="font-semibold mb-2">Post-graduate Courses (Odd Semester)</div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Number of tests held</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.tutorials_tests && formData.teaching.tutorials_tests.pg_odd && formData.teaching.tutorials_tests.pg_odd.number_of_tests) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.tutorials_tests) || { ug_odd: { number_of_tests: '', assignment_checked: '' }, ug_even: { number_of_tests: '', assignment_checked: '' }, pg_odd: { number_of_tests: '', assignment_checked: '' }, pg_even: { number_of_tests: '', assignment_checked: '' } };
//                                     updateField('teaching', 'tutorials_tests', { ...cur, pg_odd: { ...cur.pg_odd, number_of_tests: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Assignment checked</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.tutorials_tests && formData.teaching.tutorials_tests.pg_odd && formData.teaching.tutorials_tests.pg_odd.assignment_checked) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.tutorials_tests) || { ug_odd: { number_of_tests: '', assignment_checked: '' }, ug_even: { number_of_tests: '', assignment_checked: '' }, pg_odd: { number_of_tests: '', assignment_checked: '' }, pg_even: { number_of_tests: '', assignment_checked: '' } };
//                                     updateField('teaching', 'tutorials_tests', { ...cur, pg_odd: { ...cur.pg_odd, assignment_checked: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                         </div>

//                         <div className="font-semibold mb-2">Post-graduate Courses (Even Semester)</div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Number of tests held</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.tutorials_tests && formData.teaching.tutorials_tests.pg_even && formData.teaching.tutorials_tests.pg_even.number_of_tests) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.tutorials_tests) || { ug_odd: { number_of_tests: '', assignment_checked: '' }, ug_even: { number_of_tests: '', assignment_checked: '' }, pg_odd: { number_of_tests: '', assignment_checked: '' }, pg_even: { number_of_tests: '', assignment_checked: '' } };
//                                     updateField('teaching', 'tutorials_tests', { ...cur, pg_even: { ...cur.pg_even, number_of_tests: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Assignment checked</label>
//                                 <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.tutorials_tests && formData.teaching.tutorials_tests.pg_even && formData.teaching.tutorials_tests.pg_even.assignment_checked) || ''} onChange={(e) => {
//                                     const cur = (formData.teaching && formData.teaching.tutorials_tests) || { ug_odd: { number_of_tests: '', assignment_checked: '' }, ug_even: { number_of_tests: '', assignment_checked: '' }, pg_odd: { number_of_tests: '', assignment_checked: '' }, pg_even: { number_of_tests: '', assignment_checked: '' } };
//                                     updateField('teaching', 'tutorials_tests', { ...cur, pg_even: { ...cur.pg_even, assignment_checked: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* 4 b) academic planning */}
//                 <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">b) Details of academic planning/ presentation of lectures during the session</label>
//                     <textarea rows="3" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" value={(formData.teaching && formData.teaching.academic_planning) || ''} onChange={(e) => updateField('teaching', 'academic_planning', e.target.value)}></textarea>
//                 </div>
//             </div>
//         </div>
//     );
// }


// import React from 'react';
// import { FiPlus, FiTrash2 } from 'react-icons/fi';

// export default function PartII({ formData, addItem, removeItem, updateArrayField, updateAssessment, updateField, readOnly }) {
//     // Safely extract teaching data to prevent crashes
//     const teachingData = formData?.teaching || {};
//     const coursesTaught = teachingData?.courses_taught || [];
//     const desc = teachingData?.description_of_duties || '';

//     // Safe extraction for nested objects
//     const timeTable = teachingData?.time_table || { provided: {}, actual: {} };
//     const workloadWeek = teachingData?.workload_week || { odd_semester: {}, even_semester: {} };
//     const tutorialsTests = teachingData?.tutorials_tests || { ug_odd: {}, ug_even: {}, pg_odd: {}, pg_even: {} };

//     return (
//         <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
//             <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Part II - SELF APPRAISAL</h3>

//             <div className="space-y-6">
//                 {/* Description */}
//                 <div>
//                     <label htmlFor="desc-duties" className="block text-sm font-medium text-gray-700 mb-2">Description of Duties</label>
//                     <textarea id="desc-duties" rows="3" disabled={readOnly} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 text-sm disabled:bg-gray-50 disabled:text-gray-500 transition-colors" placeholder="Brief description of duties..." value={desc} onChange={(e) => updateField('teaching', 'description_of_duties', e.target.value)}></textarea>
//                 </div>

//                 {/* Mandatory Documents (Schema Alignment) */}
//                 <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6">
//                     <h4 className="text-md font-semibold text-blue-900 mb-4">Mandatory Documents</h4>
//                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//                         {/* Immovable Property Return */}
//                         <div>
//                             <label htmlFor="property-return" className="block text-sm font-medium text-gray-700 mb-1">
//                                 Immovable Property Return (Document URL)
//                             </label>
//                             <input
//                                 id="property-return"
//                                 type="text"
//                                 disabled={readOnly}
//                                 value={teachingData?.immovable_property_return || ''}
//                                 onChange={(e) => updateField('teaching', 'immovable_property_return', e.target.value)}
//                                 className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors bg-white"
//                                 placeholder="Paste Google Drive or Cloudinary link..."
//                             />
//                         </div>
                        
//                         {/* Health Checkup File */}
//                         <div>
//                             <label htmlFor="health-checkup" className="block text-sm font-medium text-gray-700 mb-1">
//                                 Health Checkup Report (Document URL)
//                             </label>
//                             <input
//                                 id="health-checkup"
//                                 type="text"
//                                 disabled={readOnly}
//                                 value={teachingData?.health_checkup_file || ''}
//                                 onChange={(e) => updateField('teaching', 'health_checkup_file', e.target.value)}
//                                 className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors bg-white"
//                                 placeholder="Paste Google Drive or Cloudinary link..."
//                             />
//                         </div>
//                     </div>
//                 </div>

//                 {/* i) Courses taught at various levels */}
//                 <div>
//                     <h4 className="text-md font-semibold text-gray-800 mb-2">i) Courses taught at various levels</h4>
//                     <div className="space-y-4">
//                         {coursesTaught.map((course, idx) => {
//                             // Smart logic: Only show "Reasons" if engaged is less than scheduled
//                             const showReasons = Number(course.total_lectures_engaged) < Number(course.total_lectures_scheduled) && course.total_lectures_scheduled !== '';

//                             return (
//                                 <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
//                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
//                                         <div>
//                                             <label htmlFor={`course-name-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Name of the course</label>
//                                             <input id={`course-name-${idx}`} type="text" disabled={readOnly} value={course.name_of_course || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'name_of_course', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
//                                         </div>
//                                         <div>
//                                             <label htmlFor={`degree-type-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Degree type of course</label>
//                                             <select id={`degree-type-${idx}`} disabled={readOnly} value={course.degree_type || 'UG'} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'degree_type', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors">
//                                                 <option>UG</option>
//                                                 <option>PG</option>
//                                             </select>
//                                         </div>
//                                         <div>
//                                             <label htmlFor={`lectures-sch-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Total lectures Scheduled</label>
//                                             <input id={`lectures-sch-${idx}`} type="number" min="0" disabled={readOnly} value={course.total_lectures_scheduled || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'total_lectures_scheduled', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
//                                         </div>
//                                         <div>
//                                             <label htmlFor={`lectures-eng-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Total lectures engaged</label>
//                                             <input id={`lectures-eng-${idx}`} type="number" min="0" disabled={readOnly} value={course.total_lectures_engaged || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'total_lectures_engaged', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
//                                         </div>
//                                         <div>
//                                             <label htmlFor={`tut-sch-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Tutorials Scheduled</label>
//                                             <input id={`tut-sch-${idx}`} type="number" min="0" disabled={readOnly} value={course.tutorials_scheduled || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'tutorials_scheduled', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
//                                         </div>
//                                         <div>
//                                             <label htmlFor={`tut-eng-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Tutorials engaged</label>
//                                             <input id={`tut-eng-${idx}`} type="number" min="0" disabled={readOnly} value={course.tutorials_engaged || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'tutorials_engaged', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
//                                         </div>
//                                         <div>
//                                             <label htmlFor={`labs-sch-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Labs Scheduled</label>
//                                             <input id={`labs-sch-${idx}`} type="number" min="0" disabled={readOnly} value={course.labs_scheduled || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'labs_scheduled', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
//                                         </div>
//                                         <div>
//                                             <label htmlFor={`labs-eng-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Labs engaged</label>
//                                             <input id={`labs-eng-${idx}`} type="number" min="0" disabled={readOnly} value={course.labs_engaged || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'labs_engaged', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
//                                         </div>
//                                     </div>
                                    
//                                     {showReasons && (
//                                         <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg">
//                                             <label htmlFor={`reasons-${idx}`} className="block text-sm font-medium text-red-800 mb-1">Reasons for not engaging all scheduled classes</label>
//                                             <textarea id={`reasons-${idx}`} rows="2" disabled={readOnly} value={course.reasons_not_engaged || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'reasons_not_engaged', e.target.value)} className="w-full border border-red-300 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500 p-3 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"></textarea>
//                                         </div>
//                                     )}

//                                     {!readOnly && (
//                                         <div className="flex justify-end">
//                                             <button type="button" onClick={() => removeItem('teaching', 'courses_taught', idx)} className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center"><FiTrash2 className="mr-1"/> Remove Course</button>
//                                         </div>
//                                     )}
//                                 </div>
//                             );
//                         })}
//                         {!readOnly && (
//                             <div className="pt-2">
//                                 <button type="button" onClick={() => addItem('teaching', 'courses_taught', { name_of_course: '', total_lectures_scheduled: '', total_lectures_engaged: '', tutorials_scheduled: '', tutorials_engaged: '', labs_scheduled: '', labs_engaged: '', reasons_not_engaged: '', degree_type: 'UG' })} className="w-full md:w-auto bg-indigo-600 text-white rounded-lg px-6 py-2.5 hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center font-medium"><FiPlus className="mr-2" /> Add Course</button>
//                             </div>
//                         )}
//                     </div>
//                 </div>

//                 {/* ii) Total of hours/periods provided in time table vs actually taken */}
//                 <div>
//                     <h4 className="text-md font-semibold text-gray-800 mb-2">ii) Total of hours/ periods provided in the time table</h4>
//                     <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
//                         <div className="font-semibold mb-2">a) Provided in the academic year</div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">For odd semester</label>
//                                 <input type="number" min="0" disabled={readOnly} value={timeTable?.provided?.odd_semester || ''} onChange={(e) => {
//                                     updateField('teaching', 'time_table', { ...timeTable, provided: { ...timeTable.provided, odd_semester: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">For even semester</label>
//                                 <input type="number" min="0" disabled={readOnly} value={timeTable?.provided?.even_semester || ''} onChange={(e) => {
//                                     updateField('teaching', 'time_table', { ...timeTable, provided: { ...timeTable.provided, even_semester: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                         </div>

//                         <div className="mt-4 font-semibold mb-2">b) Actually taken during the academic year</div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">For odd semester</label>
//                                 <input type="number" min="0" disabled={readOnly} value={timeTable?.actual?.odd_semester || ''} onChange={(e) => {
//                                     updateField('teaching', 'time_table', { ...timeTable, actual: { ...timeTable.actual, odd_semester: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm font-medium text-gray-700 mb-1">For even semester</label>
//                                 <input type="number" min="0" disabled={readOnly} value={timeTable?.actual?.even_semester || ''} onChange={(e) => {
//                                     updateField('teaching', 'time_table', { ...timeTable, actual: { ...timeTable.actual, even_semester: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* iii) Work load per week */}
//                 <div>
//                     <h4 className="text-md font-semibold text-gray-800 mb-2">iii) Work load per week</h4>
//                     <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
//                         <div className="font-semibold mb-2 text-indigo-800">For odd semester</div>
//                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Lectures</label>
//                                 <input type="number" min="0" disabled={readOnly} value={workloadWeek?.odd_semester?.lectures || ''} onChange={(e) => {
//                                     updateField('teaching', 'workload_week', { ...workloadWeek, odd_semester: { ...workloadWeek.odd_semester, lectures: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Tutorials</label>
//                                 <input type="number" min="0" disabled={readOnly} value={workloadWeek?.odd_semester?.tutorials || ''} onChange={(e) => {
//                                     updateField('teaching', 'workload_week', { ...workloadWeek, odd_semester: { ...workloadWeek.odd_semester, tutorials: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Practicals</label>
//                                 <input type="number" min="0" disabled={readOnly} value={workloadWeek?.odd_semester?.practicals || ''} onChange={(e) => {
//                                     updateField('teaching', 'workload_week', { ...workloadWeek, odd_semester: { ...workloadWeek.odd_semester, practicals: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Seminars</label>
//                                 <input type="number" min="0" disabled={readOnly} value={workloadWeek?.odd_semester?.seminars || ''} onChange={(e) => {
//                                     updateField('teaching', 'workload_week', { ...workloadWeek, odd_semester: { ...workloadWeek.odd_semester, seminars: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                         </div>

//                         <div className="font-semibold mb-2 text-indigo-800">For even semester</div>
//                         <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Lectures</label>
//                                 <input type="number" min="0" disabled={readOnly} value={workloadWeek?.even_semester?.lectures || ''} onChange={(e) => {
//                                     updateField('teaching', 'workload_week', { ...workloadWeek, even_semester: { ...workloadWeek.even_semester, lectures: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Tutorials</label>
//                                 <input type="number" min="0" disabled={readOnly} value={workloadWeek?.even_semester?.tutorials || ''} onChange={(e) => {
//                                     updateField('teaching', 'workload_week', { ...workloadWeek, even_semester: { ...workloadWeek.even_semester, tutorials: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Practicals</label>
//                                 <input type="number" min="0" disabled={readOnly} value={workloadWeek?.even_semester?.practicals || ''} onChange={(e) => {
//                                     updateField('teaching', 'workload_week', { ...workloadWeek, even_semester: { ...workloadWeek.even_semester, practicals: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Seminars</label>
//                                 <input type="number" min="0" disabled={readOnly} value={workloadWeek?.even_semester?.seminars || ''} onChange={(e) => {
//                                     updateField('teaching', 'workload_week', { ...workloadWeek, even_semester: { ...workloadWeek.even_semester, seminars: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* 3) Details of teaching methods employed */}
//                 <div>
//                     <h4 className="text-md font-semibold text-gray-800 mb-2">3) Details of teaching methods employed by you</h4>
//                     <textarea rows="3" disabled={readOnly} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" value={teachingData?.teaching_methods || ''} onChange={(e) => updateField('teaching', 'teaching_methods', e.target.value)} placeholder="(Lectures, Tutorials, Seminars, Practicals etc.)"></textarea>
//                 </div>

//                 {/* ICT Tools */}
//                 <div>
//                     <h4 className="text-md font-semibold text-gray-800 mb-2">3.1) ICT Tools and Resources Used</h4>
//                     <textarea rows="2" disabled={readOnly} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" value={teachingData?.ict_tools || ''} onChange={(e) => updateField('teaching', 'ict_tools', e.target.value)} placeholder="e.g., LCD Projector, Smart Board, Online Resources..."></textarea>
//                 </div>

//                 {/* Student Centric Methods */}
//                 <div>
//                     <h4 className="text-md font-semibold text-gray-800 mb-2">3.2) Student Centric Methods</h4>
//                     <textarea rows="2" disabled={readOnly} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" value={teachingData?.student_centric_methods || ''} onChange={(e) => updateField('teaching', 'student_centric_methods', e.target.value)} placeholder="(Experiential/Participative/Problem Solving)..."></textarea>
//                 </div>

//                 {/* 4 a) Details of Tutorials/tests held */}
//                 <div>
//                     <h4 className="text-md font-semibold text-gray-800 mb-2">4) a) Details of Tutorials/ tests held during the academic year</h4>
//                     <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
//                         <div className="font-semibold mb-2">Under-graduate Courses (Odd Semester)</div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Number of tests held</label>
//                                 <input type="number" min="0" disabled={readOnly} value={tutorialsTests?.ug_odd?.number_of_tests || ''} onChange={(e) => {
//                                     updateField('teaching', 'tutorials_tests', { ...tutorialsTests, ug_odd: { ...tutorialsTests.ug_odd, number_of_tests: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Assignment checked</label>
//                                 <input type="number" min="0" disabled={readOnly} value={tutorialsTests?.ug_odd?.assignment_checked || ''} onChange={(e) => {
//                                     updateField('teaching', 'tutorials_tests', { ...tutorialsTests, ug_odd: { ...tutorialsTests.ug_odd, assignment_checked: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                         </div>

//                         <div className="font-semibold mb-2">Under-graduate Courses (Even Semester)</div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Number of tests held</label>
//                                 <input type="number" min="0" disabled={readOnly} value={tutorialsTests?.ug_even?.number_of_tests || ''} onChange={(e) => {
//                                     updateField('teaching', 'tutorials_tests', { ...tutorialsTests, ug_even: { ...tutorialsTests.ug_even, number_of_tests: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Assignment checked</label>
//                                 <input type="number" min="0" disabled={readOnly} value={tutorialsTests?.ug_even?.assignment_checked || ''} onChange={(e) => {
//                                     updateField('teaching', 'tutorials_tests', { ...tutorialsTests, ug_even: { ...tutorialsTests.ug_even, assignment_checked: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                         </div>

//                         <div className="font-semibold mb-2">Post-graduate Courses (Odd Semester)</div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Number of tests held</label>
//                                 <input type="number" min="0" disabled={readOnly} value={tutorialsTests?.pg_odd?.number_of_tests || ''} onChange={(e) => {
//                                     updateField('teaching', 'tutorials_tests', { ...tutorialsTests, pg_odd: { ...tutorialsTests.pg_odd, number_of_tests: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Assignment checked</label>
//                                 <input type="number" min="0" disabled={readOnly} value={tutorialsTests?.pg_odd?.assignment_checked || ''} onChange={(e) => {
//                                     updateField('teaching', 'tutorials_tests', { ...tutorialsTests, pg_odd: { ...tutorialsTests.pg_odd, assignment_checked: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                         </div>

//                         <div className="font-semibold mb-2">Post-graduate Courses (Even Semester)</div>
//                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Number of tests held</label>
//                                 <input type="number" min="0" disabled={readOnly} value={tutorialsTests?.pg_even?.number_of_tests || ''} onChange={(e) => {
//                                     updateField('teaching', 'tutorials_tests', { ...tutorialsTests, pg_even: { ...tutorialsTests.pg_even, number_of_tests: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                             <div>
//                                 <label className="block text-sm text-gray-700 mb-1">Assignment checked</label>
//                                 <input type="number" min="0" disabled={readOnly} value={tutorialsTests?.pg_even?.assignment_checked || ''} onChange={(e) => {
//                                     updateField('teaching', 'tutorials_tests', { ...tutorialsTests, pg_even: { ...tutorialsTests.pg_even, assignment_checked: e.target.value } });
//                                 }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
//                             </div>
//                         </div>
//                     </div>
//                 </div>

//                 {/* 4 b) academic planning */}
//                 <div>
//                     <label className="block text-sm font-medium text-gray-700 mb-1">b) Details of academic planning/ presentation of lectures during the session</label>
//                     <textarea rows="3" disabled={readOnly} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" value={teachingData?.academic_planning || ''} onChange={(e) => updateField('teaching', 'academic_planning', e.target.value)}></textarea>
//                 </div>
//             </div>
//         </div>
//     );
// }


import React, { useMemo } from 'react';
import { FiPlus, FiTrash2, FiAward } from 'react-icons/fi';

export default function PartII({ formData, addItem, removeItem, updateArrayField, updateAssessment, updateField, readOnly }) {
    // Safely extract teaching data to prevent crashes
    const teachingData = formData?.teaching || {};
    const coursesTaught = teachingData?.courses_taught || [];
    const desc = teachingData?.description_of_duties || '';

    // Safe extraction for nested objects
    const timeTable = teachingData?.time_table || { provided: {}, actual: {} };
    const workloadWeek = teachingData?.workload_week || { odd_semester: {}, even_semester: {} };
    const tutorialsTests = teachingData?.tutorials_tests || { ug_odd: {}, ug_even: {}, pg_odd: {}, pg_even: {} };

    // ==========================================
    // NEW FEATURE: Real-Time Cumulative Score
    // ==========================================
    const currentScore = useMemo(() => {
        let score = 0;

        // 1. Course Engagement Score (Max 40 points)
        if (coursesTaught.length > 0) {
            coursesTaught.forEach(course => {
                const scheduled = Number(course.total_lectures_scheduled) || 0;
                const engaged = Number(course.total_lectures_engaged) || 0;
                
                if (scheduled > 0) {
                    // Give up to 10 points per course based on engagement percentage
                    const engagementRatio = Math.min(engaged / scheduled, 1); 
                    score += (10 * engagementRatio);
                }
            });
        }

        // Cap course score at 40
        score = Math.min(score, 40);

        // 2. Teaching Methods (Max 15 points)
        if (teachingData?.teaching_methods?.trim().length > 20) score += 15;
        else if (teachingData?.teaching_methods?.trim().length > 0) score += 5;

        // 3. ICT Tools (Max 15 points)
        if (teachingData?.ict_tools?.trim().length > 10) score += 15;

        // 4. Student Centric Methods (Max 15 points)
        if (teachingData?.student_centric_methods?.trim().length > 10) score += 15;

        // 5. Assessments & Tutorials (Max 15 points)
        // Award points if any tests were held
        const hasTests = 
            Number(tutorialsTests?.ug_odd?.number_of_tests) > 0 ||
            Number(tutorialsTests?.ug_even?.number_of_tests) > 0 ||
            Number(tutorialsTests?.pg_odd?.number_of_tests) > 0 ||
            Number(tutorialsTests?.pg_even?.number_of_tests) > 0;
            
        if (hasTests) score += 15;

        return Math.round(score); // Return a clean whole number out of 100
    }, [coursesTaught, teachingData, tutorialsTests]);

    // Determine color based on score
    const getScoreColor = () => {
        if (currentScore >= 80) return 'bg-green-100 text-green-800 border-green-200';
        if (currentScore >= 50) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        return 'bg-red-100 text-red-800 border-red-200';
    };

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            
            {/* Header & Score Badge */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-800">Part II - SELF APPRAISAL (Teaching)</h3>
                
                {/* NEW FEATURE UI: Score Card */}
                <div className={`mt-4 md:mt-0 flex items-center px-4 py-2 rounded-full border ${getScoreColor()} shadow-sm transition-all duration-300`}>
                    <FiAward className="mr-2 text-lg" />
                    <span className="font-semibold text-sm">
                        Teaching Impact Score: {currentScore} / 100
                    </span>
                </div>
            </div>

            <div className="space-y-6">
                {/* Description */}
                <div>
                    <label htmlFor="desc-duties" className="block text-sm font-medium text-gray-700 mb-2">Description of Duties</label>
                    <textarea id="desc-duties" rows="3" disabled={readOnly} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 text-sm disabled:bg-gray-50 disabled:text-gray-500 transition-colors" placeholder="Brief description of duties..." value={desc} onChange={(e) => updateField('teaching', 'description_of_duties', e.target.value)}></textarea>
                </div>

                {/* Mandatory Documents (Schema Alignment) */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6">
                    <h4 className="text-md font-semibold text-blue-900 mb-4">Optional Documents</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="property-return" className="block text-sm font-medium text-gray-700 mb-1">Immovable Property Return (Document URL)</label>
                            <input id="property-return" type="text" disabled={readOnly} value={teachingData?.immovable_property_return || ''} onChange={(e) => updateField('teaching', 'immovable_property_return', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors bg-white" placeholder="Paste Google Drive or Cloudinary link..." />
                        </div>
                        <div>
                            <label htmlFor="health-checkup" className="block text-sm font-medium text-gray-700 mb-1">Health Checkup Report (Document URL)</label>
                            <input id="health-checkup" type="text" disabled={readOnly} value={teachingData?.health_checkup_file || ''} onChange={(e) => updateField('teaching', 'health_checkup_file', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors bg-white" placeholder="Paste Google Drive or Cloudinary link..." />
                        </div>
                    </div>
                </div>

                {/* i) Courses taught at various levels */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">i) Courses taught at various levels</h4>
                    <div className="space-y-4">
                        {coursesTaught.map((course, idx) => {
                            const showReasons = Number(course.total_lectures_engaged) < Number(course.total_lectures_scheduled) && course.total_lectures_scheduled !== '';

                            return (
                                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                        <div>
                                            <label htmlFor={`course-name-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Name of the course</label>
                                            <input id={`course-name-${idx}`} type="text" disabled={readOnly} value={course.name_of_course || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'name_of_course', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
                                        </div>
                                        <div>
                                            <label htmlFor={`degree-type-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Degree type of course</label>
                                            <select id={`degree-type-${idx}`} disabled={readOnly} value={course.degree_type || 'UG'} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'degree_type', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors">
                                                <option>UG</option>
                                                <option>PG</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label htmlFor={`lectures-sch-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Total lectures Scheduled</label>
                                            <input id={`lectures-sch-${idx}`} type="number" min="0" disabled={readOnly} value={course.total_lectures_scheduled || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'total_lectures_scheduled', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
                                        </div>
                                        <div>
                                            <label htmlFor={`lectures-eng-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Total lectures engaged</label>
                                            <input id={`lectures-eng-${idx}`} type="number" min="0" disabled={readOnly} value={course.total_lectures_engaged || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'total_lectures_engaged', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
                                        </div>
                                        <div>
                                            <label htmlFor={`tut-sch-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Tutorials Scheduled</label>
                                            <input id={`tut-sch-${idx}`} type="number" min="0" disabled={readOnly} value={course.tutorials_scheduled || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'tutorials_scheduled', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
                                        </div>
                                        <div>
                                            <label htmlFor={`tut-eng-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Tutorials engaged</label>
                                            <input id={`tut-eng-${idx}`} type="number" min="0" disabled={readOnly} value={course.tutorials_engaged || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'tutorials_engaged', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
                                        </div>
                                        <div>
                                            <label htmlFor={`labs-sch-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Labs Scheduled</label>
                                            <input id={`labs-sch-${idx}`} type="number" min="0" disabled={readOnly} value={course.labs_scheduled || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'labs_scheduled', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
                                        </div>
                                        <div>
                                            <label htmlFor={`labs-eng-${idx}`} className="block text-sm font-medium text-gray-700 mb-1">Labs engaged</label>
                                            <input id={`labs-eng-${idx}`} type="number" min="0" disabled={readOnly} value={course.labs_engaged || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'labs_engaged', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
                                        </div>
                                    </div>
                                    
                                    {showReasons && (
                                        <div className="mb-3 p-3 bg-red-50 border border-red-100 rounded-lg">
                                            <label htmlFor={`reasons-${idx}`} className="block text-sm font-medium text-red-800 mb-1">Reasons for not engaging all scheduled classes</label>
                                            <textarea id={`reasons-${idx}`} rows="2" disabled={readOnly} value={course.reasons_not_engaged || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'reasons_not_engaged', e.target.value)} className="w-full border border-red-300 rounded-lg shadow-sm focus:ring-red-500 focus:border-red-500 p-3 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"></textarea>
                                        </div>
                                    )}

                                    {!readOnly && (
                                        <div className="flex justify-end">
                                            <button type="button" onClick={() => removeItem('teaching', 'courses_taught', idx)} className="text-red-600 hover:text-red-800 font-medium text-sm flex items-center"><FiTrash2 className="mr-1"/> Remove Course</button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                        {!readOnly && (
                            <div className="pt-2">
                                <button type="button" onClick={() => addItem('teaching', 'courses_taught', { name_of_course: '', total_lectures_scheduled: '', total_lectures_engaged: '', tutorials_scheduled: '', tutorials_engaged: '', labs_scheduled: '', labs_engaged: '', reasons_not_engaged: '', degree_type: 'UG' })} className="w-full md:w-auto bg-indigo-600 text-white rounded-lg px-6 py-2.5 hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center font-medium"><FiPlus className="mr-2" /> Add Course</button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ii) Total of hours/periods provided in time table vs actually taken */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">ii) Total of hours/ periods provided in the time table</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
                        <div className="font-semibold mb-2">a) Provided in the academic year</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">For odd semester</label>
                                <input type="number" min="0" disabled={readOnly} value={timeTable?.provided?.odd_semester || ''} onChange={(e) => { updateField('teaching', 'time_table', { ...timeTable, provided: { ...timeTable.provided, odd_semester: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">For even semester</label>
                                <input type="number" min="0" disabled={readOnly} value={timeTable?.provided?.even_semester || ''} onChange={(e) => { updateField('teaching', 'time_table', { ...timeTable, provided: { ...timeTable.provided, even_semester: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>

                        <div className="mt-4 font-semibold mb-2">b) Actually taken during the academic year</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">For odd semester</label>
                                <input type="number" min="0" disabled={readOnly} value={timeTable?.actual?.odd_semester || ''} onChange={(e) => { updateField('teaching', 'time_table', { ...timeTable, actual: { ...timeTable.actual, odd_semester: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">For even semester</label>
                                <input type="number" min="0" disabled={readOnly} value={timeTable?.actual?.even_semester || ''} onChange={(e) => { updateField('teaching', 'time_table', { ...timeTable, actual: { ...timeTable.actual, even_semester: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* iii) Work load per week */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">iii) Work load per week</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
                        <div className="font-semibold mb-2 text-indigo-800">For odd semester</div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Lectures</label>
                                <input type="number" min="0" disabled={readOnly} value={workloadWeek?.odd_semester?.lectures || ''} onChange={(e) => { updateField('teaching', 'workload_week', { ...workloadWeek, odd_semester: { ...workloadWeek.odd_semester, lectures: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Tutorials</label>
                                <input type="number" min="0" disabled={readOnly} value={workloadWeek?.odd_semester?.tutorials || ''} onChange={(e) => { updateField('teaching', 'workload_week', { ...workloadWeek, odd_semester: { ...workloadWeek.odd_semester, tutorials: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Practicals</label>
                                <input type="number" min="0" disabled={readOnly} value={workloadWeek?.odd_semester?.practicals || ''} onChange={(e) => { updateField('teaching', 'workload_week', { ...workloadWeek, odd_semester: { ...workloadWeek.odd_semester, practicals: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Seminars</label>
                                <input type="number" min="0" disabled={readOnly} value={workloadWeek?.odd_semester?.seminars || ''} onChange={(e) => { updateField('teaching', 'workload_week', { ...workloadWeek, odd_semester: { ...workloadWeek.odd_semester, seminars: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>

                        <div className="font-semibold mb-2 text-indigo-800">For even semester</div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Lectures</label>
                                <input type="number" min="0" disabled={readOnly} value={workloadWeek?.even_semester?.lectures || ''} onChange={(e) => { updateField('teaching', 'workload_week', { ...workloadWeek, even_semester: { ...workloadWeek.even_semester, lectures: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Tutorials</label>
                                <input type="number" min="0" disabled={readOnly} value={workloadWeek?.even_semester?.tutorials || ''} onChange={(e) => { updateField('teaching', 'workload_week', { ...workloadWeek, even_semester: { ...workloadWeek.even_semester, tutorials: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Practicals</label>
                                <input type="number" min="0" disabled={readOnly} value={workloadWeek?.even_semester?.practicals || ''} onChange={(e) => { updateField('teaching', 'workload_week', { ...workloadWeek, even_semester: { ...workloadWeek.even_semester, practicals: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Seminars</label>
                                <input type="number" min="0" disabled={readOnly} value={workloadWeek?.even_semester?.seminars || ''} onChange={(e) => { updateField('teaching', 'workload_week', { ...workloadWeek, even_semester: { ...workloadWeek.even_semester, seminars: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3) Details of teaching methods employed */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">3) Details of teaching methods employed by you</h4>
                    <textarea rows="3" disabled={readOnly} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" value={teachingData?.teaching_methods || ''} onChange={(e) => updateField('teaching', 'teaching_methods', e.target.value)} placeholder="(Lectures, Tutorials, Seminars, Practicals etc.)"></textarea>
                </div>

                {/* ICT Tools */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">3.1) ICT Tools and Resources Used</h4>
                    <textarea rows="2" disabled={readOnly} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" value={teachingData?.ict_tools || ''} onChange={(e) => updateField('teaching', 'ict_tools', e.target.value)} placeholder="e.g., LCD Projector, Smart Board, Online Resources..."></textarea>
                </div>

                {/* Student Centric Methods */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">3.2) Student Centric Methods</h4>
                    <textarea rows="2" disabled={readOnly} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" value={teachingData?.student_centric_methods || ''} onChange={(e) => updateField('teaching', 'student_centric_methods', e.target.value)} placeholder="(Experiential/Participative/Problem Solving)..."></textarea>
                </div>

                {/* 4 a) Details of Tutorials/tests held */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">4) a) Details of Tutorials/ tests held during the academic year</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
                        <div className="font-semibold mb-2">Under-graduate Courses (Odd Semester)</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Number of tests held</label>
                                <input type="number" min="0" disabled={readOnly} value={tutorialsTests?.ug_odd?.number_of_tests || ''} onChange={(e) => { updateField('teaching', 'tutorials_tests', { ...tutorialsTests, ug_odd: { ...tutorialsTests.ug_odd, number_of_tests: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Assignment checked</label>
                                <input type="number" min="0" disabled={readOnly} value={tutorialsTests?.ug_odd?.assignment_checked || ''} onChange={(e) => { updateField('teaching', 'tutorials_tests', { ...tutorialsTests, ug_odd: { ...tutorialsTests.ug_odd, assignment_checked: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>

                        <div className="font-semibold mb-2">Under-graduate Courses (Even Semester)</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Number of tests held</label>
                                <input type="number" min="0" disabled={readOnly} value={tutorialsTests?.ug_even?.number_of_tests || ''} onChange={(e) => { updateField('teaching', 'tutorials_tests', { ...tutorialsTests, ug_even: { ...tutorialsTests.ug_even, number_of_tests: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Assignment checked</label>
                                <input type="number" min="0" disabled={readOnly} value={tutorialsTests?.ug_even?.assignment_checked || ''} onChange={(e) => { updateField('teaching', 'tutorials_tests', { ...tutorialsTests, ug_even: { ...tutorialsTests.ug_even, assignment_checked: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>

                        <div className="font-semibold mb-2">Post-graduate Courses (Odd Semester)</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Number of tests held</label>
                                <input type="number" min="0" disabled={readOnly} value={tutorialsTests?.pg_odd?.number_of_tests || ''} onChange={(e) => { updateField('teaching', 'tutorials_tests', { ...tutorialsTests, pg_odd: { ...tutorialsTests.pg_odd, number_of_tests: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Assignment checked</label>
                                <input type="number" min="0" disabled={readOnly} value={tutorialsTests?.pg_odd?.assignment_checked || ''} onChange={(e) => { updateField('teaching', 'tutorials_tests', { ...tutorialsTests, pg_odd: { ...tutorialsTests.pg_odd, assignment_checked: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>

                        <div className="font-semibold mb-2">Post-graduate Courses (Even Semester)</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Number of tests held</label>
                                <input type="number" min="0" disabled={readOnly} value={tutorialsTests?.pg_even?.number_of_tests || ''} onChange={(e) => { updateField('teaching', 'tutorials_tests', { ...tutorialsTests, pg_even: { ...tutorialsTests.pg_even, number_of_tests: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Assignment checked</label>
                                <input type="number" min="0" disabled={readOnly} value={tutorialsTests?.pg_even?.assignment_checked || ''} onChange={(e) => { updateField('teaching', 'tutorials_tests', { ...tutorialsTests, pg_even: { ...tutorialsTests.pg_even, assignment_checked: e.target.value } }); }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4 b) academic planning */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">b) Details of academic planning/ presentation of lectures during the session</label>
                    <textarea rows="3" disabled={readOnly} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" value={teachingData?.academic_planning || ''} onChange={(e) => updateField('teaching', 'academic_planning', e.target.value)}></textarea>
                </div>
            </div>
        </div>
    );
}