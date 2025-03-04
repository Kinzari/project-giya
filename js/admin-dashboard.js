let usersData = [];
let filteredData = [];

document.addEventListener('DOMContentLoaded', async () => {
    const baseURL = sessionStorage.getItem("baseURL");
    if (!baseURL) {
        window.location.href = 'index.html';
        return;
    }
    const userString = sessionStorage.getItem('user');
    if (userString) {
        try {
            const user = JSON.parse(userString);
            if (user.user_typeId == 5) {
                const removeMenuSelectively = () => {
                    const masterFilesMenu = document.querySelector('#masterFilesDropdown');
                    if (masterFilesMenu) {
                        masterFilesMenu.remove();


                        const dropdowns = document.querySelectorAll('.dropdown-menu');
                        dropdowns.forEach(menu => {

                            if (menu.previousElementSibling &&
                                menu.previousElementSibling.id === 'masterFilesDropdown') {
                                menu.remove();
                            }
                        });
                    }
                };
                removeMenuSelectively();
                setTimeout(removeMenuSelectively, 500);


                const currentPage = window.location.pathname.split('/').pop();
                if (currentPage && currentPage.includes('master-')) {
                    window.location.replace('admin-dashboard.html');
                }
            }
        } catch (e) {
            console.error('Error checking user type:', e);
        }
    }

    initializeSidebar();
    const logoutBtn = document.getElementById('logout-button');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', handleLogout);
    }
    if (document.getElementById("usersTable")) {
        await fetchUsers();
    }

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));

    const currentPath = window.location.pathname;
    document.querySelectorAll('.offcanvas .nav-link').forEach(link => {
        if (link.getAttribute('href') === currentPath.split('/').pop()) {
            link.classList.add('active');
        }
    });

    const userInfo = sessionStorage.getItem('user');
    if (userInfo) {
        const user = JSON.parse(userInfo);
        const userProfile = document.querySelector('.user-profile .user-name');
        if (userProfile) {
            userProfile.textContent = user.user_firstname;
        }
    }
});

function filterUsersByType() {
    const currentPath = window.location.pathname;
    let filtered = usersData.filter(user => user.user_typeId !== "6");

    if (currentPath.includes("all-visitor")) {
        filtered = filtered.filter(user => user.user_typeId == 1);
    } else if (currentPath.includes("all-student")) {
        filtered = filtered.filter(user => user.user_typeId == 2);
    } else if (currentPath.includes("all-department")) {
        filtered = filtered.filter(user => ["3", "4", "5"].includes(user.user_typeId));
    }
    return filtered;
}

function initializeDataTable(data) {
    const columns = [
        { title: "School ID", data: "user_schoolId", defaultContent: "-" },
        { title: "Full Name", data: "full_name", defaultContent: "-" },
        {
            title: "Email",
            data: null,
            render: function(_, type, row) {
                if (type === 'display') {
                    return (row.user_typeId == 1 || row.user_typeId == 2) ?
                        row.user_email || "-" :
                        row.phinmaed_email || "-";
                }
                return row.user_email || row.phinmaed_email || "-";
            }
        }

    ];

    if ($.fn.DataTable.isDataTable("#usersTable")) {
        $("#usersTable").DataTable().destroy();
    }

    const table = $("#usersTable").DataTable({
        data: data,
        columns: columns,
        dom: '<"row mb-4"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
             '<"row"<"col-sm-12"tr>>' +
             '<"row mt-4"<"col-sm-12 col-md-4"i><"col-sm-12 col-md-8 d-flex justify-content-end"p>>',
        buttons: ['excel', 'pdf', 'print'],
        responsive: true,
        ordering: true,
        searching: true,
        lengthMenu: [10, 15, 20],
        pageLength: 10,
        language: {
            emptyTable: "No data available",
            paginate: {
                previous: "<i class='bi bi-chevron-left'></i>",
                next: "<i class='bi bi-chevron-right'></i>"
            }
        },
        drawCallback: function() {
            $('.dataTables_paginate > .pagination').addClass('pagination-md border-0');
            $('.dataTables_paginate').addClass('mt-3');
            $('.page-item .page-link').css({
                'border': 'none',
                'padding': '0.5rem 1rem',
                'margin': '0 0.2rem'
            });
        }
    });

    $('#usersTable').on('click', '.view-btn', function(e) {
        e.preventDefault();
        const data = table.row($(this).closest('tr')).data();

        if(data) {
            $('#detail-schoolId').text(data.user_schoolId || '-');
            $('#detail-firstName').text(data.user_firstname || '-');
            $('#detail-middleName').text(data.user_middlename || '-');
            $('#detail-lastName').text(data.user_lastname || '-');
            $('#detail-suffix').text(data.user_suffix || '-');
            $('#detail-contact').text(data.user_contact || '-');
            $('#detail-department').text(data.department_name || '-');
            $('#detail-course').text(data.course_name || '-');
            $('#detail-userType').text(data.user_type || '-');
            $('#detail-status').text(data.user_status === 1 ? 'Active' : 'Inactive');

            if(String(data.user_typeId) === "1") {
                $('#detail-email').text(data.user_email || '-');
            } else {
                $('#detail-email').text(data.phinmaed_email || '-');
            }
            $('#userModal').modal('show');
        }
    });

    $('#userModal').on('hidden.bs.modal', function () {
        $('body').removeClass('modal-open');
        $('.modal-backdrop').remove();
    });
}

