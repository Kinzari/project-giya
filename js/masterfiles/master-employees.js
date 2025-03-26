let employeesTable;
let currentEmployeeData = null;
const baseApiUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

$(document).ready(function() {
    initEmployeesTable();
    loadDepartmentsDropdown('department');
    loadDepartmentsDropdown('departmentFilter');
    loadCampusDropdown('campus');
    loadCampusDropdown('campusFilter');
    setupEventHandlers();
    checkModals();

    // Apply department filter when selection changes
    $('#departmentFilter').on('change', function() {
        const departmentId = $(this).val();
        if (departmentId) {
            employeesTable.column(2).search($(this).find('option:selected').text()).draw();
        } else {
            employeesTable.column(2).search('').draw();
        }
    });

    // Apply campus filter when selection changes
    $('#campusFilter').on('change', function() {
        const campusId = $(this).val();
        if (campusId) {
            employeesTable.column(5).search($(this).find('option:selected').text()).draw();
        } else {
            employeesTable.column(5).search('').draw();
        }
    });
});

function initEmployeesTable() {
    try {
        if ($.fn.DataTable.isDataTable('#employeesTable')) {
            $('#employeesTable').DataTable().destroy();
        }

        const userType = sessionStorage.getItem('user_typeId');

        employeesTable = $('#employeesTable').DataTable({
            ajax: {
                url: `${baseApiUrl}masterfile.php?action=employees`,
                dataSrc: function(response) {
                    if (!response || !response.success) {
                        console.error('Error loading employees:', response?.message || 'Unknown error');
                        return [];
                    }
                    return response.data || [];
                },
                error: function(xhr, error, thrown) {
                    console.error('Error loading employees:', error, thrown);
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
                { data: 'department_name' },
                { data: 'user_contact' },
                { data: 'phinmaed_email' },
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
                            <button class="btn btn-sm btn-primary view-employee" data-id="${data.user_id}">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary edit-employee" data-id="${data.user_id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-warning reset-employee-pw" data-id="${data.user_id}">
                                <i class="bi bi-key"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-employee" data-id="${data.user_id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>`;
                    }
                }
            ],
            responsive: true,
            language: {
                emptyTable: "No employees available",
                zeroRecords: "No matching employees found",
                searchPlaceholder: "Search employees...",
                search: "",
                lengthMenu: "_MENU_ per page",
                paginate: {
                    previous: "<i class='bi bi-chevron-left'></i>",
                    next: "<i class='bi bi-chevron-right'></i>"
                }
            },
            initComplete: function() {
                $('.dataTables_filter input')
                    .attr('placeholder', 'Search employees...')
                    .addClass('form-control-search');
            }
        });

        $('#employeesTable tbody').on('click', 'tr', function(e) {
            if (!$(e.target).closest('button').length) {
                const data = employeesTable.row(this).data();
                if (data) {
                    showEmployeeDetails(data.user_id);
                }
            }
        });

        setupActionButtonEvents();
    } catch (error) {
        console.error('Error initializing employees table:', error);
    }
}

function setupActionButtonEvents() {
    $('#employeesTable').on('click', '.view-employee', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        showEmployeeDetails(id);
    });

    $('#employeesTable').on('click', '.edit-employee', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        editEmployee(id);
    });

    $('#employeesTable').on('click', '.delete-employee', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        deleteEmployee(id);
    });

    $('#employeesTable').on('click', '.reset-employee-pw', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        $('#resetPasswordEmployeeId').val(id);
        $('#resetPasswordModal').modal('show');
    });

    $('#employeesTable').on('click', '.status-btn', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        const isCurrentlyActive = $(this).data('active') == 1;
        const newStatus = isCurrentlyActive ? 0 : 1;
        const statusText = isCurrentlyActive ? 'deactivate' : 'activate';

        Swal.fire({
            title: `${isCurrentlyActive ? 'Deactivate' : 'Activate'} Employee?`,
            text: `Are you sure you want to ${statusText} this employee account?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: isCurrentlyActive ? '#dc3545' : '#28a745',
            cancelButtonColor: '#6c757d',
            confirmButtonText: `Yes, ${statusText} it!`
        }).then((result) => {
            if (result.isConfirmed) {
                toggleEmployeeStatus(id, newStatus);
            }
        });
    });
}

function setupEventHandlers() {
    $('#addEmployeeBtn').on('click', function() {
        showAddEmployeeForm();
    });

    $('#employeeForm').on('submit', function(e) {
        e.preventDefault();
        if (validateEmployeeForm()) {
            saveEmployee();
        }
    });

    $('#confirmResetPassword').on('click', function() {
        const employeeId = $('#resetPasswordEmployeeId').val();
        resetEmployeePassword(employeeId);
    });

    $(document).on('click', '#detailsEdit', function() {
        $('#employeeDetailsModal').modal('hide');
        if (currentEmployeeData) {
            editEmployee(currentEmployeeData.user_id);
        }
    });

    $(document).on('click', '#detailsDelete', function() {
        $('#employeeDetailsModal').modal('hide');
        if (currentEmployeeData) {
            deleteEmployee(currentEmployeeData.user_id);
        }
    });

    $(document).on('click', '#detailsResetPassword', function() {
        $('#employeeDetailsModal').modal('hide');
        if (currentEmployeeData) {
            $('#resetPasswordEmployeeId').val(currentEmployeeData.user_id);
            $('#resetPasswordModal').modal('show');
        }
    });
}

function showEmployeeDetails(employeeId) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseApiUrl}masterfile.php?action=get_employee`,
        type: 'GET',
        data: { id: employeeId },
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success && response.data) {
                const employee = response.data;
                currentEmployeeData = employee;

                $('#detailsEmployeeId').text(employee.user_schoolId || 'N/A');

                let fullName = `${employee.user_firstname} `;
                if (employee.user_middlename) {
                    fullName += `${employee.user_middlename} `;
                }
                fullName += employee.user_lastname;
                if (employee.user_suffix) {
                    fullName += `, ${employee.user_suffix}`;
                }
                $('#detailsFullName').text(fullName);

                $('#detailsEmail').text(employee.phinmaed_email || 'Not provided');
                $('#detailsContact').text(employee.user_contact || 'Not provided');
                $('#detailsDepartment').text(employee.department_name || 'Not assigned');
                $('#detailsCampus').text(employee.campus_name || 'Not assigned');

                if (employee.user_status == 1) {
                    $('#detailsStatusBadge')
                        .removeClass('bg-danger')
                        .addClass('bg-success')
                        .html(`Active <button class="btn btn-sm btn-outline-light ms-2 toggle-status-btn" data-id="${employee.user_id}" data-status="0">Deactivate</button>`);
                } else {
                    $('#detailsStatusBadge')
                        .removeClass('bg-success')
                        .addClass('bg-danger')
                        .html(`Inactive <button class="btn btn-sm btn-outline-light ms-2 toggle-status-btn" data-id="${employee.user_id}" data-status="1">Activate</button>`);
                }

                $('.toggle-status-btn').on('click', function(e) {
                    e.preventDefault();
                    const id = $(this).data('id');
                    const newStatus = $(this).data('status');
                    const action = newStatus == 1 ? 'activate' : 'deactivate';

                    Swal.fire({
                        title: `${newStatus == 1 ? 'Activate' : 'Deactivate'} Employee?`,
                        text: `Are you sure you want to ${action} this employee account?`,
                        icon: 'warning',
                        showCancelButton: true,
                        confirmButtonColor: newStatus == 1 ? '#28a745' : '#dc3545',
                        cancelButtonColor: '#6c757d',
                        confirmButtonText: `Yes, ${action} it!`
                    }).then((result) => {
                        if (result.isConfirmed) {
                            toggleEmployeeStatus(id, newStatus);
                            $('#employeeDetailsModal').modal('hide');
                        }
                    });
                });

                $('#employeeDetailsModal').modal('show');
            } else {
                Swal.fire('Error', response.message || 'Failed to load employee details', 'error');
            }
        },
        error: handleAjaxError
    });
}

function editEmployee(employeeId) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseApiUrl}masterfile.php?action=get_employee`,
        type: 'GET',
        data: { id: employeeId },
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success && response.data) {
                const employee = response.data;

                // Set form mode and employee ID
                $('#employeeForm').data('mode', 'edit');
                $('#employeeForm').data('id', employee.user_id);

                // Populate the form
                $('#employeeId').val(employee.user_schoolId);
                $('#firstName').val(employee.user_firstname);
                $('#lastName').val(employee.user_lastname);
                $('#middleName').val(employee.user_middlename || '');
                $('#suffix').val(employee.user_suffix || '');
                $('#email').val(employee.phinmaed_email || '');
                $('#contact').val(employee.user_contact || '');
                $('#isActive').prop('checked', employee.user_status == 1);

                // Clear password field - it's optional for editing
                $('#password').val('');

                // Load department and campus dropdowns and select the employee's values
                loadDepartmentsDropdown('department', employee.user_departmentId);
                loadCampusDropdown('campus', employee.user_campusId);

                // Update modal title
                $('#employeeModalLabel').text('Edit Employee');

                // Show the modal
                $('#employeeModal').modal('show');
            } else {
                Swal.fire('Error', response.message || 'Failed to load employee data', 'error');
            }
        },
        error: handleAjaxError
    });
}

