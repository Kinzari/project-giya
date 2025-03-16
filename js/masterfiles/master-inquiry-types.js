let inquiryTypesTable;
let currentInquiryTypeData = null;

$(document).ready(function() {
    initBasicInquiryTypesTable();
    setupEventHandlers();
    checkModals();
});

function initBasicInquiryTypesTable() {
    try {
        if ($.fn.DataTable.isDataTable('#inquiryTypesTable')) {
            $('#inquiryTypesTable').DataTable().destroy();
        }

        $('#inquiryTypesTable').empty();
        $('#inquiryTypesTable').append('<thead><tr>' +
            '<th>Inquiry Type</th>' +
            '<th>Description</th>' +
            '<th>Department</th>' +
            '<th>Actions</th>' +
            '</tr></thead><tbody></tbody>');

        const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
        const userType = sessionStorage.getItem('userType') || '6';

        inquiryTypesTable = $('#inquiryTypesTable').DataTable({
            ajax: {
                url: `${baseUrl}masterfile.php?action=inquiry_types`,
                dataSrc: function(response) {
                    if (!response || !response.success) {
                        return [];
                    }
                    return response.data || [];
                },
                error: function(xhr, error, thrown) {
                    return [];
                },
                headers: {
                    'X-User-Type': userType
                }
            },
            columns: [
                { data: 'inquiry_type' },
                {
                    data: 'description',
                    render: function(data) {
                        return data.length > 50 ? data.substring(0, 50) + '...' : data;
                    }
                },
                { data: 'department_name' },
                {
                    data: null,
                    orderable: false,
                    render: function(data) {
                        return `<div class="d-flex gap-1">
                            <button class="btn btn-sm btn-primary view-inquiry" data-id="${data.inquiry_id}">
                                <i class="bi bi-eye"></i>
                            </button>
                            <button class="btn btn-sm btn-primary edit-inquiry" data-id="${data.inquiry_id}">
                                <i class="bi bi-pencil"></i>
                            </button>
                            <button class="btn btn-sm btn-danger delete-inquiry" data-id="${data.inquiry_id}">
                                <i class="bi bi-trash"></i>
                            </button>
                        </div>`;
                    }
                }
            ],
            responsive: true,
            language: {
                emptyTable: "No inquiry types available",
                zeroRecords: "No matching inquiry types found",
                searchPlaceholder: "Search inquiry types...",
                search: "",
                lengthMenu: "_MENU_ per page",
                paginate: {
                    previous: "<i class='bi bi-chevron-left'></i>",
                    next: "<i class='bi bi-chevron-right'></i>"
                }
            },
            initComplete: function() {
                $('.dataTables_filter input')
                    .attr('placeholder', 'Search inquiry types...')
                    .addClass('form-control-search');

                $('#inquiryTypesTable tbody tr').css('cursor', 'pointer');
            }
        });

        $('#inquiryTypesTable tbody').on('click', 'tr', function(e) {
            if (!$(e.target).closest('button').length) {
                const data = inquiryTypesTable.row(this).data();
                if (data) {
                    showInquiryTypeDetails(data.inquiry_id);
                }
            }
        });

        setupActionButtonEvents();
    } catch (error) {
    }
}

function setupActionButtonEvents() {
    $('#inquiryTypesTable').on('click', '.view-inquiry', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        showInquiryTypeDetails(id);
    });

    $('#inquiryTypesTable').on('click', '.edit-inquiry', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        editInquiryType(id);
    });

    $('#inquiryTypesTable').on('click', '.delete-inquiry', function(e) {
        e.preventDefault();
        e.stopPropagation();
        const id = $(this).data('id');
        deleteInquiryType(id);
    });
}

function setupEventHandlers() {
    $('#addInquiryTypeBtn').on('click', function() {
        showAddInquiryTypeForm();
    });

    $('#inquiryTypeForm').on('submit', function(e) {
        e.preventDefault();
        if (validateInquiryTypeForm()) {
            saveInquiryType();
        }
    });

    $(document).on('click', '#detailsEdit', function() {
        $('#inquiryTypeDetailsModal').modal('hide');
        if (currentInquiryTypeData) {
            editInquiryType(currentInquiryTypeData.inquiry_id);
        }
    });

    $(document).on('click', '#detailsDelete', function() {
        $('#inquiryTypeDetailsModal').modal('hide');
        if (currentInquiryTypeData) {
            deleteInquiryType(currentInquiryTypeData.inquiry_id);
        }
    });
}

