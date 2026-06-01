import mongoose from 'mongoose';

const QualificationSchema = new mongoose.Schema({
  degree: { type: String, trim: true },
  course: { type: String, trim: true },
  field_of_study: { type: String, trim: true },
  institution_name: { type: String, trim: true },
  university_board: { type: String, trim: true },
  year_of_passing: { type: Number },
  percentage_cgpa: { type: String, trim: true },
  certificate_url: { type: String, trim: true }
}, { _id: true });

const FacultyProfileSchema = new mongoose.Schema({
  faculty_id: { type: String, required: true, index: true, unique: true },

  basic_info: {
    full_name: { type: String, trim: true },
    aadhaar_card: { type: String, trim: true },
    caste_category: { type: String, trim: true },
    profile_photo_url: { type: String, trim: true },
    gender: { type: String, trim: true },
    date_of_birth: { type: Date },
    nationality: { type: String, trim: true },
    marital_status: { type: String, trim: true }
  },

  contact_info: {
    mobile_number: { type: String, trim: true },
    alternate_mobile_number: { type: String, trim: true },
    email_address: { type: String, trim: true },
    alternate_email_address: { type: String, trim: true },
    current_address: { type: String, trim: true },
    permanent_address: { type: String, trim: true },
    permanent_city: { type: String, trim: true },
    permanent_state: { type: String, trim: true },
    permanent_postal_code: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    postal_code: { type: String, trim: true },
    emergency_contact_name: { type: String, trim: true },
    emergency_contact_number: { type: String, trim: true }
  },

  professional_info: {
    faculty_staff_id: { type: String, trim: true },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    specialization: [{ type: String, trim: true }],
    date_of_joining: { type: Date },
    date_of_continuous_employment: { type: Date },
    employment_type: { type: String, trim: true },
    present_grade: { type: String, trim: true },
    years_of_experience: { type: Number },
    current_courses: [{ type: String, trim: true }],
    office_location: { type: String, trim: true },
    office_contact_number: { type: String, trim: true }
  },

  educational_qualifications: [QualificationSchema],

  social_links: {
    linkedin_profile: { type: String, trim: true },
    personal_website: { type: String, trim: true },
    google_scholar_profile: { type: String, trim: true },
    researchgate_profile: { type: String, trim: true },
    orcid_id: { type: String, trim: true },
    scopus_author_id: { type: String, trim: true }
  }
}, {
  timestamps: true,
  collection: 'faculty_profiles'
});

export const FacultyProfile = mongoose.model('FacultyProfile', FacultyProfileSchema);
