let studentsTable;
let currentStudentData = null;
const baseStudentApiUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

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
 * Function to load departments dropdown
 */
function loadDepartmentsDropdown(selectId, selectedId = null) {
    const baseApiUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    $.ajax({
        url: `${baseApiUrl}masterfile.php?action=departments`,
        type: 'GET',
        success: function(response) {
            if (response.success && response.data) {
                let options = '<option value="">Select Department</option>';
                response.data.forEach(dept => {
                    const isSelected = selectedId && dept.department_id == selectedId ? 'selected' : '';
                    options += `<option value="${dept.department_id}" ${isSelected}>${dept.department_name}</option>`;
                });
                $(`#${selectId}`).html(options);
            }
        },
        error: handleAjaxError
    });
}

/**
 * Function to load courses for a department
 */
function loadCoursesForDepartment(departmentId, selectId, selectedId = null) {
    const baseApiUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    $.ajax({
        url: `${baseApiUrl}masterfile.php?action=courses_by_department&department_id=${departmentId}`,
        type: 'GET',
        success: function(response) {
            if (response.success && response.data) {
                let options = '<option value="">Select Course</option>';
                response.data.forEach(course => {
                    const isSelected = selectedId && course.course_id == selectedId ? 'selected' : '';
                    options += `<option value="${course.course_id}" ${isSelected}>${course.course_name}</option>`;
                });
                $(`#${selectId}`).html(options);
            }
        },
        error: handleAjaxError
    });
}

$(document).ready(function() {
    // Initialize with a basic method first
    initBasicStudentsTable();

    // Set up event handlers
    setupEventHandlers();

    // Add modal existence check
    checkModals();

    // Ensure Bootstrap is properly loaded
    if (typeof bootstrap === 'undefined') {
        console.error('Bootstrap is not loaded! Modals won\'t work properly.');
    } else {
        console.log('Bootstrap is loaded properly, version:', bootstrap.Tooltip.VERSION);
    }
});

/**
 * Initialize a basic table without complex options to avoid DataTables issues
 */
