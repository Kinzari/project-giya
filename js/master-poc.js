/**
 * Master File - Point of Contact
 * Handles all POC-related operations
 */

// Global variables
let pocTable;
let currentPocData = null;
const basePocApiUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

/**
 * Document ready function
 */
$(document).ready(function() {
    // Initialize the POC table
    initBasicPocTable();

    // Load departments for dropdown
    loadDepartmentsDropdown('department');

    // Set up event handlers
    setupEventHandlers();

    // Check if modals exist
    checkModals();
});

/**
 * Initialize a basic POC DataTable without complex dependencies
 */
function initBasicPocTable() {
    try {
        // Clear any existing DataTable
        if ($.fn.DataTable.isDataTable('#pocTable')) {
            $('#pocTable').DataTable().destroy();
        }

        // Clean up the table DOM to avoid conflicts
        $('#pocTable').empty();
        $('#pocTable').append('<thead><tr>' +
            '<th>Employee ID</th>' +
            '<th>Name</th>' +
            '<th>Department</th>' +
            '<th>Status</th>' +
            '<th>Actions</th>' +
            '</tr></thead><tbody></tbody>');

        // Basic initialization
        pocTable = $('#pocTable').DataTable({
            ajax: {
                url: `${basePocApiUrl}masterfile.php?action=poc`,
                dataSrc: function(response) {
                    console.log('POC data received:', response);
                    if (!response || !response.success) {
                        console.error('API error:', response ? response.message : 'No response');
                        return [];
                    }
                    return response.data || [];
                },
                error: function(xhr, error, thrown) {
                    console.error('AJAX error:', xhr, error, thrown);
                    return [];
                }
            },
            columns: [
                { data: 'user_schoolId' },
                {
                    data: null,
                    render: function(data) {
                        return `${data.user_lastname}, ${data.user_firstname}`;
                    }
                },
                { data: 'department_name' },
                {
                    data: 'user_status',
                    render: function(data, type, row) {
                        const isActive = Number(data) === 1;
                        const badgeClass = isActive ? "bg-success" : "bg-danger";
                        const statusText = isActive ? "Active" : "Inactive";

                        // Status displayed as a button that can be clicked to toggle
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
                emptyTable: "No data available",
                zeroRecords: "No matching records found",
                searchPlaceholder: "Search POCs...",
                search: "", // Remove "Search:" label
                lengthMenu: "_MENU_ per page",
                paginate: {
                    previous: "<i class='bi bi-chevron-left'></i>",
                    next: "<i class='bi bi-chevron-right'></i>"
                }
            },
            // Apply styling to search input after initialization
            initComplete: function() {
                $('.dataTables_filter input')
                    .attr('placeholder', 'Search POCs...')
                    .addClass('form-control-search');

                // Make rows clickable
                $('#pocTable tbody tr').css('cursor', 'pointer');
            }
        });

        // Add row click handler
        $('#pocTable tbody').on('click', 'tr', function(e) {
            if (!$(e.target).closest('button').length) {
                const data = pocTable.row(this).data();
                if (data) {
                    showPocDetails(data.user_id);
                }
            }
        });

        // Set up action button handlers
        setupActionButtonEvents();

        console.log('POC table initialized successfully');
    } catch (error) {
        console.error('Error initializing POC table:', error);
        console.error('Detailed error:', error.message, error.stack);
    }
}

/**
 * Set up event handlers for table action buttons
 */
function setupActionButtonEvents() {
    // View button click
    $('#pocTable').on('click', '.view-poc', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        showPocDetails(id);
    });

    // Edit button click
    $('#pocTable').on('click', '.edit-poc', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        editPoc(id);
    });

    // Delete button click
    $('#pocTable').on('click', '.delete-poc', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        deletePoc(id);
    });

    // Reset password button click
    $('#pocTable').on('click', '.reset-poc-pw', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        $('#resetPasswordPocId').val(id);
        $('#resetPasswordModal').modal('show');
    });

    // Status toggle button click
    $('#pocTable').on('click', '.status-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        const isCurrentlyActive = $(this).data('active') == 1;
        const newStatus = isCurrentlyActive ? 0 : 1;
        const statusText = isCurrentlyActive ? 'deactivate' : 'activate';

        Swal.fire({
            title: `${isCurrentlyActive ? 'Deactivate' : 'Activate'} POC?`,
            text: `Are you sure you want to ${statusText} this Point of Contact account?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: isCurrentlyActive ? '#dc3545' : '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Yes, ${statusText} it!`
        }).then((result) => {
            if (result.isConfirmed) {
                togglePocStatus(id, newStatus);
            }
        });
    });
}

