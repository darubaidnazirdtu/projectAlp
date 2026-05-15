import React from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';

export default function PartII({ formData, addItem, removeItem, updateArrayField, updateAssessment, updateField, readOnly }) {
    const desc = (formData && formData.teaching && formData.teaching.description_of_duties) || '';
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <h3 className="text-xl font-bold text-gray-800 mb-6 border-b border-gray-100 pb-4">Part II - SELF APPRAISAL</h3>

            <div className="space-y-6">
                {/* Description */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Description of Duties</label>
                    <textarea rows="3" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 text-sm disabled:bg-gray-50 disabled:text-gray-500 transition-colors" placeholder="Brief description of duties..." value={desc} onChange={(e) => updateField('teaching', 'description_of_duties', e.target.value)} ></textarea>
                </div>
                {/* i) Courses taught at various levels */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">i) Courses taught at various levels</h4>
                    <div className="space-y-4">
                        {formData.teaching.courses_taught.map((course, idx) => (
                            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Name of the course</label>
                                        <input type="text" disabled={readOnly} value={course.name_of_course || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'name_of_course', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Degree type of course</label>
                                        <select disabled={readOnly} value={course.degree_type || 'UG'} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'degree_type', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors">
                                            <option>UG</option>
                                            <option>PG</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total lectures Scheduled</label>
                                        <input type="text" disabled={readOnly} value={course.total_lectures_scheduled || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'total_lectures_scheduled', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Total lectures engaged</label>
                                        <input type="text" disabled={readOnly} value={course.total_lectures_engaged || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'total_lectures_engaged', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tutorials Scheduled</label>
                                        <input type="text" disabled={readOnly} value={course.tutorials_scheduled || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'tutorials_scheduled', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tutorials engaged</label>
                                        <input type="text" disabled={readOnly} value={course.tutorials_engaged || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'tutorials_engaged', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Labs Scheduled</label>
                                        <input type="text" disabled={readOnly} value={course.labs_scheduled || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'labs_scheduled', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Labs engaged</label>
                                        <input type="text" disabled={readOnly} value={course.labs_engaged || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'labs_engaged', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 px-4 py-2.5 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" />
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Reasons for not engaging the Remaining classes, if any</label>
                                    <textarea rows="3" disabled={readOnly} value={course.reasons_not_engaged || ''} onChange={(e) => updateArrayField('teaching', 'courses_taught', idx, 'reasons_not_engaged', e.target.value)} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-3 disabled:bg-gray-100 disabled:text-gray-500 transition-colors"></textarea>
                                </div>
                                {!readOnly && (
                                    <div className="flex justify-end">
                                        <button type="button" onClick={() => removeItem('teaching', 'courses_taught', idx)} className="text-red-600 hover:text-red-800">Remove</button>
                                    </div>
                                )}
                            </div>
                        ))}
                        {!readOnly && (
                            <div className="pt-2">
                                <button type="button" onClick={() => addItem('teaching', 'courses_taught', { name_of_course: '', total_lectures_scheduled: '', total_lectures_engaged: '', tutorials_scheduled: '', tutorials_engaged: '', labs_scheduled: '', labs_engaged: '', reasons_not_engaged: '', degree_type: 'UG' })} className="w-full md:w-auto bg-indigo-600 text-white rounded-lg px-6 py-2.5 hover:bg-indigo-700 shadow-sm transition-colors flex items-center justify-center font-medium"><FiPlus className="mr-2" /> Add Course</button>
                            </div>
                        )}
                    </div>
                </div>


                {/* ii) Total of hours/periods provided in time table vs actually taken */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">ii) Total of hours/ periods provided in the time table for</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
                        <div className="font-semibold mb-2">a) Lectures, Tutorials, Practical, Seminars/ Discussions in the academic year</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">For odd semester</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.time_table && formData.teaching.time_table.provided && formData.teaching.time_table.provided.odd_semester) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.time_table) || { provided: { odd_semester: '', even_semester: '' }, actual: { odd_semester: '', even_semester: '' } };
                                    updateField('teaching', 'time_table', { ...cur, provided: { ...cur.provided, odd_semester: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">For even semester</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.time_table && formData.teaching.time_table.provided && formData.teaching.time_table.provided.even_semester) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.time_table) || { provided: { odd_semester: '', even_semester: '' }, actual: { odd_semester: '', even_semester: '' } };
                                    updateField('teaching', 'time_table', { ...cur, provided: { ...cur.provided, even_semester: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>

                        <div className="mt-4 font-semibold mb-2">b) the number actually taken during the academic year</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">For odd semester</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.time_table && formData.teaching.time_table.actual && formData.teaching.time_table.actual.odd_semester) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.time_table) || { provided: { odd_semester: '', even_semester: '' }, actual: { odd_semester: '', even_semester: '' } };
                                    updateField('teaching', 'time_table', { ...cur, actual: { ...cur.actual, odd_semester: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">For even semester</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.time_table && formData.teaching.time_table.actual && formData.teaching.time_table.actual.even_semester) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.time_table) || { provided: { odd_semester: '', even_semester: '' }, actual: { odd_semester: '', even_semester: '' } };
                                    updateField('teaching', 'time_table', { ...cur, actual: { ...cur.actual, even_semester: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* iii) Work load per week */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">iii) Work load per week</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
                        <div className="font-semibold mb-2">For odd semester</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Lectures</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.workload_week && formData.teaching.workload_week.odd_semester && formData.teaching.workload_week.odd_semester.lectures) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.workload_week) || { odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }, even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' } };
                                    updateField('teaching', 'workload_week', { ...cur, odd_semester: { ...cur.odd_semester, lectures: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Tutorials</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.workload_week && formData.teaching.workload_week.odd_semester && formData.teaching.workload_week.odd_semester.tutorials) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.workload_week) || { odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }, even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' } };
                                    updateField('teaching', 'workload_week', { ...cur, odd_semester: { ...cur.odd_semester, tutorials: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Practicals</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.workload_week && formData.teaching.workload_week.odd_semester && formData.teaching.workload_week.odd_semester.practicals) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.workload_week) || { odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }, even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' } };
                                    updateField('teaching', 'workload_week', { ...cur, odd_semester: { ...cur.odd_semester, practicals: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Seminars/Group Discussions</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.workload_week && formData.teaching.workload_week.odd_semester && formData.teaching.workload_week.odd_semester.seminars) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.workload_week) || { odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }, even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' } };
                                    updateField('teaching', 'workload_week', { ...cur, odd_semester: { ...cur.odd_semester, seminars: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>

                        <div className="mt-4 font-semibold mb-2">For even semester</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Lectures</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.workload_week && formData.teaching.workload_week.even_semester && formData.teaching.workload_week.even_semester.lectures) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.workload_week) || { odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }, even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' } };
                                    updateField('teaching', 'workload_week', { ...cur, even_semester: { ...cur.even_semester, lectures: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Tutorials</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.workload_week && formData.teaching.workload_week.even_semester && formData.teaching.workload_week.even_semester.tutorials) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.workload_week) || { odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }, even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' } };
                                    updateField('teaching', 'workload_week', { ...cur, even_semester: { ...cur.even_semester, tutorials: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Practicals</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.workload_week && formData.teaching.workload_week.even_semester && formData.teaching.workload_week.even_semester.practicals) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.workload_week) || { odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }, even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' } };
                                    updateField('teaching', 'workload_week', { ...cur, even_semester: { ...cur.even_semester, practicals: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Seminars/Group Discussions</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.workload_week && formData.teaching.workload_week.even_semester && formData.teaching.workload_week.even_semester.seminars) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.workload_week) || { odd_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' }, even_semester: { lectures: '', tutorials: '', practicals: '', seminars: '' } };
                                    updateField('teaching', 'workload_week', { ...cur, even_semester: { ...cur.even_semester, seminars: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 3) Details of teaching methods employed */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">3) Details of teaching methods employed by you: (Lectures, Tutorials, Seminars, Practicals etc.)</h4>
                    <textarea rows="3" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" value={(formData.teaching && formData.teaching.teaching_methods) || ''} onChange={(e) => updateField('teaching', 'teaching_methods', e.target.value)}></textarea>
                </div>

                {/* ICT Tools */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">3.1) ICT Tools and Resources Used</h4>
                    <textarea rows="2" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" value={(formData.teaching && formData.teaching.ict_tools) || ''} onChange={(e) => updateField('teaching', 'ict_tools', e.target.value)} placeholder="e.g., LCD Projector, Smart Board, Online Resources..."></textarea>
                </div>

                {/* Student Centric Methods */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">3.2) Student Centric Methods (Experiential/Participative/Problem Solving)</h4>
                    <textarea rows="2" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" value={(formData.teaching && formData.teaching.student_centric_methods) || ''} onChange={(e) => updateField('teaching', 'student_centric_methods', e.target.value)} placeholder="Details of methods used..."></textarea>
                </div>

                {/* 4 a) Details of Tutorials/tests held during the academic year */}
                <div>
                    <h4 className="text-md font-semibold text-gray-800 mb-2">4) a) Details of Tutorials/ tests held during the academic year</h4>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-4">
                        <div className="font-semibold mb-2">Under-graduate Courses (Odd Semester)</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Number of tests held</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.tutorials_tests && formData.teaching.tutorials_tests.ug_odd && formData.teaching.tutorials_tests.ug_odd.number_of_tests) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.tutorials_tests) || { ug_odd: { number_of_tests: '', assignment_checked: '' }, ug_even: { number_of_tests: '', assignment_checked: '' }, pg_odd: { number_of_tests: '', assignment_checked: '' }, pg_even: { number_of_tests: '', assignment_checked: '' } };
                                    updateField('teaching', 'tutorials_tests', { ...cur, ug_odd: { ...cur.ug_odd, number_of_tests: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Assignment checked</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.tutorials_tests && formData.teaching.tutorials_tests.ug_odd && formData.teaching.tutorials_tests.ug_odd.assignment_checked) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.tutorials_tests) || { ug_odd: { number_of_tests: '', assignment_checked: '' }, ug_even: { number_of_tests: '', assignment_checked: '' }, pg_odd: { number_of_tests: '', assignment_checked: '' }, pg_even: { number_of_tests: '', assignment_checked: '' } };
                                    updateField('teaching', 'tutorials_tests', { ...cur, ug_odd: { ...cur.ug_odd, assignment_checked: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>

                        <div className="font-semibold mb-2">Under-graduate Courses (Even Semester)</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Number of tests held</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.tutorials_tests && formData.teaching.tutorials_tests.ug_even && formData.teaching.tutorials_tests.ug_even.number_of_tests) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.tutorials_tests) || { ug_odd: { number_of_tests: '', assignment_checked: '' }, ug_even: { number_of_tests: '', assignment_checked: '' }, pg_odd: { number_of_tests: '', assignment_checked: '' }, pg_even: { number_of_tests: '', assignment_checked: '' } };
                                    updateField('teaching', 'tutorials_tests', { ...cur, ug_even: { ...cur.ug_even, number_of_tests: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Assignment checked</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.tutorials_tests && formData.teaching.tutorials_tests.ug_even && formData.teaching.tutorials_tests.ug_even.assignment_checked) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.tutorials_tests) || { ug_odd: { number_of_tests: '', assignment_checked: '' }, ug_even: { number_of_tests: '', assignment_checked: '' }, pg_odd: { number_of_tests: '', assignment_checked: '' }, pg_even: { number_of_tests: '', assignment_checked: '' } };
                                    updateField('teaching', 'tutorials_tests', { ...cur, ug_even: { ...cur.ug_even, assignment_checked: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>

                        <div className="font-semibold mb-2">Post-graduate Courses (Odd Semester)</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Number of tests held</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.tutorials_tests && formData.teaching.tutorials_tests.pg_odd && formData.teaching.tutorials_tests.pg_odd.number_of_tests) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.tutorials_tests) || { ug_odd: { number_of_tests: '', assignment_checked: '' }, ug_even: { number_of_tests: '', assignment_checked: '' }, pg_odd: { number_of_tests: '', assignment_checked: '' }, pg_even: { number_of_tests: '', assignment_checked: '' } };
                                    updateField('teaching', 'tutorials_tests', { ...cur, pg_odd: { ...cur.pg_odd, number_of_tests: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Assignment checked</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.tutorials_tests && formData.teaching.tutorials_tests.pg_odd && formData.teaching.tutorials_tests.pg_odd.assignment_checked) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.tutorials_tests) || { ug_odd: { number_of_tests: '', assignment_checked: '' }, ug_even: { number_of_tests: '', assignment_checked: '' }, pg_odd: { number_of_tests: '', assignment_checked: '' }, pg_even: { number_of_tests: '', assignment_checked: '' } };
                                    updateField('teaching', 'tutorials_tests', { ...cur, pg_odd: { ...cur.pg_odd, assignment_checked: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>

                        <div className="font-semibold mb-2">Post-graduate Courses (Even Semester)</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Number of tests held</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.tutorials_tests && formData.teaching.tutorials_tests.pg_even && formData.teaching.tutorials_tests.pg_even.number_of_tests) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.tutorials_tests) || { ug_odd: { number_of_tests: '', assignment_checked: '' }, ug_even: { number_of_tests: '', assignment_checked: '' }, pg_odd: { number_of_tests: '', assignment_checked: '' }, pg_even: { number_of_tests: '', assignment_checked: '' } };
                                    updateField('teaching', 'tutorials_tests', { ...cur, pg_even: { ...cur.pg_even, number_of_tests: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-700 mb-1">Assignment checked</label>
                                <input type="text" disabled={readOnly} value={(formData.teaching && formData.teaching.tutorials_tests && formData.teaching.tutorials_tests.pg_even && formData.teaching.tutorials_tests.pg_even.assignment_checked) || ''} onChange={(e) => {
                                    const cur = (formData.teaching && formData.teaching.tutorials_tests) || { ug_odd: { number_of_tests: '', assignment_checked: '' }, ug_even: { number_of_tests: '', assignment_checked: '' }, pg_odd: { number_of_tests: '', assignment_checked: '' }, pg_even: { number_of_tests: '', assignment_checked: '' } };
                                    updateField('teaching', 'tutorials_tests', { ...cur, pg_even: { ...cur.pg_even, assignment_checked: e.target.value } });
                                }} className="w-full border border-gray-300 rounded px-3 py-2 disabled:bg-gray-100 disabled:text-gray-500" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 4 b) academic planning */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">b) Details of academic planning/ presentation of lectures during the session</label>
                    <textarea rows="3" disabled={readOnly} className="w-full border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 p-4 disabled:bg-gray-100 disabled:text-gray-500 transition-colors" value={(formData.teaching && formData.teaching.academic_planning) || ''} onChange={(e) => updateField('teaching', 'academic_planning', e.target.value)}></textarea>
                </div>
            </div>
        </div>
    );
}

