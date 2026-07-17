// import React from 'react';
// import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

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
//                     <h4 className="text-md font-semibold text-gray-800 mb-2">ii) Total Number of hours/ periods provided in the time table for</h4>
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
// import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';

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
//                     <h4 className="text-md font-semibold text-gray-800 mb-2">ii) Total Number of hours/ periods provided in the time table</h4>
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


//import React from 'react';
import { FiPlus, FiTrash2, FiEdit2 } from 'react-icons/fi';
import { toast } from 'sonner';
import React, { useState } from 'react';
import DynamicTableSection from '../../components/DynamicTableSection';
import FileUpload from '../../components/FileUpload';



const requiredCourseFields = [
    { key: 'name_of_course', label: 'Name of the course', idPrefix: 'course-name' },
    { key: 'course_code', label: 'Course Code', idPrefix: 'course-code' },
    { key: 'degree_type', label: 'Degree type of course', idPrefix: 'degree-type' },
    { key: 'total_lectures_scheduled', label: 'Total lectures Scheduled', idPrefix: 'lectures-sch' },
    { key: 'total_lectures_engaged', label: 'Total lectures engaged', idPrefix: 'lectures-eng' },
    { key: 'tutorials_scheduled', label: 'Tutorials Scheduled', idPrefix: 'tut-sch' },
    { key: 'tutorials_engaged', label: 'Tutorials engaged', idPrefix: 'tut-eng' },
    { key: 'labs_scheduled', label: 'Labs Scheduled', idPrefix: 'labs-sch' },
    { key: 'labs_engaged', label: 'Labs engaged', idPrefix: 'labs-eng' }
];

const isBlankCourseValue = (value) => value === null || value === undefined || String(value).trim() === '';

const courseEngagementLimits = [
    {
        scheduledKey: 'total_lectures_scheduled',
        engagedKey: 'total_lectures_engaged',
        scheduledLabel: 'Total lectures Scheduled',
        engagedLabel: 'Total lectures engaged',
        idPrefix: 'lectures-eng'
    },
    {
        scheduledKey: 'tutorials_scheduled',
        engagedKey: 'tutorials_engaged',
        scheduledLabel: 'Tutorials Scheduled',
        engagedLabel: 'Tutorials engaged',
        idPrefix: 'tut-eng'
    },
    {
        scheduledKey: 'labs_scheduled',
        engagedKey: 'labs_engaged',
        scheduledLabel: 'Labs Scheduled',
        engagedLabel: 'Labs engaged',
        idPrefix: 'labs-eng'
    }
];

const hasEngagedLessThanScheduled = (course = {}) => courseEngagementLimits.some(({ scheduledKey, engagedKey }) => {
    if (isBlankCourseValue(course[scheduledKey]) || isBlankCourseValue(course[engagedKey])) return false;
    const scheduled = Number(course[scheduledKey]);
    const engaged = Number(course[engagedKey]);
    return Number.isFinite(scheduled) && Number.isFinite(engaged) && engaged < scheduled;
});

const validateSingleCourse = (course) => {
    const missingField = requiredCourseFields.find(({ key }) => {
        const courseType = course.course_type || 'Theory';
        if (courseType === 'Practical' && key.startsWith('total_lectures')) return false;
        if (courseType === 'Theory' && key.startsWith('labs_')) return false;

        const value = key === 'degree_type' ? (course[key] || 'UG') : course[key];
        return isBlankCourseValue(value);
    });
    if (missingField) {
        return {
            idPrefix: missingField.idPrefix,
            message: `Please fill ${missingField.label}.`
        };
    }

    const exceededLimit = courseEngagementLimits.find(({ scheduledKey, engagedKey }) => {
        const scheduled = Number(course[scheduledKey]);
        const engaged = Number(course[engagedKey]);
        return Number.isFinite(scheduled) && Number.isFinite(engaged) && engaged > scheduled;
    });
    if (exceededLimit) {
        return {
            idPrefix: exceededLimit.idPrefix,
            message: `${exceededLimit.engagedLabel} cannot exceed ${exceededLimit.scheduledLabel}.`
        };
    }

    if (hasEngagedLessThanScheduled(course) && isBlankCourseValue(course.reasons_not_engaged)) {
        return {
            idPrefix: 'reasons',
            message: `Please fill reasons for not engaging all scheduled classes.`
        };
    }
    return null;
};


