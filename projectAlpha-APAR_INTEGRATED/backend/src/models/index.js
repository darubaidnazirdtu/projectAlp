/**
 * Models Index - Export all database models
 * 
 * Architecture: 16 consolidated models (4 core + 12 domain-specific)
 * - Core: User, Faculty, Department, Student
 * - Academic: Programme, Course, Teaching
 * - Research: Publication, Patent, ResearchProject, PhdDefence
 * - Activities: FacultyActivity, Collaboration, StudentActivity
 * - Resources: DepartmentResource, Training
 */

// Core models
export { User } from './user.model.js';
export { Faculty } from './faculty.model.js';
export { Department } from './department.model.js';
export { Student } from './student.model.js';

// Academic models
export { Programme } from './programme.model.js';
export { Course } from './course.model.js';
export { Teaching } from './teaching.model.js';

// Research & Output models
export { Publication } from './publication.model.js';
export { Patent } from './patent.model.js';
export { ResearchProject } from './researchProject.model.js';
export { PhdDefence } from './phdDefence.model.js';

// Activity models (consolidated with type discriminators)
export { FacultyActivity } from './facultyActivity.model.js';
export { Collaboration } from './collaboration.model.js';
export { StudentActivity } from './studentActivity.model.js';

// Resource & Training models
export { DepartmentResource } from './departmentResource.model.js';
export { Training } from './training.model.js';

// APAR Form (separate lifecycle)
export { AparForm } from './aparForm.model.js';
