/**
 * Master Files Handler Script
 * Handles all CRUD operations for master files
 */

document.addEventListener('DOMContentLoaded', function() {
    // Check which page we're on
    const currentPage = window.location.pathname.split('/').pop();

    // Initialize the appropriate table based on the current page
    if (currentPage === 'master-students.html') {
        initializeStudentsTable();
    } else if (currentPage === 'master-poc.html') {
        initializePOCTable();
    } else if (currentPage === 'master-departments.html') {
        initializeDepartmentsTable();
    } else if (currentPage === 'master-courses.html') {
        initializeCoursesTable();
    } else if (currentPage === 'master-inquiry-types.html') {
        initializeInquiryTypesTable();
    }

    // Load departments for dropdowns
    loadDepartmentsForDropdowns();
});

// Global variables for edit mode
let isEditMode = false;
let editingId = null;

/**
 * Initialize Students Table
 */
function initializeStudentsTable() {
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

    // Check if DataTable is already initialized and destroy it first
    if ($.fn.DataTable.isDataTable('#studentsTable')) {
        $('#studentsTable').DataTable().destroy();
    }

    // Initialize DataTable
    $('#studentsTable').DataTable({
        ajax: {
            url: `${baseURL}masterfile.php?action=students`,
            dataSrc: function(json) {
                return json.data || [];
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
            { data: 'course_name' },
            {
                data: 'user_schoolyearId',
                render: function(data) {
                    const yearMap = {
                        '1': '1st Year',
                        '2': '2nd Year',
                        '3': '3rd Year',
                        '4': '4th Year',
                        '5': '5th Year'
                    };
                    return yearMap[data] || 'N/A';
                }
            },
            {
                data: 'user_status',
                render: function(data) {
                    return data == 1 ?
                        '<span class="badge bg-success">Active</span>' :
                        '<span class="badge bg-danger">Inactive</span>';
                }
            },
            {
                data: null,
                render: function(data) {
                    return `
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${data.user_id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${data.user_id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    `;
                }
            }
        ],
        responsive: true,
        dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>rtip',
        language: {
            searchPlaceholder: "Search students..."
        },
        order: [[1, 'asc']],
        drawCallback: function() {
            // Add event listeners to edit and delete buttons
            $('.edit-btn').on('click', function() {
                const studentId = $(this).data('id');
                editStudent(studentId);
            });

            $('.delete-btn').on('click', function() {
                const studentId = $(this).data('id');
                deleteStudent(studentId);
            });
        }
    });

    // Setup add student modal
    $('#addStudentBtn').on('click', function() {
        resetStudentForm();
        $('#studentModalLabel').text('Add Student');
        $('#studentModal').modal('show');
    });

    // Setup student form submission
    $('#studentForm').on('submit', function(e) {
        e.preventDefault();
        submitStudentForm();
    });
}

/**
 * Initialize Point of Contact Table
 */
function initializePOCTable() {
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

    // Check if DataTable is already initialized and destroy it first
    if ($.fn.DataTable.isDataTable('#pocTable')) {
        $('#pocTable').DataTable().destroy();
    }

    // Initialize DataTable
    $('#pocTable').DataTable({
        ajax: {
            url: `${baseURL}masterfile.php?action=poc`,
            dataSrc: function(json) {
                return json.data || [];
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
                render: function(data) {
                    return data == 1 ?
                        '<span class="badge bg-success">Active</span>' :
                        '<span class="badge bg-danger">Inactive</span>';
                }
            },
            {
                data: null,
                render: function(data) {
                    return `
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${data.user_id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${data.user_id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    `;
                }
            }
        ],
        responsive: true,
        dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>rtip',
        language: {
            searchPlaceholder: "Search POC..."
        },
        order: [[1, 'asc']],
        drawCallback: function() {
            // Add event listeners to edit and delete buttons
            $('.edit-btn').on('click', function() {
                const pocId = $(this).data('id');
                editPOC(pocId);
            });

            $('.delete-btn').on('click', function() {
                const pocId = $(this).data('id');
                deletePOC(pocId);
            });
        }
    });

    // Setup POC form submission
    $('#pocForm').on('submit', function(e) {
        e.preventDefault();
        submitPOCForm();
    });
}

/**
 * Initialize Departments Table
 */
function initializeDepartmentsTable() {
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

    // Check if DataTable is already initialized and destroy it first
    if ($.fn.DataTable.isDataTable('#departmentsTable')) {
        $('#departmentsTable').DataTable().destroy();
    }

    // Initialize DataTable
    $('#departmentsTable').DataTable({
        ajax: {
            url: `${baseURL}masterfile.php?action=departments`,
            dataSrc: function(json) {
                return json.data || [];
            }
        },
        columns: [
            { data: 'department_id' },
            { data: 'department_name' },
            {
                data: null,
                render: function() {
                    return '0'; // Replace with actual count when API supports it
                }
            },
            {
                data: null,
                render: function() {
                    return '0'; // Replace with actual count when API supports it
                }
            },
            {
                data: null,
                render: function(data) {
                    return `
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${data.department_id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${data.department_id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    `;
                }
            }
        ],
        responsive: true,
        dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>rtip',
        language: {
            searchPlaceholder: "Search departments..."
        },
        order: [[1, 'asc']],
        drawCallback: function() {
            // Add event listeners to edit and delete buttons
            $('.edit-btn').on('click', function() {
                const deptId = $(this).data('id');
                editDepartment(deptId);
            });

            $('.delete-btn').on('click', function() {
                const deptId = $(this).data('id');
                deleteDepartment(deptId);
            });
        }
    });

    // Setup department form submission
    $('#departmentForm').on('submit', function(e) {
        e.preventDefault();
        submitDepartmentForm();
    });
}

/**
 * Initialize Courses Table
 */
function initializeCoursesTable() {
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

    // Check if DataTable is already initialized and destroy it first
    if ($.fn.DataTable.isDataTable('#coursesTable')) {
        $('#coursesTable').DataTable().destroy();
    }

    // Initialize DataTable
    $('#coursesTable').DataTable({
        ajax: {
            url: `${baseURL}masterfile.php?action=courses`,
            dataSrc: function(json) {
                return json.data || [];
            }
        },
        columns: [
            { data: 'course_id' },
            { data: 'course_name' },
            { data: 'department_name' },
            {
                data: null,
                render: function() {
                    return '0'; // Replace with actual count when API supports it
                }
            },
            {
                data: null,
                render: function(data) {
                    return `
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${data.course_id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${data.course_id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    `;
                }
            }
        ],
        responsive: true,
        dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>rtip',
        language: {
            searchPlaceholder: "Search courses..."
        },
        order: [[1, 'asc']],
        drawCallback: function() {
            // Add event listeners to edit and delete buttons
            $('.edit-btn').on('click', function() {
                const courseId = $(this).data('id');
                editCourse(courseId);
            });

            $('.delete-btn').on('click', function() {
                const courseId = $(this).data('id');
                deleteCourse(courseId);
            });
        }
    });

    // Setup course form submission
    $('#courseForm').on('submit', function(e) {
        e.preventDefault();
        submitCourseForm();
    });
}

/**
 * Initialize Inquiry Types Table
 */
function initializeInquiryTypesTable() {
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

    // Check if DataTable is already initialized and destroy it first
    if ($.fn.DataTable.isDataTable('#inquiryTypesTable')) {
        $('#inquiryTypesTable').DataTable().destroy();
    }

    // Initialize DataTable
    $('#inquiryTypesTable').DataTable({
        ajax: {
            url: `${baseURL}masterfile.php?action=inquiry_types`,
            dataSrc: function(json) {
                return json.data || [];
            }
        },
        columns: [
            { data: 'inquiry_id' },
            { data: 'inquiry_type' },
            { data: 'description' },
            { data: 'department_name' },
            {
                data: 'is_active',
                render: function(data) {
                    return data == 1 ?
                        '<span class="badge bg-success">Active</span>' :
                        '<span class="badge bg-danger">Inactive</span>';
                }
            },
            {
                data: null,
                render: function(data) {
                    return `
                        <button class="btn btn-sm btn-primary edit-btn" data-id="${data.inquiry_id}">
                            <i class="bi bi-pencil"></i>
                        </button>
                        <button class="btn btn-sm btn-danger delete-btn" data-id="${data.inquiry_id}">
                            <i class="bi bi-trash"></i>
                        </button>
                    `;
                }
            }
        ],
        responsive: true,
        dom: '<"row"<"col-sm-12 col-md-6"l><"col-sm-12 col-md-6"f>>rtip',
        language: {
            searchPlaceholder: "Search inquiry types..."
        },
        order: [[1, 'asc']],
        drawCallback: function() {
            // Add event listeners to edit and delete buttons
            $('.edit-btn').on('click', function() {
                const typeId = $(this).data('id');
                editInquiryType(typeId);
            });

            $('.delete-btn').on('click', function() {
                const typeId = $(this).data('id');
                deleteInquiryType(typeId);
            });
        }
    });

    // Setup inquiry type form submission
    $('#inquiryTypeForm').on('submit', function(e) {
        e.preventDefault();
        submitInquiryTypeForm();
    });
}

/**
 * Load departments for all dropdowns
 */
function loadDepartmentsForDropdowns() {
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

    $.ajax({
        url: `${baseURL}masterfile.php?action=departments`,
        method: 'GET',
        success: function(response) {
            if (response.success && response.data) {
                // Create options for department dropdowns
                let options = '<option value="">Select Department</option>';

                response.data.forEach(function(dept) {
                    options += `<option value="${dept.department_id}">${dept.department_name}</option>`;
                });

                // Populate all department dropdowns
                $('select[id="department"]').html(options);
            }
        },
        error: function() {
            toastr.error('Failed to load departments');
        }
    });
}

// Example of a form submission function
function submitPOCForm() {
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

    // Get form data
    const formData = {
        employeeId: $('#employeeId').val(),
        firstName: $('#firstName').val(),
        lastName: $('#lastName').val(),
        departmentId: $('#department').val(),
        contact: $('#contact').val(),
        email: $('#email').val(),
        isActive: $('#isActive').is(':checked') ? 1 : 0,
        mode: isEditMode ? 'update' : 'add',
        id: isEditMode ? editingId : null
    };

    // Send request
    $.ajax({
        url: `${baseURL}masterfile.php?action=submit_poc`,
        method: 'POST',
        data: formData,
        success: function(response) {
            if (response.success) {
                toastr.success('POC information saved successfully');
                $('#pocModal').modal('hide');
                $('#pocTable').DataTable().ajax.reload();
            } else {
                toastr.error(response.message || 'Failed to save POC information');
            }
        },
        error: function() {
            toastr.error('An error occurred. Please try again.');
        }
    });
}

// Show error message in a consistent way
function showError(message) {
    Swal.fire({
        icon: 'error',
        title: 'Error',
        text: message
    });
}

// Show success message in a consistent way
function showSuccess(message) {
    Swal.fire({
        icon: 'success',
        title: 'Success',
        text: message
    });
}

// Reset form to add mode
function resetForm(formId) {
    $(`#${formId}`)[0].reset();
    isEditMode = false;
    editingId = null;
}

// CRUD Operations

// Edit POC
function editPOC(id) {
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

    $.ajax({
        url: `${baseURL}masterfile.php?action=get_poc_details&id=${id}`,
        method: 'GET',
        success: function(response) {
            if (response.success && response.data) {
                const poc = response.data;

                // Fill the form with POC data
                $('#employeeId').val(poc.user_schoolId);
                $('#firstName').val(poc.user_firstname);
                $('#lastName').val(poc.user_lastname);
                $('#department').val(poc.user_departmentId);
                $('#contact').val(poc.user_contact);
                $('#email').val(poc.phinmaed_email);
                $('#isActive').prop('checked', poc.user_status == 1);

                // Set edit mode
                isEditMode = true;
                editingId = poc.user_id;

                // Update modal title
                $('#pocModalLabel').text('Edit Point of Contact');

                // Show modal
                $('#pocModal').modal('show');
            } else {
                toastr.error('Failed to load POC details');
            }
        },
        error: function() {
            toastr.error('An error occurred while loading POC details');
        }
    });
}

// Delete POC
function deletePOC(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

            $.ajax({
                url: `${baseURL}masterfile.php?action=delete_poc`,
                method: 'POST',
                data: { id: id },
                success: function(response) {
                    if (response.success) {
                        showSuccess('POC deleted successfully');
                        $('#pocTable').DataTable().ajax.reload();
                    } else {
                        showError(response.message || 'Failed to delete POC');
                    }
                },
                error: function() {
                    showError('An error occurred while deleting the POC');
                }
            });
        }
    });
}

