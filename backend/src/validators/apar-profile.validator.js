import { z } from 'zod';

const nullableString = z.string().trim().optional().nullable();
const dateLike = z.preprocess((val) => val ? new Date(val) : null, z.date().optional().nullable());
const requiredDateLike = z.preprocess((val) => val ? new Date(val) : null, z.date({ required_error: 'Date is required' }));

const qualificationSchema = z.object({
  degree: nullableString,
  field_of_study: nullableString,
  institution_name: nullableString,
  university_board: nullableString,
  year_of_passing: z.number().int().min(1900).max(new Date().getFullYear()).optional().nullable(),
  percentage_cgpa: nullableString,
  certificate_url: nullableString
});

export const upsertProfileSchema = z.object({
  body: z.object({
    faculty_id: z.string().trim().optional(),
    basic_info: z.object({
      full_name: z.string().trim().min(1, 'Full Name is required'),
      aadhaar_card: nullableString,
      caste_category: nullableString,
      profile_photo_url: nullableString,
      gender: z.string().trim().min(1, 'Gender is required'),
      date_of_birth: requiredDateLike,
      nationality: z.string().trim().min(1, 'Nationality is required'),
      marital_status: z.string().trim().min(1, 'Marital Status is required')
    }),
    contact_info: z.object({
      mobile_number: nullableString,
      alternate_mobile_number: nullableString,
      email_address: nullableString,
      alternate_email_address: nullableString,
      current_address: z.string().trim().min(1, 'Current Address is required'),
      permanent_address: z.string().trim().min(1, 'Permanent Address is required'),
      permanent_city: z.string().trim().min(1, 'Permanent City is required'),
      permanent_state: z.string().trim().min(1, 'Permanent State is required'),
      permanent_postal_code: z.string().trim().min(1, 'Permanent Postal Code is required'),
      city: z.string().trim().min(1, 'City is required'),
      state: z.string().trim().min(1, 'State is required'),
      postal_code: z.string().trim().min(1, 'Postal Code is required'),
      emergency_contact_name: nullableString,
      emergency_contact_number: nullableString
    }),
    professional_info: z.object({
      faculty_staff_id: nullableString,
      designation: nullableString,
      department: nullableString,
      specialization: z.array(z.string().trim().regex(/^[A-Za-z0-9 ]+$/, 'Only letters, numbers and spaces')).optional(),
      date_of_joining: requiredDateLike,
      date_of_continuous_employment: requiredDateLike,
      employment_type: z.string().trim().min(1, 'Employment Type is required'),
      present_grade: nullableString,
      years_of_experience: z.number().min(0).max(70).optional().nullable(),
      current_courses: z.array(z.string().trim()).optional(),
      office_location: nullableString,
      office_contact_number: nullableString
    }),
    educational_qualifications: z.array(qualificationSchema)
      .min(1, 'At least one qualification is required')
      .refine((list) => Array.isArray(list) && list.some((q) => typeof q?.degree === 'string' && q.degree.trim().toLowerCase() === 'graduation'), {
        message: "At least one 'Graduation' qualification is required"
      }),
    social_links: z.object({
      linkedin_profile: nullableString,
      personal_website: nullableString,
      google_scholar_profile: nullableString,
      researchgate_profile: nullableString,
      orcid_id: nullableString,
      scopus_author_id: nullableString
    }).optional()
  })
});
