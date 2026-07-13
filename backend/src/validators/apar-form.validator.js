// import { z } from 'zod';
// import { hasRequiredGraduation } from '../utils/qualification.util.js';

// const nullToUndefined = (value) => value == null ? undefined : value;
// const nullToEmptyString = (value) => value == null ? '' : value;
// const normalizeNulls = (value) => {
//   if (value === null) return undefined;
//   if (value instanceof Date) return value;
//   if (Array.isArray(value)) return value.map(normalizeNulls);
//   if (value && typeof value === 'object') {
//     return Object.fromEntries(
//       Object.entries(value).map(([key, val]) => [key, normalizeNulls(val)])
//     );
//   }
//   return value;
// };

// const requiredString = (fieldName) => z.preprocess(
//   nullToEmptyString,
//   z.string().trim().min(1, `${fieldName} is required`)
// );
// const nonEmptyString = requiredString;
// const optionalString = z.preprocess(nullToUndefined, z.string().trim().optional());
// const optionalNumber = z.preprocess(nullToUndefined, z.number().optional());
// const optionalDate = z.preprocess(nullToUndefined, z.union([z.date(), z.string()]).optional());
// const optionalEmail = z.preprocess(
//   nullToUndefined,
//   z.union([z.string().email('Invalid email format'), z.literal('')]).optional()
// );
// const optionalMouActivities = z.preprocess(
//   nullToUndefined,
//   z.union([z.string().trim(), z.array(z.unknown())]).optional()
// );
// const optionalScore = (message = 'Score must be between 1 and 10') => z.preprocess(
//   nullToUndefined,
//   z.string().optional().refine((val) => !val || (parseInt(val) >= 1 && parseInt(val) <= 10), { message })
// );
// const requiredScore = (fieldName, message = `${fieldName} must be between 1 and 10`) => z.preprocess(
//   (value) => value == null ? '' : String(value),
//   z.string().trim().min(1, `${fieldName} is required`).refine((val) => parseInt(val) >= 1 && parseInt(val) <= 10, { message })
// );
// const requiredGradeText = requiredString('Grading').refine(
//   (value) => ['Outstanding', 'Very Good', 'Good', 'Average', 'Below Average'].includes(value),
//   { message: 'Grading is required' }
// );

// // Personal Data Validation
// const personalSchema = z.object({
//   name: nonEmptyString('Name'),
//   designation: nonEmptyString('Designation'),
//   date_of_birth: requiredString('Date of birth'),
//   email: optionalEmail,
//   phone: optionalString,
//   department_id: nonEmptyString('Department'),
//   qualification_undergraduate: optionalString,
//   qualification_postgraduate: optionalString,
//   qualification_phd: optionalString,
//   qualification: optionalString,
//   joining_date: requiredString('Joining date'),
//   report_start_date: optionalString,
//   report_end_date: optionalString,
//   sc_st_status: nonEmptyString('Caste category'),
//   absence_period: requiredString('Absence period'),
//   grade: requiredString('Grade')
// }).superRefine((data, ctx) => {
//   if (!hasRequiredGraduation(data)) {
//     ctx.addIssue({
//       code: z.ZodIssueCode.custom,
//       message: 'Graduation qualification is required',
//       path: ['qualification_undergraduate'],
//     });
//   }
// });

// // Teaching Validation
// const teachingSchema = z.object({
//   description_of_duties_department: optionalString,
//   description_of_duties_admin: optionalString,
//   courses_taught: z.array(z.object({
//     name_of_course: optionalString,
//     course_code: optionalString,
//     total_lectures_scheduled: optionalString,
//     total_lectures_engaged: optionalString,
//     tutorials_scheduled: optionalString,
//     tutorials_engaged: optionalString,
//     labs_scheduled: optionalString,
//     labs_engaged: optionalString,
//     reasons_not_engaged: optionalString,
//     degree_type: z.preprocess(nullToUndefined, z.union([z.enum(['UG', 'PG']), z.literal('')]).optional())
//   })).optional(),
//   time_table: z.object({
//     provided: z.object({
//       odd_semester: optionalString,
//       even_semester: optionalString
//     }).optional(),
//     actual: z.object({
//       odd_semester: optionalString,
//       even_semester: optionalString
//     }).optional()
//   }).optional(),
//   workload_week: z.object({
//     odd_semester: z.object({
//       lectures: optionalString,
//       tutorials: optionalString,
//       practicals: optionalString,
//       seminars: optionalString
//     }).optional(),
//     even_semester: z.object({
//       lectures: optionalString,
//       tutorials: optionalString,
//       practicals: optionalString,
//       seminars: optionalString
//     }).optional()
//   }).optional(),
//   teaching_methods: optionalString,
//   ict_tools: optionalString,
//   student_centric_methods: optionalString,
//   tutorials_tests: z.object({
//     ug_odd: z.object({
//       number_of_tests: optionalString,
//       assignment_checked: optionalString
//     }).optional(),
//     ug_even: z.object({
//       number_of_tests: optionalString,
//       assignment_checked: optionalString
//     }).optional(),
//     pg_odd: z.object({
//       number_of_tests: optionalString,
//       assignment_checked: optionalString
//     }).optional(),
//     pg_even: z.object({
//       number_of_tests: optionalString,
//       assignment_checked: optionalString
//     }).optional()
//   }).optional(),
//   academic_planning: optionalString
// });

