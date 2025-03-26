let visitorsTable;
let currentVisitorData = null;
const baseVisitorApiUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

$(document).ready(function() {
    initVisitorsTable();
    loadCampusDropdown('campus'); 
    setupEventHandlers();
    checkModals();
});

function initVisitorsTable() {
    try {
        if ($.fn.DataTable.isDataTable('#visitorsTable')) {
            $('#visitorsTable').DataTable().destroy();
        }

        const userType = sessionStorage.getItem('user_typeId');

        visitorsTable = $('#visitorsTable').DataTable({
            ajax: {
                url: `${baseVisitorApiUrl}masterfile.php?action=visitors`,
                dataSrc: function(response) {
                    if (!response || !response.success) {
                        console.error('Error loading visitors:', response?.message || 'Unknown error');
                        return [];
                    }
                    return response.data || [];
                },
                error: function(xhr, error, thrown) {
                    console.error('Error loading visitors:', error, thrown);
                    return [];
                },
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-User-Type', userType || '6');
                }
            },
            columns: [
                { data: 'user_schoolId' },
                {
                    data: null,
                    render: function(data) {
                        let fullName = `${data.user_lastname}, ${data.user_firstname}`;
                        if (data.user_middlename) {
                            fullName += ` ${data.user_middlename.charAt(0)}.`;
                        }
                        if (data.user_suffix) {
                            fullName += ` ${data.user_suffix}`;
                        }
                        return fullName;
                    }
                },
                { data: 'user_email' },
                { data: 'user_contact' },
                { data: 'campus_name' },
                {
                    data: 'user_status',
                    render: function(data, type, row) {
                        const isActive = Number(data) === 1;
                        const badgeClass = isActive ? "bg-success" : "bg-danger";
                        const statusText = isActive ? "Active" : "Inactive";

                        return `
                            <button class="btn btn-sm status-btn ${isActive ? 'btn-success' : 'btn-danger'}"
                                data-id="${row.user_id}"
                                data-active="${data}">
                                ${statusText}
                            </button>`;
                    }
                },
                {
                    data: null,
                    orderable: false,
                    render: function(data) {
                        return `<div class="d-flex gap-1">
                            <button class="btn btn-sm btn-primary view-visitor" data-id="${data.user_id}">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary edit-visitor" data-id="${data.user_id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-warning reset-visitor-pw" data-id="${data.user_id}">
                                <i class="bi bi-key"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-visitor" data-id="${data.user_id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>`;
                    }
                }
            ],
            responsive: true,
            language: {
                emptyTable: "No visitors available",
                zeroRecords: "No matching visitors found",
                searchPlaceholder: "Search visitors...",
                search: "",
                lengthMenu: "_MENU_ per page",
                paginate: {
                    previous: "<i class='bi bi-chevron-left'></i>",
                    next: "<i class='bi bi-chevron-right'></i>"
                }
            },
            initComplete: function() {
                $('.dataTables_filter input')
                    .attr('placeholder', 'Search visitors...')
                    .addClass('form-control-search');
            }
        });

        $('#visitorsTable tbody').on('click', 'tr', function(e) {
            if (!$(e.target).closest('button').length) {
                const data = visitorsTable.row(this).data();
                if (data) {
                    showVisitorDetails(data.user_id);
                }
            }
        });

        setupActionButtonEvents();
    } catch (error) {
        console.error('Error initializing visitors table:', error);
    }
}

function setupActionButtonEvents() {
    $('#visitorsTable').on('click', '.view-visitor', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        showVisitorDetails(id);
    });

    $('#visitorsTable').on('click', '.edit-visitor', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        editVisitor(id);
    });

    $('#visitorsTable').on('click', '.delete-visitor', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        deleteVisitor(id);
    });

    $('#visitorsTable').on('click', '.reset-visitor-pw', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        $('#resetPasswordVisitorId').val(id);
        $('#resetPasswordModal').modal('show');
    });

    $('#visitorsTable').on('click', '.status-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        const isCurrentlyActive = $(this).data('active') == 1;
        const newStatus = isCurrentlyActive ? 0 : 1;
        const statusText = isCurrentlyActive ? 'deactivate' : 'activate';

        Swal.fire({
            title: `${isCurrentlyActive ? 'Deactivate' : 'Activate'} Visitor?`,
            text: `Are you sure you want to ${statusText} this visitor account?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: isCurrentlyActive ? '#dc3545' : '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Yes, ${statusText} it!`
        }).then((result) => {
            if (result.isConfirmed) {
                toggleVisitorStatus(id, newStatus);
            }
        });
    });
}

