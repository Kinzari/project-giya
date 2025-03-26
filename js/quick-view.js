document.addEventListener('DOMContentLoaded', () => {
    const quickViewModal = new bootstrap.Modal(document.getElementById('quickViewModal'));
    const quickViewForm = document.getElementById('quickViewForm');
    const quickViewResults = document.getElementById('quickViewResults');
    const quickViewTableBody = document.getElementById('quickViewTableBody');
    const noResultsMessage = document.getElementById('noResultsMessage') ||
                            createNoResultsElement();
    const debugInfo = document.getElementById('debugInfo');

    function createNoResultsElement() {
        const element = document.createElement('div');
        element.id = 'noResultsMessage';
        element.className = 'alert alert-info mt-3';
        element.style.display = 'none';
        element.textContent = 'No inquiries found for this ID or email.';
        quickViewForm.after(element);
        return element;
    }


    function getBaseUrl() {

        const storedBaseUrl = sessionStorage.getItem('baseURL');
        if (storedBaseUrl) {
            return storedBaseUrl;
        }


        if (window.location.hostname.includes('localhost') || window.location.hostname === '127.0.0.1') {
            return 'http://localhost/api/';
        } else {

            return '/api/';
        }
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
        if (debugInfo) debugInfo.style.display = 'none';

        try {

            const baseURL = getBaseUrl();
            const apiUrl = `${baseURL}posts.php?action=get_quick_view&identifier=${encodeURIComponent(identifier)}`;

            if (debugInfo) {
                debugInfo.textContent = `Calling API: ${apiUrl}`;
                debugInfo.style.display = 'block';
            }

            console.log("Attempting API call to:", apiUrl);


            const response = await axios.get(apiUrl, { timeout: 15000 });
            console.log("API Response:", response.data);

            toastr.clear(loadingToast);


            if (response.data && response.data.status === 'success' && response.data.data && response.data.data.length > 0) {

                quickViewTableBody.innerHTML = response.data.data.map(item => `
                    <tr>
                        <td>#${item.post_id}</td>
                        <td>${item.postType_name || 'Unknown'}</td>
                        <td>${formatDate(item.post_date)}</td>
                        <td><span class="badge ${getStatusBadgeClass(item.post_status)}">${getStatusText(item.post_status)}</span></td>
                    </tr>
                `).join('');

                quickViewResults.style.display = 'block';
                toastr.success(`Found ${response.data.data.length} inquiries`);


                sessionStorage.setItem('baseURL', baseURL);

                if (debugInfo) {
                    debugInfo.textContent = `Found ${response.data.data.length} results for: ${identifier}`;
                    debugInfo.style.display = 'block';
                }
            } else {
                noResultsMessage.style.display = 'block';
                toastr.info('No inquiries found for this ID or email.');
            }
        } catch (error) {
            toastr.clear(loadingToast);
            console.error("API Error:", error);


            if (error.response) {

                const errorMessage = error.response.data?.message || `Server error ${error.response.status}`;
                toastr.error(`Error: ${errorMessage}`);

                if (debugInfo) {
                    debugInfo.textContent = `Server Error (${error.response.status}): ${errorMessage}`;
                    debugInfo.style.display = 'block';
                }
            } else if (error.request) {

                toastr.error('No response from server. Please check your connection.');


                const currentBaseUrl = getBaseUrl();
                let suggestion = "Suggestions: ";

                if (currentBaseUrl.startsWith('http://')) {
                    suggestion += "Server might require HTTPS. ";
                } else if (currentBaseUrl.startsWith('https://')) {
                    suggestion += "Try using HTTP instead. ";
                }

                suggestion += "Check that the API is running at " + currentBaseUrl;

                if (debugInfo) {
                    debugInfo.innerHTML = `Error: No response received from server<br><small>${suggestion}</small>`;
                    debugInfo.style.display = 'block';
                }
            } else {

                toastr.error('Error sending request: ' + error.message);

                if (debugInfo) {
                    debugInfo.textContent = `Error: ${error.message}`;
                    debugInfo.style.display = 'block';
                }
            }
        }
    });

    function formatDate(dateStr) {
        if (!dateStr) return 'Unknown';
        try {
            const parts = dateStr.split(/[-\/]/);

            if (parts.length === 3) {
                return dateStr;
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
            if (debugInfo) debugInfo.style.display = 'none';
            quickViewModal.show();
        });
    }
});