// // Research Validation
// const researchSchema = z.object({
//   journals: z.array(z.object({
//     paper_id: optionalString,
//     title: optionalString,
//     name_of_journal: optionalString,
//     author_names: optionalString,
//     issn: optionalString,
//     volume: optionalString,
//     issue: optionalString,
//     page_numbers: optionalString,
//     year_of_publication: optionalString,
//     doi: optionalString,
//     indexing: optionalString,
//     impact_factor: optionalString,
//     citation_count: optionalString,
//     is_ugc_care_listed: optionalString,
//     link: optionalString,
//     link_to_paper: optionalString,
//     department_id: optionalString
//   })).optional(),
//   conferences: z.array(z.object({
//     paper_id: optionalString,
//     title: optionalString,
//     title_of_paper: optionalString,
//     name_of_conference: optionalString,
//     conference_level: optionalString,
//     organizer: optionalString,
//     venue: optionalString,
//     publisher: optionalString,
//     isbn: optionalString,
//     year_of_publication: optionalString,
//     doi: optionalString,
//     indexing: optionalString,
//     award_received: optionalString,
//     paper_status: optionalString,
//     link: optionalString,
//     link_to_paper: optionalString,
//     department_id: optionalString
//   })).optional(),
//   books: z.array(z.object({
//     publication_id: optionalString,
//     title_of_book: optionalString,
//     title_of_chapter: optionalString,
//     publication_type: optionalString,
//     role: optionalString,
//     year: optionalString,
//     isbn_number: optionalString,
//     name_of_publisher: optionalString,
//     publisher_type: optionalString,
//     same_institute_affiliation: optionalString,
//     link_to_publication: optionalString,
//     link: optionalString,
//     doi: optionalString,
//     department_id: optionalString
//   })).optional(),
//   projects: z.array(z.object({
//     project_id: optionalString,
//     funding_id: optionalString,
//     title_research: optionalString,
//     title: optionalString,
//     type_of_project: optionalString,
//     funding_agency_name: optionalString,
//     funding_type: optionalString,
//     sanction_number: optionalString,
//     year_of_sanction: optionalString,
//     amount: optionalString,
//     start_date: optionalString,
//     end_date: optionalString,
//     status: optionalString,
//     outcome: optionalString,
//     remarks: optionalString,
//     academic_year: optionalString,
//     department_id: optionalString
//   })).optional(),
//   consultancy: z.array(z.object({
//     consultancy_id: optionalString,
//     name_of_project: optionalString,
//     title: optionalString,
//     agency_name: optionalString,
//     type_of_agency: optionalString,
//     consultancy_type: optionalString,
//     grant_amount: optionalString,
//     revenue_generated: optionalString,
//     start_date: optionalString,
//     end_date: optionalString,
//     year_of_consultancy: optionalString,
//     remarks: optionalString,
//     link: optionalString,
//     department_id: optionalString
//   })).optional(),
//   patents: z.array(z.object({
//     patent_id: optionalString,
//     patent_title: optionalString,
//     author_names: optionalString,
//     application_number: optionalString,
//     patent_number: optionalString,
//     status: optionalString,
//     country: optionalString,
//     date_of_filing: optionalString,
//     date_of_award: optionalString,
//     patent_awarding_agency: optionalString,
//     link_to_patent: optionalString,
//     link: optionalString,
//     department_id: optionalString
//   })).optional(),
//   awards: z.array(z.object({
//     award_id: optionalString,
//     name_of_award: optionalString,
//     type_of_award: optionalString,
//     category_of_award: optionalString,
//     name_of_organisation: optionalString,
//     awarding_agency: optionalString,
//     date_of_award: optionalString,
//     monetary_value: optionalString,
//     year: optionalString,
//     link: optionalString,
//     evidence_link: optionalString,
//     academic_year: optionalString,
//     department_id: optionalString
//   })).optional(),
//   e_content: z.array(z.object({
//     econtent_id: optionalString,
//     name_of_module: optionalString,
//     type_of_content: optionalString,
//     platform: optionalString,
//     platform_type: optionalString,
//     date_of_launching: optionalString,
//     target_audience: optionalString,
//     duration_hours: optionalString,
//     learning_outcome: optionalString,
//     link: optionalString,
//     course_id: optionalString,
//     academic_year: optionalString,
//     department_id: optionalString,
//     faculty_id: optionalString
//   })).optional(),
//   faculty_visits: z.array(z.object({
//     visit_id: optionalString,
//     organisation_name: optionalString,
//     title: optionalString,
//     visit_type: optionalString,
//     purpose: optionalString,
//     location: optionalString,
//     start_date: optionalString,
//     end_date: optionalString,
//     link: optionalString,
//     academic_year: optionalString,
//     department_id: optionalString,
//     faculty_id: optionalString
//   })).optional(),
//   collaborations: z.array(z.object({
//     activity_id: optionalString,
//     title_of_activity: optionalString,
//     title: optionalString,
//     name_of_collaborative_agency: optionalString,
//     type_of_activity: optionalString,
//     nature_of_activity: optionalString,
//     number_of_participants: optionalString,
//     source_of_financial_support: optionalString,
//     funding_amount: optionalString,
//     year: optionalString,
//     duration: optionalString,
//     level: optionalString,
//     start_date: optionalString,
//     end_date: optionalString,
//     link: optionalString,
//     academic_year: optionalString,
//     department_id: optionalString
//   })).optional(),
//   phd_supervision: z.array(z.object({
//     defence_id: optionalString,
//     student_id: optionalString,
//     student_name: optionalString,
//     enrollment_no: optionalString,
//     thesis_title: optionalString,
//     thesis_type: optionalString,
//     supervisor_name: optionalString,
//     supervisor_id: optionalString,
//     registration_year: optionalString,
//     date_of_defence: optionalString,
//     date_of_result_notification: optionalString,
//     result_outcome: optionalString,
//     academic_year: optionalString,
//     remarks: optionalString,
//     link: optionalString,
//     department_id: optionalString
//   })).optional(),
//   mous: z.array(z.object({
//     mou_id: optionalString,
//     organisation_name: optionalString,
//     title: optionalString,
//     type_of_mou: optionalString,
//     year_of_signing: optionalString,
//     purpose: optionalString,
//     activities_under_mou: optionalMouActivities,
//     start_date: optionalString,
//     end_date: optionalString,
//     level: optionalString,
//     link: optionalString,
//     academic_year: optionalString,
//     department_id: optionalString
//   })).optional(),
//   workshops: z.array(z.object({
//     program_id: optionalString,
//     program_title: optionalString,
//     type_of_program: optionalString,
//     level: optionalString,
//     mode: optionalString,
//     duration_days: optionalString,
//     organising_body: optionalString,
//     funding_agency: optionalString,
//     venue: optionalString,
//     certificate_link: optionalString,
//     start_date: optionalString,
//     end_date: optionalString,
//     outcome: optionalString,
//     remarks: optionalString,
//     link: optionalString,
//     academic_year: optionalString,
//     department_id: optionalString
//   })).optional(),
//   summer_institutes_attended: z.array(z.object({ description: optionalString })).optional(),
//   summer_institutes_organized: z.array(z.object({ description: optionalString })).optional(),
//   ug_pg_guidance: z.array(z.object({ description: optionalString })).optional(),
//   phd_guidance_text: z.array(z.object({ description: optionalString })).optional(),
//   research_guidance: z.array(z.object({ description: optionalString })).optional(),
//   industry_interaction: z.array(z.object({ description: optionalString })).optional(),
//   memberships_text: z.array(z.object({ description: optionalString })).optional(),
//   other_activities: z.array(z.object({ description: optionalString })).optional()
// });

