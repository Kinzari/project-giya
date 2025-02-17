document.addEventListener('DOMContentLoaded', async () => {
    // student = 2
    const userTypeId = localStorage.getItem('user_typeId');
    if (userTypeId !== '2') {
        window.location.href = 'choose-concern.html';
        return;
    }

    // localStorage user info with fallbacks
    const userInfo = {
        userId: localStorage.getItem('user_id') || '',
        schoolId: localStorage.getItem('user_schoolId') || '',
        firstName: localStorage.getItem('user_firstname') || '',
        middleName: localStorage.getItem('user_middlename') || '',
        lastName: localStorage.getItem('user_lastname') || '',
        suffix: localStorage.getItem('user_suffix') || '',
        departmentName: localStorage.getItem('department_name') || 'Not Assigned',
        courseName: localStorage.getItem('course_name') || 'Not Assigned',
        yearLevel: localStorage.getItem('user_schoolyearId') || '',
        email: localStorage.getItem('phinmaed_email') || '', // phinmaed_email for students
        contactNumber: localStorage.getItem('user_contact') || '',
        postType: localStorage.getItem('selectedPostType') || ''
    };
    // fill in form fields
    document.getElementById('schoolId').value = userInfo.schoolId;
    document.getElementById('fullName').value = formatFullName(
        userInfo.firstName,
        userInfo.middleName,
        userInfo.lastName,
        userInfo.suffix
    );
    document.getElementById('department').value = userInfo.departmentName;
    document.getElementById('course').value = userInfo.courseName;
    document.getElementById('yearLevel').value = getYearLevelText(userInfo.yearLevel) || 'Not Assigned';
    document.getElementById('email').value = userInfo.email;
    document.getElementById('contactNumber').value = userInfo.contactNumber;

    // inquiry type
    const inquirySelect = document.getElementById('inquiryType');
    if (userInfo.postType) {
        inquirySelect.value = userInfo.postType;
    }

    // form submission handler
    const form = document.getElementById('studentInquiryForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

// full name formatter
function formatFullName(firstName, middleName, lastName, suffix) {
    const middleInitial = middleName ? middleName.trim().charAt(0).toUpperCase() + '.' : '';
    let fullName = firstName || '';
    if (middleInitial) fullName += ' ' + middleInitial;
    if (lastName) fullName += ' ' + lastName;
    if (suffix) fullName += ' ' + suffix;
    return fullName.trim();
}

function getYearLevelText(yearLevel) {
    const yearLevels = {
        '1': '1st Year',
        '2': '2nd Year',
        '3': '3rd Year',
        '4': '4th Year',
        '5': '5th Year'
    };
    return yearLevels[yearLevel] || '';
}

async function handleSubmit(e) {
    e.preventDefault();

    const inquiryType = document.getElementById('inquiryType').value;
    const inquiryMessage = document.getElementById('inquiryMessage').value;

    if (!inquiryType || !inquiryMessage.trim()) {
        Swal.fire('Error!', 'Please fill in all required fields.', 'error');
        return;
    }

    const confirmResult = await Swal.fire({
        title: 'Submit Inquiry?',
        text: 'Are you sure you want to submit this inquiry?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Yes, submit it!',
        cancelButtonText: 'No, cancel'
    });

    if (!confirmResult.isConfirmed) return;

    const formData = {
        user_id: localStorage.getItem('user_id'),
        post_type: inquiryType,
        post_title: getInquiryTypeFullText(inquiryType), // inquiry type full text
        post_message: inquiryMessage
    };

    try {
        const response = await axios.post(
            `${sessionStorage.getItem('baseURL')}?action=submit_inquiry`,
            formData
        );

        if (response.data.success) {
            await Swal.fire('Success!', 'Your inquiry has been submitted.', 'success');
            window.location.href = 'choose-concern.html';
        } else {
            throw new Error(response.data.message || 'Failed to submit inquiry');
        }
    } catch (error) {
        Swal.fire('Error!', error.message || 'Failed to submit inquiry. Please try again.', 'error');
    }
}
