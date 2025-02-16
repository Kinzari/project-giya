document.addEventListener('DOMContentLoaded', () => {
    // Use AuthHelper for authentication
    if (!AuthHelper.isVisitor()) {
        window.location.href = 'choose-concern.html';
        return;
    }

    const visitorId = AuthHelper.getId();
    document.getElementById('visitorId').value = visitorId;

    // Load departments
    loadDepartments();

    // Form submission
    document.getElementById('visitorFeedbackForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const rating = document.querySelector('input[name="rating"]:checked');
        if (!rating) {
            toastr.error('Please provide a rating');
            return;
        }

        const formData = {
            visitorId: document.getElementById('visitorId').value,
            department: document.getElementById('department').value,
            feedbackType: document.getElementById('feedbackType').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value,
            rating: rating.value
        };

        try {
            const response = await axios.post(
                `${sessionStorage.getItem('baseURL')}?action=submitVisitorFeedback`,
                formData
            );

            if (response.data.success) {
                toastr.success('Feedback submitted successfully!');
                setTimeout(() => {
                    window.location.href = 'choose-concern.html';
                }, 2000);
            } else {
                toastr.error(response.data.message || 'Failed to submit feedback');
            }
        } catch (error) {
            console.error(error);
            toastr.error('An error occurred while submitting feedback');
        }
    });
});

// Reuse loadDepartments function
async function loadDepartments() {
    // ...same as feedback-student.js...
}