// // Corporate Life Validation
// const corporateSchema = z.object({
//   curriculum_development: optionalString,
//   course_development_details: optionalString,
//   lab_development: optionalString,
//   cultural_activities: optionalString,
//   sports_community: optionalString,
//   admin_assignment: optionalString,
//   any_other: optionalString,
//   certify: z.preprocess(nullToUndefined, z.union([z.string().trim(), z.boolean()]).optional())
// });

// // Assessment Validation (scores must be between 1-10)
// const assessmentScoreSchema = z.object({
//   q1: optionalScore(),
//   q2: optionalScore(),
//   q3: optionalScore(),
//   q4: optionalScore(),
//   overall_grading: optionalScore()
// });

// const assessmentSectionBSchema = z.object({
//   q1: optionalScore(),
//   q2: optionalScore(),
//   q3: optionalScore(),
//   q4: optionalScore(),
//   q5: optionalScore(),
//   q6: optionalScore(),
//   q7a: optionalScore(),
//   q7b: optionalScore(),
//   q8: optionalScore(),
//   q9: optionalScore(),
//   q10: optionalScore(),
//   q11: z.preprocess(nullToUndefined, z.union([z.enum(['Outstanding', 'Very Good', 'Good', 'Average', 'Below Average']), z.literal('')]).optional()),
//   overall_grading: optionalScore()
// });

// const assessmentSectionCSchema = z.object({
//   q1: optionalScore(),
//   q2: optionalScore(),
//   q3: optionalScore(),
//   q4: optionalScore(),
//   q5: optionalScore(),
//   q6: optionalScore(),
//   overall_grading: optionalScore()
// });

// const assessmentGeneralSchema = z.object({
//   q1: optionalString,
//   q2: optionalString,
//   q3: optionalString,
//   q4: optionalString,
//   q5: optionalString,
//   q6: optionalScore('Overall score must be between 1 and 10')
// });

// const assessmentSchema = z.object({
//   section_a: assessmentScoreSchema.optional(),
//   section_b: assessmentSectionBSchema.optional(),
//   section_c: assessmentSectionCSchema.optional(),
//   general: assessmentGeneralSchema.optional()
// });

