let campusesTable;
let currentCampusData = null;
const baseApiUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

$(document).ready(function() {
    initCampusesTable();
    setupEventHandlers();
});

function initCampusesTable() {
    try {
        if ($.fn.DataTable.isDataTable('#campusesTable')) {
            $('#campusesTable').DataTable().destroy();
        }

        const userType = sessionStorage.getItem('user_typeId');

        campusesTable = $('#campusesTable').DataTable({
            ajax: {
                url: `${baseApiUrl}masterfile.php?action=campuses_full`,
                dataSrc: function(response) {
                    if (!response || !response.success) {
                        console.error('Error loading campuses:', response?.message || 'Unknown error');
                        return [];
                    }
                    return response.data || [];
                },
                error: function(xhr, error, thrown) {
                    console.error('Error loading campuses:', error, thrown);
                    return [];
                },
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-User-Type', userType || '6');
                }
            },
            columns: [
                { data: 'campus_id' },
                { data: 'campus_name' },
                {
                    data: 'student_count',
                    render: function(data) {
                        return `<span class="badge bg-primary">${data || 0}</span>`;
                    }
                },
                {
                    data: 'employee_count',
                    render: function(data) {
                        return `<span class="badge bg-info">${data || 0}</span>`;
                    }
                },
                {
                    data: 'visitor_count',
                    render: function(data) {
                        return `<span class="badge bg-success">${data || 0}</span>`;
                    }
                },
                {
                    data: null,
                    orderable: false,
                    render: function(data) {
                        return `<div class="d-flex gap-1">
                            <button class="btn btn-sm btn-primary view-campus" data-id="${data.campus_id}">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary edit-campus" data-id="${data.campus_id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-campus" data-id="${data.campus_id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>`;
                    }
                }
            ],
            responsive: true,
            language: {
                emptyTable: "No campuses available",
                zeroRecords: "No matching campuses found",
                searchPlaceholder: "Search campuses...",
                search: "",
                lengthMenu: "_MENU_ per page",
                paginate: {
                    previous: "<i class='bi bi-chevron-left'></i>",
                    next: "<i class='bi bi-chevron-right'></i>"
                }
            },
            initComplete: function() {
                $('.dataTables_filter input')
                    .attr('placeholder', 'Search campuses...')
                    .addClass('form-control-search');
            }
        });

        $('#campusesTable tbody').on('click', 'tr', function(e) {
            if (!$(e.target).closest('button').length) {
                const data = campusesTable.row(this).data();
                if (data) {
                    showCampusDetails(data.campus_id);
                }
            }
        });

        setupActionButtonEvents();
    } catch (error) {
        console.error('Error initializing campuses table:', error);
    }
}

function setupActionButtonEvents() {
    $('#campusesTable').on('click', '.view-campus', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        showCampusDetails(id);
    });

    $('#campusesTable').on('click', '.edit-campus', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        editCampus(id);
    });

    $('#campusesTable').on('click', '.delete-campus', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        deleteCampus(id);
    });
}

function setupEventHandlers() {
    $('#addCampusBtn').on('click', function() {
        showAddCampusForm();
    });

    $('#campusForm').on('submit', function(e) {
        e.preventDefault();
        if (validateCampusForm()) {
            saveCampus();
        }
    });

    $(document).on('click', '#detailsEdit', function() {
        $('#campusDetailsModal').modal('hide');
        if (currentCampusData) {
            editCampus(currentCampusData.campus_id);
        }
    });

    $(document).on('click', '#detailsDelete', function() {
        $('#campusDetailsModal').modal('hide');
        if (currentCampusData) {
            deleteCampus(currentCampusData.campus_id);
        }
    });
}