// Edit Department
function editDepartment(id) {
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

    $.ajax({
        url: `${baseURL}masterfile.php?action=get_department_details&id=${id}`,
        method: 'GET',
        success: function(response) {
            if (response.success && response.data) {
                const dept = response.data;

                // Fill the form with department data
                $('#departmentName').val(dept.department_name);

                // Set edit mode
                isEditMode = true;
                editingId = dept.department_id;

                // Update modal title
                $('.modal-title').text('Edit Department');

                // Show modal
                $('#departmentModal').modal('show');
            } else {
                toastr.error('Failed to load department details');
            }
        },
        error: function() {
            toastr.error('An error occurred while loading department details');
        }
    });
}

// Delete Department
function deleteDepartment(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

            $.ajax({
                url: `${baseURL}masterfile.php?action=delete_department`,
                method: 'POST',
                data: { id: id },
                success: function(response) {
                    if (response.success) {
                        showSuccess('Department deleted successfully');
                        $('#departmentsTable').DataTable().ajax.reload();
                    } else {
                        showError(response.message || 'Failed to delete department');
                    }
                },
                error: function() {
                    showError('An error occurred while deleting the department');
                }
            });
        }
    });
}

// Edit Course
function editCourse(id) {
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

    $.ajax({
        url: `${baseURL}masterfile.php?action=get_course_details&id=${id}`,
        method: 'GET',
        success: function(response) {
            if (response.success && response.data) {
                const course = response.data;

                // Fill the form with course data
                $('#courseName').val(course.course_name);
                $('#department').val(course.course_departmentId);

                // Set edit mode
                isEditMode = true;
                editingId = course.course_id;

                // Update modal title
                $('.modal-title').text('Edit Course');

                // Show modal
                $('#courseModal').modal('show');
            } else {
                toastr.error('Failed to load course details');
            }
        },
        error: function() {
            toastr.error('An error occurred while loading course details');
        }
    });
}