// const requiredAssessmentSchema = z.object({
//   section_a: z.object({
//     q1: requiredScore('Section A Q1'),
//     q2: requiredScore('Section A Q2'),
//     q3: requiredScore('Section A Q3'),
//     q4: requiredScore('Section A Q4'),
//     overall_grading: requiredScore('Section A overall grading')
//   }),
//   section_b: z.object({
//     q1: requiredScore('Section B Q1'),
//     q2: requiredScore('Section B Q2'),
//     q3: requiredScore('Section B Q3'),
//     q4: requiredScore('Section B Q4'),
//     q5: requiredScore('Section B Q5'),
//     q6: requiredScore('Section B Q6'),
//     q7a: requiredScore('Section B Q7a'),
//     q7b: requiredScore('Section B Q7b'),
//     q8: requiredScore('Section B Q8'),
//     q9: requiredScore('Section B Q9'),
//     q10: requiredScore('Section B Q10'),
//     q11: requiredGradeText,
//     overall_grading: requiredScore('Section B overall grading')
//   }),
//   section_c: z.object({
//     q1: requiredScore('Section C Q1'),
//     q2: requiredScore('Section C Q2'),
//     q3: requiredScore('Section C Q3'),
//     q4: requiredScore('Section C Q4'),
//     q5: requiredScore('Section C Q5'),
//     q6: requiredScore('Section C Q6'),
//     overall_grading: requiredScore('Section C overall grading')
//   }),
//   general: z.object({
//     q1: requiredString('Relations with the public'),
//     q2: requiredString('Training recommendations'),
//     q3: requiredString('State of health'),
//     q4: requiredString('Integrity'),
//     q5: requiredString('Pen picture'),
//     q6: requiredScore('Overall numerical grading', 'Overall score must be between 1 and 10')
//   })
// });

// const requestSchema = (bodySchema) => z.object({
//   body: z.preprocess(normalizeNulls, bodySchema),
//   params: z.object({}).passthrough(),
//   query: z.object({}).passthrough()
// });

// // Remarks Validation
// const remarksSchema = z.object({
//   length_of_service: optionalString,
//   satisfied_with_reporting: optionalString,
//   agree_with_assessment: z.preprocess(nullToUndefined, z.union([z.enum(['Yes', 'No']), z.literal('')]).optional()),
//   disagreement_reason: optionalString,
//   general_remarks: optionalString,
//   specific_characteristics: optionalString,
//   signature_place: optionalString,
//   signature_date: optionalString,
//   query_comment: optionalString
// });

// const requiredRemarksSchema = z.object({
//   length_of_service: requiredString('Length of service'),
//   satisfied_with_reporting: requiredString('Satisfaction with reporting officer assessment'),
//   agree_with_assessment: requiredString('Agreement with assessment').refine((value) => ['Yes', 'No'].includes(value), {
//     message: 'Agreement with assessment is required'
//   }),
//   disagreement_reason: optionalString,
//   general_remarks: requiredString('General remarks'),
//   specific_characteristics: requiredString('Specific characteristics'),
//   signature_place: requiredString('Signature place'),
//   signature_date: requiredString('Signature date')
// }).superRefine((data, ctx) => {
//   if (data.agree_with_assessment === 'No' && !data.disagreement_reason?.trim()) {
//     ctx.addIssue({
//       code: z.ZodIssueCode.custom,
//       message: 'Disagreement reason is required',
//       path: ['disagreement_reason']
//     });
//   }
// });

// // Full APAR Form Schema
// export const aparFormSchema = requestSchema(z.object({
//   ay: requiredString('Academic Year'),
//   faculty_id: requiredString('Faculty ID'),
//   formData: z.object({
//     personal: personalSchema,
//     teaching: teachingSchema.optional(),
//     research: researchSchema.optional(),
//     corporate: corporateSchema.optional(),
//     assessment: assessmentSchema.optional(),
//     remarks: remarksSchema.optional()
//   }).optional()
// }));

// // Schema for saving draft (very lenient - only required fields)
// export const aparDraftSchema = requestSchema(z.object({
//   ay: requiredString('Academic Year'),
//   faculty_id: requiredString('Faculty ID'),
//   formData: z.object({
//     personal: z.object({
//       name: optionalString,
//       designation: optionalString,
//       date_of_birth: optionalString,
//       email: optionalString,
//       phone: optionalString,
//       department_id: optionalString,
//       qualification: optionalString,
//       qualification_undergraduate: optionalString,
//       qualification_postgraduate: optionalString,
//       qualification_phd: optionalString,
//       joining_date: optionalString,
//       report_start_date: optionalString,
//       report_end_date: optionalString,
//       sc_st_status: optionalString,
//       absence_period: optionalString,
//       grade: optionalString
//     }).optional(),
//     teaching: z.any().optional(),
//     research: z.any().optional(),
//     corporate: z.any().optional(),
//     assessment: z.any().optional(),
//     remarks: z.any().optional()
//   }).optional()
// }));

// // Schema for assessment submission (requires assessment section)
// export const aparAssessmentSchema = requestSchema(z.object({
//   faculty_id: requiredString('Faculty ID'),
//   ay: requiredString('Academic Year'),
//   assessment: requiredAssessmentSchema,
//   status: optionalString,
//   query_comment: optionalString
// }));

// export const aparReviewingSchema = requestSchema(z.object({
//   faculty_id: requiredString('Faculty ID'),
//   ay: requiredString('Academic Year'),
//   remarks: requiredRemarksSchema,
//   status: requiredString('Status'),
//   query_comment: optionalString
// }));
import { z } from 'zod';
import { hasRequiredGraduation } from '../utils/qualification.util.js';

