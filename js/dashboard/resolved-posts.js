document.addEventListener('DOMContentLoaded', function() {
    const baseURL = sessionStorage.getItem("baseURL");
    if (!baseURL) {
        console.error("baseURL not found in sessionStorage");
        sessionStorage.setItem('baseURL', 'http://localhost/api/');
        toastr.warning('API URL not found. Using default URL. You may need to login again.');
    }

    const path = window.location.pathname.toLowerCase();
    const userInfo = sessionStorage.getItem('user');
    let departmentId = null;
    let userTypeId = null;

    if (userInfo) {
        try {
            const user = JSON.parse(userInfo);
            departmentId = user.user_departmentId;
            userTypeId = user.user_typeId;
        } catch (e) {
            console.error('Error parsing user info:', e);
        }
    }

    // Debug function with enhanced detail
    function debugTableData(action, endpoint) {
        $.ajax({
            url: `${baseURL}posts.php?action=${action}`,
            type: 'GET',
            success: function(response) {
                console.log(`${action} API Response:`, response);
                if (response && response.data && response.data.length > 0) {
                    const firstRecord = response.data[0];
                    console.log('First record:', firstRecord);
                    console.log('All properties:', Object.keys(firstRecord));
                    console.log('Classification data:', {
                        user_typeId: firstRecord.user_typeId,
                        user_type: firstRecord.user_type
                    });
                }
            },
            error: function(xhr, status, error) {
                console.error('API Error:', error);
            }
        });
    }

    // Improved getEndpoint function to better handle specific resolved post types
    function getEndpoint() {
        let apiAction = "";

        // Determine which API endpoint to use based on current page
        if (path.includes("visitors-resolved.html")) {
            apiAction = "get_resolved_visitor_posts";
        } else if (path.includes("students-resolved.html")) {
            apiAction = "get_resolved_student_posts";
        } else if (path.includes("employees-resolved.html")) {
            apiAction = "get_resolved_employee_posts";
        } else {
            // Default - all resolved posts
            apiAction = "get_resolved_posts";
        }

        // For POC users, we might need to filter by department
        // But we still want to see resolved posts, not all posts
        if (userTypeId == 5 && departmentId) {
            // We'll use the same endpoints but filter on the client side
            console.log(`POC user (${userTypeId}) with department ${departmentId} accessing resolved posts`);
        }

        return apiAction;
    }

    // Enhanced helper function to get user type label with better fallback handling
    function getUserTypeLabel(typeId) {
        // Convert to integer if it's a string, handle null/undefined
        if (typeId === null || typeId === undefined) {
            return 'Unknown';
        }

        // Try parsing as integer, default to 0 if parsing fails
        const parsedTypeId = parseInt(typeId, 10) || 0;

        // Match with tblusertype.user_typeId values from your database
        switch(parsedTypeId) {
            case 1: return 'Visitor';
            case 2: return 'Student';
            case 3: return 'Faculty';
            case 4: return 'Employee';
            case 5: return 'POC';
            case 6: return 'Administrator'; // Administrator / SSG
            default: return `Unknown (${typeId})`;
        }
    }

    // Initialize the resolved posts table with appropriate data source
    if (document.getElementById("resolvedPostsTable")) {
        const endpoint = getEndpoint();

        // Debug the API response
        debugTableData(endpoint, endpoint);

        const resolvedTable = $('#resolvedPostsTable').DataTable({
            order: [[6, 'desc'], [7, 'desc']], // Most recent posts first by date and time
            ajax: {
                url: `${baseURL}posts.php?action=${endpoint}`,
                type: 'GET',
                dataSrc: function(json) {
                    if (!json || !json.data) {
                        console.error('Invalid data format returned from server:', json);
                        return [];
                    }

                    console.log(`Received ${json.data.length} resolved posts.`);
                    console.log('Sample data:', json.data[0]);

                    // For POC users, filter by department if needed
                    if (userTypeId == 5 && departmentId) {
                        return json.data.filter(item =>
                            item.post_departmentId == departmentId ||
                            item.department_id == departmentId
                        );
                    }

                    // Add user_typeId inference for records that are missing it
                    json.data.forEach(record => {
                        if (!record.user_typeId && record.user_schoolId) {
                            const schoolId = record.user_schoolId.toLowerCase();
                            if (schoolId.startsWith('02-')) {
                                record.user_typeId = 2; // Student
                            } else if (schoolId.startsWith('01-')) {
                                record.user_typeId = 3; // Faculty/Employee
                            } else if (schoolId.startsWith('vs-')) {
                                record.user_typeId = 1; // Visitor
                            } else if (schoolId.startsWith('25-')) {
                                record.user_typeId = endpoint.includes('employee') ? 4 : 5; // POC/Administrator
                            }
                        }

                        // If endpoint-specific and still no user_typeId, set based on endpoint
                        if (!record.user_typeId) {
                            if (endpoint.includes('visitor')) {
                                record.user_typeId = 1;
                            } else if (endpoint.includes('student')) {
                                record.user_typeId = 2;
                            } else if (endpoint.includes('employee')) {
                                record.user_typeId = 3;
                            }
                        }
                    });

                    return json.data;
                },
                error: function(xhr, error, thrown) {
                    console.error('DataTables Ajax error:', error, thrown);
                    toastr.error('Error loading resolved posts data. Please try refreshing the page.');
                }
            },
            columns: [
                {
                    title: "Status",
                    data: "post_status",
                    render: renderStatusBadge,
                    width: "100px"
                },
                {
                    title: "Classification",
                    data: null,
                    render: function(data, type, row) {
                        // Debug the row data to help identify the issues
                        if (type === 'display' && !row.user_typeId) {
                            console.debug('Row missing user_typeId:', row);
                        }

                        // First priority: look for user_typeId in multiple possible locations
                        let typeId = null;
                        if (row.user_typeId !== undefined && row.user_typeId !== null) {
                            typeId = row.user_typeId;
                        } else if (row.user_type_id !== undefined && row.user_type_id !== null) {
                            typeId = row.user_type_id;
                        } else if (row.user && row.user.user_typeId !== undefined) {
                            typeId = row.user.user_typeId;
                        }

                        // If we found a valid type ID, return its label
                        if (typeId !== null) {
                            return getUserTypeLabel(typeId);
                        }

                        // Second priority: infer from school ID prefix
                        if (row.user_schoolId) {
                            const schoolId = row.user_schoolId.toLowerCase();
                            if (schoolId.startsWith('02-')) {
                                return 'Student';
                            } else if (schoolId.startsWith('01-')) {
                                return 'Faculty/Employee';
                            } else if (schoolId.startsWith('vs-')) {
                                return 'Visitor';
                            } else if (schoolId.startsWith('25-')) {
                                return 'POC/Administrator';
                            }
                        }

                        // Third priority: infer from endpoint name
                        if (endpoint.includes('visitor')) {
                            return 'Visitor';
                        } else if (endpoint.includes('student')) {
                            return 'Student';
                        } else if (endpoint.includes('employee')) {
                            return 'Faculty/Employee';
                        }

                        return 'Unknown';
                    },
                    width: "120px"
                },
                {
                    title: "Full Name",
                    data: "user_fullname",
                    width: "150px"
                },
                {
                    title: "Type",
                    data: "postType_name",
                    width: "120px"
                },
                {
                    title: "Message",
                    data: null,
                    render: function(data, type, row) {
                        // Prefer post_message, but use post_title if message is not available
                        let content = row.post_message || row.post_title || '';

                        if (content && content.length > 20) {
                            return content.substring(0, 20) + ' . . .';
                        }
                        return content;
                    }
                },
                {
                    title: "Department",
                    data: "department_name",
                    render: function(data) {
                        return data || 'Not Assigned';
                    },
                    width: "130px"
                },
                {
                    title: "Campus",
                    data: "campus_name",
                    render: function(data) {
                        return data || 'Carmen';
                    },
                    width: "100px"
                },
                {
                    title: "Date",
                    data: "post_date",
                    width: "100px"
                },
                {
                    title: "Time",
                    data: "post_time",
                    width: "100px",
                    render: function(data, type, row) {
                        if (data && row.post_date) {
                            const dt = new Date(row.post_date + " " + data);
                            const options = { hour: 'numeric', minute: '2-digit', hour12: true };
                            return dt.toLocaleTimeString('en-US', options);
                        }
                        return data || '';
                    }
                }
            ],
            dom: '<"row mb-4"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
                 '<"row"<"col-sm-12"tr>>' +
                 '<"row mt-4"<"col-sm-12 col-md-4"i><"col-sm-12 col-md-8 d-flex justify-content-end"p>>',
            pageLength: 10,
            processing: true,
            language: {
                emptyTable: "No resolved posts available",
                zeroRecords: "No resolved posts found",
                searchPlaceholder: "Search records...",
                search: "",
                lengthMenu: "_MENU_ per page"
            },
            drawCallback: function() {
                $('.dataTables_paginate > .pagination').addClass('pagination-md border-0');
                $('.dataTables_paginate').addClass('mt-3');
                $('.page-item .page-link').css({
                    'border': 'none',
                    'padding': '0.5rem 1rem',
                    'margin': '0 0.2rem'
                });

                applyTableHeaderStyling();
            }
        });

        // Handle row click events
        $('#resolvedPostsTable tbody').on('click', 'tr', function() {
            const data = resolvedTable.row(this).data();
            if (data && data.post_id) {
                showResolvedPostDetails(data.post_id);
            }
        });
    }

    // Define currentPostId in this scope to make it accessible
    let currentPostId = null;

    // Define a function for showing resolved posts details
    window.showResolvedPostDetails = function(postId) {
        try {
            currentPostId = postId;
            const baseURL = sessionStorage.getItem('baseURL');
            if (!baseURL) {
                toastr.error('Base URL not found. Please re-login.');
                return;
            }

            const loadingToast = toastr.info('Loading post details...', '', {timeOut: 0});

            axios.get(`${baseURL}posts.php?action=get_post_details&post_id=${postId}`)
                .then(response => {
                    toastr.clear(loadingToast);

                    if (response.data.success && response.data.post) {
                        const post = response.data.post;
                        const modal = new bootstrap.Modal(document.getElementById('postDetailsModal'));
                        modal.show();

                        // Update modal content with post details
                        setTimeout(updateModalButtons, 300);

                        const userNameElement = document.getElementById('postUserName');
                        if (userNameElement) {
                            userNameElement.textContent = post.user_fullname;
                        }

                        const userIdElement = document.getElementById('postUserId');
                        if (userIdElement) {
                            userIdElement.textContent = post.user_schoolId || '';
                        }

                        const statusBadgeElement = document.getElementById('postStatusBadge');
                        if (statusBadgeElement) {
                            statusBadgeElement.innerHTML = renderStatusBadge(post.post_status);
                        }

                        const repliesContainer = document.querySelector('.replies-container');
                        if (repliesContainer) {
                            repliesContainer.innerHTML = '';

                            // Display original post
                            const originalPostElement = document.createElement('div');
                            originalPostElement.className = 'message-bubble border-start border-4 border-primary bg-light rounded p-3 w-100';
                            originalPostElement.innerHTML = `
                                <div class="message-content">
                                    <div class="mb-2">
                                        <span class="badge bg-secondary">${post.postType_name}</span>
                                        ${post.inquiry_type ? `<span class="badge bg-info ms-1">${post.inquiry_type}</span>` : ''}
                                    </div>
                                    <h5 class="text-primary">${post.post_title || ''}</h5>
                                    <p>${post.post_message || ''}</p>
                                    <div class="d-flex justify-content-between align-items-center">
                                        <small class="text-muted">${new Date(post.post_date + " " + post.post_time).toLocaleString()}</small>
                                        ${renderStatusBadge(post.post_status)}
                                    </div>
                                </div>
                            `;
                            repliesContainer.appendChild(originalPostElement);

                            // Display replies
                            if (post.replies && post.replies.length > 0) {
                                post.replies.forEach(reply => {
                                    const replyElement = document.createElement('div');
                                    replyElement.className = `message-bubble ${reply.user_type === 'admin' ? 'admin-message' : 'user-message'}`;
                                    replyElement.innerHTML = `
                                        <div class="message-content">
                                            <strong>${reply.display_name}</strong>
                                            <p>${reply.reply_message}</p>
                                            <small>${new Date(reply.reply_date + " " + reply.reply_time).toLocaleString()}</small>
                                        </div>
                                    `;
                                    repliesContainer.appendChild(replyElement);
                                });
                            }
                        }

                        // Always show the resolved message for the reply form
                        const formContainer = document.querySelector('.reply-form-container');
                        if (formContainer) {
                            formContainer.innerHTML = `
                                <div class="alert alert-success mb-0 text-center">
                                    <i class="bi bi-check-circle me-2"></i>
                                    This post is resolved and the conversation is closed.
                                </div>`;
                        }

                        // Scroll the replies container to the bottom
                        setTimeout(scrollToBottom, 300);
                    } else {
                        toastr.error(response.data.message || 'Failed to load post details');
                    }
                })
                .catch(error => {
                    console.error('Error loading post details:', error);
                    toastr.error('Failed to load post details');
                    toastr.clear(loadingToast);
                });
        } catch (error) {
            console.error('Error showing post details:', error);
            toastr.error('Failed to load post details');
        }
    };

    function updateModalButtons() {
        $('#postDetailsModal .btn-primary').addClass('btn-solid-primary').removeClass('btn-primary');
        $('#postDetailsModal .btn-warning').addClass('btn-solid-warning').removeClass('btn-warning');
        $('#postDetailsModal .btn-danger').addClass('btn-solid-danger').removeClass('btn-danger');
        $('#postDetailsModal .btn-success').addClass('btn-solid-success').removeClass('btn-success');
    }

    function renderStatusBadge(data) {
        let statusText = "";
        let badgeClass = "";

        switch (Number(data)) {
            case 0:
                statusText = "Pending";
                badgeClass = "btn-solid-danger";
                break;
            case 1:
                statusText = "Ongoing";
                badgeClass = "btn-solid-warning";
                break;
            case 2:
            case 3:
                statusText = "Resolved";
                badgeClass = "btn-solid-primary";
                break;
            default:
                statusText = "Unknown";
                badgeClass = "btn-secondary";
        }

        return `<span class="badge ${badgeClass}">${statusText}</span>`;
    }

    function scrollToBottom() {
        const repliesContainer = document.querySelector('.replies-container');
        if (repliesContainer) {
            repliesContainer.scrollTop = repliesContainer.scrollHeight;
        }
    }

    // Add table header styling function
    function applyTableHeaderStyling() {
        document.querySelectorAll('th').forEach(el => {
            el.style.backgroundColor = '#155f37';
            el.style.color = 'white';
        });
    }

    // Apply styling after table is initialized
    setTimeout(applyTableHeaderStyling, 500);

    // Apply styling again after any table redraw
    $(document).on('draw.dt', function() {
        setTimeout(applyTableHeaderStyling, 100);
    });
});