async function updateUserStatus(userId, newStatus) {
    try {
        const result = await Swal.fire({
            title: "Are you sure?",
            text: `Do you want to ${newStatus === 1 ? "activate" : "deactivate"} this user?`,
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#3085d6",
            cancelButtonColor: "#d33",
            confirmButtonText: "Yes, proceed!"
        });

        if (!result.isConfirmed) return;

        const baseURL = sessionStorage.getItem("baseURL");
        const response = await axios.post(`${baseURL}giya.php?action=update_user_status`, {
            user_id: userId,
            user_status: newStatus
        });

        if (response.data.success) {
            await Swal.fire("Success!", "User status updated successfully", "success");

            if ($.fn.DataTable.isDataTable("#usersTable")) {
                await $("#usersTable").DataTable().ajax.reload(null, false);
            }
            if ($.fn.DataTable.isDataTable("#postsTable")) {
                await $("#postsTable").DataTable().ajax.reload(null, false);
            }
            if ($.fn.DataTable.isDataTable("#latestPostsTable")) {
                await $("#latestPostsTable").DataTable().ajax.reload(null, false);
            }

            if ($('#userModal').is(':visible')) {
                const modalUserId = $('#userModal').data('userId');
                if (modalUserId === userId) {
                    document.getElementById('detail-status').textContent = newStatus === 1 ? 'Active' : 'Inactive';
                }
            }
        } else {
            Swal.fire("Error!", response.data.message || "Failed to update user status", "error");
        }
    } catch (error) {
        console.error("Error updating user status:", error);
        Swal.fire("Error!", "An error occurred while updating user status", "error");
    }
}

async function resetUserPassword(userId) {
    try {
        const result = await Swal.fire({
            title: 'Reset Password?',
            text: "Password will be reset to 'phinma-coc'",
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, reset it!'
        });

        if (result.isConfirmed) {
            const baseURL = sessionStorage.getItem("baseURL");
            const response = await axios.post(`${baseURL}giya.php?action=reset_password`, {
                user_id: userId,
            });

            if (response.data.success) {
                Swal.fire('Success!', "Password has been reset to 'phinma-coc'", 'success');
            } else {
                Swal.fire('Error!', 'Failed to reset password', 'error');
            }
        }
    } catch (error) {
        console.error("Error resetting password:", error);
        Swal.fire('Error!', 'An error occurred while resetting the password', 'error');
    }
}

async function fetchUsers() {
    try {
        const baseURL = sessionStorage.getItem("baseURL");
        const response = await axios.get(`${baseURL}giya.php?action=users`);

        if (response.data.success && Array.isArray(response.data.users)) {
            usersData = response.data.users;
            filteredData = filterUsersByType();
            initializeDataTable(filteredData);
        } else {
            toastr.error("Failed to load user data");
            initializeDataTable([]);
        }
    } catch (error) {
        toastr.error("Error loading user data");
        initializeDataTable([]);
    }
}

function initializeSidebar() {
    const toggleBtn = document.getElementById('sidebar-toggle');
    const sidebar = document.querySelector('.sidebar-nav');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            sessionStorage.setItem('sidebarCollapsed', sidebar.classList.contains('collapsed'));
        });
    }

    const isCollapsed = sessionStorage.getItem('sidebarCollapsed') === 'true';
    if (isCollapsed) {
        sidebar.classList.add('collapsed');
    }
}

function handleLogout() {
    Swal.fire({
        title: 'Are you sure?',
        text: 'You will be logged out of the system',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#155f37',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, log out!'
    }).then((result) => {
        if (result.isConfirmed) {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    });
}

async function viewUserDetails(userId, fullName, schoolId, userStatus) {
    try {
        const baseURL = sessionStorage.getItem("baseURL");
        const response = await axios.get(`${baseURL}giya.php?action=get_user_details&user_id=${userId}`);

        if (response.data.success) {
            const user = response.data.user;
            document.getElementById('detail-schoolId').textContent = user.user_schoolId || '-';
            document.getElementById('detail-firstName').textContent = user.user_firstname || '-';
            document.getElementById('detail-middleName').textContent = user.user_middlename || '-';
            document.getElementById('detail-lastName').textContent = user.user_lastname || '-';
            document.getElementById('detail-suffix').textContent = user.user_suffix || '-';
            document.getElementById('detail-email').textContent = user.phinmaed_email || user.user_email || '-';
            document.getElementById('detail-contact').textContent = user.user_contact || '-';
            document.getElementById('detail-department').textContent = user.department_name || '-';
            document.getElementById('detail-course').textContent = user.course_name || '-';
            document.getElementById('detail-userType').textContent = user.user_type || '-';
            document.getElementById('detail-status').textContent = user.user_status == 1 ? 'Active' : 'Inactive';
            const modal = new bootstrap.Modal(document.getElementById('userModal'));
            modal.show();
        } else {
            toastr.error('Failed to load user details');
        }
    } catch (error) {
        console.error('Error fetching user details:', error);
        toastr.error('Error loading user details');
    }
}