const nullToUndefined = (value) => value == null ? undefined : value;
const nullToEmptyString = (value) => value == null ? '' : value;
const normalizeNulls = (value) => {
  if (value === null) return undefined;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) return value.map(normalizeNulls);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, val]) => [key, normalizeNulls(val)])
    );
  }
  return value;
};

const requiredString = (fieldName) => z.preprocess(
  nullToEmptyString,
  z.string().trim().min(1, `${fieldName} is required`)
);
const nonEmptyString = requiredString;
const optionalString = z.preprocess(nullToUndefined, z.string().trim().optional());
const optionalNumber = z.preprocess(nullToUndefined, z.number().optional());
const optionalDate = z.preprocess(nullToUndefined, z.union([z.date(), z.string()]).optional());
const optionalEmail = z.preprocess(
  nullToUndefined,
  z.union([z.string().email('Invalid email format'), z.literal('')]).optional()
);
const optionalMouActivities = z.preprocess(
  nullToUndefined,
  z.union([z.string().trim(), z.array(z.unknown())]).optional()
);
const optionalScore = (message = 'Score must be between 1 and 10') => z.preprocess(
  nullToUndefined,
  z.string().optional().refine((val) => !val || (parseInt(val) >= 1 && parseInt(val) <= 10), { message })
);
const requiredScore = (fieldName, message = `${fieldName} must be between 1 and 10`) => z.preprocess(
  (value) => value == null ? '' : String(value),
  z.string().trim().min(1, `${fieldName} is required`).refine((val) => parseInt(val) >= 1 && parseInt(val) <= 10, { message })
);
const requiredGradeText = requiredString('Grading').refine(
  (value) => ['Outstanding', 'Very Good', 'Good', 'Average', 'Below Average'].includes(value),
  { message: 'Grading is required' }
);

// Personal Data Validation
const personalSchema = z.object({
  name: nonEmptyString('Name'),
  designation: nonEmptyString('Designation'),
  date_of_birth: requiredString('Date of birth'),
  email: optionalEmail,
  phone: optionalString,
  department_id: nonEmptyString('Department'),
  qualification_undergraduate: optionalString,
  qualification_postgraduate: optionalString,
  qualification_phd: optionalString,
  qualification: optionalString,
  joining_date: requiredString('Joining date'),
  report_start_date: optionalString,
  report_end_date: optionalString,
  sc_st_status: nonEmptyString('Caste category'),
  absence_taken: requiredString('Leave/absence option'),
  absence_period: optionalString,
  grade: requiredString('Grade')
}).superRefine((data, ctx) => {
  if (data.absence_taken === 'Yes') {
    if (!data.absence_period?.trim()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Absence period is required',
        path: ['absence_period'],
      });
      return;
    }

    const hasIncompletePeriod = data.absence_period
      .split('\n')
      .filter(row => row.trim())
      .some(row => (row.match(/\d{4}-\d{2}-\d{2}/g) || []).length < 2);

    if (hasIncompletePeriod) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Start and end date are required for each absence period',
        path: ['absence_period'],
      });
    }
  }
});

// Teaching Validation
const teachingSchema = z.object({
  description_of_duties_department: z.array(z.object({ description: optionalString })).optional(),
  description_of_duties_admin: z.array(z.object({ description: optionalString })).optional(),
  courses_taught: z.array(z.object({
    name_of_course: optionalString,
    course_code: optionalString,
    total_lectures_scheduled: optionalString,
    total_lectures_engaged: optionalString,
    extra_lectures_engaged: optionalString,
    tutorials_scheduled: optionalString,
    tutorials_engaged: optionalString,
    extra_tutorials_engaged: optionalString,
    labs_scheduled: optionalString,
    labs_engaged: optionalString,
    extra_labs_engaged: optionalString,
    reasons_not_engaged: optionalString,
    degree_type: z.preprocess(nullToUndefined, z.union([z.enum(['UG', 'PG']), z.literal('')]).optional()),
    semester: z.preprocess(nullToUndefined, z.union([z.enum(['Odd', 'Even']), z.literal('')]).optional()),
    course_type: z.preprocess(nullToUndefined, z.union([z.enum(['Theory', 'Practical']), z.literal('')]).optional())
  })).optional(),
  time_table: z.object({
    provided: z.object({
      odd_semester: optionalString,
      even_semester: optionalString
    }).optional(),
    actual: z.object({
      odd_semester: optionalString,
      even_semester: optionalString
    }).optional()
  }).optional(),
  workload_week: z.object({
    odd_semester: z.object({
      lectures: optionalString,
      tutorials: optionalString,
      practicals: optionalString,
      seminars: optionalString
    }).optional(),
    even_semester: z.object({
      lectures: optionalString,
      tutorials: optionalString,
      practicals: optionalString,
      seminars: optionalString
    }).optional()
  }).optional(),
  teaching_methods: z.array(z.object({ description: optionalString })).optional(),
  faculty_visits_other_institutions: z.array(z.object({ description: optionalString })).optional(),
  ict_tools: z.array(z.object({ description: optionalString, room_no: optionalString })).optional(),
  student_centric_methods: z.array(z.object({ description: optionalString })).optional(),
  tutorials_tests: z.object({
    ug_odd: z.object({
      number_of_tests: optionalString,
      assignment_checked: optionalString
    }).optional(),
    ug_even: z.object({
      number_of_tests: optionalString,
      assignment_checked: optionalString
    }).optional(),
    pg_odd: z.object({
      number_of_tests: optionalString,
      assignment_checked: optionalString
    }).optional(),
    pg_even: z.object({
      number_of_tests: optionalString,
      assignment_checked: optionalString
    }).optional()
  }).optional(),
  academic_planning: z.array(z.object({ description: optionalString })).optional()
});