function setupEventHandlers() {
    $('#visitorForm').on('submit', function(e) {
        e.preventDefault();
        if (validateVisitorForm()) {
            saveVisitor();
        }
    });

    $('#confirmResetPassword').on('click', function() {
        const visitorId = $('#resetPasswordVisitorId').val();
        resetVisitorPassword(visitorId);
    });

    $(document).on('click', '#detailsEdit', function() {
        $('#visitorDetailsModal').modal('hide');
        if (currentVisitorData) {
            editVisitor(currentVisitorData.user_id);
        }
    });

    $(document).on('click', '#detailsDelete', function() {
        $('#visitorDetailsModal').modal('hide');
        if (currentVisitorData) {
            deleteVisitor(currentVisitorData.user_id);
        }
    });

    $(document).on('click', '#detailsResetPassword', function() {
        $('#visitorDetailsModal').modal('hide');
        if (currentVisitorData) {
            $('#resetPasswordVisitorId').val(currentVisitorData.user_id);
            $('#resetPasswordModal').modal('show');
        }
    });
}

function showVisitorDetails(visitorId) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseVisitorApiUrl}masterfile.php?action=get_visitor`,
        type: 'GET',
        data: { id: visitorId },
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success && response.data) {
                const visitor = response.data;
                currentVisitorData = visitor;

                $('#detailsVisitorId').text(visitor.user_schoolId || 'N/A');

                let fullName = `${visitor.user_firstname} `;
                if (visitor.user_middlename) {
                    fullName += `${visitor.user_middlename} `;
                }
                fullName += visitor.user_lastname;
                if (visitor.user_suffix) {
                    fullName += `, ${visitor.user_suffix}`;
                }
                $('#detailsFullName').text(fullName);

                $('#detailsEmail').text(visitor.user_email || 'Not provided');
                $('#detailsContact').text(visitor.user_contact || 'Not provided');
                $('#detailsCampus').text(visitor.campus_name || 'Not assigned');

                if (visitor.user_status == 1) {
                    $('#detailsStatusBadge')
                        .removeClass('bg-danger')
                        .addClass('bg-success')
                        .html(`Active <button class="btn btn-sm btn-outline-light ms-2 toggle-status-btn" data-id="${visitor.user_id}" data-status="0">Deactivate</button>`);
                } else {
                    $('#detailsStatusBadge')
                        .removeClass('bg-success')
                        .addClass('bg-danger')
                        .html(`Inactive <button class="btn btn-sm btn-outline-light ms-2 toggle-status-btn" data-id="${visitor.user_id}" data-status="1">Activate</button>`);
                }

                $('.toggle-status-btn').on('click', function(e) {
                    e.preventDefault();
                    const id = $(this).data('id');
                    const newStatus = $(this).data('status');
                    const action = newStatus == 1 ? 'activate' : 'deactivate';

                    Swal.fire({
                        title: `${newStatus == 1 ? 'Activate' : 'Deactivate'} Visitor?`,
                        text: `Are you sure you want to ${action} this visitor account?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: newStatus == 1 ? '#28a745' : '#dc3545',
                        cancelButtonColor: '#6c757d',
                        confirmButtonText: `Yes, ${action} it!`
                    }).then((result) => {
                        if (result.isConfirmed) {
                            toggleVisitorStatus(id, newStatus);
                            $('#visitorDetailsModal').modal('hide');
                        }
                    });
                });

                $('#visitorDetailsModal').modal('show');
            } else {
                Swal.fire('Error', response.message || 'Failed to load visitor details', 'error');
            }
        },
        error: handleAjaxError
    });
}