function showCampusDetails(campusId) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseApiUrl}masterfile.php?action=get_campus`,
        type: 'GET',
        data: { id: campusId },
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success && response.data) {
                const campus = response.data;
                currentCampusData = campus;

                $('#detailsCampusId').text(campus.campus_id);
                $('#detailsCampusName').text(campus.campus_name);
                $('#detailsCampusAddress').text(campus.campus_address || 'Not provided');
                $('#detailsCampusContact').text(campus.campus_contact || 'Not provided');
                $('#detailsStudentCount').text(campus.student_count || 0);
                $('#detailsEmployeeCount').text(campus.employee_count || 0);
                $('#detailsVisitorCount').text(campus.visitor_count || 0);

                // Disable delete button if campus has associated users
                const hasAssociatedUsers = (
                    (campus.student_count > 0) ||
                    (campus.employee_count > 0) ||
                    (campus.visitor_count > 0)
                );

                $('#detailsDelete').prop('disabled', hasAssociatedUsers);
                if (hasAssociatedUsers) {
                    $('#detailsDelete').attr('title', 'Cannot delete campus with associated users');
                } else {
                    $('#detailsDelete').attr('title', 'Delete this campus');
                }

                $('#campusDetailsModal').modal('show');
            } else {
                Swal.fire('Error', response.message || 'Failed to load campus details', 'error');
            }
        },
        error: handleAjaxError
    });
}

function editCampus(campusId) {
    const userType = sessionStorage.getItem('user_typeId');

    $.ajax({
        url: `${baseApiUrl}masterfile.php?action=get_campus`,
        type: 'GET',
        data: { id: campusId },
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success && response.data) {
                const campus = response.data;

                // Set form mode and campus ID
                $('#campusForm').data('mode', 'edit');
                $('#campusForm').data('id', campus.campus_id);

                // Populate the form
                $('#campusName').val(campus.campus_name);
                $('#campusAddress').val(campus.campus_address || '');
                $('#campusContact').val(campus.campus_contact || '');

                // Update modal title
                $('#campusModalLabel').text('Edit Campus');

                // Show the modal
                $('#campusModal').modal('show');
            } else {
                Swal.fire('Error', response.message || 'Failed to load campus data', 'error');
            }
        },
        error: handleAjaxError
    });
}

function showAddCampusForm() {
    // Reset form
    $('#campusForm')[0].reset();
    $('#campusForm').removeData('id');
    $('#campusForm').data('mode', 'add');

    // Set modal title
    $('#campusModalLabel').text('Add Campus');

    // Show modal
    $('#campusModal').modal('show');
}

function saveCampus() {
    const userType = sessionStorage.getItem('user_typeId');
    const formData = {
        mode: $('#campusForm').data('mode') || 'add',
        id: $('#campusForm').data('id'),
        campusName: $('#campusName').val(),
        campusAddress: $('#campusAddress').val(),
        campusContact: $('#campusContact').val()
    };

    $.ajax({
        url: `${baseApiUrl}masterfile.php?action=save_campus`,
        type: 'POST',
        data: formData,
        headers: {
            'X-User-Type': userType || '6'
        },
        success: function(response) {
            if (response.success) {
                $('#campusModal').modal('hide');

                Swal.fire({
                    title: 'Success',
                    text: formData.mode === 'add' ? 'Campus added successfully' : 'Campus updated successfully',
                    icon: 'success',
                    timer: 2000,
                    showConfirmButton: false
                });

                campusesTable.ajax.reload();
            } else {
                Swal.fire('Error', response.message || 'Failed to save campus', 'error');
            }
        },
        error: handleAjaxError
    });
}

function deleteCampus(campusId) {
    Swal.fire({
        title: 'Delete Campus',
        text: "Are you sure you want to delete this campus? This action cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it'
    }).then((result) => {
        if (result.isConfirmed) {
            const userType = sessionStorage.getItem('user_typeId');

            $.ajax({
                url: `${baseApiUrl}masterfile.php?action=campus_delete`,
                type: 'POST',
                data: { id: campusId },
                headers: {
                    'X-User-Type': userType || '6'
                },
                success: function(response) {
                    if (response.success) {
                        Swal.fire({
                            title: 'Success',
                            text: 'Campus deleted successfully',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        campusesTable.ajax.reload();
                    } else {
                        Swal.fire('Error', response.message || 'Failed to delete campus', 'error');
                    }
                },
                error: handleAjaxError
            });
        }
    });
}

function validateCampusForm() {
    const campusName = $('#campusName').val().trim();
    if (!campusName) {
        Swal.fire('Error', 'Campus name is required', 'error');
        return false;
    }

    const campusContact = $('#campusContact').val().trim();
    if (campusContact && !validatePhoneNumber(campusContact)) {
        Swal.fire('Error', 'Please enter a valid Philippine phone number (e.g., 09xxxxxxxxx)', 'error');
        return false;
    }

    return true;
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