function checkModals() {
    if ($('#inquiryTypeDetailsModal').length === 0) {
        createInquiryTypeDetailsModal();
    }
}

function createInquiryTypeDetailsModal() {
    const modalHtml = `
    <div class="modal fade" id="inquiryTypeDetailsModal" tabindex="-1" aria-labelledby="inquiryTypeDetailsModalTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="inquiryTypeDetailsModalTitle">Inquiry Type Details</h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p><strong>ID:</strong> <span id="detailsInquiryId"></span></p>
                    <p><strong>Type Name:</strong> <span id="detailsInquiryType"></span></p>
                    <p><strong>Description:</strong> <span id="detailsDescription"></span></p>
                    <p><strong>Department:</strong> <span id="detailsDepartmentName"></span></p>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-primary" id="detailsEdit">Edit</button>
                    <button type="button" class="btn btn-danger" id="detailsDelete">Delete</button>
                </div>
            </div>
        </div>
    </div>`;

    $('body').append(modalHtml);
}

function showInquiryTypeDetails(inquiryId) {
    const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    const userType = sessionStorage.getItem('userType') || '6';

    $.ajax({
        url: `${baseUrl}masterfile.php?action=get_inquiry_type`,
        type: 'GET',
        data: { id: inquiryId },
        headers: {
            'X-User-Type': userType
        },
        success: function(response) {
            if (response.success && response.data) {
                const inquiryType = response.data;
                currentInquiryTypeData = inquiryType;

                $('#detailsInquiryId').text(inquiryType.inquiry_id);
                $('#detailsInquiryType').text(inquiryType.inquiry_type);
                $('#detailsDescription').text(inquiryType.description);
                $('#detailsDepartmentName').text(inquiryType.department_name);

                $('#inquiryTypeDetailsModal').modal('show');
            } else {
                Swal.fire('Error', response.message || 'Failed to load inquiry type details', 'error');
            }
        },
        error: function(xhr, status, error) {
            Swal.fire('Error', 'Failed to load inquiry type details', 'error');
        }
    });
}

function showAddInquiryTypeForm() {
    $('#inquiryTypeForm')[0].reset();
    $('#inquiryTypeForm').removeData('id');
    $('#inquiryTypeForm').data('mode', 'add');

    const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    loadDepartmentsDropdown('department');

    $('#inquiryTypeModalLabel').text('Add Inquiry Type');
    $('#inquiryTypeModal').modal('show');
}

function editInquiryType(inquiryId) {
    const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    const userType = sessionStorage.getItem('userType') || '6';

    $.ajax({
        url: `${baseUrl}masterfile.php?action=get_inquiry_type`,
        type: 'GET',
        data: { id: inquiryId },
        headers: {
            'X-User-Type': userType
        },
        success: function(response) {
            if (response.success && response.data) {
                const inquiryType = response.data;

                $('#inquiryTypeForm').data('id', inquiryType.inquiry_id);
                $('#inquiryTypeForm').data('mode', 'edit');

                $('#inquiryType').val(inquiryType.inquiry_type);
                $('#description').val(inquiryType.description);

                loadDepartmentsDropdown('department', inquiryType.department_id);

                $('#inquiryTypeModalLabel').text('Edit Inquiry Type');
                $('#inquiryTypeModal').modal('show');
            } else {
                Swal.fire('Error', response.message || 'Failed to load inquiry type data', 'error');
            }
        },
        error: function(xhr, status, error) {
            Swal.fire('Error', 'Failed to load inquiry type data', 'error');
        }
    });
}