// Delete Course
function deleteCourse(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

            $.ajax({
                url: `${baseURL}masterfile.php?action=delete_course`,
                method: 'POST',
                data: { id: id },
                success: function(response) {
                    if (response.success) {
                        showSuccess('Course deleted successfully');
                        $('#coursesTable').DataTable().ajax.reload();
                    } else {
                        showError(response.message || 'Failed to delete course');
                    }
                },
                error: function() {
                    showError('An error occurred while deleting the course');
                }
            });
        }
    });
}

// Edit Inquiry Type
function editInquiryType(id) {
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

    $.ajax({
        url: `${baseURL}masterfile.php?action=get_inquiry_type_details&id=${id}`,
        method: 'GET',
        success: function(response) {
            if (response.success && response.data) {
                const type = response.data;

                // Fill the form with inquiry type data
                $('#inquiryType').val(type.inquiry_type);
                $('#description').val(type.description);
                $('#department').val(type.department_id);
                $('#isActive').prop('checked', type.is_active == 1);

                // Set edit mode
                isEditMode = true;
                editingId = type.inquiry_id;

                // Update modal title
                $('.modal-title').text('Edit Inquiry Type');

                // Show modal
                $('#inquiryTypeModal').modal('show');
            } else {
                toastr.error('Failed to load inquiry type details');
            }
        },
        error: function() {
            toastr.error('An error occurred while loading inquiry type details');
        }
    });
}

