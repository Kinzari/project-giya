document.addEventListener('DOMContentLoaded', async () => {
    // 1. Ensure user_typeId is '1' (visitor)
    const userTypeId = localStorage.getItem('user_typeId');
    if (userTypeId !== '1') {
        window.location.href = 'choose-concern.html';
        return;
    }

    // 2. Get user info with fallbacks
    const userInfo = {
        userId: localStorage.getItem('user_id') || '',
        schoolId: localStorage.getItem('user_schoolId') || '',
        firstName: localStorage.getItem('user_firstname') || '',
        middleName: localStorage.getItem('user_middlename') || '',
        lastName: localStorage.getItem('user_lastname') || '',
        suffix: localStorage.getItem('user_suffix') || '',
        email: localStorage.getItem('user_email') || '', // Use user_email for visitors
        contactNumber: localStorage.getItem('user_contact') || '',
        postType: localStorage.getItem('selectedPostType') || ''
    };

    // 3. Fill in form fields
    document.getElementById('schoolId').value = userInfo.schoolId;
    document.getElementById('fullName').value = formatFullName(
        userInfo.firstName,
        userInfo.middleName,
        userInfo.lastName,
        userInfo.suffix
    );
    document.getElementById('email').value = userInfo.email;
    document.getElementById('contactNumber').value = userInfo.contactNumber;

    // 4. Set the inquiry type if previously selected
    const inquirySelect = document.getElementById('inquiryType');
    if (userInfo.postType) {
        inquirySelect.value = userInfo.postType;
    }

    // 5. Handle form submission
    const form = document.getElementById('visitorInquiryForm');
    if (form) {
        form.addEventListener('submit', handleSubmit);
    }
});

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
        post_title: getInquiryTypeFullText(inquiryType), // Use the full text description
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