// Research Validation
const researchSchema = z.object({
  journals: z.array(z.object({
    paper_id: optionalString,
    title: optionalString,
    name_of_journal: optionalString,
    author_names: optionalString,
    issn: optionalString,
    volume: optionalString,
    issue: optionalString,
    page_numbers: optionalString,
    year_of_publication: optionalString,
    doi: optionalString,
    indexing: optionalString,
    impact_factor: optionalString,
    citation_count: optionalString,
    is_ugc_care_listed: optionalString,
    link: optionalString,
    link_to_paper: optionalString,
    department_id: optionalString
  })).optional(),
  conferences: z.array(z.object({
    paper_id: optionalString,
    title: optionalString,
    title_of_paper: optionalString,
    name_of_conference: optionalString,
    conference_level: optionalString,
    organizer: optionalString,
    venue: optionalString,
    publisher: optionalString,
    isbn: optionalString,
    year_of_publication: optionalString,
    doi: optionalString,
    indexing: optionalString,
    award_received: optionalString,
    paper_status: optionalString,
    link: optionalString,
    link_to_paper: optionalString,
    department_id: optionalString
  })).optional(),
  books: z.array(z.object({
    publication_id: optionalString,
    title_of_book: optionalString,
    title_of_chapter: optionalString,
    publication_type: optionalString,
    role: optionalString,
    year: optionalString,
    isbn_number: optionalString,
    name_of_publisher: optionalString,
    publisher_type: optionalString,
    same_institute_affiliation: optionalString,
    link_to_publication: optionalString,
    link: optionalString,
    doi: optionalString,
    department_id: optionalString
  })).optional(),
  projects: z.array(z.object({
    project_id: optionalString,
    funding_id: optionalString,
    title_research: optionalString,
    title: optionalString,
    type_of_project: optionalString,
    funding_agency_name: optionalString,
    funding_type: optionalString,
    sanction_number: optionalString,
    year_of_sanction: optionalString,
    amount: optionalString,
    start_date: optionalString,
    end_date: optionalString,
    status: optionalString,
    outcome: optionalString,
    remarks: optionalString,
    academic_year: optionalString,
    department_id: optionalString
  })).optional(),
  consultancy: z.array(z.object({
    consultancy_id: optionalString,
    name_of_project: optionalString,
    title: optionalString,
    agency_name: optionalString,
    type_of_agency: optionalString,
    consultancy_type: optionalString,
    grant_amount: optionalString,
    revenue_generated: optionalString,
    start_date: optionalString,
    end_date: optionalString,
    year_of_consultancy: optionalString,
    remarks: optionalString,
    link: optionalString,
    department_id: optionalString
  })).optional(),
  patents: z.array(z.object({
    patent_id: optionalString,
    patent_title: optionalString,
    author_names: optionalString,
    application_number: optionalString,
    patent_number: optionalString,
    status: optionalString,
    country: optionalString,
    date_of_filing: optionalString,
    date_of_award: optionalString,
    patent_awarding_agency: optionalString,
    link_to_patent: optionalString,
    link: optionalString,
    department_id: optionalString
  })).optional(),
  awards: z.array(z.object({
    award_id: optionalString,
    name_of_award: optionalString,
    type_of_award: optionalString,
    category_of_award: optionalString,
    name_of_organisation: optionalString,
    awarding_agency: optionalString,
    date_of_award: optionalString,
    monetary_value: optionalString,
    year: optionalString,
    link: optionalString,
    evidence_link: optionalString,
    academic_year: optionalString,
    department_id: optionalString
  })).optional(),
  e_content: z.array(z.object({
    econtent_id: optionalString,
    name_of_module: optionalString,
    type_of_content: optionalString,
    platform: optionalString,
    platform_type: optionalString,
    date_of_launching: optionalString,
    target_audience: optionalString,
    duration_hours: optionalString,
    learning_outcome: optionalString,
    link: optionalString,
    course_id: optionalString,
    academic_year: optionalString,
    department_id: optionalString,
    faculty_id: optionalString
  })).optional(),
  faculty_visits: z.array(z.object({
    visit_id: optionalString,
    organisation_name: optionalString,
    title: optionalString,
    visit_type: optionalString,
    purpose: optionalString,
    location: optionalString,
    start_date: optionalString,
    end_date: optionalString,
    link: optionalString,
    academic_year: optionalString,
    department_id: optionalString,
    faculty_id: optionalString
  })).optional(),
  collaborations: z.array(z.object({
    activity_id: optionalString,
    title_of_activity: optionalString,
    title: optionalString,
    name_of_collaborative_agency: optionalString,
    type_of_activity: optionalString,
    nature_of_activity: optionalString,
    number_of_participants: optionalString,
    source_of_financial_support: optionalString,
    funding_amount: optionalString,
    year: optionalString,
    duration: optionalString,
    level: optionalString,
    start_date: optionalString,
    end_date: optionalString,
    link: optionalString,
    academic_year: optionalString,
    department_id: optionalString
  })).optional(),
  phd_supervision: z.array(z.object({
    defence_id: optionalString,
    student_id: optionalString,
    student_name: optionalString,
    enrollment_no: optionalString,
    thesis_title: optionalString,
    thesis_type: optionalString,
    supervisor_name: optionalString,
    supervisor_id: optionalString,
    registration_year: optionalString,
    date_of_defence: optionalString,
    date_of_result_notification: optionalString,
    result_outcome: optionalString,
    academic_year: optionalString,
    remarks: optionalString,
    link: optionalString,
    department_id: optionalString
  })).optional(),
  mous: z.array(z.object({
    mou_id: optionalString,
    organisation_name: optionalString,
    title: optionalString,
    type_of_mou: optionalString,
    year_of_signing: optionalString,
    purpose: optionalString,
    activities_under_mou: optionalMouActivities,
    start_date: optionalString,
    end_date: optionalString,
    level: optionalString,
    link: optionalString,
    academic_year: optionalString,
    department_id: optionalString
  })).optional(),
  workshops: z.array(z.object({
    program_id: optionalString,
    program_title: optionalString,
    type_of_program: optionalString,
    type_of_program_other: optionalString,
    level: optionalString,
    mode: optionalString,
    duration_days: optionalString,
    organising_body: optionalString,
    funding_agency: optionalString,
    venue: optionalString,
    certificate_link: optionalString,
    start_date: optionalString,
    end_date: optionalString,
    outcome: optionalString,
    remarks: optionalString,
    link: optionalString,
    academic_year: optionalString,
    department_id: optionalString
  })).optional(),
  summer_institutes_attended: z.array(z.object({ description: optionalString })).optional(),
  summer_institutes_organized: z.array(z.object({ description: optionalString })).optional(),
  ug_pg_guidance: z.array(z.object({ description: optionalString })).optional(),
  phd_guidance_text: z.array(z.object({ description: optionalString })).optional(),
  research_guidance: z.array(z.object({ description: optionalString })).optional(),
  industry_interaction: z.array(z.object({ description: optionalString })).optional(),
  memberships_text: z.array(z.object({ description: optionalString })).optional(),
  other_activities: z.array(z.object({ description: optionalString })).optional()
});