function deleteInquiryType(inquiryId) {
    Swal.fire({
        title: 'Delete Inquiry Type',
        text: "Are you sure you want to delete this inquiry type? This cannot be undone.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Yes, delete it',
        cancelButtonText: 'Cancel'
    }).then((result) => {
        if (result.isConfirmed) {
            const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
            const userType = sessionStorage.getItem('userType') || '6';

            $.ajax({
                url: `${baseUrl}masterfile.php?action=inquiry_type_delete`,
                type: 'POST',
                data: { id: inquiryId },
                headers: {
                    'X-User-Type': userType
                },
                success: function(response) {
                    if (response.success) {
                        Swal.fire({
                            title: 'Success',
                            text: 'Inquiry type deleted successfully',
                            icon: 'success',
                            timer: 2000,
                            showConfirmButton: false
                        });
                        inquiryTypesTable.ajax.reload();
                    } else {
                        Swal.fire('Error', response.message || 'Failed to delete inquiry type', 'error');
                    }
                },
                error: function(xhr, status, error) {
                    Swal.fire('Error', 'An error occurred while trying to delete the inquiry type', 'error');
                }
            });
        }
    });
}

function saveInquiryType() {
    const formData = {
        mode: $('#inquiryTypeForm').data('mode') || 'add',
        id: $('#inquiryTypeForm').data('id'),
        inquiryType: $('#inquiryType').val(),
        description: $('#description').val(),
        departmentId: $('#department').val()
    };

    const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    const userType = sessionStorage.getItem('userType') || '6';

    $.ajax({
        url: `${baseUrl}masterfile.php?action=submit_inquiry_type`,
        type: 'POST',
        data: formData,
        headers: {
            'X-User-Type': userType
        },
        dataType: 'text',
        success: function(responseText) {
            try {
                const response = JSON.parse(responseText);

                if (response.success) {
                    $('#inquiryTypeModal').modal('hide');

                    Swal.fire({
                        title: 'Success',
                        text: formData.mode === 'add' ? 'Inquiry type added successfully' : 'Inquiry type updated successfully',
                        icon: 'success',
                        timer: 2000,
                        showConfirmButton: false
                    });

                    inquiryTypesTable.ajax.reload();
                } else {
                    Swal.fire('Error', response.message || 'Failed to save inquiry type', 'error');
                }
            } catch (e) {
                if (responseText.indexOf('}{') > -1) {
                    try {
                        const firstJson = responseText.substring(0, responseText.indexOf('}')+1);
                        const response = JSON.parse(firstJson);

                        if (response.success) {
                            $('#inquiryTypeModal').modal('hide');
                            Swal.fire({
                                title: 'Success',
                                text: 'Operation completed successfully',
                                icon: 'success',
                                timer: 2000,
                                showConfirmButton: false
                            });
                            inquiryTypesTable.ajax.reload();
                            return;
                        }
                    } catch (ex) {
                    }
                }

                Swal.fire('Error', 'The server returned an invalid response', 'error');
            }
        },
        error: function(xhr, status, error) {
            let errorMessage = 'An error occurred while communicating with the server';

            if (xhr.responseText && xhr.responseText.indexOf('<br />') > -1) {
                errorMessage = 'The server encountered an error. Please contact the administrator.';
            }

            Swal.fire({
                title: 'Error',
                text: errorMessage,
                icon: 'error'
            });
        }
    });
}

function validateInquiryTypeForm() {
    const inquiryType = $('#inquiryType').val();
    if (!inquiryType || inquiryType.trim() === '') {
        Swal.fire('Error', 'Inquiry type name is required', 'error');
        return false;
    }

    const description = $('#description').val();
    if (!description || description.trim() === '') {
        Swal.fire('Error', 'Description is required', 'error');
        return false;
    }

    const department = $('#department').val();
    if (!department) {
        Swal.fire('Error', 'Please select a department', 'error');
        return false;
    }

    return true;
}

function loadDepartmentsDropdown(selectId, selectedId = null) {
    const baseUrl = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    const userType = sessionStorage.getItem('userType') || '6';

    $.ajax({
        url: `${baseUrl}masterfile.php?action=departments`,
        type: 'GET',
        headers: {
            'X-User-Type': userType
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
        error: function(xhr, status, error) {
            $(`#${selectId}`).html('<option value="">Error loading departments</option>');
        }
    });
}
