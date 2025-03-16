document.addEventListener('DOMContentLoaded', () => {
    const quickViewModal = new bootstrap.Modal(document.getElementById('quickViewModal'));
    const quickViewForm = document.getElementById('quickViewForm');
    const quickViewResults = document.getElementById('quickViewResults');
    const quickViewTableBody = document.getElementById('quickViewTableBody');
    const noResultsMessage = document.getElementById('noResultsMessage') ||
                            createNoResultsElement();

    function createNoResultsElement() {
        const element = document.createElement('div');
        element.id = 'noResultsMessage';
        element.className = 'alert alert-info mt-3';
        element.style.display = 'none';
        element.textContent = 'No inquiries found for this ID or email.';
        quickViewForm.after(element);
        return element;
    }

    quickViewForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const identifier = document.getElementById('quickViewId').value.trim();

        if (!identifier) {
            toastr.warning('Please enter a Student ID, Email or Visitor ID');
            return;
        }

        const loadingToast = toastr.info('Searching for inquiries...', '', {timeOut: 0});

        quickViewResults.style.display = 'none';
        noResultsMessage.style.display = 'none';

        try {
            const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
            const apiUrl = `${baseURL}posts.php?action=get_quick_view&identifier=${encodeURIComponent(identifier)}`;
            const response = await axios.get(apiUrl);

            toastr.clear(loadingToast);

            const responseData = response.data;
            let postsData = null;

            if (responseData.status === 'success' && responseData.data && Array.isArray(responseData.data)) {
                postsData = responseData.data;
            } else if (Array.isArray(responseData)) {
                postsData = responseData;
            } else if (responseData.posts && Array.isArray(responseData.posts)) {
                postsData = responseData.posts;
            } else if (responseData.data && Array.isArray(responseData.data)) {
                postsData = responseData.data;
            }

            if (postsData && postsData.length > 0) {
                quickViewTableBody.innerHTML = postsData.map(item => `
                    <tr>
                        <td>#${item.post_id}</td>
                        <td>${item.postType_name || item.type || 'Unknown'}</td>
                        <td>${formatDate(item.post_date)}</td>
                        <td><span class="badge ${getStatusBadgeClass(item.post_status)}">${getStatusText(item.post_status)}</span></td>
                    </tr>
                `).join('');

                quickViewResults.style.display = 'block';
                toastr.success(`Found ${postsData.length} inquiries`);
            } else {
                noResultsMessage.style.display = 'block';
                toastr.info('No inquiries found for this ID or email.');
            }
        } catch (error) {
            toastr.clear(loadingToast);

            if (error.response) {
                const errorMessage = error.response.data?.message || 'Server returned an error';
                toastr.error(`Error: ${errorMessage}`);
            } else if (error.request) {
                toastr.error('No response from server. Please check your connection.');
            } else {
                toastr.error('Error sending request. Please try again later.');
            }
        }
    });

    function formatDate(dateStr) {
        if (!dateStr) return 'Unknown';
        try {
            const parts = dateStr.split(/[-\/]/);

            if (parts.length === 3) {
                if (parseInt(parts[0]) <= 12) {
                    return `${parts[0]}/${parts[1]}/${parts[2]}`;
                } else {
                    return `${parts[1]}/${parts[2]}/${parts[0]}`;
                }
            }

            const date = new Date(dateStr);
            if (!isNaN(date)) {
                return date.toLocaleDateString();
            }

            return dateStr;
        } catch (e) {
            return dateStr;
        }
    }

    function getStatusBadgeClass(status) {
        if (!status && status !== 0) return 'bg-secondary';

        status = String(status);
        switch (status) {
            case '0': return 'bg-danger';
            case '1': return 'bg-warning';
            case '2': return 'bg-success';
            default: return 'bg-secondary';
        }
    }

    function getStatusText(status) {
        if (!status && status !== 0) return 'Unknown';

        status = String(status);
        switch (status) {
            case '0': return 'Pending';
            case '1': return 'Ongoing';
            case '2': return 'Resolved';
            default: return 'Unknown';
        }
    }

    const quickViewBtn = document.getElementById('quickViewBtn');
    if (quickViewBtn) {
        quickViewBtn.addEventListener('click', () => {
            quickViewForm.reset();
            quickViewResults.style.display = 'none';
            noResultsMessage.style.display = 'none';
            quickViewModal.show();
        });
    }
});
