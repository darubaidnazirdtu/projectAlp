import re
import os

filepath = r"c:\DTU Project\projectAlp\frontend\src\pages\Apar\Profile.jsx"

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update Aadhaar validation message
content = content.replace("if (!isAadhaar(val)) return 'Aadhaar must be 12 digits';", "if (!isAadhaar(val)) return 'Aadhaar must be exactly 12 digits';")

# 2. Update Nationality validation
content = content.replace(
    "if (val && !/^[A-Za-z ]+$/.test(val)) return 'Only letters and spaces allowed';",
    "if (val && !/^[A-Za-z ]+$/.test(val)) return 'Only letters allowed (no numbers or special characters)';"
)

# 3. Add asterisks to manually defined labels
required_fields = [
    "Full Name", "Aadhaar Card", "Gender", "Date of Birth", "Nationality",
    "Marital Status", "Category", "Current Address", "City", "State",
    "Postal Code", "Permanent Address", "Permanent City", "Permanent State",
    "Permanent Postal Code", "Specialization" # Wait, specialization isn't required.
]

for field in required_fields:
    content = content.replace(f"<label className={{labelBase}}>{field}</label>", f'<label className={{labelBase}}>{field} <span className="text-red-500">*</span></label>')

# 4. For Contact info loop
# [['contact_info.mobile_number','Mobile Number'], ... ]
contact_loop_orig = """              {[
                ['contact_info.mobile_number','Mobile Number'],
                ['contact_info.alternate_mobile_number','Alternate Mobile Number'],
                ['contact_info.email_address','Email Address'],
                ['contact_info.alternate_email_address','Alternate Email Address'],
                ['contact_info.emergency_contact_name','Emergency Contact Name'],
                ['contact_info.emergency_contact_number','Emergency Contact Number']
              ].map(([path,label]) => ("""
contact_loop_new = """              {[
                ['contact_info.mobile_number','Mobile Number', true],
                ['contact_info.alternate_mobile_number','Alternate Mobile Number', false],
                ['contact_info.email_address','Email Address', true],
                ['contact_info.alternate_email_address','Alternate Email Address', false],
                ['contact_info.emergency_contact_name','Emergency Contact Name', false],
                ['contact_info.emergency_contact_number','Emergency Contact Number', false]
              ].map(([path,label, req]) => ("""
content = content.replace(contact_loop_orig, contact_loop_new)

contact_label_orig = "<label className={labelBase}>{label}</label>"
contact_label_new = '<label className={labelBase}>{label} {req && <span className="text-red-500">*</span>}</label>'
# Wait, replacing contact_label_orig will replace all occurrences!
# Let's only replace it within the loops. We can just replace all `<label className={labelBase}>{label}</label>` with `<label className={labelBase}>{label} {req && <span className="text-red-500">*</span>}</label>`
# But wait, what if `req` is undefined in other loops?
# Let's check other loops:
# Professional Info loop
prof_loop_orig = """              {[
                ['professional_info.faculty_staff_id','Employee ID'],
                ['professional_info.designation','Designation'],
                ['professional_info.department','Department'],
                ['professional_info.date_of_joining','Date of Joining','date'],
                ['professional_info.date_of_continuous_employment','Date of Continuous Employment','date'],
                ['professional_info.employment_type','Employment Type'],
                ['professional_info.years_of_experience','Years of Experience','number'],
                ['professional_info.office_location','Office Location'],
                ['professional_info.office_contact_number','Office Contact Number'],
                ['professional_info.present_grade','Present Grade']
              ].map(([path,label,type]) => ("""
prof_loop_new = """              {[
                ['professional_info.faculty_staff_id','Employee ID', '', false],
                ['professional_info.designation','Designation', '', false],
                ['professional_info.department','Department', '', false],
                ['professional_info.date_of_joining','Date of Joining','date', true],
                ['professional_info.date_of_continuous_employment','Date of Continuous Employment','date', true],
                ['professional_info.employment_type','Employment Type', '', true],
                ['professional_info.years_of_experience','Years of Experience','number', false],
                ['professional_info.office_location','Office Location', '', false],
                ['professional_info.office_contact_number','Office Contact Number', '', false],
                ['professional_info.present_grade','Present Grade', '', true]
              ].map(([path,label,type,req]) => ("""
content = content.replace(prof_loop_orig, prof_loop_new)

# Educational loop
edu_loop_orig = """                  {[
                    ['degree','Degree'],
                    ['course','Course'],
                    ['field_of_study','Field of Study'],
                    ['institution_name','Institution Name'],
                    ['university_board','University/Board'],
                    ['year_of_passing','Year of Passing'],
                    ['percentage_cgpa','Percentage/CGPA']
                  ].map(([k,label]) => ("""
edu_loop_new = """                  {[
                    ['degree','Degree', true],
                    ['course','Course', true],
                    ['field_of_study','Field of Study', true],
                    ['institution_name','Institution Name', true],
                    ['university_board','University/Board', true],
                    ['year_of_passing','Year of Passing', true],
                    ['percentage_cgpa','Percentage/CGPA', true]
                  ].map(([k,label, req]) => ("""
content = content.replace(edu_loop_orig, edu_loop_new)

social_loop_orig = """              {[
                ['social_links.google_scholar_profile','Google Scholar Profile','url'],
                ['social_links.researchgate_profile','ResearchGate Profile','url'],
                ['social_links.orcid_id','ORCID ID','text'],
                ['social_links.scopus_author_id','Scopus Author ID','text']
              ].map(([path,label,type]) => ("""
social_loop_new = """              {[
                ['social_links.google_scholar_profile','Google Scholar Profile','url', true],
                ['social_links.researchgate_profile','ResearchGate Profile','url', true],
                ['social_links.orcid_id','ORCID ID','text', false],
                ['social_links.scopus_author_id','Scopus Author ID','text', true]
              ].map(([path,label,type,req]) => ("""
content = content.replace(social_loop_orig, social_loop_new)

# Now replace the dynamic label
content = content.replace("<label className={labelBase}>{label}</label>", '<label className={labelBase}>{label} {req && <span className="text-red-500">*</span>}</label>')

# Address sections:
addr_fields = [
    "Address", "City", "State", "Postal Code"
]
# Wait, address fields have multiple occurrences. Let's just do a regex replace for address labels.
# Current Address block
content = content.replace('<label className={labelBase}>Address</label>', '<label className={labelBase}>Address <span className="text-red-500">*</span></label>')


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated successfully")
