const now = new Date();
const options = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' };
const formattedTime = now.toLocaleTimeString('en-US', options);

document.addEventListener('DOMContentLoaded', async () => {
    // Validate that we have baseURL
    const baseURL = sessionStorage.getItem("baseURL");
    if (!baseURL) {
        window.location.href = 'index.html';
        return;
    }

    const selectedPostType = sessionStorage.getItem('selectedPostType') || 'inquiry';

    document.getElementById('selectedPostType').value = selectedPostType;
    const concernTypeLabel = document.getElementById('concernTypeLabel');
    const headerFormType = document.getElementById('headerFormType');

    // Capitalize the selected post type and update both the label and header
    const capitalizedType = capitalizeFirstLetter(selectedPostType);
    concernTypeLabel.value = capitalizedType;
    headerFormType.textContent = capitalizedType;

    const inquirySelect = document.getElementById('inquiryType');

    // Clear any existing options first (except the first one if it's a placeholder)
    while (inquirySelect.options.length > 1) {
        inquirySelect.remove(1);
    }

    try {
        // Show loading indicator
        inquirySelect.disabled = true;
        const placeholderOption = document.createElement('option');
        placeholderOption.textContent = 'Loading inquiry types...';
        placeholderOption.disabled = true;
        placeholderOption.selected = true;
        inquirySelect.appendChild(placeholderOption);

        const response = await axios.get(
            `${baseURL}inquiry.php?action=get_inquiry_types`,
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );

        // Remove loading placeholder and clear any existing options
        inquirySelect.innerHTML = '';
        inquirySelect.disabled = false;

        if (response.data && response.data.success && Array.isArray(response.data.types)) {
            const types = response.data.types;

            // Track unique inquiry types to prevent duplicates
            const uniqueTypes = new Map();

            // Process the types and keep only unique ones
            types.forEach(type => {
                // Use inquiry_type as the key to prevent duplicates
                uniqueTypes.set(type.inquiry_type, type);
            });

            // Add default option
            const defaultOption = document.createElement('option');
            defaultOption.value = '';
            defaultOption.textContent = '-- Select Inquiry Type --';
            defaultOption.selected = true;
            inquirySelect.appendChild(defaultOption);

            // Add unique inquiry types sorted alphabetically
            Array.from(uniqueTypes.values())
                .sort((a, b) => a.inquiry_type.localeCompare(b.inquiry_type))
                .forEach(type => {
                    const option = document.createElement('option');
                    option.value = type.inquiry_type;
                    option.textContent = `${type.inquiry_type} (${type.description})`;
                    inquirySelect.appendChild(option);
                });
        } else {
            throw new Error('Invalid response format from server');
        }
    } catch (error) {
        console.error('Error loading inquiry types:', error);

        // Enable select and show error message
        inquirySelect.disabled = false;

        // Add a default option indicating error
        const errorOption = document.createElement('option');
        errorOption.value = '';
        errorOption.textContent = 'Error loading inquiry types';
        errorOption.disabled = true;
        errorOption.selected = true;
        inquirySelect.appendChild(errorOption);

        // Add fallback options for critical inquiry types
        const fallbackTypes = [
            {value: 'ENROLLMENT', label: 'ENROLLMENT (Enrollment Process, ORF, SIS)'},
            {value: 'ACADEMICS', label: 'ACADEMICS (Grades, Teachers, Dean)'},
            {value: 'FINANCE', label: 'FINANCE (Balance, Assessment)'},
            {value: 'OTHERS', label: 'OTHERS (Other inquiries)'}
        ];

        fallbackTypes.forEach(type => {
            const option = document.createElement('option');
            option.value = type.value;
            option.textContent = type.label;
            inquirySelect.appendChild(option);
        });

        // Show error notification
        toastr.error('Failed to load inquiry types. Using fallback options.', 'Network Error', {
            timeOut: 5000,
            closeButton: true
        });
    }

    // Add back button handler
    document.getElementById('backBtn').addEventListener('click', () => {
        Swal.fire({
            title: 'Are you sure?',
            text: "Any unsaved changes will be lost!",
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#155f37',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, go back',
            cancelButtonText: 'Cancel'
        }).then((result) => {
            if (result.isConfirmed) {
                window.location.href = 'choose-concern.html';
            }
        });
    });

    // 4. Handle form submission
    document.getElementById('concernForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const postTitle = document.getElementById('postTitle').value.trim();
        const postMessage = document.getElementById('postMessage').value.trim();
        const chosenPostType = document.getElementById('inquiryType').value || '';

        // Get the post type ID from the selected post type in the form
        // This matches with the value in tbl_giya_posttype
        let postTypeId = 1; // Default to 1 (Inquiry)
        const selectedPostType = sessionStorage.getItem('selectedPostType') || 'inquiry';

        // Map the post type to ID
        if (selectedPostType === 'feedback') {
            postTypeId = 2;
        } else if (selectedPostType === 'suggestion') {
            postTypeId = 3;
        }

        if (!postTitle || !postMessage) {
            Swal.fire('Error!', 'Please fill in all required fields.', 'error');
            return;
        }

        Swal.fire({
            title: 'Confirm Submission',
            text: 'Are you sure you want to submit your concern?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Yes, submit it',
            confirmButtonColor: '#155f37',
            cancelButtonColor: '#d33',
            cancelButtonText: 'Cancel'
        }).then(async (result) => {
            if (result.isConfirmed) {
                const formData = {
                    user_id: sessionStorage.getItem('user_id'),
                    post_type: chosenPostType,
                    post_type_id: postTypeId,  // Add the post type ID
                    post_title: postTitle,
                    post_message: postMessage,
                    submit_time: formattedTime
                };

                try {
                    const response = await axios.post(
                        `${sessionStorage.getItem('baseURL')}inquiry.php?action=submit_inquiry`,
                        formData
                    );
                    if (response.data.success) {
                        await Swal.fire('Success!', 'Your concern has been submitted.', 'success');
                        window.location.href = 'choose-concern.html';
                    } else {
                        throw new Error(response.data.message || 'Submission failed');
                    }
                } catch (error) {
                    Swal.fire('Error!', error.message || 'Submission error. Please try again.', 'error');
                }
            }
        });
    });
});

function capitalizeFirstLetter(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}
