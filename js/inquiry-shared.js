function formatFullName(firstName, middleName, lastName, suffix) {
    const middleInitial = middleName
      ? middleName.trim().charAt(0).toUpperCase() + '.'
      : '';

    let fullName = firstName || '';
    if (middleInitial) fullName += ' ' + middleInitial;
    if (lastName) fullName += ' ' + lastName;
    if (suffix) fullName += ' ' + suffix;

    return fullName.trim();
  }


function getInquiryDescription(inquiryType) {
    const descriptions = {
        ACADEMICS: "Grades, Teachers, Dean",
        REGISTRAR: "TOR, Diploma, Credentials, School Related Documents",
        FINANCE: "Balance, Assessment, Scholarships",
        BUSINESS_CENTER: "Books, Uniforms",
        CSDL: "Guidance Counseling, Student Loan, Financial Aid, Scholarship Renewal, Duty Assignment",
        MARKETING: "New Students, Promotion",
        IT_SERVICES: "SIS Account, Gmail Account, GCR",
        LIBRARY: "Books, E-Library",
        CLINIC: "School Physician, School Nurse",
        GSD: "Facilities, Classrooms, Laboratories, Canteen, Comfort Rooms, Parkings",
        GRADUATE_SCHOOL: "Courses available, Virtual Classroom",
        SSG: "Modules",
        HR: "Hiring, Contract",
        ACE: "Alumni, Job Placement, Career Talks, Graduation Pictures, Exclusive Hiring",
        OTHERS: "Other inquiries",
    };
    return `${inquiryType} (${descriptions[inquiryType] || ""})`;
}

function getInquiryTypeFullText(type) {
    const descriptions = {
        'ENROLLMENT': 'ENROLLMENT (Enrollment Process, ORF, SIS, ID, Email, Down Payment, Module)',
        'ACADEMICS': 'ACADEMICS (Grades, Teachers, Dean)',
        'REGISTRAR': 'REGISTRAR (TOR, Diploma, Credentials, School Related Documents)',
        'FINANCE': 'FINANCE (Balance, Assessment, Scholarships)',
        'BUSINESS_CENTER': 'BUSINESS CENTER (Books, Uniforms)',
        'CSDL': 'CSDL (Guidance Counseling, Student Loan, Financial Aid, Scholarship Renewal, Duty Assignment)',
        'MARKETING': 'MARKETING (New Students, Promotion)',
        'IT_SERVICES': 'IT SERVICES (SIS Account, Gmail Account, GCR)',
        'LIBRARY': 'LIBRARY (Books, E-Library)',
        'CLINIC': 'CLINIC (School Physician, School Nurse)',
        'GSD': 'GENERAL SERVICES DEPARTMENT (Facilities, Classrooms, Laboratories, Canteen, Comfort Rooms, Parkings)',
        'GRADUATE_SCHOOL': 'GRADUATE SCHOOL (Courses available, Virtual Classroom)',
        'SSG': 'SSG (Modules)',
        'HR': 'HUMAN RESOURCE (Hiring, Contract)',
        'ACE': 'ACE (Alumni, Job Placement, Career Talks, Graduation Pictures, Exclusive Hiring)',
        'OTHERS': 'OTHERS'
    };
    return descriptions[type] || type;
}

function getInquiryTypes() {
    return [
        { id: "ACADEMICS", desc: "Grades, Teachers, Dean" },
        {
            id: "REGISTRAR",
            desc: "TOR, Diploma, Credentials, School Related Documents",
        },
        { id: "FINANCE", desc: "Balance, Assessment, Scholarships" },
        { id: "BUSINESS_CENTER", desc: "Books, Uniforms" },
        {
            id: "CSDL",
            desc: "Guidance Counseling, Student Loan, Financial Aid, Scholarship Renewal, Duty Assignment",
        },
        { id: "MARKETING", desc: "New Students, Promotion" },
        { id: "IT_SERVICES", desc: "SIS Account, Gmail Account, GCR" },
        { id: "LIBRARY", desc: "Books, E-Library" },
        { id: "CLINIC", desc: "School Physician, School Nurse" },
        {
            id: "GSD",
            desc: "Facilities, Classrooms, Laboratories, Canteen, Comfort Rooms, Parkings",
        },
        { id: "GRADUATE_SCHOOL", desc: "Courses available, Virtual Classroom" },
        { id: "SSG", desc: "Modules" },
        { id: "HR", desc: "Hiring, Contract" },
        {
            id: "ACE",
            desc: "Alumni, Job Placement, Career Talks, Graduation Pictures, Exclusive Hiring",
        },
        { id: "OTHERS", desc: "Other inquiries" },
    ];
}