function initBasicStudentsTable() {
    try {
        // Clear any existing DataTable
        if ($.fn.DataTable.isDataTable('#studentsTable')) {
            $('#studentsTable').DataTable().destroy();
        }

        // Clean up the table DOM to avoid conflicts
        $('#studentsTable').empty();
        $('#studentsTable').append('<thead><tr>' +
            '<th>School ID</th>' +
            '<th>Name</th>' +
            '<th>Status</th>' +
            '<th>Actions</th>' +
            '</tr></thead><tbody></tbody>');

        // Basic initialization
        studentsTable = $('#studentsTable').DataTable({
            ajax: {
                url: `${baseStudentApiUrl}masterfile.php?action=students`,
                dataSrc: function(response) {
                    console.log('Received data:', response);
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
                        let middleInitial = '';
                        if (data.user_middlename) {
                            middleInitial = data.user_middlename.charAt(0) + '. ';
                        }
                        return `${data.user_lastname}, ${data.user_firstname} ${middleInitial}`;
                    }
                },
                {
                    data: 'user_status',
                    render: function(data, type, row) {
                        const isActive = Number(data) === 1;
                        const badgeClass = isActive ? "bg-success" : "bg-danger";
                        const statusText = isActive ? "Active" : "Inactive";

                        // Added display of status as a button that can be clicked to toggle
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
                            <button class="btn btn-sm btn-primary view-btn" data-id="${data.user_id}">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary edit-btn" data-id="${data.user_id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-warning reset-btn" data-id="${data.user_id}">
                                <i class="bi bi-key"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-btn" data-id="${data.user_id}">
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
                searchPlaceholder: "Search records...",
                search: "",
                lengthMenu: "_MENU_ per page",
                paginate: {
                    previous: "<i class='bi bi-chevron-left'></i>",
                    next: "<i class='bi bi-chevron-right'></i>"
                }
            },
            // Apply some additional styling to the search input after init
            initComplete: function() {
                // Add styling and proper placeholder to search input
                $('.dataTables_filter input')
                    .attr('placeholder', 'Search students...')
                    .addClass('form-control-search');
            }
        });

        // Add row click handler
        $('#studentsTable tbody').on('click', 'tr', function(e) {
            if (!$(e.target).closest('button').length) {
                const data = studentsTable.row(this).data();
                if (data) {
                    showStudentDetails(data.user_id);
                }
            }
        });

        // Make table rows appear clickable
        $('#studentsTable tbody').css('cursor', 'pointer');

        // Set up action button handlers
        setupActionButtonEvents();

        console.log('Students table initialized successfully');

    } catch (error) {
        console.error('Error initializing students table:', error);
    }
}

/**
 * Set up event handlers for table action buttons
 */
function setupActionButtonEvents() {
    // View button
    $('#studentsTable').on('click', '.view-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        showStudentDetails(id);
    });

    // Edit button
    $('#studentsTable').on('click', '.edit-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        showStudentForm(id);
    });

    // Delete button
    $('#studentsTable').on('click', '.delete-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        deleteStudent(id);
    });

    // Reset password button
    $('#studentsTable').on('click', '.reset-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        $('#resetPasswordStudentId').val(id);
        $('#resetPasswordModal').modal('show');
    });

    // Status toggle button - NEW
    $('#studentsTable').on('click', '.status-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        const isCurrentlyActive = $(this).data('active') === 1;
        const newStatus = isCurrentlyActive ? 0 : 1;
        const statusText = isCurrentlyActive ? 'deactivate' : 'activate';

        Swal.fire({
            title: `${isCurrentlyActive ? 'Deactivate' : 'Activate'} Student?`,
            text: `Are you sure you want to ${statusText} this student account?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: isCurrentlyActive ? '#dc3545' : '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Yes, ${statusText} it!`
        }).then((result) => {
            if (result.isConfirmed) {
                toggleStudentStatus(id, newStatus);
            }
        });
    });
}

/**
 * Set up all event handlers for this page
 */
function setupEventHandlers() {
    // Add new student
    $('#addStudentBtn').on('click', function() {
        showStudentForm();
    });

    // Confirm reset password button
    $('#confirmResetPassword').on('click', function() {
        const studentId = $('#resetPasswordStudentId').val();
        resetStudentPassword(studentId);
    });

    // Student form submission
    $(document).on('submit', '#studentForm', function(e) {
        e.preventDefault();
        saveStudent();
    });

    // Student details modal action buttons
    $('#detailsEdit').on('click', function() {
        $('#studentDetailsModal').modal('hide');
        if (currentStudentData) {
            showStudentForm(currentStudentData.user_id);
        }
    });

    $('#detailsDelete').on('click', function() {
        $('#studentDetailsModal').modal('hide');
        if (currentStudentData) {
            deleteStudent(currentStudentData.user_id);
        }
    });

    $('#detailsResetPassword').on('click', function() {
        $('#studentDetailsModal').modal('hide');
        if (currentStudentData) {
            $('#resetPasswordStudentId').val(currentStudentData.user_id);
            $('#resetPasswordModal').modal('show');
        }
    });
}

/**
 * Show student details in a modal - Add contact and suffix information
 */