function editVisitor(visitorId) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseVisitorApiUrl}masterfile.php?action=get_visitor`,
        type: 'GET',
        data: { id: visitorId },
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success && response.data) {
                const visitor = response.data;

                // Set form mode and visitor ID
                $('#visitorForm').data('mode', 'edit');
                $('#visitorForm').data('id', visitor.user_id);

                // Populate the form
                $('#firstName').val(visitor.user_firstname);
                $('#lastName').val(visitor.user_lastname);
                $('#middleName').val(visitor.user_middlename || '');
                $('#suffix').val(visitor.user_suffix || '');
                $('#email').val(visitor.user_email || '');
                $('#contact').val(visitor.user_contact || '');
                $('#isActive').prop('checked', visitor.user_status == 1);

                // Clear password field - it's optional for editing
                $('#password').val('');

                // Load campus dropdown and select the visitor's campus
                loadCampusDropdown('campus', visitor.user_campusId);

                // Update modal title
                $('#visitorModalLabel').text('Edit Visitor');

                // Show the modal
                $('#visitorModal').modal('show');
            } else {
                Swal.fire('Error', response.message || 'Failed to load visitor data', 'error');
            }
        },
        error: handleAjaxError
    });
}

function saveVisitor() {
    const userType = sessionStorage.getItem('user_typeId');
    const formData = {
        mode: $('#visitorForm').data('mode') || 'add',
        id: $('#visitorForm').data('id'),
        firstName: $('#firstName').val(),
        lastName: $('#lastName').val(),
        middleName: $('#middleName').val(),
        suffix: $('#suffix').val(),
        email: $('#email').val(),
        contact: $('#contact').val(),
        campusId: $('#campus').val(),
        password: $('#password').val(),
        isActive: $('#isActive').is(':checked') ? 1 : 0
    };

    $.ajax({
        url: `${baseVisitorApiUrl}masterfile.php?action=save_visitor`,
        type: 'POST',
        data: formData,
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success) {
                $('#visitorModal').modal('hide');

                Swal.fire({
                    title: 'Success',
                    text: formData.mode === 'add' ? 'Visitor added successfully' : 'Visitor updated successfully',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });

                visitorsTable.ajax.reload();
            } else {
                Swal.fire('Error', response.message || 'Failed to save visitor', 'error');
            }
        },
        error: handleAjaxError
    });
}

function deleteVisitor(visitorId) {
    Swal.fire({
        title: 'Delete Visitor',
        text: "Are you sure you want to delete this visitor? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it'
    }).then((result) => {
        if (result.isConfirmed) {
            const userType = sessionStorage.getItem('user_typeId');

            $.ajax({
                url: `${baseVisitorApiUrl}masterfile.php?action=visitor_delete`,
                type: 'POST',
                data: { id: visitorId },
                headers: {
                    'X-User-Type': userType || '6'
                },
                success: function(response) {
                    console.log("Delete response:", response); // Add debugging

                    if (response.success) {
                        Swal.fire({
                            title: 'Success',
                            text: 'Visitor deleted successfully',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        visitorsTable.ajax.reload();
                    } else {
                        Swal.fire('Error', response.message || 'Failed to delete visitor', 'error');
                    }
                },
                error: function(xhr, status, error) {
                    console.error("Delete error:", xhr.responseText);
                    handleAjaxError(xhr, status, error);
                }
            });
        }
    });
}

function toggleVisitorStatus(visitorId, isActive) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseVisitorApiUrl}masterfile.php?action=toggle_visitor_status`,
        type: 'POST',
        data: { id: visitorId, status: isActive },
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success) {
                Swal.fire({
                    title: 'Success',
                    text: isActive ? 'Visitor activated successfully' : 'Visitor deactivated successfully',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                visitorsTable.ajax.reload();
            } else {
                Swal.fire('Error', response.message || 'Failed to update status', 'error');
            }
        },
        error: handleAjaxError
    });
}

function resetVisitorPassword(visitorId) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseVisitorApiUrl}giya.php?action=reset_password`,
        type: 'POST',
        data: { user_id: visitorId },
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            $('#resetPasswordModal').modal('hide');

            if (response.success) {
                Swal.fire({
                    title: 'Success',
                    text: 'Password has been reset to default (phinma-coc)',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
            } else {
                Swal.fire('Error', response.message || 'Failed to reset password', 'error');
            }
        },
        error: function(xhr, status, error) {
            $('#resetPasswordModal').modal('hide');
            handleAjaxError(xhr, status, error);
        }
    });
}

function validateVisitorForm() {
    const firstName = $('#firstName').val().trim();
    if (!firstName) {
        Swal.fire('Error', 'First Name is required', 'error');
        return false;
    }

    const lastName = $('#lastName').val().trim();
    if (!lastName) {
        Swal.fire('Error', 'Last Name is required', 'error');
        return false;
    }

    const email = $('#email').val().trim();
    if (!email) {
        Swal.fire('Error', 'Email is required', 'error');
        return false;
    }

    if (!validateEmail(email)) {
        Swal.fire('Error', 'Please enter a valid email address', 'error');
        return false;
    }

    const contact = $('#contact').val().trim();
    if (!contact) {
        Swal.fire('Error', 'Contact number is required', 'error');
        return false;
    }

    if (!validatePhoneNumber(contact)) {
        Swal.fire('Error', 'Please enter a valid Philippine mobile number (e.g., 09xxxxxxxxx)', 'error');
        return false;
    }

    const campus = $('#campus').val();
    if (!campus) {
        Swal.fire('Error', 'Please select a campus', 'error');
        return false;
    }

    return true;
}

function loadCampusDropdown(selectId, selectedId = null) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseVisitorApiUrl}masterfile.php?action=campuses`,
        type: 'GET',
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success && response.data) {
                let options = '<option value="">Select Campus</option>';

                response.data.forEach(function(campus) {
                    const isSelected = selectedId && campus.campus_id == selectedId ? 'selected' : '';
                    options += `<option value="${campus.campus_id}" ${isSelected}>${campus.campus_name}</option>`;
                });

                $(`#${selectId}`).html(options);
            }
        },
        error: function() {
            $(`#${selectId}`).html('<option value="">Error loading campuses</option>');
        }
    });
}

function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(String(email).toLowerCase());
}

function validatePhoneNumber(phone) {
    const re = /^(09|\+639)\d{9}$/;
    return re.test(String(phone));
}

function checkModals() {
    // Modals are already defined in the HTML
}

function handleAjaxError(xhr, status, error) {
    console.error('Ajax Error:', status, error);
    Swal.fire({
        title: 'Error',
        text: 'An error occurred while communicating with the server',
        icon: 'error'
    });
}
