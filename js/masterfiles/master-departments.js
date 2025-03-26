let departmentsTable;
let currentDepartmentData = null;

$(document).ready(function() {
    initBasicDepartmentsTable();
    setupEventHandlers();
    checkModals();
});

function initBasicDepartmentsTable() {
    try {
        if ($.fn.DataTable.isDataTable('#departmentsTable')) {
            $('#departmentsTable').DataTable().destroy();
        }

        $('#departmentsTable').empty();
        $('#departmentsTable').append('<thead><tr>' +
            '<th>ID</th>' +
            '<th>Department Name</th>' +
            '<th>Courses</th>' +
            '<th>Students</th>' +
            '<th>Actions</th>' +
            '</tr></thead><tbody></tbody>');

        const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
        const userType = sessionStorage.getItem('user_typeId');

        departmentsTable = $('#departmentsTable').DataTable({
            ajax: {
                url: `${baseUrl}masterfile.php?action=departments`,
                dataSrc: function(response) {
                    if (!response || !response.success) {
                        return [];
                    }
                    return response.data || [];
                },
                error: function(xhr, error, thrown) {
                    console.error("Error loading departments:", error, thrown);
                    return [];
                },
                // Add authentication headers
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-User-Type', userType || '6');
                }
            },
            columns: [
                { data: 'department_id' },
                { data: 'department_name' },
                {
                    data: 'course_count',
                    render: function(data) {
                        return `<span class="badge bg-info">${data || 0}</span>`;
                    }
                },
                {
                    data: 'student_count',
                    render: function(data) {
                        return `<span class="badge bg-primary">${data || 0}</span>`;
                    }
                },
                {
                    data: null,
                    orderable: false,
                    render: function(data) {
                        return `<div class="d-flex gap-1">
                            <button class="btn btn-sm btn-primary view-dept" data-id="${data.department_id}">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary edit-dept" data-id="${data.department_id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-dept" data-id="${data.department_id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>`;
                    }
                }
            ],
            responsive: true,
            language: {
                emptyTable: "No departments available",
                zeroRecords: "No matching departments found",
                searchPlaceholder: "Search departments...",
                search: "",
                lengthMenu: "_MENU_ per page",
                paginate: {
                    previous: "<i class='bi bi-chevron-left'></i>",
                    next: "<i class='bi bi-chevron-right'></i>"
                }
            },
            initComplete: function() {
                $('.dataTables_filter input')
                    .attr('placeholder', 'Search departments...')
                    .addClass('form-control-search');

                $('#departmentsTable tbody tr').css('cursor', 'pointer');
            }
        });

        $('#departmentsTable tbody').on('click', 'tr', function(e) {
            if (!$(e.target).closest('button').length) {
                const data = departmentsTable.row(this).data();
                if (data) {
                    showDepartmentDetails(data.department_id);
                }
            }
        });

        setupActionButtonEvents();
    } catch (error) {
        console.error("Error initializing departments table:", error);
    }
}

function setupActionButtonEvents() {
    $('#departmentsTable').on('click', '.view-dept', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        showDepartmentDetails(id);
    });

    $('#departmentsTable').on('click', '.edit-dept', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        editDepartment(id);
    });

    $('#departmentsTable').on('click', '.delete-dept', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        deleteDepartment(id);
    });
}

function setupEventHandlers() {
    $('#addDepartmentBtn').on('click', function() {
        showAddDepartmentForm();
    });

    $('#departmentForm').on('submit', function(e) {
        e.preventDefault();
        if (validateDepartmentForm()) {
            saveDepartment();
        }
    });

    $(document).on('click', '#detailsEdit', function() {
        $('#departmentDetailsModal').modal('hide');
        if (currentDepartmentData) {
            editDepartment(currentDepartmentData.department_id);
        }
    });

    $(document).on('click', '#detailsDelete', function() {
        $('#departmentDetailsModal').modal('hide');
        if (currentDepartmentData) {
            deleteDepartment(currentDepartmentData.department_id);
        }
    });

    $(document).on('click', '#viewCourses', function() {
        if (currentDepartmentData) {
            window.location.href = `master-courses.html?department=${currentDepartmentData.department_id}`;
        }
    });
}

function checkModals() {
    if ($('#departmentDetailsModal').length === 0) {
        createDepartmentDetailsModal();
    }
}

