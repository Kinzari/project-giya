$(document).ready(function() {
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';
    const userType = sessionStorage.getItem('user_typeId');
    let faqTable;

    // Initialize DataTable
    function initFaqTable() {
        const columns = [
            { data: 'faq_id' },
            {
                data: 'question',
                render: function(data) {
                    return data.length > 100 ? data.substring(0, 100) + '...' : data;
                }
            },
            { data: 'display_order' },
            {
                data: 'is_active',
                render: function(data) {
                    return MasterTable.renderStatusBadge(data);
                }
            },
            {
                data: 'faq_id',
                render: function(data) {
                    return MasterTable.renderActionButtons(data, {
                        edit: true,
                        delete: true,
                        view: true
                    });
                }
            }
        ];

        faqTable = MasterTable.initTable('#faqTable', columns, {
            ajax: {
                url: `${baseURL}faq.php?action=get_all_admin`,
                dataSrc: function(response) {
                    if (!response || !response.success) {
                        console.error('Error loading FAQs:', response?.message || 'Unknown error');
                        return [];
                    }
                    return response.data || [];
                },
                beforeSend: function(xhr) {
                    xhr.setRequestHeader('X-User-Type', userType || '6');
                }
            }
        });

        // Handle FAQ actions
        $('#faqTable').on('click', '.edit-btn', function() {
            const faqId = $(this).data('id');
            editFaq(faqId);
        });

        $('#faqTable').on('click', '.delete-btn', function() {
            const faqId = $(this).data('id');
            deleteFaq(faqId);
        });

        $('#faqTable').on('click', '.view-btn', function() {
            const faqId = $(this).data('id');
            viewFaq(faqId);
        });
    }

    // Add FAQ Click Handler
    $('#addFaqBtn').on('click', function() {
        // Reset form
        $('#faqForm')[0].reset();
        $('#faqId').val('');
        $('#formMode').val('add');

        // Set modal title
        $('#faqModalLabel').text('Add New FAQ');

        // Show modal
        $('#faqModal').modal('show');
    });

    // Save FAQ Button Click Handler
    $('#saveFaqBtn').on('click', function() {
        if (!validateFaqForm()) {
            return;
        }

        const faqData = {
            mode: $('#formMode').val(),
            id: $('#faqId').val(),
            question: $('#question').val(),
            answer: $('#answer').val(),
            displayOrder: $('#displayOrder').val(),
            isActive: $('#isActive').is(':checked') ? 1 : 0
        };

        saveFaq(faqData);
    });

    // Validate FAQ form
    function validateFaqForm() {
        const form = document.getElementById('faqForm');
        if (!form.checkValidity()) {
            form.reportValidity();
            return false;
        }
        return true;
    }

    // View FAQ
    function viewFaq(faqId) {
        $.ajax({
            url: `${baseURL}faq.php?action=get_faq&id=${faqId}`,
            type: 'GET',
            headers: {
                'X-User-Type': userType || '6'
            },
            success: function(response) {
                if (response.success && response.data) {
                    const faq = response.data;

                    Swal.fire({
                        title: faq.question,
                        html: `<div class="text-start">${faq.answer}</div>`,
                        confirmButtonText: 'Close',
                        width: '50em'
                    });
                } else {
                    Swal.fire('Error', response.message || 'Failed to load FAQ details', 'error');
                }
            },
            error: handleAjaxError
        });
    }

    // Edit FAQ
    function editFaq(faqId) {
        $.ajax({
            url: `${baseURL}faq.php?action=get_faq&id=${faqId}`,
            type: 'GET',
            headers: {
                'X-User-Type': userType || '6'
            },
            success: function(response) {
                if (response.success && response.data) {
                    const faq = response.data;

                    // Populate form
                    $('#faqId').val(faq.faq_id);
                    $('#question').val(faq.question);
                    $('#answer').val(faq.answer);
                    $('#displayOrder').val(faq.display_order);
                    $('#isActive').prop('checked', faq.is_active == 1);

                    // Set form mode
                    $('#formMode').val('edit');

                    // Update modal title
                    $('#faqModalLabel').text('Edit FAQ');

                    // Show modal
                    $('#faqModal').modal('show');
                } else {
                    Swal.fire('Error', response.message || 'Failed to load FAQ details', 'error');
                }
            },
            error: handleAjaxError
        });
    }

    // Save FAQ
    function saveFaq(data) {
        $.ajax({
            url: `${baseURL}faq.php?action=submit_faq`,
            type: 'POST',
            data: data,
            headers: {
                'X-User-Type': userType || '6'
            },
            success: function(response) {
                if (response.success) {
                    Swal.fire({
                        icon: 'success',
                        title: 'Success',
                        text: response.message,
                        timer: 1500,
                        showConfirmButton: false
                    }).then(() => {
                        $('#faqModal').modal('hide');
                        faqTable.ajax.reload();
                    });
                } else {
                    Swal.fire('Error', response.message || 'Failed to save FAQ', 'error');
                }
            },
            error: handleAjaxError
        });
    }

    // Delete FAQ
    function deleteFaq(faqId) {
        Swal.fire({
            title: 'Are you sure?',
            text: "This will delete this FAQ. This action cannot be undone!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Yes, delete it!'
        }).then((result) => {
            if (result.isConfirmed) {
                $.ajax({
                    url: `${baseURL}faq.php?action=delete_faq`,
                    type: 'POST',
                    data: { id: faqId },
                    headers: {
                        'X-User-Type': userType || '6'
                    },
                    success: function(response) {
                        if (response.success) {
                            Swal.fire({
                                icon: 'success',
                                title: 'Success',
                                text: 'FAQ deleted successfully',
                                timer: 1500,
                                showConfirmButton: false
                            });
                            faqTable.ajax.reload();
                        } else {
                            Swal.fire('Error', response.message || 'Failed to delete FAQ', 'error');
                        }
                    },
                    error: handleAjaxError
                });
            }
        });
    }

    // Handle AJAX errors
    function handleAjaxError(xhr, status, error) {
        console.error('AJAX Error:', status, error);
        Swal.fire('Error', 'An error occurred while communicating with the server', 'error');
    }

    // Initialize the FAQ table
    initFaqTable();
});