// Corporate Life Validation
const corporateSchema = z.object({
  curriculum_development: z.array(z.object({ description: optionalString })).optional(),
  course_development_details: z.array(z.object({ description: optionalString })).optional(),
  lab_development: z.array(z.object({ description: optionalString })).optional(),
  cultural_activities: z.array(z.object({ description: optionalString })).optional(),
  sports_community: z.array(z.object({ description: optionalString })).optional(),
  admin_assignment_university: z.array(z.object({ description: optionalString })).optional(),
  admin_assignment_department: z.array(z.object({ description: optionalString })).optional(),
  admin_assignment_external: z.array(z.object({ description: optionalString })).optional(),
  any_other: z.array(z.object({ description: optionalString })).optional(),
  // Ensure that certification evaluates properly from both strings and booleans
  certify: z.preprocess(
    (val) => val === 'true' || val === true,
    z.boolean().refine(val => val === true, { message: "Certification is required" })
  )
});

// Assessment Validation (scores must be between 1-10)
const assessmentScoreSchema = z.object({
  q1: optionalScore(),
  q2: optionalScore(),
  q3: optionalScore(),
  q4: optionalScore(),
  overall_grading: optionalScore()
});

const assessmentSectionBSchema = z.object({
  q1: optionalScore(),
  q2: optionalScore(),
  q3: optionalScore(),
  q4: optionalScore(),
  q5: optionalScore(),
  q6: optionalScore(),
  q7a: optionalScore(),
  q7b: optionalScore(),
  q8: optionalScore(),
  q9: optionalScore(),
  q10: optionalScore(),
  q11: z.preprocess(nullToUndefined, z.union([z.enum(['Outstanding', 'Very Good', 'Good', 'Average', 'Below Average']), z.literal('')]).optional()),
  overall_grading: optionalScore()
});

const assessmentSectionCSchema = z.object({
  q1: optionalScore(),
  q2: optionalScore(),
  q3: optionalScore(),
  q4: optionalScore(),
  q5: optionalScore(),
  q6: optionalScore(),
  overall_grading: optionalScore()
});

const assessmentGeneralSchema = z.object({
  q1: optionalString,
  q2: optionalString,
  q3: optionalString,
  q4: optionalString,
  q5: optionalString,
  q6: optionalScore('Overall score must be between 1 and 10')
});

const assessmentSchema = z.object({
  section_a: assessmentScoreSchema.optional(),
  section_b: assessmentSectionBSchema.optional(),
  section_c: assessmentSectionCSchema.optional(),
  general: assessmentGeneralSchema.optional()
});

