document.addEventListener('DOMContentLoaded', () => {
    // Check authentication
    const userTypeId = localStorage.getItem('user_typeId');
    const firstName = localStorage.getItem('first_name');
    const studentId = localStorage.getItem('studentId');

    if (!userTypeId || !firstName || userTypeId !== '2') {
        window.location.href = 'choose-concern.html';
        return;
    }

    // Populate student info
    document.getElementById('studentId').value = studentId;
    document.getElementById('courseYear').value = localStorage.getItem('courseYear') || '';

    // Load departments
    loadDepartments();

    // Form submission
    document.getElementById('studentSuggestionForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            studentId: document.getElementById('studentId').value,
            department: document.getElementById('department').value,
            suggestionType: document.getElementById('suggestionType').value,
            subject: document.getElementById('subject').value,
            message: document.getElementById('message').value,
            benefits: document.getElementById('benefits').value,
            timeline: document.getElementById('timeline').value
        };

        try {
            const response = await axios.post(
                `${sessionStorage.getItem('baseURL')}?action=submitSuggestion`,
                formData
            );

            if (response.data.success) {
                toastr.success('Suggestion submitted successfully!');
                setTimeout(() => {
                    window.location.href = 'choose-concern.html';
                }, 2000);
            } else {
                toastr.error(response.data.message || 'Failed to submit suggestion');
            }
        } catch (error) {
            console.error(error);
            toastr.error('An error occurred while submitting suggestion');
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
