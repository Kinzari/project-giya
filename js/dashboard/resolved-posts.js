document.addEventListener('DOMContentLoaded', function() {
    const baseURL = sessionStorage.getItem("baseURL");
    if (!baseURL) {
        console.error("baseURL not found in sessionStorage");
        sessionStorage.setItem('baseURL', 'http://localhost/giya-api/');
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

    // Initialize the resolved posts table with appropriate data source
    if (document.getElementById("resolvedPostsTable")) {
        $('.student-table-container').addClass('discord-pagination');

        // Initialize the resolved posts table - Use a different approach to avoid conflicts
        if ($.fn.DataTable.isDataTable('#resolvedPostsTable')) {
            $('#resolvedPostsTable').DataTable().destroy();
        }

        // Get the correct API endpoint based on the current page
        const endpoint = getEndpoint();
        console.log(`Using API endpoint: ${endpoint} for resolved posts`);

        // Use the getEndpoint function to get the appropriate API endpoint
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

                    console.log(`Received ${json.data.length} posts, filtering for resolved only`);

                    // Filter to only show resolved posts (status 2 or 3)
                    const resolvedPosts = json.data.filter(item =>
                        Number(item.post_status) === 2 || Number(item.post_status) === 3
                    );

                    // For POC users, additionally filter by department if needed
                    if (userTypeId == 5 && departmentId) {
                        return resolvedPosts.filter(item =>
                            item.post_departmentId == departmentId ||
                            item.department_id == departmentId
                        );
                    }

                    return resolvedPosts;
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
                    title: "Full Name",
                    data: "user_fullname"
                },
                {
                    title: "Type",
                    data: "postType_name",
                    width: "120px"
                },
                {
                    title: "Title",
                    data: "post_title"
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
                    width: "100px",
                    className: "campus-column"
                },
                {
                    title: "Date",
                    data: "post_date",
                    width: "150px"
                },
                {
                    title: "Time",
                    data: "post_time",
                    width: "150px",
                    render: function(data, type, row) {
                        const dt = new Date(row.post_date + " " + data);
                        const options = { hour: 'numeric', minute: '2-digit', hour12: true };
                        return dt.toLocaleTimeString('en-US', options);
                    }
                }
            ],
            dom: '<"row mb-4"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
                 '<"row"<"col-sm-12"tr>>' +
                 '<"row mt-4"<"col-sm-12 col-md-4"i><"col-sm-12 col-md-8 d-flex justify-content-end"p>>',
            pageLength: 10,
            processing: true,
            serverSide: false,
            responsive: true,
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

                $('table.dataTable tbody tr').css('cursor', 'pointer');

                // Apply styling to table headers
                applyTableHeaderStyling();
            },
            initComplete: function() {
                // Log that table initialization is complete
                console.log(`Resolved posts table for ${path} initialized successfully`);
            }
        }).on('xhr.dt', function(e, settings, json) {
            // Log any XHR information that could help debug issues
            if (!json || !json.data) {
                console.warn('Invalid data format in XHR response:', json);
            } else {
                console.log(`XHR complete: received ${json.data.length} records`);
            }
        }).on('click', 'tbody tr', function() {
            const data = $('#resolvedPostsTable').DataTable().row(this).data();
            if (data) {
                showResolvedPostDetails(data.post_id);
            }
        });
    }

    // Define currentPostId in this scope to make it accessible
    let currentPostId = null;

    // Define a separate function for showing resolved posts details
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
                                    <h5 class="text-primary">${post.post_title}</h5>
                                    <p>${post.post_message}</p>
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
