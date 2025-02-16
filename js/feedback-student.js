document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const userTypeId = localStorage.getItem('user_typeId');
    const firstName = localStorage.getItem('first_name');
    const studentId = localStorage.getItem('studentId');

    if (!userTypeId || !firstName || userTypeId !== '2') {
        window.location.href = 'index.html';
        return;
    }

    // Add logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        Swal.fire({
            title: 'Logout Confirmation',
            text: 'Are you sure you want to logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#155f37',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, logout'
        }).then((result) => {
            if (result.isConfirmed) {
                toastr.success('Logging out...');
                localStorage.clear();
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        });
    });

    // Populate student info
    document.getElementById('studentId').value = studentId;
    document.getElementById('courseYear').value = localStorage.getItem('courseYear') || '';

    // Load departments
    loadDepartments();

    // Form submission
    document.getElementById('studentFeedbackForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const rating = document.querySelector('input[name="rating"]:checked');
        if (!rating) {
            toastr.error('Please provide a rating');
            return;
        }

        const formData = {
            studentId: document.getElementById('studentId').value,
            department: document.getElementById('department').value,
            feedbackType: document.getElementById('feedbackType').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value,
            rating: rating.value
        };

        try {
            const response = await axios.post(
                `${sessionStorage.getItem('baseURL')}?action=submitFeedback`,
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

async function loadDepartments() {
    try {
        const response = await axios.get(`${sessionStorage.getItem('baseURL')}?action=get_departments`);
        const departmentSelect = document.getElementById('department');

        if (response.data.success && response.data.departments) {
            response.data.departments.forEach(dept => {
                const option = new Option(dept.name, dept.id);
                departmentSelect.add(option);
            });
        }
    } catch (error) {
        console.error('Error loading departments:', error);
        toastr.error('Failed to load departments');
    }
}
