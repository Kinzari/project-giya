document.addEventListener('DOMContentLoaded', () => {
    // Get baseURL from sessionStorage
    const baseURL = sessionStorage.getItem("baseURL");
    if (!baseURL) {
        window.location.href = 'login.html';
        return;
    }

    // Auth check
    const auth = AuthHelper.checkAuth();
    if (!auth.isValid) {
        window.location.href = 'index.html';
        return;
    }

    document.getElementById('userFirstName').textContent = auth.firstName;

    // Fix modal initialization
    const inquiryStatusModal = new bootstrap.Modal(document.getElementById('inquiryStatusModal'));
    const submissionDetailModal = new bootstrap.Modal(document.getElementById('submissionDetailModal'), {
        backdrop: true, // This will use Bootstrap's default backdrop opacity
        keyboard: true
    });
    const privacyModal = new bootstrap.Modal(document.getElementById('privacyModal'));

    let currentSubmissionId = null;

    // Remove old inquiry status button listener
    document.getElementById('inquiryStatusBtn').removeEventListener('click', null);

    // Add click handler for both buttons
    const showInquiryStatus = () => {
        // Reset filter buttons to default state before loading submissions
        document.querySelectorAll('.filter-buttons .btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Set 'active' filter as default
        const activeFilterBtn = document.querySelector('[data-filter="active"]');
        if (activeFilterBtn) {
            activeFilterBtn.classList.add('active');
        }

        loadUserSubmissions();
        inquiryStatusModal.show();
    };

    document.getElementById('inquiryStatusBtn').addEventListener('click', showInquiryStatus);
    document.getElementById('inquiryStatusFloatBtn').addEventListener('click', showInquiryStatus);

    // Enhanced filtering functionality
    let allSubmissions = []; // Store all submissions for filtering

    // Load user submissions with enhanced display
    async function loadUserSubmissions() {
        try {
            const userId = sessionStorage.getItem('user_id');
            if (!userId) {
                toastr.error('User ID not found. Please login again.');
                return;
            }

            const response = await axios.get(
                `${baseURL}inquiry.php?action=get_user_submissions&user_id=${userId}`
            );

            if (response.data.status === 'success') {
                allSubmissions = response.data.data || [];

                // Initialize filter buttons once
                initializeFilterButtons();

                // Apply initial filtering
                renderSubmissions(filterSubmissions());
            } else {
                document.getElementById('inquiriesTableBody').innerHTML =
                    '<tr><td colspan="5" class="text-center">No submissions found.</td></tr>';
            }
        } catch (error) {
            console.error('Error loading submissions:', error);
            toastr.error('Failed to load submissions. Please try again.');
        }
    }

    // Remove the duplicate DOMContentLoaded event listener
    // and move filter button initialization here
    function initializeFilterButtons() {
        // Remove any existing event listeners first
        document.querySelectorAll('.filter-buttons .btn').forEach(btn => {
            btn.replaceWith(btn.cloneNode(true));
        });

        // Set initial active filter and add new event listeners
        const defaultFilter = document.querySelector('[data-filter="active"]');
        if (defaultFilter) {
            defaultFilter.classList.add('active');
        }

        // Add click handlers to all filter buttons
        document.querySelectorAll('.filter-buttons .btn').forEach(button => {
            button.addEventListener('click', (e) => {
                // Remove active class from all buttons
                document.querySelectorAll('.filter-buttons .btn').forEach(btn => {
                    btn.classList.remove('active');
                });
                // Add active class only to clicked button
                e.target.classList.add('active');
                // Apply filter
                renderSubmissions(filterSubmissions());
            });
        });
    }

    function filterSubmissions() {
        const activeFilter = document.querySelector('.filter-buttons .btn.active');
        if (!activeFilter) return allSubmissions;

        const filterValue = activeFilter.dataset.filter;
        const searchFilter = document.getElementById('searchFilter').value.toLowerCase();

        return allSubmissions.filter(submission => {
            // Handle search filtering
            const matchesSearch = !searchFilter ||
                submission.post_title.toLowerCase().includes(searchFilter) ||
                submission.type.toLowerCase().includes(searchFilter);

            if (!matchesSearch) return false;

            // Convert status to string for comparison
            const status = String(submission.post_status);

            // Handle status filtering
            if (filterValue === 'active') {
                // Show both pending (0) and ongoing (1) posts
                return status === '0' || status === '1';
            }

            // Match exact status (0=pending, 1=ongoing, 2=resolved)
            return status === filterValue;
        });
    }

    // Update search event listener
    document.getElementById('searchFilter').addEventListener('input', () => {
        renderSubmissions(filterSubmissions());
    });

    function renderSubmissions(submissions) {
        const tableBody = document.getElementById('inquiriesTableBody');

        if (submissions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No matching submissions found.</td></tr>';
            return;
        }

        tableBody.innerHTML = submissions.map(submission => `
            <tr class="submission-row" data-id="${submission.post_id}">
                <td>#${submission.post_id}</td>
                <td>${submission.type}</td>
                <td>${submission.post_title}</td>
                <td>${formatDate(submission.post_date)}</td>
                <td><span class="badge ${getStatusBadgeClass(submission.post_status)}">
                    ${getStatusText(submission.post_status)}</span></td>
            </tr>
        `).join('');

        // Reattach click handlers
        document.querySelectorAll('.submission-row').forEach(row => {
            row.addEventListener('click', () => {
                loadSubmissionDetails(row.dataset.id);
            });
        });
    }

    // Enhanced submission details loading
    async function loadSubmissionDetails(submissionId) {
        try {
            const response = await axios.get(
                `${baseURL}inquiry.php?action=get_submission_detail&id=${submissionId}`
            );

            if (response.data.status === 'success') {
                currentSubmissionId = submissionId;
                const submission = response.data.data.submission;
                const replies = response.data.data.replies;

                // Close inquiry status modal first
                const inquiryModal = bootstrap.Modal.getInstance(document.getElementById('inquiryStatusModal'));
                if (inquiryModal) {
                    inquiryModal.hide();
                }

                // Show submission detail modal
                const detailModal = new bootstrap.Modal(document.getElementById('submissionDetailModal'));
                detailModal.show();

                // Update user info and status
                document.getElementById('postUserName').textContent = submission.author_name;
                document.getElementById('postUserId').textContent = `ID: ${submission.user_schoolId || ''}`;

                const statusBadge = document.getElementById('postStatus');
                statusBadge.className = `badge ${getStatusBadgeClass(submission.post_status)}`;
                statusBadge.textContent = getStatusText(submission.post_status);

                // Update chat content
                document.querySelector('.main-post').innerHTML = `
                    <div class="d-flex flex-column">
                        <h5>${submission.type}</h5>
                        <h6>${submission.post_title}</h6>
                        <div class="inquiry-details mb-3">
                            <strong>Type of Inquiry:</strong> ${submission.inquiry_type || 'N/A'}
                            <p class="text-muted mb-2">${submission.inquiry_description || ''}</p>
                        </div>
                        <p class="mb-3">${submission.post_message}</p>
                        <small class="text-muted text-end">${formatDateTime(submission.post_date, submission.post_time)}</small>
                    </div>
                `;

                // Update replies
                document.querySelector('.replies-container').innerHTML = replies.map(reply => `
                    <div class="message-bubble ${reply.user_type === 'admin' ? 'admin-message' : 'user-message'}">
                        <div class="message-content">
                            <strong>${reply.display_name}</strong>
                            <p>${reply.reply_message}</p>
                            <small>${new Date(reply.reply_date + " " + reply.reply_time).toLocaleString()}</small>
                        </div>
                    </div>
                `).join('');

                // Update reply form container based on status
                const replyFormContainer = document.getElementById('replyFormContainer');

                if (submission.post_status === '2') { // Resolved
                    replyFormContainer.innerHTML = `
                        <div class="alert alert-success mb-0 text-center">
                            <i class="fas fa-check-circle me-2"></i>
                            This post is resolved and the conversation is closed.
                        </div>`;
                } else {
                    replyFormContainer.innerHTML = `
                        <form id="replyForm" class="reply-form">
                            <div class="input-group">
                                <input type="text" class="form-control reply-input" placeholder="Write a reply...">
                                <button class="btn btn-primary" type="submit">
                                    <i class="bi bi-send-fill"></i>
                                </button>
                            </div>
                        </form>
                        <div class="d-flex justify-content-end mt-2">
                            <button class="btn btn-success btn-sm" onclick="markAsResolved(${submissionId})">
                                <i class="fas fa-check-circle"></i> Mark as Resolved
                            </button>
                        </div>`;

                    // Attach reply form listener
                    attachReplyFormListener();
                }

                // Scroll to bottom of replies
                const repliesContainer = document.querySelector('.replies-container');
                if (repliesContainer) {
                    setTimeout(() => {
                        repliesContainer.scrollTop = repliesContainer.scrollHeight;
                    }, 300);
                }
            }
        } catch (error) {
            toastr.error('Failed to load submission details');
        }
    }

    // Add this new function
    window.markAsResolved = async function(submissionId) {
        try {
            const result = await Swal.fire({
                title: 'Mark as Resolved?',
                text: 'This will close the concern and no further replies can be added.',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#28a745',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Yes, mark as resolved'
            });

            if (result.isConfirmed) {
                const response = await axios.post(
                    `${baseURL}inquiry.php?action=update_status`,
                    {
                        post_id: submissionId,
                        status: '2' // 2 = resolved
                    }
                );

                if (response.data.status === 'success') {
                    toastr.success('Concern marked as resolved');
                    await loadSubmissionDetails(submissionId); // Reload the details
                    await loadUserSubmissions(); // Refresh the list
                }
            }
        } catch (error) {
            console.error('Error:', error);
            toastr.error('Failed to update status');
        }
    };

    // Helper function to attach reply form listener
    function attachReplyFormListener() {
        const replyForm = document.getElementById('replyForm');
        if (replyForm) {
            replyForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const replyInput = e.target.querySelector('.reply-input');
                if (!replyInput || !replyInput.value.trim()) return;

                try {
                    const formData = new FormData();
                    formData.append('post_id', currentSubmissionId);
                    formData.append('user_id', sessionStorage.getItem('user_id'));
                    formData.append('content', replyInput.value.trim());

                    replyInput.value = '';

                    const response = await axios.post(
                        `${baseURL}inquiry.php?action=add_reply`,
                        formData
                    );

                    if (response.data.status === 'success') {
                        // Hide current modal instance
                        const currentModal = bootstrap.Modal.getInstance(document.getElementById('submissionDetailModal'));
                        if (currentModal) {
                            currentModal.hide();
                            // Wait for modal to fully hide
                            setTimeout(async () => {
                                // Remove any lingering backdrops
                                document.querySelector('.modal-backdrop')?.remove();
                                document.body.classList.remove('modal-open');
                                // Now load submission details
                                await loadSubmissionDetails(currentSubmissionId);
                            }, 300);
                        }
                    }
                } catch (error) {
                    console.error('Error sending reply:', error);
                    toastr.error('Failed to send reply');
                }
            });
        }
    }

    // Helper functions
    function formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString();
    }

    function formatDateTime(date, time) {
        return new Date(date + ' ' + time).toLocaleString();
    }

    function getStatusBadgeClass(status) {
        const statusMap = {
            '0': 'bg-danger',    // Pending
            '1': 'bg-warning',   // Ongoing
            '2': 'bg-success'    // Resolved
        };
        return statusMap[status] || 'bg-secondary';
    }

    function getStatusText(status) {
        const statusMap = {
            '0': 'Pending',
            '1': 'Ongoing',
            '2': 'Resolved'
        };
        return statusMap[status] || 'Unknown';
    }

    // Check privacy policy status when page loads
    async function checkPrivacyPolicyStatus() {
        try {
            const response = await axios.get(
                `${baseURL}inquiry.php?action=check_privacy_policy&user_id=${sessionStorage.getItem('user_id')}`
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
                await axios.post(
                    `${baseURL}inquiry.php?action=update_privacy_policy`,
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

    // Remove existing reply event listeners to avoid duplicates
    const replyForm = document.getElementById('replyForm');
    if (replyForm) {
        // Single event listener for form submission
        replyForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const replyInput = e.target.querySelector('.reply-input');
            if (!replyInput || !replyInput.value.trim()) return;

            try {
                const formData = new FormData();
                formData.append('post_id', currentSubmissionId);
                formData.append('user_id', sessionStorage.getItem('user_id'));
                formData.append('content', replyInput.value.trim());

                replyInput.value = '';

                const response = await axios.post(
                    `${baseURL}inquiry.php?action=add_reply`,
                    formData
                );

                if (response.data.status === 'success') {
                    await loadSubmissionDetails(currentSubmissionId);
                }
            } catch (error) {
                console.error('Error sending reply:', error);
            }
        });
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
