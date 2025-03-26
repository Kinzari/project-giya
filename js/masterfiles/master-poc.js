let pocTable;
let currentPocData = null;
const baseApiUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

$(document).ready(function() {
    initPocTable();
    setupEventHandlers();
});

function initPocTable() {
    try {
        if ($.fn.DataTable.isDataTable('#pocTable')) {
            $('#pocTable').DataTable().destroy();
        }

        const userType = sessionStorage.getItem('user_typeId');

        pocTable = $('#pocTable').DataTable({
            ajax: {
                url: `${baseApiUrl}masterfile.php?action=poc`,
                dataSrc: function(response) {
                    if (!response || !response.success) {
                        console.error('Error loading POCs:', response?.message || 'Unknown error');
                        return [];
                    }
                    return response.data || [];
                },
                error: function(xhr, error, thrown) {
                    console.error('Error loading POCs:', error, thrown);
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
                        return `${data.user_firstname} ${data.user_lastname}`;
                    }
                },
                { data: 'department_name' },
                { data: 'user_contact' },
                { data: 'phinmaed_email' },
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
                            <button class="btn btn-sm btn-primary view-poc" data-id="${data.user_id}">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary edit-poc" data-id="${data.user_id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-warning reset-poc-pw" data-id="${data.user_id}">
                                <i class="bi bi-key"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-poc" data-id="${data.user_id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>`;
                    }
                }
            ],
            responsive: true,
            language: {
                emptyTable: "No POCs available",
                zeroRecords: "No matching POCs found",
                searchPlaceholder: "Search POCs...",
                search: "",
                lengthMenu: "_MENU_ per page",
                paginate: {
                    previous: "<i class='bi bi-chevron-left'></i>",
                    next: "<i class='bi bi-chevron-right'></i>"
                }
            },
            initComplete: function() {
                $('.dataTables_filter input')
                    .attr('placeholder', 'Search POCs...')
                    .addClass('form-control-search');
            }
        });

        setupActionButtonEvents();
    } catch (error) {
        console.error('Error initializing POC table:', error);
    }
}

function setupActionButtonEvents() {
    $('#pocTable').on('click', '.view-poc', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        showPocDetails(id);
    });

    $('#pocTable').on('click', '.edit-poc', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        editPoc(id);
    });

    $('#pocTable').on('click', '.delete-poc', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        deletePoc(id);
    });

    $('#pocTable').on('click', '.reset-poc-pw', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        $('#resetPasswordPocId').val(id);
        $('#resetPasswordModal').modal('show');
    });

    $('#pocTable').on('click', '.status-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        const isCurrentlyActive = $(this).data('active') == 1;
        const newStatus = isCurrentlyActive ? 0 : 1;
        togglePocStatus(id, newStatus);
    });
}

function setupEventHandlers() {
    $('#addPocBtn').on('click', function() {
        showAddPocForm();
    });

    $('#pocForm').on('submit', function(e) {
        e.preventDefault();
        if (validatePocForm()) {
            savePoc();
        }
    });

    $('#confirmResetPassword').on('click', function() {
        const pocId = $('#resetPasswordPocId').val();
        resetPocPassword(pocId);
    });

    $(document).on('click', '#detailsEdit', function() {
        $('#pocDetailsModal').modal('hide');
        if (currentPocData) {
            editPoc(currentPocData.user_id);
        }
    });

    $(document).on('click', '#detailsDelete', function() {
        $('#pocDetailsModal').modal('hide');
        if (currentPocData) {
            deletePoc(currentPocData.user_id);
        }
    });

    $(document).on('click', '#detailsResetPassword', function() {
        $('#pocDetailsModal').modal('hide');
        if (currentPocData) {
            $('#resetPasswordPocId').val(currentPocData.user_id);
            $('#resetPasswordModal').modal('show');
        }
    });
}

function renderPocForm(data = null) {
    const isEdit = data !== null;

    const html = `
    <div class="row mb-3">
        <div class="col-md-6">
            <label for="employeeId" class="form-label">Employee ID*</label>
            <input type="text" class="form-control" id="employeeId" value="${isEdit ? data.user_schoolId : ''}" required>
        </div>
    </div>
    <div class="row mb-3">
        <div class="col-md-6">
            <label for="firstName" class="form-label">First Name*</label>
            <input type="text" class="form-control" id="firstName" value="${isEdit ? data.user_firstname : ''}" required>
        </div>
        <div class="col-md-6">
            <label for="lastName" class="form-label">Last Name*</label>
            <input type="text" class="form-control" id="lastName" value="${isEdit ? data.user_lastname : ''}" required>
        </div>
    </div>
    <div class="row mb-3">
        <div class="col-md-6">
            <label for="email" class="form-label">PHINMA Email*</label>
            <input type="email" class="form-control" id="email" placeholder="username@phinmaed.com"
                value="${isEdit ? data.phinmaed_email : ''}" required>
            <small class="text-muted">Must be a valid PHINMA email address</small>
        </div>
        <div class="col-md-6">
            <label for="contact" class="form-label">Contact Number</label>
            <input type="tel" class="form-control" id="contact" placeholder="09xxxxxxxxx"
                value="${isEdit ? (data.user_contact || '') : ''}">
        </div>
    </div>
    <div class="row mb-3">
        <div class="col-md-6">
            <label for="department" class="form-label">Department*</label>
            <select class="form-select" id="department" required>
                <option value="">Select Department</option>
            </select>
        </div>
        <div class="col-md-6">
            <label for="password" class="form-label">Password</label>
            <input type="password" class="form-control" id="password">
            <small class="text-muted">Leave blank to keep current password (default: phinma-coc)</small>
        </div>
    </div>
    <div class="row mb-3">
        <div class="col-md-6">
            <div class="form-check mt-2">
                <input class="form-check-input" type="checkbox" id="isActive" ${isEdit && data.user_status == 1 ? 'checked' : ''}>
                <label class="form-check-label" for="isActive">Active account</label>
            </div>
        </div>
    </div>
    <div class="border-top pt-3 text-end">
        <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
        <button type="submit" class="btn btn-primary ms-2">Save POC</button>
    </div>`;

    $('#pocForm').html(html);

    // Load departments dropdown
    loadDepartmentsDropdown('department', isEdit ? data.user_departmentId : null);
}

function showPocDetails(pocId) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseApiUrl}masterfile.php?action=get_poc`,
        type: 'GET',
        data: { id: pocId },
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success && response.data) {
                const poc = response.data;
                currentPocData = poc;

                $('#detailsEmployeeId').text(poc.user_schoolId || 'N/A');
                $('#detailsFullName').text(`${poc.user_firstname} ${poc.user_lastname}`);
                $('#detailsEmail').text(poc.phinmaed_email || 'Not provided');
                $('#detailsContact').text(poc.user_contact || 'Not provided');
                $('#detailsDepartment').text(poc.department_name || 'Not assigned');

                if (poc.user_status == 1) {
                    $('#detailsStatusBadge')
                        .removeClass('bg-danger')
                        .addClass('bg-success')
                        .text('Active');
                } else {
                    $('#detailsStatusBadge')
                        .removeClass('bg-success')
                        .addClass('bg-danger')
                        .text('Inactive');
                }

                $('#pocDetailsModal').modal('show');
            } else {
                Swal.fire('Error', response.message || 'Failed to load POC details', 'error');
            }
        },
        error: handleAjaxError
    });
}

function editPoc(pocId) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseApiUrl}masterfile.php?action=get_poc`,
        type: 'GET',
        data: { id: pocId },
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success && response.data) {
                const poc = response.data;

                // Set form mode and POC ID
                $('#pocForm').data('mode', 'edit');
                $('#pocForm').data('id', poc.user_id);

                // Render form with POC data
                renderPocForm(poc);

                // Update modal title
                $('#pocModalLabel').text('Edit Point of Contact');

                // Show the modal
                $('#pocModal').modal('show');
            } else {
                Swal.fire('Error', response.message || 'Failed to load POC data', 'error');
            }
        },
        error: handleAjaxError
    });
}

function showAddPocForm() {
    // Reset form
    $('#pocForm').removeData('id');
    $('#pocForm').data('mode', 'add');

    // Render empty form
    renderPocForm();

    // Set modal title
    $('#pocModalLabel').text('Add Point of Contact');

    // Show modal
    $('#pocModal').modal('show');
}

function savePoc() {
    const userType = sessionStorage.getItem('user_typeId');
    const formData = {
        mode: $('#pocForm').data('mode') || 'add',
        id: $('#pocForm').data('id'),
        employeeId: $('#employeeId').val(),
        firstName: $('#firstName').val(),
        lastName: $('#lastName').val(),
        email: $('#email').val(),
        contact: $('#contact').val(),
        departmentId: $('#department').val(),
        password: $('#password').val(),
        isActive: $('#isActive').is(':checked') ? 1 : 0
    };

    $.ajax({
        url: `${baseApiUrl}masterfile.php?action=submit_poc`,
        type: 'POST',
        data: formData,
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success) {
                $('#pocModal').modal('hide');

                Swal.fire({
                    title: 'Success',
                    text: formData.mode === 'add' ? 'POC added successfully' : 'POC updated successfully',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });

                pocTable.ajax.reload();
            } else {
                Swal.fire('Error', response.message || 'Failed to save POC', 'error');
            }
        },
        error: handleAjaxError
    });
}

function deletePoc(pocId) {
    Swal.fire({
        title: 'Delete POC',
        text: "Are you sure you want to delete this Point of Contact? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it'
    }).then((result) => {
        if (result.isConfirmed) {
            const userType = sessionStorage.getItem('user_typeId');

            $.ajax({
                url: `${baseApiUrl}masterfile.php?action=poc_delete`,
                type: 'POST',
                data: { id: pocId },
                headers: {
                    'X-User-Type': userType || '6'
                },
                success: function(response) {
                    if (response.success) {
                        Swal.fire({
                            title: 'Success',
                            text: 'POC deleted successfully',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        pocTable.ajax.reload();
                    } else {
                        Swal.fire('Error', response.message || 'Failed to delete POC', 'error');
                    }
                },
                error: handleAjaxError
            });
        }
    });
}

function togglePocStatus(pocId, isActive) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseApiUrl}masterfile.php?action=toggle_poc_status`,
        type: 'POST',
        data: { id: pocId, status: isActive },
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success) {
                Swal.fire({
                    title: 'Success',
                    text: isActive ? 'POC activated successfully' : 'POC deactivated successfully',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                pocTable.ajax.reload();
            } else {
                Swal.fire('Error', response.message || 'Failed to update status', 'error');
            }
        },
        error: handleAjaxError
    });
}