function showAddEmployeeForm() {
    // Reset form
    $('#employeeForm')[0].reset();
    $('#employeeForm').removeData('id');
    $('#employeeForm').data('mode', 'add');

    // Load fresh dropdowns
    loadDepartmentsDropdown('department');
    loadCampusDropdown('campus');

    // Set modal title
    $('#employeeModalLabel').text('Add Employee');

    // Show modal
    $('#employeeModal').modal('show');
}

function saveEmployee() {
    const userType = sessionStorage.getItem('user_typeId');
    const formData = {
        mode: $('#employeeForm').data('mode') || 'add',
        id: $('#employeeForm').data('id'),
        employeeId: $('#employeeId').val(),
        firstName: $('#firstName').val(),
        lastName: $('#lastName').val(),
        middleName: $('#middleName').val(),
        suffix: $('#suffix').val(),
        email: $('#email').val(),
        contact: $('#contact').val(),
        departmentId: $('#department').val(),
        campusId: $('#campus').val(),
        password: $('#password').val(),
        isActive: $('#isActive').is(':checked') ? 1 : 0
    };

    $.ajax({
        url: `${baseApiUrl}masterfile.php?action=save_employee`,
        type: 'POST',
        data: formData,
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            console.log("Save employee response:", response); // Add debugging

            if (response.success) {
                $('#employeeModal').modal('hide');

                Swal.fire({
                    title: 'Success',
                    text: formData.mode === 'add' ? 'Employee added successfully' : 'Employee updated successfully',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });

                employeesTable.ajax.reload();
            } else {
                Swal.fire('Error', response.message || 'Failed to save employee', 'error');
            }
        },
        error: function(xhr, status, error) {
            console.error("Save error:", xhr.responseText);
            handleAjaxError(xhr, status, error);
        }
    });
}