function showStudentDetails(studentId) {
    console.log('Showing details for student ID:', studentId);

    $.ajax({
        url: `${baseStudentApiUrl}masterfile.php?action=get_student`,
        type: 'GET',
        data: { id: studentId },
        success: function(response) {
            if (response.success && response.data) {
                const student = response.data;
                currentStudentData = student;

                // Fill in student details
                $('#detailsSchoolId').text(student.user_schoolId);

                // Build full name with middle name and suffix if available
                let fullName = `${student.user_firstname} `;
                if (student.user_middlename) {
                    fullName += `${student.user_middlename} `;
                }
                fullName += student.user_lastname;
                if (student.user_suffix) {
                    fullName += `, ${student.user_suffix}`;
                }
                $('#detailsFullName').text(fullName);

                // Display email if available
                $('#detailsEmail').text(student.phinmaed_email || 'Not provided');

                // Display contact number if available
                $('#detailsContact').text(student.user_contact || 'Not provided');

                // Academic information
                $('#detailsDepartment').text(student.department_name || 'Not assigned');
                $('#detailsCourse').text(student.course_name || 'Not assigned');
                $('#detailsYearLevel').text(student.schoolyear || 'Not assigned');

                // Status badge with toggle button added
                if (student.user_status == 1) {
                    $('#detailsStatusBadge')
                        .removeClass('bg-danger')
                        .addClass('bg-success')
                        .html(`Active <button class="btn btn-sm btn-outline-light ms-2 toggle-status-btn" data-id="${student.user_id}" data-status="0">Deactivate</button>`);
                } else {
                    $('#detailsStatusBadge')
                        .removeClass('bg-success')
                        .addClass('bg-danger')
                        .html(`Inactive <button class="btn btn-sm btn-outline-light ms-2 toggle-status-btn" data-id="${student.user_id}" data-status="1">Activate</button>`);
                }

                // Add click handler for status toggle button in details modal
                $('.toggle-status-btn').on('click', function(e) {
                    e.preventDefault();
                    const id = $(this).data('id');
                    const newStatus = $(this).data('status');
                    const action = newStatus === 1 ? 'activate' : 'deactivate';

                    Swal.fire({
                        title: `${newStatus === 1 ? 'Activate' : 'Deactivate'} Student?`,
                        text: `Are you sure you want to ${action} this student account?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: newStatus === 1 ? '#28a745' : '#dc3545',
                        cancelButtonColor: '#6c757d',
                        confirmButtonText: `Yes, ${action} it!`
                    }).then((result) => {
                        if (result.isConfirmed) {
                            toggleStudentStatus(id, newStatus);
                            $('#studentDetailsModal').modal('hide');
                        }
                    });
                });

                // Show the modal using jQuery to avoid Bootstrap version issues
                $('#studentDetailsModal').modal('show');

                // Log to verify modal is triggered
                console.log('Student details modal should be visible now');
            } else {
                Swal.fire('Error', response.message || 'Failed to load student details', 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error('AJAX error loading student details:', xhr, status, error);
            handleAjaxError(xhr, status, error);
        }
    });
}

/**
 * Show student form for adding or editing
 * @param {number} studentId - Student ID for editing, or undefined for adding
 */
function showStudentForm(studentId = null) {
    const isEdit = studentId !== null;
    console.log(isEdit ? 'Edit student ID:' + studentId : 'Add new student');

    // Update modal title
    $('#studentModalTitle').text(isEdit ? 'Edit Student' : 'Add New Student');

    // Clear the form
    $('#studentForm').empty();

    if (isEdit) {
        // Load student data for editing
        $.ajax({
            url: `${baseStudentApiUrl}masterfile.php?action=get_student`,
            type: 'GET',
            data: { id: studentId },
            success: function(response) {
                if (response.success && response.data) {
                    const student = response.data;
                    renderStudentForm(student);

                    // Show the modal using Bootstrap JS API
                    const studentModal = new bootstrap.Modal(document.getElementById('studentModal'));
                    studentModal.show();
                } else {
                    Swal.fire('Error', response.message || 'Failed to load student data', 'error');
                }
            },
            error: handleAjaxError
        });
    } else {
        // Render empty form for new student
        renderStudentForm();

        // Show the modal using Bootstrap JS API
        const studentModal = new bootstrap.Modal(document.getElementById('studentModal'));
        studentModal.show();
    }
}

// Original functions from master-students.js
function initStudentsTableStandard() {
    if ($.fn.DataTable.isDataTable('#studentsTable')) {
        $('#studentsTable').DataTable().destroy();
    }

    studentsTable = $('#studentsTable').DataTable({
        ajax: {
            url: `${baseStudentApiUrl}masterfile.php?action=students`,
            dataSrc: function(response) {
                if (!response || !response.success) {
                    console.error('API error:', response ? response.message : 'No response');
                    return [];
                }
                return response.data || [];
            },
            error: function(xhr, status, error) {
                handleAjaxError(xhr, status, error);
                return [];
            }
        },
        columns: columns,
        processing: true,
        serverSide: false,
        responsive: true,
        dom: '<"row mb-4"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>' +
             '<"row"<"col-sm-12"tr>>' +
             '<"row mt-4"<"col-sm-12 col-md-4"i><"col-sm-12 col-md-8 d-flex justify-content-end"p>>',
        language: {
            emptyTable: "No data available",
            zeroRecords: "No matching records found",
            searchPlaceholder: "Search records...",
            lengthMenu: "_MENU_ per page",
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
        },
        initComplete: function() {
            $('#studentsTable tbody').on('click', 'tr', function() {
                const data = studentsTable.row(this).data();
                if (data) {
                    showStudentDetails(data.user_id);
                }
            });

            // Add cursor pointer style
            $('#studentsTable tbody tr').css('cursor', 'pointer');
        }
    });
}

/**
 * Render student form with optional data
 * @param {object} student - Student data for editing, or undefined for new student
 */
function renderStudentForm(student = null) {
    const isEdit = student !== null;

    // Build the form HTML
    const formHtml = `
        ${isEdit ? `<input type="hidden" id="studentId" value="${student.user_id}">` : ''}
        <div class="row mb-3">
            <div class="col-md-6">
                <label for="studentSchoolId" class="form-label">School ID*</label>
                <input type="text" class="form-control" id="studentSchoolId" value="${isEdit ? student.user_schoolId : ''}" required>
            </div>
            <div class="col-md-6">
                <label for="studentEmail" class="form-label">Email</label>
                <input type="email" class="form-control" id="studentEmail" value="${isEdit ? student.phinmaed_email || '' : ''}"
                    placeholder="username@phinmaed.com">
                <small class="text-muted">Must be a PHINMA email</small>
            </div>
        </div>

        <div class="row mb-3">
            <div class="col-md-3">
                <label for="studentFirstName" class="form-label">First Name*</label>
                <input type="text" class="form-control" id="studentFirstName" value="${isEdit ? student.user_firstname : ''}" required>
            </div>
            <div class="col-md-3">
                <label for="studentMiddleName" class="form-label">Middle Name</label>
                <input type="text" class="form-control" id="studentMiddleName" value="${isEdit ? student.user_middlename || '' : ''}">
            </div>
            <div class="col-md-3">
                <label for="studentLastName" class="form-label">Last Name*</label>
                <input type="text" class="form-control" id="studentLastName" value="${isEdit ? student.user_lastname : ''}" required>
            </div>
            <div class="col-md-3">
                <label for="studentSuffix" class="form-label">Suffix</label>
                <input type="text" class="form-control" id="studentSuffix" value="${isEdit ? student.user_suffix || '' : ''}" placeholder="Jr, Sr, III, etc">
            </div>
        </div>

        <div class="row mb-3">
            <div class="col-md-6">
                <label for="studentContact" class="form-label">Contact Number</label>
                <input type="tel" class="form-control" id="studentContact" value="${isEdit ? student.user_contact || '' : ''}" placeholder="09xxxxxxxxx">
            </div>
            <div class="col-md-6">
                <label for="studentDepartment" class="form-label">Department*</label>
                <select class="form-select" id="studentDepartment" required>
                    <option value="">Select Department</option>
                </select>
            </div>
        </div>

        <div class="row mb-3">
            <div class="col-md-6">
                <label for="studentCourse" class="form-label">Course*</label>
                <select class="form-select" id="studentCourse" required>
                    <option value="">Select Department First</option>
                </select>
            </div>
            <div class="col-md-6">
                <label for="studentYearLevel" class="form-label">Year Level*</label>
                <select class="form-select" id="studentYearLevel" required>
                    <option value="1" ${isEdit && student.user_schoolyearId == 1 ? 'selected' : ''}>1st Year</option>
                    <option value="2" ${isEdit && student.user_schoolyearId == 2 ? 'selected' : ''}>2nd Year</option>
                    <option value="3" ${isEdit && student.user_schoolyearId == 3 ? 'selected' : ''}>3rd Year</option>
                    <option value="4" ${isEdit && student.user_schoolyearId == 4 ? 'selected' : ''}>4th Year</option>
                    <option value="5" ${isEdit && student.user_schoolyearId == 5 ? 'selected' : ''}>5th Year</option>
                </select>
            </div>
        </div>

        ${isEdit ? `
        <div class="row mb-3">
            <div class="col-md-6">
                <label class="form-label d-block">Status</label>
                <div class="form-check form-switch">
                    <input class="form-check-input" type="checkbox" id="studentActive" ${student.user_status == 1 ? 'checked' : ''}>
                    <label class="form-check-label" for="studentActive">Active account</label>
                </div>
            </div>
        </div>
        ` : ''}

        <div class="border-top pt-3 text-end">
            <button type="button" class="btn btn-outline-secondary" data-bs-dismiss="modal">Cancel</button>
            <button type="submit" class="btn btn-primary ms-2">${isEdit ? 'Update' : 'Add'} Student</button>
        </div>
    `;

    // Add the form HTML to the container
    $('#studentForm').html(formHtml);

    // Load departments dropdown
    loadDepartmentsDropdown('studentDepartment', isEdit ? student.user_departmentId : null);

    // Set up department change handler
    $('#studentDepartment').on('change', function() {
        const departmentId = $(this).val();
        if (departmentId) {
            loadCoursesForDepartment(departmentId, 'studentCourse');
        } else {
            $('#studentCourse').html('<option value="">Select Department First</option>');
        }
    });

    // If editing, load courses once department is loaded
    if (isEdit) {
        setTimeout(() => {
            loadCoursesForDepartment(student.user_departmentId, 'studentCourse', student.user_courseId);
        }, 300);
    }
}

/**
 * Toggle student active status - UPDATED
 */
function toggleStudentStatus(studentId, isActive) {
    $.ajax({
        // Fixed URL by removing extra slash
        url: `${baseStudentApiUrl}masterfile.php?action=toggle_student_status`,
        type: 'POST',
        data: { id: studentId, status: isActive },
        success: function(response) {
            if (response.success) {
                const statusText = isActive ? 'activated' : 'deactivated';
                showSuccessMessage(`Student account ${statusText} successfully`);
                studentsTable.ajax.reload(null, false);
            } else {
                Swal.fire('Error', response.message || 'Failed to update status', 'error');
                studentsTable.ajax.reload(null, false);
            }
        },
        error: handleAjaxError
    });
}

/**
 * Reset student password to default - FIXED
 */
function resetStudentPassword(studentId) {
    console.log('Resetting password for student ID:', studentId);

    // First convert the string to JSON to debug what's being sent
    const requestData = { user_id: studentId };
    console.log('Reset password request data:', JSON.stringify(requestData));

    $.ajax({
        url: `${baseStudentApiUrl}giya.php?action=reset_password`,
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
 * Delete a student record
 */
function deleteStudent(studentId) {
    Swal.fire({
        title: 'Delete Student',
        text: "Are you sure you want to delete this student? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            $.ajax({
                url: `${baseStudentApiUrl}/masterfile.php?action=student_delete`,
                type: 'POST',
                data: { id: studentId },
                success: function(response) {
                    if (response.success) {
                        showSuccessMessage('Student deleted successfully');
                        studentsTable.ajax.reload();
                    } else {
                        Swal.fire('Error', response.message || 'Failed to delete student', 'error');
                    }
                },
                error: handleAjaxError
            });
        }
    });
}

/**
 * Save student data (add or update) - Include suffix and contact
 */
function saveStudent() {
    // If validation fails, exit early
    if (!validateStudentForm()) return;

    // Collect form data
    const studentId = $('#studentId').val();
    const data = {
        schoolId: $('#studentSchoolId').val(),
        firstName: $('#studentFirstName').val(),
        middleName: $('#studentMiddleName').val(),
        lastName: $('#studentLastName').val(),
        suffix: $('#studentSuffix').val(),
        contact: $('#studentContact').val(),
        departmentId: $('#studentDepartment').val(),
        courseId: $('#studentCourse').val(),
        yearLevel: $('#studentYearLevel').val(),
        email: $('#studentEmail').val()
    };

    // Only include status field if editing (not when adding)
    if (studentId) {
        data.id = studentId;
        data.active = $('#studentActive').is(':checked') ? 1 : 0;
    } else {
        // Default to active when adding new student
        data.active = 1;
    }

    // Submit to server
    $.ajax({
        url: `${baseStudentApiUrl}masterfile.php?action=save_student`,
        type: 'POST',
        data: data,
        success: function(response) {
            if (response.success) {
                showSuccessMessage(studentId ? 'Student updated successfully!' : 'Student added successfully!');
                $('#studentModal').modal('hide');
                studentsTable.ajax.reload();
            } else {
                Swal.fire('Error', response.message || 'Failed to save student data', 'error');
            }
        },
        error: handleAjaxError
    });
}

/**
 * Validate student form data
 */
function validateStudentForm() {
    // Required fields
    const schoolId = $('#studentSchoolId').val();
    if (!schoolId || schoolId.trim() === '') {
        Swal.fire('Validation Error', 'School ID is required', 'error');
        return false;
    }

    const firstName = $('#studentFirstName').val();
    const lastName = $('#studentLastName').val();
    if (!firstName || !lastName || firstName.trim() === '' || lastName.trim() === '') {
        Swal.fire('Validation Error', 'First name and last name are required', 'error');
        return false;
    }

    const department = $('#studentDepartment').val();
    const course = $('#studentCourse').val();
    if (!department || !course) {
        Swal.fire('Validation Error', 'Please select a department and course', 'error');
        return false;
    }

    // Email format (if provided)
    const email = $('#studentEmail').val();
    if (email && email.trim() !== '') {
        // Check if it's a valid PHINMA email
        if (!email.endsWith('@phinmaed.com')) {
            Swal.fire('Validation Error', 'Please enter a valid PHINMA email address (@phinmaed.com)', 'error');
            return false;
        }
    }

    return true;
}

/**
 * Check if modals exist in the DOM and create if missing
 */
function checkModals() {
    console.log('Checking for modals:');
    console.log('Student Form Modal exists:', $('#studentModal').length > 0);
    console.log('Reset Password Modal exists:', $('#resetPasswordModal').length > 0);
    console.log('Student Details Modal exists:', $('#studentDetailsModal').length > 0);

    // Check if we need to create any missing modals
    if ($('#studentDetailsModal').length === 0) {
        createStudentDetailsModal();
    }

    if ($('#resetPasswordModal').length === 0) {
        createResetPasswordModal();
    }
}

function createStudentDetailsModal() {
    const modalHtml = `
    <div class="modal fade" id="studentDetailsModal" tabindex="-1" aria-labelledby="studentDetailsModalTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="studentDetailsModalTitle">Student Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p><strong>School ID:</strong> <span id="detailsSchoolId"></span></p>
                    <p><strong>Full Name:</strong> <span id="detailsFullName"></span></p>
                    <p><strong>Email:</strong> <span id="detailsEmail"></span></p>
                    <p><strong>Contact:</strong> <span id="detailsContact"></span></p>
                    <p><strong>Department:</strong> <span id="detailsDepartment"></span></p>
                    <p><strong>Course:</strong> <span id="detailsCourse"></span></p>
                    <p><strong>Year Level:</strong> <span id="detailsYearLevel"></span></p>
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
    console.log('Student Details modal created dynamically');
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
                    <p>Are you sure you want to reset this student's password to the default (phinma-coc)?</p>
                    <input type="hidden" id="resetPasswordStudentId">
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