export default function PartII({ formData, academicYear, addItem, removeItem, updateArrayField, updateArrayItem, updateAssessment, updateField, readOnly, triggerSave }) {
    // Safely extract teaching data to prevent crashes
    const teachingData = formData?.teaching || {};
    const coursesTaught = teachingData?.courses_taught || [];
    const descDept = teachingData?.description_of_duties_department || '';
    const descAdmin = teachingData?.description_of_duties_admin || '';

    // Helper handlers generator for DynamicTableSection
    const createHandlers = (category, field) => ({
        onAdd: (item) => addItem(category, field, item),
        onUpdate: (index, newItem) => updateArrayItem(category, field, index, newItem),
        onRemove: removeItem ? (index) => removeItem(category, field, index) : undefined
    });

    // Safe extraction for nested objects
    const timeTable = teachingData?.time_table || { provided: {}, actual: {} };
    const workloadWeek = teachingData?.workload_week || { odd_semester: {}, even_semester: {} };
    const tutorialsTests = teachingData?.tutorials_tests || { ug_odd: {}, ug_even: {}, pg_odd: {}, pg_even: {} };

    const calculatedAcademicYearStr = (() => {
        const start = formData?.personal?.report_start_date;
        const end = formData?.personal?.report_end_date;
        if (!start || !end) return '';
        const startYear = new Date(start).getFullYear();
        const endYear = new Date(end).getFullYear();
        if (!Number.isFinite(startYear) || !Number.isFinite(endYear)) return '';
        return `${startYear}-${String(endYear).slice(-2)}`;
    })();
    const academicYearStr = academicYear || calculatedAcademicYearStr || 'unknown_ay';

    const handleDirectUpload = (field, val) => {
        updateField('teaching', field, val);
        if (triggerSave) {
            const nextData = {
                ...formData,
                teaching: {
                    ...(formData?.teaching || {}),
                    [field]: val
                }
            };
            triggerSave(nextData);
        }
    };

    let age = 0;
    if (formData?.personal?.date_of_birth) {
        const dob = new Date(formData.personal.date_of_birth);
        const diff = Date.now() - dob.getTime();
        age = Math.floor(diff / (1000 * 60 * 60 * 24 * 365.25));
    }
    const isHealthCheckupMandatory = age > 40;

    const [errors, setErrors] = useState({});
    const [editingCourseIndex, setEditingCourseIndex] = useState(null); // null: table, -1: new, >= 0: edit
    const [tempCourse, setTempCourse] = useState(null);

    const validateURLField = (value, label) => {
        if (!value?.trim()) return '';

        try {
            const url = new URL(value);

            if (
                url.protocol !== 'http:' &&
                url.protocol !== 'https:'
            ) {
                return `${label} must be a valid URL`;
            }

            return '';
        } catch {
            return `${label} must contain only a valid URL`;
        }
    };

    const handleURLBlur = (field, value, label) => {
        const error = validateURLField(value, label);

        setErrors((prev) => ({
            ...prev,
            [field]: error,
        }));

        return !error;
    };

    const validateOptionalDocuments = () => {
        const newErrors = {};

        const propertyError = validateURLField(
            teachingData?.immovable_property_return,
            'Immovable Property Return'
        );

        const healthError = validateURLField(
            teachingData?.health_checkup_file,
            'Health Checkup Report'
        );

        if (propertyError) {
            newErrors.immovable_property_return = propertyError;
        }

        if (healthError) {
            newErrors.health_checkup_file = healthError;
        }

        setErrors((prev) => ({
            ...prev,
            ...newErrors,
        }));

        return Object.keys(newErrors).length === 0;
    };
    const handleStartAddCourse = () => {
        setEditingCourseIndex(-1);
        setTempCourse({ name_of_course: '', course_code: '', semester: 'Odd', course_type: 'Theory', total_lectures_scheduled: '', total_lectures_engaged: '', extra_lectures_engaged: '', tutorials_scheduled: '', tutorials_engaged: '', extra_tutorials_engaged: '', labs_scheduled: '', labs_engaged: '', extra_labs_engaged: '', reasons_not_engaged: '', degree_type: 'UG' });
    };

    const handleStartEditCourse = (idx) => {
        setEditingCourseIndex(idx);
        setTempCourse({ ...coursesTaught[idx] });
    };

    const handleSaveCourse = () => {
        const issue = validateSingleCourse(tempCourse);
        if (issue) {
            toast.error(issue.message);
            const field = document.getElementById(`${issue.idPrefix}-temp`);
            if (field) {
                field.focus();
                if (typeof field.reportValidity === 'function') field.reportValidity();
            }
            return;
        }

        if (editingCourseIndex === -1) {
            addItem('teaching', 'courses_taught', tempCourse);
        } else {
            const newArray = [...coursesTaught];
            newArray[editingCourseIndex] = tempCourse;
            updateField('teaching', 'courses_taught', newArray);
        }
        
        setEditingCourseIndex(null);
        setTempCourse(null);
    };

    const handleEngagedBlurTemp = (limit) => {
        if (!tempCourse) return;
        const scheduledValue = tempCourse[limit.scheduledKey];
        const engagedValue = tempCourse[limit.engagedKey];

        if (isBlankCourseValue(scheduledValue) || isBlankCourseValue(engagedValue)) return;

        const scheduled = Number(scheduledValue);
        const engaged = Number(engagedValue);

        if (!Number.isFinite(scheduled) || !Number.isFinite(engaged) || engaged <= scheduled) return;

        toast.error(`${limit.engagedLabel} cannot exceed ${limit.scheduledLabel}.`);
        setTempCourse(prev => ({ ...prev, [limit.engagedKey]: '' }));

        window.setTimeout(() => {
            const field = document.getElementById(`${limit.idPrefix}-temp`);
            if (field) field.focus();
        }, 0);
    };

    const validateTimeTableHours = (semester) => {
    const provided = Number(timeTable?.provided?.[semester] || 0);
    const actual = Number(timeTable?.actual?.[semester] || 0);

    if (!Number.isFinite(provided) || !Number.isFinite(actual) || actual <= provided) {
        return;
    }

    toast.error(
        `Actually taken hours cannot exceed provided hours for ${semester === 'odd_semester' ? 'odd semester' : 'even semester'
        }.`
    );

    updateField('teaching', 'time_table', {
        ...timeTable,
        actual: {
            ...timeTable.actual,
            [semester]: ''
        }
    });

    window.setTimeout(() => {
        const field = document.getElementById(
            semester === 'odd_semester'
                ? 'time-table-actual-odd'
                : 'time-table-actual-even'
        );

        if (field) field.focus();
    }, 0);
};
    const isNumberInput = (target) => target?.tagName === 'INPUT' && target.type === 'number';

    const handleNumberKeyDownCapture = (e) => {
        if (!isNumberInput(e.target)) return;
        if (['e', 'E', '+', '-', '.'].includes(e.key)) {
            e.preventDefault();
        }
    };

    const handleNumberPasteCapture = (e) => {
        if (!isNumberInput(e.target)) return;
        const pastedText = e.clipboardData?.getData('text') || '';
        if (!/^\d*$/.test(pastedText)) {
            e.preventDefault();
        }
    };

    const handleNumberInputCapture = (e) => {
        if (!isNumberInput(e.target)) return;
        const integerValue = String(e.target.value || '').replace(/\D/g, '');
        if (e.target.value !== integerValue) {
            e.target.value = integerValue;
        }
    };

    return (
        <div
            className="p-2 space-y-6"
            onInputCapture={handleNumberInputCapture}
            onKeyDownCapture={handleNumberKeyDownCapture}
            onPasteCapture={handleNumberPasteCapture}
        >
            {/* Header & Score Badge */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-gray-100 pb-4">
                <h3 className="text-xl font-bold text-gray-800 flex items-center">
                    <span className="bg-indigo-100 text-indigo-700 p-2 rounded-lg mr-3">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                    </span>
                    Part II - SELF APPRAISAL (Teaching)
                </h3>
            </div>

            <div className="space-y-6">
                {/* Description of Duties */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DynamicTableSection
                        title="Description of Duties (Department Level)"
                        data={teachingData?.description_of_duties_department || []}
                        uniqueKey="description"
                        {...createHandlers('teaching', 'description_of_duties_department')}
                        readOnly={readOnly}
                        initialItem={{ description: '', proof: '' }}
                        fields={[
                            { label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Enter duty details' },
                            { label: 'Proof Document', key: 'proof', type: 'file', fullWidth: true, required: true }
                        ]}
                    />
                    <DynamicTableSection
                        title="Description of Duties (Administration)"
                        data={teachingData?.description_of_duties_admin || []}
                        uniqueKey="description"
                        {...createHandlers('teaching', 'description_of_duties_admin')}
                        readOnly={readOnly}
                        initialItem={{ description: '', proof: '' }}
                        fields={[
                            { label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Enter administration duty details' },
                            { label: 'Proof Document', key: 'proof', type: 'file', fullWidth: true, required: true }
                        ]}
                    />
                </div>

                {/* Mandatory Documents (Schema Alignment) */}
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6 mb-6">
                    <h4 className="text-md font-semibold text-blue-900 mb-4">Optional Documents</h4>
                    {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="property-return" className="block text-sm font-medium text-gray-700 mb-1">Immovable Property Return (Document URL)</label>
                            <input id="property-return" type="text" disabled={readOnly} value={teachingData?.immovable_property_return || ''} onChange={(e) => updateField('teaching', 'immovable_property_return', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors bg-white" placeholder="Paste Google Drive or Cloudinary link..." />
                        </div>
                        <div>
                            <label htmlFor="health-checkup" className="block text-sm font-medium text-gray-700 mb-1">Health Checkup Report (Document URL)</label>
                            <input id="health-checkup" type="text" disabled={readOnly} value={teachingData?.health_checkup_file || ''} onChange={(e) => updateField('teaching', 'health_checkup_file', e.target.value)} className="w-full border border-gray-300 rounded-lg shadow-sm focus:ring-blue-500 focus:border-blue-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors bg-white" placeholder="Paste Google Drive or Cloudinary link..." />
                        </div>
                    </div> */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Health Checkup Report (PDF Document) - Age: {age > 0 ? age : 'N/A'} {isHealthCheckupMandatory ? <span className="text-red-500">*</span> : <span className="text-gray-400 font-normal ml-1">(Optional)</span>}
                </label>
                {isHealthCheckupMandatory && (
                    <p className="text-xs text-gray-500 mb-2">Mandatory as your age is above 40 years.</p>
                )}
                <FileUpload
                    value={teachingData?.health_checkup_file}
                    onChange={(val) => handleDirectUpload('health_checkup_file', val)}
                    disabled={readOnly}
                    directMinio={true}
                    academicYear={academicYearStr}
                    required={isHealthCheckupMandatory}
                />
                {errors?.health_checkup_file && (
                    <p className="text-red-500 text-sm mt-1">
                        {errors.health_checkup_file}
                    </p>
                )}
            </div>
                </div>

                {/* 1.1 Courses taught at various levels */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">1.1 Courses taught at various levels</h4>
                    <div className="space-y-4">
                        {editingCourseIndex === null ? (
                            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-gray-50 text-gray-700">
                                            <tr>
                                                <th className="px-4 py-3 border-b text-center w-16">S.No.</th>
                                                <th className="px-4 py-3 border-b">Course Name</th>
                                                <th className="px-4 py-3 border-b">Course Code</th>
                                                <th className="px-4 py-3 border-b">Degree Type</th>
                                                <th className="px-4 py-3 border-b">Semester</th>
                                                <th className="px-4 py-3 border-b">Course Type</th>
                                                <th className="px-4 py-3 border-b text-center">Lectures (Sch/Eng/Ext)</th>
                                                <th className="px-4 py-3 border-b text-center">Tutorials (Sch/Eng/Ext)</th>
                                                <th className="px-4 py-3 border-b text-center">Labs (Sch/Eng/Ext)</th>
                                                {!readOnly && <th className="px-4 py-3 border-b text-right">Actions</th>}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {coursesTaught.length === 0 ? (
                                                <tr>
                                                    <td colSpan={!readOnly ? 8 : 7} className="px-4 py-8 text-center text-gray-500">
                                                        No courses added yet.
                                                    </td>
                                                </tr>
                                            ) : (
                                                coursesTaught.map((course, idx) => (
                                                    <tr key={idx} className="border-b hover:bg-gray-50 transition-colors">
                                                        <td className="px-4 py-3 text-center">{idx + 1}</td>
                                                        <td className="px-4 py-3 font-medium text-gray-900">{course.name_of_course || '-'}</td>
                                                        <td className="px-4 py-3 font-medium text-gray-900">{course.course_code || '-'}</td>
                                                        <td className="px-4 py-3">{course.degree_type || 'UG'}</td>
                                                        <td className="px-4 py-3">{course.semester || 'Odd'}</td>
                                                        <td className="px-4 py-3">{course.course_type || 'Theory'}</td>
                                                        <td className="px-4 py-3 text-center">{course.total_lectures_scheduled || 0} / {course.total_lectures_engaged || 0} / {course.extra_lectures_engaged || 0}</td>
                                                        <td className="px-4 py-3 text-center">{course.tutorials_scheduled || 0} / {course.tutorials_engaged || 0} / {course.extra_tutorials_engaged || 0}</td>
                                                        <td className="px-4 py-3 text-center">{course.labs_scheduled || 0} / {course.labs_engaged || 0} / {course.extra_labs_engaged || 0}</td>
                                                        {!readOnly && (
                                                            <td className="px-4 py-3 text-right">
                                                                <button type="button" onClick={() => handleStartEditCourse(idx)} className="text-blue-600 hover:text-blue-800 p-1 mr-2" title="Edit"><FiEdit2 /></button>
                                                                <button type="button" onClick={() => removeItem('teaching', 'courses_taught', idx)} className="text-red-600 hover:text-red-800 p-1" title="Delete"><FiTrash2 /></button>
                                                            </td>
                                                        )}
                                                    </tr>
                                                ))
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                                {!readOnly && (
                                    <div className="p-4 bg-gray-50 border-t">
                                        <button type="button" onClick={handleStartAddCourse} className="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 shadow-sm transition-colors flex items-center font-medium text-sm">
                                            <FiPlus className="mr-1.5" /> Add Course
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="bg-indigo-50/30 border border-indigo-100 rounded-lg p-6">
                                <h5 className="font-semibold text-indigo-900 mb-4">{editingCourseIndex === -1 ? 'Add New Course' : 'Edit Course'}</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label htmlFor="course-name-temp" className="block text-sm font-medium text-gray-700 mb-1">Name of the course <span className="text-red-500">*</span></label>
                                        <input id="course-name-temp" type="text" required disabled={readOnly} value={tempCourse.name_of_course || ''} onChange={(e) => setTempCourse(prev => ({ ...prev, name_of_course: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="course-code-temp" className="block text-sm font-medium text-gray-700 mb-1">Course Code <span className="text-red-500">*</span></label>
                                        <input id="course-code-temp" type="text" required disabled={readOnly} value={tempCourse.course_code || ''} onChange={(e) => setTempCourse(prev => ({ ...prev, course_code: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="degree-type-temp" className="block text-sm font-medium text-gray-700 mb-1">Degree type of course <span className="text-red-500">*</span></label>
                                        <select id="degree-type-temp" required disabled={readOnly} value={tempCourse.degree_type || 'UG'} onChange={(e) => setTempCourse(prev => ({ ...prev, degree_type: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5">
                                            <option>UG</option>
                                            <option>PG</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="semester-temp" className="block text-sm font-medium text-gray-700 mb-1">Semester <span className="text-red-500">*</span></label>
                                        <select id="semester-temp" required disabled={readOnly} value={tempCourse.semester || 'Odd'} onChange={(e) => setTempCourse(prev => ({ ...prev, semester: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5">
                                            <option value="Odd">Odd Semester</option>
                                            <option value="Even">Even Semester</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="course-type-temp" className="block text-sm font-medium text-gray-700 mb-1">Course Type <span className="text-red-500">*</span></label>
                                        <select id="course-type-temp" required disabled={readOnly} value={tempCourse.course_type || 'Theory'} onChange={(e) => { const newType = e.target.value; setTempCourse(prev => { const next = { ...prev, course_type: newType }; if (newType === 'Theory') { next.labs_scheduled = ''; next.labs_engaged = ''; next.extra_labs_engaged = ''; } else if (newType === 'Practical') { next.total_lectures_scheduled = ''; next.total_lectures_engaged = ''; next.extra_lectures_engaged = ''; } return next; }); }} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5">
                                            <option value="Theory">Theory</option>
                                            <option value="Practical">Practical</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label htmlFor="lectures-sch-temp" className="block text-sm font-medium text-gray-700 mb-1">Total lectures Scheduled <span className="text-red-500">*</span></label>
                                        <input id="lectures-sch-temp" type="number" min="0" required={(tempCourse.course_type || 'Theory') !== 'Practical'} disabled={readOnly || (tempCourse.course_type || 'Theory') === 'Practical'} value={tempCourse.total_lectures_scheduled || ''} onChange={(e) => setTempCourse(prev => ({ ...prev, total_lectures_scheduled: e.target.value, extra_lectures_engaged: (Number(e.target.value) === Number(prev.total_lectures_engaged) ? prev.extra_lectures_engaged : '') }))} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="lectures-eng-temp" className="block text-sm font-medium text-gray-700 mb-1">Total lectures engaged <span className="text-red-500">*</span></label>
                                        <input id="lectures-eng-temp" type="number" min="0" max={tempCourse.total_lectures_scheduled || ''} required={(tempCourse.course_type || 'Theory') !== 'Practical'} disabled={readOnly || (tempCourse.course_type || 'Theory') === 'Practical'} value={tempCourse.total_lectures_engaged || ''} onChange={(e) => setTempCourse(prev => ({ ...prev, total_lectures_engaged: e.target.value, extra_lectures_engaged: (Number(e.target.value) === Number(prev.total_lectures_scheduled) ? prev.extra_lectures_engaged : '') }))} onBlur={() => handleEngagedBlurTemp(courseEngagementLimits[0])} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="extra-lectures-eng-temp" className="block text-sm font-medium text-gray-700 mb-1">Extra lectures engaged (Optional)</label>
                                        <input id="extra-lectures-eng-temp" type="number" min="0" disabled={readOnly || (tempCourse.course_type || 'Theory') === 'Practical' || !tempCourse.total_lectures_scheduled || !tempCourse.total_lectures_engaged || Number(tempCourse.total_lectures_scheduled) !== Number(tempCourse.total_lectures_engaged)} value={tempCourse.extra_lectures_engaged || ''} onChange={(e) => setTempCourse(prev => ({ ...prev, extra_lectures_engaged: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                                    </div>
                                    
                                    <div>
                                        <label htmlFor="tut-sch-temp" className="block text-sm font-medium text-gray-700 mb-1">Tutorials Scheduled <span className="text-red-500">*</span></label>
                                        <input id="tut-sch-temp" type="number" min="0" required disabled={readOnly} value={tempCourse.tutorials_scheduled || ''} onChange={(e) => setTempCourse(prev => ({ ...prev, tutorials_scheduled: e.target.value, extra_tutorials_engaged: (Number(e.target.value) === Number(prev.tutorials_engaged) ? prev.extra_tutorials_engaged : '') }))} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="tut-eng-temp" className="block text-sm font-medium text-gray-700 mb-1">Tutorials engaged <span className="text-red-500">*</span></label>
                                        <input id="tut-eng-temp" type="number" min="0" max={tempCourse.tutorials_scheduled || ''} required disabled={readOnly} value={tempCourse.tutorials_engaged || ''} onChange={(e) => setTempCourse(prev => ({ ...prev, tutorials_engaged: e.target.value, extra_tutorials_engaged: (Number(e.target.value) === Number(prev.tutorials_scheduled) ? prev.extra_tutorials_engaged : '') }))} onBlur={() => handleEngagedBlurTemp(courseEngagementLimits[1])} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5" />
                                    </div>
                                    <div>
                                        <label htmlFor="extra-tut-eng-temp" className="block text-sm font-medium text-gray-700 mb-1">Extra tutorials engaged (Optional)</label>
                                        <input id="extra-tut-eng-temp" type="number" min="0" disabled={readOnly || !tempCourse.tutorials_scheduled || !tempCourse.tutorials_engaged || Number(tempCourse.tutorials_scheduled) !== Number(tempCourse.tutorials_engaged)} value={tempCourse.extra_tutorials_engaged || ''} onChange={(e) => setTempCourse(prev => ({ ...prev, extra_tutorials_engaged: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                                    </div>

                                    <div>
                                        <label htmlFor="labs-sch-temp" className="block text-sm font-medium text-gray-700 mb-1">Labs Scheduled <span className="text-red-500">*</span></label>
                                        <input id="labs-sch-temp" type="number" min="0" required={(tempCourse.course_type || 'Theory') === 'Practical'} disabled={readOnly || (tempCourse.course_type || 'Theory') === 'Theory'} value={tempCourse.labs_scheduled || ''} onChange={(e) => setTempCourse(prev => ({ ...prev, labs_scheduled: e.target.value, extra_labs_engaged: (Number(e.target.value) === Number(prev.labs_engaged) ? prev.extra_labs_engaged : '') }))} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="labs-eng-temp" className="block text-sm font-medium text-gray-700 mb-1">Labs engaged <span className="text-red-500">*</span></label>
                                        <input id="labs-eng-temp" type="number" min="0" max={tempCourse.labs_scheduled || ''} required={(tempCourse.course_type || 'Theory') === 'Practical'} disabled={readOnly || (tempCourse.course_type || 'Theory') === 'Theory'} value={tempCourse.labs_engaged || ''} onChange={(e) => setTempCourse(prev => ({ ...prev, labs_engaged: e.target.value, extra_labs_engaged: (Number(e.target.value) === Number(prev.labs_scheduled) ? prev.extra_labs_engaged : '') }))} onBlur={() => handleEngagedBlurTemp(courseEngagementLimits[2])} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                                    </div>
                                    <div>
                                        <label htmlFor="extra-labs-eng-temp" className="block text-sm font-medium text-gray-700 mb-1">Extra labs engaged (Optional)</label>
                                        <input id="extra-labs-eng-temp" type="number" min="0" disabled={readOnly || (tempCourse.course_type || 'Theory') === 'Theory' || !tempCourse.labs_scheduled || !tempCourse.labs_engaged || Number(tempCourse.labs_scheduled) !== Number(tempCourse.labs_engaged)} value={tempCourse.extra_labs_engaged || ''} onChange={(e) => setTempCourse(prev => ({ ...prev, extra_labs_engaged: e.target.value }))} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                                    </div>
                                </div>
                                
                                {hasEngagedLessThanScheduled(tempCourse) && (
                                    <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-lg">
                                        <label htmlFor="reasons-temp" className="block text-sm font-medium text-red-800 mb-1">Reasons for not engaging all scheduled classes<span className="text-red-500">*</span></label>
                                        <textarea id="reasons-temp" rows="2" required disabled={readOnly} value={tempCourse.reasons_not_engaged || ''} onChange={(e) => setTempCourse(prev => ({ ...prev, reasons_not_engaged: e.target.value }))} className="w-full bg-white border border-red-300 text-red-900 rounded-lg shadow-sm focus:ring-2 focus:ring-red-500/30 focus:border-red-500 hover:border-red-400 transition-all duration-200 p-3"></textarea>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3 mt-4">
                                    <button type="button" onClick={() => { setEditingCourseIndex(null); setTempCourse(null); }} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors">Cancel</button>
                                    <button type="button" onClick={handleSaveCourse} className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg font-medium transition-colors shadow-sm">Save Course</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* 1.2 Total of hours/periods provided in time table vs actually taken */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">1.2 Total Number of hours/ periods provided in the time table <span className="text-sm font-normal text-gray-500">(Only numbers allowed)</span></h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
                        <div className="font-semibold mb-2">a) Provided in the academic year</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">For odd semester<span className="text-red-500">*</span></label>
                                <input id="time-table-provided-odd" type="number" min="0" required disabled={readOnly} value={timeTable?.provided?.odd_semester || ''} onChange={(e) => { updateField('teaching', 'time_table', { ...timeTable, provided: { ...timeTable.provided, odd_semester: e.target.value } }); }} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">For even semester<span className="text-red-500">*</span></label>
                                <input id="time-table-provided-even" type="number" min="0" required disabled={readOnly} value={timeTable?.provided?.even_semester || ''} onChange={(e) => { updateField('teaching', 'time_table', { ...timeTable, provided: { ...timeTable.provided, even_semester: e.target.value } }); }} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>

                        <div className="mt-4 font-semibold mb-2">b) Actually taken during the academic year</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">For odd semester<span className="text-red-500">*</span></label>
                                <input id="time-table-actual-odd" type="number" min="0" max={timeTable?.provided?.odd_semester || ''} required disabled={readOnly} value={timeTable?.actual?.odd_semester || ''} onChange={(e) => { updateField('teaching', 'time_table', { ...timeTable, actual: { ...timeTable.actual, odd_semester: e.target.value } }); }} onBlur={() => validateTimeTableHours('odd_semester')} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">For even semester<span className="text-red-500">*</span></label>
                                <input id="time-table-actual-even" type="number" min="0" max={timeTable?.provided?.even_semester || ''} required disabled={readOnly} value={timeTable?.actual?.even_semester || ''} onChange={(e) => { updateField('teaching', 'time_table', { ...timeTable, actual: { ...timeTable.actual, even_semester: e.target.value } }); }} onBlur={() => validateTimeTableHours('even_semester')} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 1.3 Work load per week */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">1.3 Work load per week <span className="text-sm font-normal text-gray-500">(Only numbers allowed)</span></h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
                        <div className="font-semibold mb-2 text-indigo-800">For odd semester</div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Lectures<span className="text-red-500">*</span></label>
                                <input type="number" min="0" required disabled={readOnly} value={workloadWeek?.odd_semester?.lectures || ''} onChange={(e) => { updateField('teaching', 'workload_week', { ...workloadWeek, odd_semester: { ...workloadWeek.odd_semester, lectures: e.target.value } }); }} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Tutorials<span className="text-red-500">*</span></label>
                                <input type="number" min="0" required disabled={readOnly} value={workloadWeek?.odd_semester?.tutorials || ''} onChange={(e) => { updateField('teaching', 'workload_week', { ...workloadWeek, odd_semester: { ...workloadWeek.odd_semester, tutorials: e.target.value } }); }} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Practicals<span className="text-red-500">*</span></label>
                                <input type="number" min="0" required disabled={readOnly} value={workloadWeek?.odd_semester?.practicals || ''} onChange={(e) => { updateField('teaching', 'workload_week', { ...workloadWeek, odd_semester: { ...workloadWeek.odd_semester, practicals: e.target.value } }); }} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Seminars<span className="text-red-500">*</span></label>
                                <input type="number" min="0" required disabled={readOnly} value={workloadWeek?.odd_semester?.seminars || ''} onChange={(e) => { updateField('teaching', 'workload_week', { ...workloadWeek, odd_semester: { ...workloadWeek.odd_semester, seminars: e.target.value } }); }} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>

                        <div className="font-semibold mb-2 text-indigo-800">For even semester</div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Lectures<span className="text-red-500">*</span></label>
                                <input type="number" min="0" required disabled={readOnly} value={workloadWeek?.even_semester?.lectures || ''} onChange={(e) => { updateField('teaching', 'workload_week', { ...workloadWeek, even_semester: { ...workloadWeek.even_semester, lectures: e.target.value } }); }} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Tutorials<span className="text-red-500">*</span></label>
                                <input type="number" min="0" required disabled={readOnly} value={workloadWeek?.even_semester?.tutorials || ''} onChange={(e) => { updateField('teaching', 'workload_week', { ...workloadWeek, even_semester: { ...workloadWeek.even_semester, tutorials: e.target.value } }); }} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Practicals<span className="text-red-500">*</span></label>
                                <input type="number" min="0" required disabled={readOnly} value={workloadWeek?.even_semester?.practicals || ''} onChange={(e) => { updateField('teaching', 'workload_week', { ...workloadWeek, even_semester: { ...workloadWeek.even_semester, practicals: e.target.value } }); }} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Seminars<span className="text-red-500">*</span></label>
                                <input type="number" min="0" required disabled={readOnly} value={workloadWeek?.even_semester?.seminars || ''} onChange={(e) => { updateField('teaching', 'workload_week', { ...workloadWeek, even_semester: { ...workloadWeek.even_semester, seminars: e.target.value } }); }} className="w-full bg-gray-50 border border-gray-200 text-gray-900 rounded-lg shadow-sm focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 hover:border-indigo-300 transition-all duration-200 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2) Visit of faculty to other institution */}
                <DynamicTableSection
                    title="2) Visit of faculty to other institution for taking Experts’ Lectures/other academic work"
                    data={teachingData?.faculty_visits_other_institutions || []}
                    uniqueKey="title_of_activity"
                    {...createHandlers('teaching', 'faculty_visits_other_institutions')}
                    readOnly={readOnly}
                    initialItem={{ institution: '', nature_of_visit: '', title_of_activity: '', role_of_faculty: '', date_of_visit: '', mode: '', level: '' }}
                    fields={[
                        { label: 'Institution/Organisation Visited', key: 'institution', required: true, placeholder: 'Enter institution' },
                        { label: 'Nature of Visit/Academic Engagement', key: 'nature_of_visit', required: true, placeholder: 'e.g. Expert Lecture' },
                        { label: 'Title/Topic of Activity', key: 'title_of_activity', required: true, placeholder: 'Enter topic' },
                        { label: 'Role of Faculty Member', key: 'role_of_faculty', required: true, placeholder: 'e.g. Keynote Speaker' },
                        { label: 'Date(s) of Visit', key: 'date_of_visit', required: true, placeholder: 'e.g. 15-Aug-2023 to 17-Aug-2023' },
                        { label: 'Mode', key: 'mode', type: 'select', options: ['Physical', 'Online', 'Hybrid'], required: true },
                        { label: 'Level', key: 'level', type: 'select', options: ['International', 'National', 'State', 'Institutional'], required: true }
                    ]}
                />

                {/* 3) Details of teaching methods employed */}
                <DynamicTableSection
                    title="3) Details of teaching methods employed by you (Lectures, Tutorials, Seminars, Practicals etc.)"
                    data={teachingData?.teaching_methods || []}
                    uniqueKey="description"
                    {...createHandlers('teaching', 'teaching_methods')}
                    readOnly={readOnly}
                    initialItem={{ description: '' }}
                    fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Enter teaching method details' }]}
                />

                {/* ICT Tools */}
                <DynamicTableSection
                    title="3.1) ICT Tools and Resources Used"
                    data={teachingData?.ict_tools || []}
                    uniqueKey="description"
                    {...createHandlers('teaching', 'ict_tools')}
                    readOnly={readOnly}
                    initialItem={{ description: '', room_no: '' }}
                    fields={[
                        { label: 'Description', key: 'description', required: true, placeholder: 'Enter ICT tools details' },
                        { label: 'Room No', key: 'room_no', placeholder: 'Enter Room No' }
                    ]}
                />

                {/* Student Centric Methods */}
                <DynamicTableSection
                    title="3.2) Student Centric Methods (Experiential/Participative/Problem Solving)"
                    data={teachingData?.student_centric_methods || []}
                    uniqueKey="description"
                    {...createHandlers('teaching', 'student_centric_methods')}
                    readOnly={readOnly}
                    initialItem={{ description: '' }}
                    fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Enter student centric method details' }]}
                />

                {/* 4.1 Details of Tutorials/tests held */}
                <DynamicTableSection
                    title="4.1 Details of Tutorials/ tests held during the academic year (Only numbers allowed)"
                    data={Array.isArray(teachingData?.tutorials_tests) ? teachingData.tutorials_tests : []}
                    uniqueKey=""
                    {...createHandlers('teaching', 'tutorials_tests')}
                    readOnly={readOnly}
                    initialItem={{ course_name: '', course_code: '', semester: '', degree_type: '', number_of_tests: '', assignment_checked: '' }}
                    fields={[
                        { label: 'Course Name', key: 'course_name', type: 'select', options: [...new Set(coursesTaught.map(c => c.name_of_course).filter(Boolean))], required: true },
                        { label: 'Course Code', key: 'course_code', type: 'select', options: [...new Set(coursesTaught.map(c => c.course_code).filter(Boolean))], required: true },
                        { label: 'Semester', key: 'semester', type: 'select', options: ['Odd', 'Even'], required: true },
                        { label: 'Degree Type', key: 'degree_type', type: 'select', options: ['UG', 'PG'], required: true },
                        { label: 'Number of tests held', key: 'number_of_tests', type: 'number', required: true, placeholder: 'Enter number' },
                        { label: 'Assignment Assigned', key: 'assignment_checked', type: 'number', required: true, placeholder: 'Enter number' }
                    ]}
                />

                {/* 4.2 academic planning */}
                <DynamicTableSection
                    title="4.2 Details of academic planning/ presentation of lectures during the session"
                    data={teachingData?.academic_planning || []}
                    uniqueKey="description"
                    {...createHandlers('teaching', 'academic_planning')}
                    readOnly={readOnly}
                    initialItem={{ description: '' }}
                    fields={[{ label: 'Description', key: 'description', fullWidth: true, required: true, placeholder: 'Enter details' }]}
                />
            </div>
        </div>
    );
}