function createDepartmentDetailsModal() {
    const modalHtml = `
    <div class="modal fade" id="departmentDetailsModal" tabindex="-1" aria-labelledby="departmentDetailsModalTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="departmentDetailsModalTitle">Department Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p><strong>Department ID:</strong> <span id="detailsDepartmentId"></span></p>
                    <p><strong>Department Name:</strong> <span id="detailsDepartmentName"></span></p>
                    <p><strong>Total Courses:</strong> <span id="detailsCourseCount" class="badge bg-info"></span></p>
                    <p><strong>Total Students:</strong> <span id="detailsStudentCount" class="badge bg-primary"></span></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-info" id="viewCourses">View Courses</button>
                    <button type="button" class="btn btn-primary" id="detailsEdit">Edit</button>
                    <button type="button" class="btn btn-danger" id="detailsDelete">Delete</button>
                </div>
            </div>
        </div>
    </div>`;

    $('body').append(modalHtml);
}

function showDepartmentDetails(departmentId) {
    const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseUrl}masterfile.php?action=get_department`,
        type: 'GET',
        data: { id: departmentId },
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success && response.data) {
                const dept = response.data;
                currentDepartmentData = dept;

                $('#detailsDepartmentId').text(dept.department_id);
                $('#detailsDepartmentName').text(dept.department_name);
                $('#detailsCourseCount').text(dept.course_count || 0);
                $('#detailsStudentCount').text(dept.student_count || 0);

                const hasAssociatedRecords = (dept.course_count > 0 || dept.student_count > 0);
                $('#detailsDelete').prop('disabled', hasAssociatedRecords);
                if (hasAssociatedRecords) {
                    $('#detailsDelete').attr('title', 'Cannot delete departments with associated courses or students');
                } else {
                    $('#detailsDelete').attr('title', 'Delete this department');
                }

                $('#departmentDetailsModal').modal('show');
            } else {
                Swal.fire('Error', response.message || 'Failed to load department details', 'error');
            }
        },
        error: handleAjaxError
    });
}

function editDepartment(departmentId) {
    const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseUrl}masterfile.php?action=get_department`,
        type: 'GET',
        data: { id: departmentId },
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success && response.data) {
                const dept = response.data;

                $('#departmentForm').data('mode', 'edit');
                $('#departmentForm').data('id', dept.department_id);
                $('#departmentName').val(dept.department_name);

                $('#departmentModalLabel').text('Edit Department');
                $('#departmentModal').modal('show');
            } else {
                Swal.fire('Error', response.message || 'Failed to load department data', 'error');
            }
        },
        error: handleAjaxError
    });
}

function showAddDepartmentForm() {
    $('#departmentForm')[0].reset();
    $('#departmentForm').removeData('id');
    $('#departmentForm').data('mode', 'add');

    $('#departmentModalLabel').text('Add Department');
    $('#departmentModal').modal('show');
}

function deleteDepartment(departmentId) {
    Swal.fire({
        title: 'Delete Department',
        text: "Are you sure you want to delete this department? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
            const userType = sessionStorage.getItem('user_typeId');

            $.ajax({
                url: `${baseUrl}masterfile.php?action=department_delete`,
                type: 'POST',
                data: { id: departmentId },
                headers: {
                    'X-User-Type': userType || '6'
                },
                success: function(response) {
                    if (response.success) {
                        showSuccessMessage('Department deleted successfully');
                        departmentsTable.ajax.reload();
                    } else {
                        Swal.fire('Error', response.message || 'Failed to delete department', 'error');
                    }
                },
                error: handleAjaxError
            });
        }
    });
}

function saveDepartment() {
    const formData = {
        mode: $('#departmentForm').data('mode') || 'add',
        id: $('#departmentForm').data('id'),
        departmentName: $('#departmentName').val()
    };

    const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseUrl}masterfile.php?action=submit_department`,
        type: 'POST',
        data: formData,
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success) {
                $('#departmentModal').modal('hide');
                showSuccessMessage(formData.mode === 'add' ? 'Department added successfully' : 'Department updated successfully');
                departmentsTable.ajax.reload();
            } else {
                Swal.fire('Error', response.message || 'Failed to save department', 'error');
            }
        },
        error: handleAjaxError
    });
}

function validateDepartmentForm() {
    const departmentName = $('#departmentName').val();
    if (!departmentName || departmentName.trim() === '') {
        Swal.fire('Error', 'Department name is required', 'error');
        return false;
    }
    return true;
}

function showSuccessMessage(message) {
    Swal.fire({
        title: 'Success',
        text: message,
        icon: 'success',
        timer: 2000,
        showConfirmButton: false
    });
}

function handleAjaxError(xhr, status, error) {
    Swal.fire({
        title: 'Error',
        text: 'An error occurred while communicating with the server',
        icon: 'error'
    });
}