function deleteEmployee(employeeId) {
    Swal.fire({
        title: 'Delete Employee',
        text: "Are you sure you want to delete this employee? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it'
    }).then((result) => {
        if (result.isConfirmed) {
            const userType = sessionStorage.getItem('user_typeId');

            $.ajax({
                url: `${baseApiUrl}masterfile.php?action=employee_delete`,
                type: 'POST',
                data: { id: employeeId },
                headers: {
                    'X-User-Type': userType || '6'
                },
                success: function(response) {
                    console.log("Delete employee response:", response); // Add debugging

                    if (response.success) {
                        Swal.fire({
                            title: 'Success',
                            text: 'Employee deleted successfully',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        employeesTable.ajax.reload();
                    } else {
                        Swal.fire('Error', response.message || 'Failed to delete employee', 'error');
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

function toggleEmployeeStatus(employeeId, isActive) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseApiUrl}masterfile.php?action=toggle_employee_status`,
        type: 'POST',
        data: { id: employeeId, status: isActive },
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success) {
                Swal.fire({
                    title: 'Success',
                    text: isActive ? 'Employee activated successfully' : 'Employee deactivated successfully',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });
                employeesTable.ajax.reload();
            } else {
                Swal.fire('Error', response.message || 'Failed to update status', 'error');
            }
        },
        error: handleAjaxError
    });
}

function resetEmployeePassword(employeeId) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseApiUrl}giya.php?action=reset_password`,
        type: 'POST',
        data: { user_id: employeeId },
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
                let options = selectId === 'departmentFilter' ?
                    '<option value="">All Departments</option>' :
                    '<option value="">Select Department</option>';

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

function loadCampusDropdown(selectId, selectedId = null) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseApiUrl}masterfile.php?action=campuses`,
        type: 'GET',
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success && response.data) {
                let options = selectId === 'campusFilter' ?
                    '<option value="">All Campuses</option>' :
                    '<option value="">Select Campus</option>';

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

function validateEmployeeForm() {
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

    const campusId = $('#campus').val();
    if (!campusId) {
        Swal.fire('Error', 'Please select a campus', 'error');
        return false;
    }

    return true;
}

function validatePhinmaEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@phinmaed\.com$/;
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
