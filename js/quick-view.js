document.addEventListener('DOMContentLoaded', () => {
    const quickViewModal = new bootstrap.Modal(document.getElementById('quickViewModal'));
    const quickViewForm = document.getElementById('quickViewForm');
    const quickViewResults = document.getElementById('quickViewResults');
    const quickViewTableBody = document.getElementById('quickViewTableBody');

    quickViewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('quickViewId').value.trim();

        try {
            const response = await axios.get(
                `${sessionStorage.getItem('baseURL') || 'http://localhost/api/'}inquiry.php?action=quick_view&identifier=${identifier}`
            );

            if (response.data.status === 'success') {
                quickViewTableBody.innerHTML = response.data.data.map(item => `
                    <tr>
                        <td>#${item.post_id}</td>
                        <td>${item.type}</td>
                        <td>${new Date(item.post_date).toLocaleDateString()}</td>
                        <td><span class="badge ${getStatusBadgeClass(item.post_status)}">${getStatusText(item.post_status)}</span></td>
                    </tr>
                `).join('');

                quickViewResults.style.display = 'block';
            } else {
                toastr.error(response.data.message || 'No inquiries found');
                quickViewResults.style.display = 'none';
            }
        } catch (error) {
            toastr.error('Error fetching inquiries');
            console.error('Error:', error);
        }
    });

    function getStatusBadgeClass(status) {
        return {
            '0': 'bg-danger',    // Pending
            '1': 'bg-warning',   // Ongoing
            '2': 'bg-success'    // Resolved
        }[status] || 'bg-secondary';
    }

    function getStatusText(status) {
        return {
            '0': 'Pending',
            '1': 'Ongoing',
            '2': 'Resolved'
        }[status] || 'Unknown';
    }

    // Show modal when quick view button is clicked
    document.getElementById('quickViewBtn').addEventListener('click', () => {
        quickViewModal.show();
    });
});