// Delete Inquiry Type
function deleteInquiryType(id) {
    Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, delete it!'
    }).then((result) => {
        if (result.isConfirmed) {
            const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

            $.ajax({
                url: `${baseURL}masterfile.php?action=delete_inquiry_type`,
                method: 'POST',
                data: { id: id },
                success: function(response) {
                    if (response.success) {
                        showSuccess('Inquiry type deleted successfully');
                        $('#inquiryTypesTable').DataTable().ajax.reload();
                    } else {
                        showError(response.message || 'Failed to delete inquiry type');
                    }
                },
                error: function() {
                    showError('An error occurred while deleting the inquiry type');
                }
            });
        }
    });
}

// Submit Department Form
function submitDepartmentForm() {
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

    // Get form data
    const formData = {
        departmentName: $('#departmentName').val(),
        mode: isEditMode ? 'update' : 'add',
        id: isEditMode ? editingId : null
    };

    // Send request
    $.ajax({
        url: `${baseURL}masterfile.php?action=submit_department`,
        method: 'POST',
        data: formData,
        success: function(response) {
            if (response.success) {
                toastr.success('Department saved successfully');
                $('#departmentModal').modal('hide');
                $('#departmentsTable').DataTable().ajax.reload();
            } else {
                toastr.error(response.message || 'Failed to save department');
            }
        },
        error: function() {
            toastr.error('An error occurred. Please try again.');
        }
    });
}