/**
 * Set up all general event handlers for this page
 */
function setupEventHandlers() {
    // Add new POC button
    $('#addPocBtn').on('click', function() {
        showAddPocForm();
    });

    // POC form submission
    $('#pocForm').on('submit', function(e) {
        e.preventDefault();
        if (validatePocForm()) {
            savePoc();
        }
    });

    // Reset password confirm button
    $('#confirmResetPassword').on('click', function() {
        const pocId = $('#resetPasswordPocId').val();
        resetPocPassword(pocId);
    });

    // POC details modal action buttons
    $('#detailsEdit').on('click', function() {
        $('#pocDetailsModal').modal('hide');
        if (currentPocData) {
            editPoc(currentPocData.user_id);
        }
    });

    $('#detailsDelete').on('click', function() {
        $('#pocDetailsModal').modal('hide');
        if (currentPocData) {
            deletePoc(currentPocData.user_id);
        }
    });

    $('#detailsResetPassword').on('click', function() {
        $('#pocDetailsModal').modal('hide');
        if (currentPocData) {
            $('#resetPasswordPocId').val(currentPocData.user_id);
            $('#resetPasswordModal').modal('show');
        }
    });
}

/**
 * Show POC details in modal with improved data display
 */
function showPocDetails(pocId) {
    console.log('Showing details for POC ID:', pocId);

    $.ajax({
        url: `${basePocApiUrl}masterfile.php?action=get_poc`,
        type: 'GET',
        data: { id: pocId },
        success: function(response) {
            if (response.success && response.data) {
                const poc = response.data;
                currentPocData = poc;

                // Fill in POC details
                $('#detailsEmployeeId').text(poc.user_schoolId);

                // Build full name with middle name and suffix if available
                let fullName = `${poc.user_firstname} `;
                if (poc.user_middlename) {
                    fullName += `${poc.user_middlename} `;
                }
                fullName += poc.user_lastname;
                if (poc.user_suffix) {
                    fullName += `, ${poc.user_suffix}`;
                }
                $('#detailsFullName').text(fullName);

                // Display email and contact information
                $('#detailsEmail').text(poc.phinmaed_email || 'Not provided');
                $('#detailsContact').text(poc.user_contact || 'Not provided');
                $('#detailsDepartment').text(poc.department_name || 'Not assigned');

                // Status badge with toggle button
                if (poc.user_status == 1) {
                    $('#detailsStatusBadge')
                        .removeClass('bg-danger')
                        .addClass('bg-success')
                        .html(`Active <button class="btn btn-sm btn-outline-light ms-2 toggle-status-btn" data-id="${poc.user_id}" data-status="0">Deactivate</button>`);
                } else {
                    $('#detailsStatusBadge')
                        .removeClass('bg-success')
                        .addClass('bg-danger')
                        .html(`Inactive <button class="btn btn-sm btn-outline-light ms-2 toggle-status-btn" data-id="${poc.user_id}" data-status="1">Activate</button>`);
                }

                // Add click handler for status toggle button
                $('.toggle-status-btn').on('click', function(e) {
                    e.preventDefault();
                    const id = $(this).data('id');
                    const newStatus = $(this).data('status');
                    const action = newStatus == 1 ? 'activate' : 'deactivate';

                    Swal.fire({
                        title: `${newStatus == 1 ? 'Activate' : 'Deactivate'} POC?`,
                        text: `Are you sure you want to ${action} this Point of Contact account?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: newStatus == 1 ? '#28a745' : '#dc3545',
                        cancelButtonColor: '#6c757d',
                        confirmButtonText: `Yes, ${action} it!`
                    }).then((result) => {
                        if (result.isConfirmed) {
                            togglePocStatus(id, newStatus);
                            $('#pocDetailsModal').modal('hide');
                        }
                    });
                });

                // Show the modal
                $('#pocDetailsModal').modal('show');

            } else {
                Swal.fire('Error', response.message || 'Failed to load POC details', 'error');
            }
        },
        error: handleAjaxError
    });
}

/**
 * Load POC data for editing with enhanced fields
 */
function editPoc(pocId) {
    $.ajax({
        url: `${basePocApiUrl}masterfile.php?action=get_poc`,
        type: 'GET',
        data: { id: pocId },
        success: function(response) {
            if (response.success && response.data) {
                const poc = response.data;

                // Update form data attribute
                $('#pocForm').data('mode', 'edit');
                $('#pocForm').data('id', poc.user_id);

                // Render the enhanced form with POC data
                renderPocForm(poc);

                // Update modal title
                $('#pocModalLabel').text('Edit Point of Contact');

                // Show modal
                $('#pocModal').modal('show');
            } else {
                Swal.fire('Error', response.message || 'Failed to load POC data', 'error');
            }
        },
        error: handleAjaxError
    });
}

/**
 * Show form for adding a new POC with enhanced fields
 */
function showAddPocForm() {
    // Reset form
    $('#pocForm')[0].reset();
    $('#pocForm').removeData('id');
    $('#pocForm').data('mode', 'add');

    // Rebuild the form to include suffix and better field organization
    renderPocForm();

    // Update modal title
    $('#pocModalLabel').text('Add Point of Contact');

    // Load fresh departments
    loadDepartmentsDropdown('department');

    // Show modal
    $('#pocModal').modal('show');
}

/**
 * Render POC form with optional data
 * @param {object} poc - POC data for editing, or undefined for new POC
 */
function renderPocForm(poc = null) {
    const isEdit = poc !== null;

    // Build the form HTML with improved layout and additional fields
    const formHtml = `
        <div class="row mb-3">
            <div class="col-md-12">
                <label for="employeeId" class="form-label">Employee ID*</label>
                <input type="text" class="form-control" id="employeeId" value="${isEdit ? poc.user_schoolId : ''}" required>
            </div>
        </div>
        <div class="row mb-3">
            <div class="col-md-6">
                <label for="firstName" class="form-label">First Name*</label>
                <input type="text" class="form-control" id="firstName" value="${isEdit ? poc.user_firstname : ''}" required>
            </div>
            <div class="col-md-6">
                <label for="lastName" class="form-label">Last Name*</label>
                <input type="text" class="form-control" id="lastName" value="${isEdit ? poc.user_lastname : ''}" required>
            </div>
        </div>
        <div class="row mb-3">
            <div class="col-md-6">
                <label for="middleName" class="form-label">Middle Name</label>
                <input type="text" class="form-control" id="middleName" value="${isEdit ? poc.user_middlename || '' : ''}">
            </div>
            <div class="col-md-6">
                <label for="suffix" class="form-label">Suffix</label>
                <input type="text" class="form-control" id="suffix" value="${isEdit ? poc.user_suffix || '' : ''}" placeholder="Jr, Sr, III, etc">
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
                <label for="contact" class="form-label">Contact Number (Optional)</label>
                <input type="tel" class="form-control" id="contact" value="${isEdit ? poc.user_contact || '' : ''}" placeholder="09xxxxxxxxx">
            </div>
        </div>
        <div class="row mb-3">
            <div class="col-md-12">
                <label for="email" class="form-label">PHINMA Email*</label>
                <input type="email" class="form-control" id="email" value="${isEdit ? poc.phinmaed_email || '' : ''}" placeholder="username@phinmaed.com" required>
                <small class="text-muted">Must be a valid PHINMA email address</small>
            </div>
        </div>
        <div class="row mb-3">
            <div class="col-md-12">
                <div class="form-check">
                    <input class="form-check-input" type="checkbox" id="isActive" ${!isEdit || poc.user_status == 1 ? 'checked' : ''}>
                    <label class="form-check-label" for="isActive">Active account</label>
                </div>
            </div>
        </div>
        <div class="border-top pt-3 text-end">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary ms-2">${isEdit ? 'Update' : 'Add'} POC</button>
        </div>
    `;

    // Replace the form content
    $('#pocForm').html(formHtml);

    // If editing, load the department dropdown with the POC's department selected
    if (isEdit) {
        loadDepartmentsDropdown('department', poc.user_departmentId);
    }
}

/**
 * Save POC data (add or update) including enhanced fields
 */
function savePoc() {
    // Get form data including new fields
    const formData = {
        mode: $('#pocForm').data('mode') || 'add',
        id: $('#pocForm').data('id'),
        employeeId: $('#employeeId').val(),
        firstName: $('#firstName').val(),
        middleName: $('#middleName').val(),
        lastName: $('#lastName').val(),
        suffix: $('#suffix').val(),
        departmentId: $('#department').val(),
        contact: $('#contact').val(),
        email: $('#email').val(),
        isActive: $('#isActive').is(':checked') ? 1 : 0
    };

    // Submit form
    $.ajax({
        url: `${basePocApiUrl}masterfile.php?action=submit_poc`,
        type: 'POST',
        data: formData,
        success: function(response) {
            if (response.success) {
                $('#pocModal').modal('hide');
                showSuccessMessage(formData.mode === 'add' ? 'POC added successfully' : 'POC updated successfully');
                pocTable.ajax.reload();
            } else {
                Swal.fire('Error', response.message || 'Failed to save POC', 'error');
            }
        },
        error: handleAjaxError
    });
}

/**
 * Toggle POC active status
 */
function togglePocStatus(pocId, isActive) {
    $.ajax({
        url: `${basePocApiUrl}masterfile.php?action=toggle_poc_status`,
        type: 'POST',
        data: { id: pocId, status: isActive },
        success: function(response) {
            if (response.success) {
                const statusText = isActive ? 'activated' : 'deactivated';
                showSuccessMessage(`POC account ${statusText} successfully`);
                pocTable.ajax.reload(null, false);
            } else {
                Swal.fire('Error', response.message || 'Failed to update status', 'error');
                pocTable.ajax.reload(null, false);
            }
        },
        error: handleAjaxError
    });
}

/**
 * Reset POC password to default - FIXED
 */
function resetPocPassword(pocId) {
    console.log('Resetting password for POC ID:', pocId);

    // First convert the string to JSON to debug what's being sent
    const requestData = { user_id: pocId };
    console.log('Reset password request data:', JSON.stringify(requestData));

    $.ajax({
        url: `${basePocApiUrl}giya.php?action=reset_password`,
        type: 'POST',
        data: requestData,
        dataType: 'json', // Explicitly set expected response type
        success: function(response) {
            // Close modal
            $('#resetPasswordModal').modal('hide');

            if (response.success) {
                showSuccessMessage('Password has been reset to default (phinma-coc)');
            } else {
                Swal.fire('Error', response.message || 'Failed to reset password', 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('AJAX error resetting password:', xhr, status, error);

            // Try to parse the response to get more details
            try {
                const errorResponse = JSON.parse(xhr.responseText);
                console.log('Error response:', errorResponse);
                Swal.fire('Error', errorResponse.message || 'Failed to reset password', 'error');
            } catch (e) {
                handleAjaxError(xhr, status, error);
            }

            $('#resetPasswordModal').modal('hide');
        }
    });
}

/**
 * Validate POC form data with improved validation
 */
function validatePocForm() {
    const employeeId = $('#employeeId').val();
    if (!employeeId || employeeId.trim() === '') {
        Swal.fire('Error', 'Employee ID is required', 'error');
        return false;
    }

    const firstName = $('#firstName').val();
    const lastName = $('#lastName').val();
    if (!firstName || firstName.trim() === '' || !lastName || lastName.trim() === '') {
        Swal.fire('Error', 'First name and last name are required', 'error');
        return false;
    }

    const department = $('#department').val();
    if (!department) {
        Swal.fire('Error', 'Please select a department', 'error');
        return false;
    }

    const contact = $('#contact').val();
    // Contact is now optional, but validate its format if provided
    if (contact && contact.trim() !== '' && !validatePhoneNumber(contact)) {
        Swal.fire('Error', 'Please enter a valid Philippine mobile number (e.g., 09xxxxxxxxx)', 'error');
        return false;
    }

    const email = $('#email').val();
    if (email && email.trim() !== '' && !validateEmail(email)) {
        Swal.fire('Error', 'Please enter a valid PHINMA email address (@phinmaed.com)', 'error');
        return false;
    }

    return true;
}

/**
 * Validate email format
 */
function validateEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@phinmaed\.com$/;
    return re.test(String(email).toLowerCase());
}

/**
 * Validate Philippine phone number format
 */
function validatePhoneNumber(phone) {
    // Accept 09xxxxxxxxx or +639xxxxxxxxx formats
    const re = /^(09|\+639)\d{9}$/;
    return re.test(String(phone));
}

/**
 * Check if modals exist and create them if they don't
 */
function checkModals() {
    console.log('Checking for POC modals:');
    console.log('POC Form Modal exists:', $('#pocModal').length > 0);
    console.log('POC Details Modal exists:', $('#pocDetailsModal').length > 0);
    console.log('Reset Password Modal exists:', $('#resetPasswordModal').length > 0);

    // Check if we need to create any missing modals
    if ($('#pocDetailsModal').length === 0) {
        createPocDetailsModal();
    }

    if ($('#resetPasswordModal').length === 0) {
        createResetPasswordModal();
    }
}

/**
 * Create POC details modal if it doesn't exist - With enhanced fields
 */
function createPocDetailsModal() {
    const modalHtml = `
    <div class="modal fade" id="pocDetailsModal" tabindex="-1" aria-labelledby="pocDetailsModalTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="pocDetailsModalTitle">POC Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p><strong>Employee ID:</strong> <span id="detailsEmployeeId"></span></p>
                    <p><strong>Full Name:</strong> <span id="detailsFullName"></span></p>
                    <p><strong>Email:</strong> <span id="detailsEmail"></span></p>
                    <p><strong>Contact:</strong> <span id="detailsContact"></span></p>
                    <p><strong>Department:</strong> <span id="detailsDepartment"></span></p>
                    <p><strong>Status:</strong> <span id="detailsStatusBadge" class="badge"></span></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-warning" id="detailsResetPassword">Reset Password</button>
                    <button type="button" class="btn btn-primary" id="detailsEdit">Edit</button>
                    <button type="button" class="btn btn-danger" id="detailsDelete">Delete</button>
                </div>
            </div>
        </div>
    </div>`;

    $('body').append(modalHtml);
    console.log('POC Details modal created dynamically');
}

/**
 * Create reset password modal if it doesn't exist
 */
function createResetPasswordModal() {
    const modalHtml = `
    <div class="modal fade" id="resetPasswordModal" tabindex="-1" aria-labelledby="resetPasswordModalTitle" aria-hidden="true">
        <div class="modal-dialog modal-sm modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="resetPasswordModalTitle">Reset Password</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p>Are you sure you want to reset this account's password to the default (phinma-coc)?</p>
                    <input type="hidden" id="resetPasswordPocId">
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancel</button>
                    <button type="button" class="btn btn-warning" id="confirmResetPassword">Reset Password</button>
                </div>
            </div>
        </div>
    </div>`;

    $('body').append(modalHtml);
    console.log('Reset Password modal created dynamically');
}

/**
 * Function to show success message
 */
function showSuccessMessage(message) {
    Swal.fire({
        title: 'Success',
        text: message,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
    });
}

/**
 * Function to handle AJAX errors
 */
function handleAjaxError(xhr, status, error) {
    console.error(`AJAX Error: ${status}`, xhr, error);
    Swal.fire({
        title: 'Error',
        text: 'An error occurred while communicating with the server',
        icon: 'error'
    });
}
