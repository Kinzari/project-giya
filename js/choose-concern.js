document.addEventListener('DOMContentLoaded', () => {
    // Get baseURL from sessionStorage
    const baseURL = sessionStorage.getItem("baseURL");
    if (!baseURL) {
        window.location.href = 'index.html';
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
    const submissionDetailModal = new bootstrap.Modal(document.getElementById('submissionDetailModal'));
    const privacyModal = new bootstrap.Modal(document.getElementById('privacyModal'));

    let currentSubmissionId = null;

    // Add click handler for inquiry status button
    const showInquiryStatus = () => {
        // Mark notifications as read
        clearNotification();

        // Reset filter buttons to default state before loading submissions
        document.querySelectorAll('.filter-buttons .btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Set 'active' filter as default
        const activeFilterBtn = document.querySelector('[data-filter="active"]');
        if (activeFilterBtn) {
            activeFilterBtn.classList.add('active');
        }

        // Show the inquiry status modal
        inquiryStatusModal.show();

        // Load user submissions after showing the modal to ensure the table is visible
        loadUserSubmissions();
    };

    // Only use the floating button for opening the inquiry status modal
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

            // Show loading indicator in the table
            document.getElementById('inquiriesTableBody').innerHTML = '<tr><td colspan="5" class="text-center"><div class="spinner-border text-primary" role="status"><span class="visually-hidden">Loading...</span></div></td></tr>';

            // Update the API endpoint to use the correct action and user_id parameter
            const response = await axios.get(
                `${baseURL}posts.php?action=get_user_posts&user_id=${userId}`
            );

            if (response.data && response.data.success) {
                allSubmissions = response.data.data || [];

                if (allSubmissions.length === 0) {
                    document.getElementById('inquiriesTableBody').innerHTML = '<tr><td colspan="5" class="text-center">No submissions found.</td></tr>';
                    return;
                }

                // Initialize filter buttons
                initializeFilterButtons();

                // Apply initial filtering and render
                renderSubmissions(filterSubmissions());
            } else {
                document.getElementById('inquiriesTableBody').innerHTML = '<tr><td colspan="5" class="text-center">Error loading submissions: ' + (response.data.message || 'Unknown error') + '</td></tr>';
                console.error('Error loading submissions:', response.data.message);
            }
        } catch (error) {
            console.error('Error loading submissions:', error);
            document.getElementById('inquiriesTableBody').innerHTML = '<tr><td colspan="5" class="text-center">Failed to load submissions. Please try again.</td></tr>';
            toastr.error('Failed to load submissions. Please try again.');
        }
    }

    // Filter button initialization
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
                (submission.post_title && submission.post_title.toLowerCase().includes(searchFilter)) ||
                (submission.type && submission.type.toLowerCase().includes(searchFilter));

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

    // Update the renderSubmissions function to match the new column order
    function renderSubmissions(submissions) {
        const tableBody = document.getElementById('inquiriesTableBody');

        if (submissions.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No matching submissions found.</td></tr>';
            return;
        }

        tableBody.innerHTML = '';

        submissions.forEach(submission => {
            const row = document.createElement('tr');
            row.className = 'submission-row';
            row.dataset.id = submission.post_id;

            // Format the table row with all required columns
            row.innerHTML = `
                <td>#${submission.post_id}</td>
                <td><span class="badge ${getStatusBadgeClass(submission.post_status)}">
                    ${getStatusText(submission.post_status)}</span></td>
                <td>${submission.type || ''}</td>
                <td>${submission.post_title || ''}</td>
                <td>${formatDate(submission.post_date)}</td>
            `;

            // Add click event listener
            row.addEventListener('click', () => {
                loadSubmissionDetails(submission.post_id);
            });

            tableBody.appendChild(row);
        });
    }

    async function loadSubmissionDetails(submissionId) {
        try {
            // Show loading indicator
            const detailModal = document.getElementById('submissionDetailModal');
            if (detailModal.querySelector('.replies-container')) {
                detailModal.querySelector('.replies-container').innerHTML =
                    '<div class="d-flex justify-content-center p-5"><div class="spinner-border text-primary" role="status"></div></div>';
            }

            // Call the endpoint to get submission details
            const response = await axios.get(
                `${baseURL}posts.php?action=get_submission_detail&id=${submissionId}`
            );

            console.log('Submission detail response:', response.data);

            if (response.data.status === 'success') {
                currentSubmissionId = submissionId;
                const submission = response.data.data.submission;
                const replies = response.data.data.replies;

                // Close inquiry status modal first
                if (bootstrap.Modal.getInstance(document.getElementById('inquiryStatusModal'))) {
                    bootstrap.Modal.getInstance(document.getElementById('inquiryStatusModal')).hide();
                }

                // Show submission detail modal
                submissionDetailModal.show();

                // Update user info and status
                document.getElementById('postUserName').textContent = submission.author_name || '';
                document.getElementById('postUserId').textContent = `ID: ${submission.user_schoolId || ''}`;

                // Store the current status for proper handling
                const currentStatus = submission.post_status;

                const statusBadge = document.getElementById('postStatus');
                statusBadge.className = `badge ${getStatusBadgeClass(currentStatus)}`;
                statusBadge.textContent = getStatusText(currentStatus);

                // Clear replies container
                const repliesContainer = document.querySelector('.replies-container');
                if (repliesContainer) {
                    repliesContainer.innerHTML = '';

                    // Add the main post as the first message in the replies container
                    const originalPostElement = document.createElement('div');
                    originalPostElement.className = 'message-bubble admin-bg';
                    originalPostElement.innerHTML = `
                        <div class="message-content original-post">
                            <div class="mb-2">
                                <span class="badge bg-secondary">${submission.type || ''}</span>
                                ${submission.inquiry_type ? `<span class="badge bg-info ms-1">${submission.inquiry_type}</span>` : ''}
                            </div>
                            <h5>${submission.post_title || ''}</h5>
                            <p>${submission.post_message || ''}</p>
                            <div class="d-flex justify-content-between align-items-center">
                                <small class="text-muted">${formatDateTime(submission.post_date, submission.post_time)}</small>
                                <span class="badge ${getStatusBadgeClass(submission.post_status)}">${getStatusText(submission.post_status)}</span>
                            </div>
                        </div>
                    `;
                    repliesContainer.appendChild(originalPostElement);

                    // Add replies
                    if (replies && replies.length > 0) {
                        replies.forEach(reply => {
                            const replyElement = document.createElement('div');
                            replyElement.className = `message-bubble ${reply.user_type === 'admin' ? 'admin-message' : 'user-message'}`;
                            replyElement.innerHTML = `
                                <div class="message-content">
                                    <strong>${reply.display_name || ''}</strong>
                                    <p>${reply.reply_message || ''}</p>
                                    <small>${new Date(reply.reply_date + " " + reply.reply_time).toLocaleString()}</small>
                                </div>
                            `;
                            repliesContainer.appendChild(replyElement);
                        });
                    }
                }

                // Update reply form container based on status
                updateReplyForm(currentStatus);

                // Scroll to bottom of replies
                scrollToBottom();
            } else {
                toastr.error(response.data.message || 'Failed to load submission details');
            }
        } catch (error) {
            console.error('Error loading submission details:', error);
            toastr.error('Failed to load submission details. Please try again.');
        }
    }

    // New function to render replies
    function renderReplies(replies) {
        const repliesContainer = document.querySelector('.replies-container');

        repliesContainer.innerHTML = replies.length ?
            replies.map(reply => `
                <div class="message-bubble ${reply.user_type === 'admin' ? 'admin-message' : 'user-message'}">
                    <div class="message-content">
                        <strong>${reply.display_name || ''}</strong>
                        <p>${reply.reply_message || ''}</p>
                        <small>${new Date(reply.reply_date + " " + reply.reply_time).toLocaleString()}</small>
                    </div>
                </div>
            `).join('') :
            '<p class="text-muted text-center">No replies yet.</p>';
    }

    // Enhanced updateReplyForm function with better status handling
    function updateReplyForm(status) {
        const replyFormContainer = document.getElementById('replyFormContainer');
        const userType = sessionStorage.getItem('user_typeId');
        const isStudentOrVisitor = userType === '1' || userType === '2';

        // Convert status to string if it's not already
        status = String(status);

        if (status === '2') { // Resolved
            replyFormContainer.innerHTML = `
                <div class="alert alert-success mb-0 text-center">
                    <i class="fas fa-check-circle me-2"></i>
                    This post is resolved and the conversation is closed.
                </div>`;
        } else {
            // Only show "Mark as Resolved" button for students and visitors
            const resolveButton = isStudentOrVisitor ? `
                <div class="d-flex justify-content-end mt-2">
                    <button class="btn btn-success btn-sm" id="resolveButton">
                        <i class="fas fa-check-circle"></i> Mark as Resolved
                    </button>
                </div>` : '';

            replyFormContainer.innerHTML = `
                <form id="replyForm" class="reply-form">
                    <div class="input-group">
                        <input type="text" class="form-control reply-input" placeholder="Write a reply...">
                        <button class="btn btn-primary" type="submit">
                            <i class="bi bi-send-fill"></i>
                        </button>
                    </div>
                </form>
                ${resolveButton}`;

            // Attach reply form listener
            attachReplyFormListener();

            // Add direct click handler for the resolve button
            const resolveBtn = document.getElementById('resolveButton');
            if (resolveBtn) {
                resolveBtn.addEventListener('click', function() {
                    markAsResolved(currentSubmissionId);
                });
            }
        }
    }

    // Function to scroll chat to bottom
    function scrollToBottom() {
        const repliesContainer = document.querySelector('.replies-container');
        if (repliesContainer) {
            setTimeout(() => {
                repliesContainer.scrollTop = repliesContainer.scrollHeight;
            }, 300);
        }
    }

    // Mark as resolved function accessible globally
    async function markAsResolved(submissionId) {
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
                console.log(`Marking submission ${submissionId} as resolved...`);

                // Use the correct endpoint for status update
                const response = await axios.post(
                    `${baseURL}posts.php?action=update_post_status`,
                    {
                        post_id: submissionId,
                        status: '2' // 2 = resolved
                    }
                );

                console.log('API response:', response.data);

                if (response.data.success) {
                    // Update the status badge
                    const statusBadge = document.getElementById('postStatus');
                    statusBadge.className = 'badge bg-success';
                    statusBadge.textContent = 'Resolved';

                    // Update the reply form to show resolved state
                    updateReplyForm('2');

                    // Update the submission in the allSubmissions array
                    const submissionIndex = allSubmissions.findIndex(s => s.post_id == submissionId);
                    if (submissionIndex !== -1) {
                        allSubmissions[submissionIndex].post_status = '2';
                    }

                    // Show success message
                    toastr.success('Concern marked as resolved');

                    // Refresh the submissions list in background
                    loadUserSubmissions();
                } else {
                    console.error('Failed to mark as resolved:', response.data.message);
                    toastr.error(response.data.message || 'Failed to mark as resolved');
                }
            }
        } catch (error) {
            console.error('Error in markAsResolved:', error);
            toastr.error('Failed to update status. Please try again.');
        }
    }

    // Make markAsResolved available globally for compatibility
    window.markAsResolved = markAsResolved;

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

                    // Clear input before sending to make UX feel faster
                    const content = replyInput.value.trim();
                    replyInput.value = '';

                    // Optimistically add reply to the UI
                    const currentUserName = `${sessionStorage.getItem('user_firstname') || ''} ${sessionStorage.getItem('user_lastname') || ''}`;
                    addReplyToUI(content, currentUserName, 'user-message', new Date());

                    // Scroll to bottom after adding the new message
                    scrollToBottom();

                    // Send the reply to backend
                    const response = await axios.post(
                        `${baseURL}posts.php?action=add_reply`,
                        formData
                    );

                    if (response.data.status !== 'success') {
                        toastr.error('Failed to send reply');
                    }
                } catch (error) {
                    console.error('Error sending reply:', error);
                    toastr.error('Failed to send reply');
                }
            });
        }
    }

    // Function to add a reply to the UI
    function addReplyToUI(message, authorName, cssClass, timestamp) {
        const repliesContainer = document.querySelector('.replies-container');

        // Create a new message element
        const newReply = document.createElement('div');
        newReply.className = `message-bubble ${cssClass}`;
        newReply.innerHTML = `
            <div class="message-content">
                <strong>${authorName}</strong>
                <p>${message}</p>
                <small>${timestamp.toLocaleString()}</small>
            </div>
        `;

        // Append it to the container
        repliesContainer.appendChild(newReply);
    }

    // Helper functions
    function formatDate(dateStr) {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString();
    }

    function formatDateTime(date, time) {
        if (!date || !time) return '';
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

    // Update the acceptPrivacyBtn click handler
    document.getElementById('acceptPrivacyBtn').addEventListener('click', async () => {
        try {
            const userId = sessionStorage.getItem('user_id');
            const pendingUrl = sessionStorage.getItem('pendingRedirect');

            if (!userId) {
                toastr.error('User ID not found. Please login again.');
                return;
            }

            const response = await axios.post(
                `${baseURL}inquiry.php?action=update_privacy_policy`,
                {
                    user_id: userId,
                    privacy_policy_check: 1
                }
            );

            if (response.data.success) {
                sessionStorage.setItem('privacyPolicyAccepted', 'true');

                Swal.fire({
                    icon: 'success',
                    title: 'Privacy Policy Accepted',
                    text: 'Redirecting...',
                    timer: 1500,
                    showConfirmButton: false
                });

                if (pendingUrl) {
                    sessionStorage.removeItem('pendingRedirect');
                    setTimeout(() => {
                        window.location.href = pendingUrl;
                    }, 1500);
                } else {
                    setTimeout(() => {
                        bootstrap.Modal.getInstance(document.getElementById('privacyModal')).hide();
                    }, 1500);
                }
            } else {
                toastr.error('Failed to update privacy policy status. Please try again.');
            }
        } catch (error) {
            console.error('Failed to update privacy policy flag:', error);
            toastr.error('An error occurred. Please try again.');
        }
    });

    // Update concern button click handlers
    document.querySelectorAll('.concern-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            sessionStorage.setItem('selectedPostType', type);
            window.location.href = 'form.html';
        });
    });

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

    // Check for unread notifications
    checkForNewReplies();

    // Set interval to check for new notifications every 2 minutes
    setInterval(checkForNewReplies, 120000);

    // Check and update notification badge
    async function checkForNewReplies() {
        const userId = sessionStorage.getItem('user_id');
        if (!userId) return;

        try {
            const response = await axios.get(`${baseURL}posts.php?action=check_new_replies&user_id=${userId}`);

            if (response.data.status === 'success') {
                const newRepliesCount = response.data.unreadCount || 0;
                updateNotificationBadge(newRepliesCount);
            }
        } catch (error) {
            console.error('Error checking for new replies:', error);
        }
    }

    // Update notification badge display
    function updateNotificationBadge(count) {
        const badge = document.getElementById('notificationBadge');

        if (count > 0) {
            badge.textContent = count > 99 ? '99+' : count;
            badge.classList.remove('d-none');
        } else {
            badge.classList.add('d-none');
        }
    }

    // Clear notification when user opens the inquiry status
    async function clearNotification() {
        const userId = sessionStorage.getItem('user_id');
        if (!userId) return;

        try {
            await axios.post(`${baseURL}posts.php?action=mark_replies_read`, { user_id: userId });
            document.getElementById('notificationBadge').classList.add('d-none');
        } catch (error) {
            console.error('Error clearing notifications:', error);
        }
    }

    // Call checkForNewReplies once more to make sure it runs
    setTimeout(checkForNewReplies, 1000);
});