// Submit Course Form
function submitCourseForm() {
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

    // Get form data
    const formData = {
        courseName: $('#courseName').val(),
        departmentId: $('#department').val(),
        mode: isEditMode ? 'update' : 'add',
        id: isEditMode ? editingId : null
    };

    // Send request
    $.ajax({
        url: `${baseURL}masterfile.php?action=submit_course`,
        method: 'POST',
        data: formData,
        success: function(response) {
            if (response.success) {
                toastr.success('Course saved successfully');
                $('#courseModal').modal('hide');
                $('#coursesTable').DataTable().ajax.reload();
            } else {
                toastr.error(response.message || 'Failed to save course');
            }
        },
        error: function() {
            toastr.error('An error occurred. Please try again.');
        }
    });
}

// Submit Inquiry Type Form
function submitInquiryTypeForm() {
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

    // Get form data
    const formData = {
        inquiryType: $('#inquiryType').val(),
        description: $('#description').val(),
        departmentId: $('#department').val(),
        isActive: $('#isActive').is(':checked') ? 1 : 0,
        mode: isEditMode ? 'update' : 'add',
        id: isEditMode ? editingId : null
    };

    // Send request
    $.ajax({
        url: `${baseURL}masterfile.php?action=submit_inquiry_type`,
        method: 'POST',
        data: formData,
        success: function(response) {
            if (response.success) {
                toastr.success('Inquiry type saved successfully');
                $('#inquiryTypeModal').modal('hide');
                $('#inquiryTypesTable').DataTable().ajax.reload();
            } else {
                toastr.error(response.message || 'Failed to save inquiry type');
            }
        },
        error: function() {
            toastr.error('An error occurred. Please try again.');
        }
    });
}