const requiredAssessmentSchema = z.object({
  section_a: z.object({
    q1: requiredScore('Section A Q1'),
    q2: requiredScore('Section A Q2'),
    q3: requiredScore('Section A Q3'),
    q4: requiredScore('Section A Q4'),
    overall_grading: requiredScore('Section A overall grading')
  }),
  section_b: z.object({
    q1: requiredScore('Section B Q1'),
    q2: requiredScore('Section B Q2'),
    q3: requiredScore('Section B Q3'),
    q4: requiredScore('Section B Q4'),
    q5: requiredScore('Section B Q5'),
    q6: requiredScore('Section B Q6'),
    q7a: requiredScore('Section B Q7a'),
    q7b: requiredScore('Section B Q7b'),
    q8: requiredScore('Section B Q8'),
    q9: requiredScore('Section B Q9'),
    q10: requiredScore('Section B Q10'),
    q11: requiredGradeText,
    overall_grading: requiredScore('Section B overall grading')
  }),
  section_c: z.object({
    q1: requiredScore('Section C Q1'),
    q2: requiredScore('Section C Q2'),
    q3: requiredScore('Section C Q3'),
    q4: requiredScore('Section C Q4'),
    q5: requiredScore('Section C Q5'),
    q6: requiredScore('Section C Q6'),
    overall_grading: requiredScore('Section C overall grading')
  }),
  general: z.object({
    q1: requiredString('Relations with the public'),
    q2: requiredString('Training recommendations'),
    q3: requiredString('State of health'),
    q4: requiredString('Integrity'),
    q5: requiredString('Pen picture'),
    q6: requiredScore('Overall numerical grading', 'Overall score must be between 1 and 10')
  })
});

const requestSchema = (bodySchema) => z.object({
  body: z.preprocess(normalizeNulls, bodySchema),
  params: z.object({}).passthrough(),
  query: z.object({}).passthrough()
});

// Remarks Validation
const remarksSchema = z.object({
  length_of_service: optionalString,
  satisfied_with_reporting: optionalString,
  agree_with_assessment: z.preprocess(nullToUndefined, z.union([z.enum(['Yes', 'No']), z.literal('')]).optional()),
  disagreement_reason: optionalString,
  general_remarks: optionalString,
  specific_characteristics: optionalString,
  signature_place: optionalString,
  signature_date: optionalString,
  query_comment: optionalString
});

const requiredRemarksSchema = z.object({
  length_of_service: requiredString('Length of service'),
  satisfied_with_reporting: requiredString('Satisfaction with reporting officer assessment'),
  agree_with_assessment: requiredString('Agreement with assessment').refine((value) => ['Yes', 'No'].includes(value), {
    message: 'Agreement with assessment is required'
  }),
  disagreement_reason: optionalString,
  general_remarks: requiredString('General remarks'),
  specific_characteristics: requiredString('Specific characteristics'),
  signature_place: requiredString('Signature place'),
  signature_date: requiredString('Signature date')
}).superRefine((data, ctx) => {
  if (data.agree_with_assessment === 'No' && !data.disagreement_reason?.trim()) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Disagreement reason is required',
      path: ['disagreement_reason']
    });
  }
});

// Full APAR Form Schema
export const aparFormSchema = requestSchema(z.object({
  ay: requiredString('Academic Year'),
  faculty_id: requiredString('Faculty ID'),
  formData: z.object({
    personal: personalSchema,
    teaching: teachingSchema.optional(),
    research: researchSchema.optional(),
    corporate: corporateSchema.optional(),
    assessment: assessmentSchema.optional(),
    remarks: remarksSchema.optional()
  }).optional()
}));

// Schema for saving draft (very lenient - only required fields)
export const aparDraftSchema = requestSchema(z.object({
  ay: requiredString('Academic Year'),
  faculty_id: requiredString('Faculty ID'),
  formData: z.object({
    personal: z.object({
      name: optionalString,
      designation: optionalString,
      date_of_birth: optionalString,
      email: optionalString,
      phone: optionalString,
      department_id: optionalString,
      qualification: optionalString,
      qualification_undergraduate: optionalString,
      qualification_postgraduate: optionalString,
      qualification_phd: optionalString,
      joining_date: optionalString,
      report_start_date: optionalString,
      report_end_date: optionalString,
      sc_st_status: optionalString,
      absence_taken: optionalString,
      absence_period: optionalString,
      grade: optionalString
    }).optional(),
    teaching: z.any().optional(),
    research: z.any().optional(),
    corporate: z.any().optional(),
    assessment: z.any().optional(),
    remarks: z.any().optional()
  }).optional()
}));

// Schema for assessment submission (requires assessment section)
export const aparAssessmentSchema = requestSchema(z.object({
  faculty_id: requiredString('Faculty ID'),
  ay: requiredString('Academic Year'),
  assessment: requiredAssessmentSchema,
  status: optionalString,
  query_comment: optionalString
}));

export const aparReviewingSchema = requestSchema(z.object({
  faculty_id: requiredString('Faculty ID'),
  ay: requiredString('Academic Year'),
  remarks: requiredRemarksSchema,
  status: requiredString('Status'),
  query_comment: optionalString
}));