function resetPocPassword(pocId) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseApiUrl}giya.php?action=reset_password`,
        type: 'POST',
        data: { user_id: pocId },
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

function validatePocForm() {
    const employeeId = $('#employeeId').val().trim();
    if (!employeeId) {
        Swal.fire('Error', 'Employee ID is required', 'error');
        return false;
    }

    const firstName = $('#firstName').val().trim();
    const lastName = $('#lastName').val().trim();
    if (!firstName || !lastName) {
        Swal.fire('Error', 'First name and last name are required', 'error');
        return false;
    }

    const email = $('#email').val().trim();
    if (!email) {
        Swal.fire('Error', 'Email is required', 'error');
        return false;
    }

    if (!validatePhinmaEmail(email)) {
        Swal.fire('Error', 'Please enter a valid PHINMA email address (@phinmaed.com)', 'error');
        return false;
    }

    const contact = $('#contact').val().trim();
    if (contact && !validatePhoneNumber(contact)) {
        Swal.fire('Error', 'Please enter a valid Philippine mobile number (e.g., 09xxxxxxxxx)', 'error');
        return false;
    }

    const departmentId = $('#department').val();
    if (!departmentId) {
        Swal.fire('Error', 'Please select a department', 'error');
        return false;
    }

    return true;
}

function loadDepartmentsDropdown(selectId, selectedId = null) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseApiUrl}masterfile.php?action=departments`,
        type: 'GET',
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success && response.data) {
                let options = '<option value="">Select Department</option>';

                response.data.forEach(function(dept) {
                    const isSelected = selectedId && dept.department_id == selectedId ? 'selected' : '';
                    options += `<option value="${dept.department_id}" ${isSelected}>${dept.department_name}</option>`;
                });

                $(`#${selectId}`).html(options);
            }
        },
        error: function() {
            $(`#${selectId}`).html('<option value="">Error loading departments</option>');
        }
    });
}

function validatePhinmaEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@phinmaed\.com$/;
    return re.test(String(email).toLowerCase());
}

function validatePhoneNumber(phone) {
    const re = /^(09|\+639)\d{9}$/;
    return re.test(String(phone));
}

function handleAjaxError(xhr, status, error) {
    console.error('Ajax Error:', status, error);
    Swal.fire({
        title: 'Error',
        text: 'An error occurred while communicating with the server',
        icon: 'error'
    });
}
