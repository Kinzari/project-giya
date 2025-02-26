// Base URL configuration
sessionStorage.setItem("baseURL", "http://localhost/api/");
// sessionStorage.setItem("baseURL", "http://192.168.137.190/api/");

document.addEventListener('DOMContentLoaded', () => {
    // Auth check
    const auth = AuthHelper.checkAuth();
    if (!auth.isValid) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userFirstName').textContent = auth.firstName;

    // Check privacy policy status when page loads
    async function checkPrivacyPolicyStatus() {
        try {
            const response = await axios.get(
                `${sessionStorage.getItem('baseURL')}inquiry.php?action=check_privacy_policy&user_id=${sessionStorage.getItem('user_id')}`
            );
            if (response.data.success && response.data.privacy_policy_check === 1) {
                sessionStorage.setItem('privacyPolicyAccepted', 'true');
            } else {
                sessionStorage.removeItem('privacyPolicyAccepted');
            }
        } catch (error) {
            console.error('Error checking privacy policy status:', error);
        }
    }

    // Call the check on page load
    checkPrivacyPolicyStatus();

    // Initialize dropdowns
    document.querySelectorAll('.dropdown-toggle').forEach(dropdown => {
        new bootstrap.Dropdown(dropdown);
    });

    // Privacy Modal handling
    const privacyModalElement = document.getElementById('privacyModal');
    const privacyModal = new bootstrap.Modal(privacyModalElement);
    const privacyContent = document.getElementById('privacyContent');
    const acceptBtn = document.getElementById('acceptPrivacyBtn');

    privacyContent.addEventListener('scroll', () => {
        const isAtBottom = Math.abs(
            privacyContent.scrollHeight - privacyContent.scrollTop - privacyContent.clientHeight
        ) < 2;
        if (isAtBottom) {
            acceptBtn.removeAttribute('disabled');
            acceptBtn.classList.add('btn-pulse');
        }
    });

    privacyModalElement.addEventListener('show.bs.modal', () => {
        acceptBtn.setAttribute('disabled', 'disabled');
        acceptBtn.classList.remove('btn-pulse');
        privacyContent.scrollTop = 0;
    });

    document.getElementById('acceptPrivacyBtn').addEventListener('click', async () => {
        const pendingUrl = sessionStorage.getItem('pendingRedirect');
        if (pendingUrl) {
            try {
                const userId = sessionStorage.getItem('user_id');
                console.log("User ID from sessionStorage:", userId);
                await axios.post(
                    `${sessionStorage.getItem('baseURL')}inquiry.php?action=update_privacy_policy`,
                    {
                        user_id: userId,
                        privacy_policy_check: 1
                    }
                );
                sessionStorage.setItem('privacyPolicyAccepted', 'true');
                Swal.fire({
                    icon: 'success',
                    title: 'Privacy Policy Accepted',
                    text: 'Redirecting...',
                    timer: 1500,
                    showConfirmButton: false
                });
                sessionStorage.removeItem('pendingRedirect');
                setTimeout(() => {
                    window.location.href = pendingUrl;
                }, 1500);
            } catch (error) {
                console.error('Failed to update privacy policy flag:', error);
            }
        }
    });

    // Concern button click handlers
    document.querySelectorAll('.concern-btn').forEach(btn => {
        btn.addEventListener('click', async () => {
            const type = btn.dataset.type;
            sessionStorage.setItem('selectedPostType', type);
            const targetUrl = 'form.html';
            sessionStorage.setItem('pendingRedirect', targetUrl);

            // Recheck privacy policy status before proceeding
            await checkPrivacyPolicyStatus();

            if (sessionStorage.getItem('privacyPolicyAccepted') === 'true') {
                window.location.href = targetUrl;
            } else {
                privacyModal.show();
            }
        });
    });

    // Initialize modals for submissions
    const inquiryStatusModal = new bootstrap.Modal(document.getElementById('inquiryStatusModal'));
    const submissionDetailModal = new bootstrap.Modal(document.getElementById('submissionDetailModal'));
    let currentSubmissionId = null;

    // Show inquiry status modal
    document.getElementById('inquiryStatusBtn').addEventListener('click', () => {
        loadUserSubmissions();
        inquiryStatusModal.show();
    });

    // Load all user submissions
    async function loadUserSubmissions() {
        try {
            const userId = sessionStorage.getItem('user_id');
            const response = await axios.get(
                `${sessionStorage.getItem('baseURL')}inquiry.php?action=get_user_submissions&user_id=${userId}`
            );

            const tableBody = document.getElementById('inquiriesTableBody');

            if (response.data.status === 'success' && response.data.data.length > 0) {
                tableBody.innerHTML = response.data.data.map(submission => `
                    <tr class="submission-row" data-id="${submission.post_id}" style="cursor: pointer;">
                        <td>#${submission.post_id}</td>
                        <td>${submission.type}</td>
                        <td>${submission.post_title}</td>
                        <td>${submission.post_date}</td>
                        <td><span class="badge ${getStatusBadgeClass(submission.post_status)}">
                            ${getStatusText(submission.post_status)}</span></td>
                    </tr>
                `).join('');

                // Add click handlers to rows
                document.querySelectorAll('.submission-row').forEach(row => {
                    row.addEventListener('click', () => {
                        loadSubmissionDetails(row.dataset.id);
                    });
                });
            } else {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No submissions found.</td></tr>';
            }
        } catch (error) {
            console.error('Error loading submissions:', error);
            toastr.error('Failed to load submissions. Please try again.');
        }
    }

    // Load details for a specific submission
    async function loadSubmissionDetails(submissionId) {
        try {
            const response = await axios.get(
                `${sessionStorage.getItem('baseURL')}inquiry.php?action=get_submission_detail&id=${submissionId}`
            );

            if (response.data.status === 'success') {
                currentSubmissionId = submissionId;
                const submission = response.data.data.submission;
                const replies = response.data.data.replies;

                // Update submission details
                document.getElementById('detailTitle').textContent = submission.post_title;
                document.getElementById('detailContent').textContent = submission.post_message;
                document.getElementById('detailType').textContent = submission.type;
                document.getElementById('detailDate').textContent = `${submission.post_date} ${submission.post_time}`;

                const statusBadge = document.getElementById('detailStatus');
                statusBadge.className = `badge ${getStatusBadgeClass(submission.post_status)}`;
                statusBadge.textContent = getStatusText(submission.post_status);

                // Display replies
                const repliesContainer = document.getElementById('replies');
                repliesContainer.innerHTML = '';

                replies.forEach(reply => {
                    const replyElement = document.createElement('div');
                    replyElement.className = `card mb-2 ${reply.user_type === 'admin' ? 'border-success' : ''}`;
                    replyElement.innerHTML = `
                        <div class="card-header ${reply.user_type === 'admin' ? 'bg-light-success' : ''} d-flex justify-content-between">
                            <span><strong>${reply.display_name}</strong></span>
                            <small>${reply.reply_date} ${reply.reply_time}</small>
                        </div>
                        <div class="card-body">
                            <p class="card-text">${reply.reply_message}</p>
                        </div>
                    `;
                    repliesContainer.appendChild(replyElement);
                });

                // Show/hide reply form based on status
                const replyForm = document.getElementById('replyFormContainer');
                replyForm.style.display = submission.post_status === 'Resolved' ? 'none' : 'block';

                inquiryStatusModal.hide();
                submissionDetailModal.show();
            }
        } catch (error) {
            console.error('Error loading submission details:', error);
            toastr.error('Failed to load submission details. Please try again.');
        }
    }

    // Send reply
    document.getElementById('sendReplyBtn').addEventListener('click', async () => {
        const replyContent = document.getElementById('replyContent').value.trim();
        if (!replyContent) {
            toastr.warning('Please enter a reply message.');
            return;
        }

        try {
            const formData = new FormData();
            formData.append('post_id', currentSubmissionId);
            formData.append('user_id', sessionStorage.getItem('user_id'));
            formData.append('content', replyContent);

            const response = await axios.post(
                `${sessionStorage.getItem('baseURL')}inquiry.php?action=add_reply`,
                formData
            );

            if (response.data.status === 'success') {
                document.getElementById('replyContent').value = '';
                loadSubmissionDetails(currentSubmissionId);
                toastr.success('Reply sent successfully');
            }
        } catch (error) {
            console.error('Error sending reply:', error);
            toastr.error('Failed to send reply. Please try again.');
        }
    });

    // Mark as resolved
    document.getElementById('markResolvedBtn').addEventListener('click', async () => {
        try {
            const response = await axios.post(
                `${sessionStorage.getItem('baseURL')}inquiry.php?action=update_status`,
                {
                    post_id: currentSubmissionId,
                    status: 3 // Use 3 for Resolved
                }
            );

            if (response.data.status === 'success') {
                toastr.success('Marked as resolved successfully');
                loadSubmissionDetails(currentSubmissionId);
                setTimeout(() => {
                    submissionDetailModal.hide();
                    loadUserSubmissions();
                    inquiryStatusModal.show();
                }, 1500);
            }
        } catch (error) {
            console.error('Error updating status:', error);
            toastr.error('Failed to update status. Please try again.');
        }
    });

    // Helper function for status badge classes
    function getStatusBadgeClass(status) {
        if (typeof status === 'number') {
            switch(status) {
                case 0: return 'bg-secondary'; // Unread
                case 1: return 'bg-info'; // Read
                case 2: return 'bg-warning text-dark'; // Pending
                case 3: return 'bg-success'; // Resolved
                default: return 'bg-info';
            }
        }

        // Handle string status
        if (typeof status === 'string') {
            switch(status.toLowerCase()) {
                case 'unread': case '0': return 'bg-secondary';
                case 'read': case '1': return 'bg-info';
                case 'pending': case '2': return 'bg-warning text-dark';
                case 'resolved': case '3': return 'bg-success';
                default: return 'bg-info';
            }
        }

        return 'bg-info'; // Default fallback
    }

    // Helper function to convert status number to text
    function getStatusText(status) {
        if (typeof status === 'number') {
            switch(status) {
                case 0: return 'Unread';
                case 1: return 'Read';
                case 2: return 'Pending';
                case 3: return 'Resolved';
                default: return 'Unknown';
            }
        }
        return status || 'Unknown';
    }

    // Logout handler
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
                sessionStorage.clear();
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        });
    });
});
