// If not set elsewhere, you can set your baseURL here
sessionStorage.setItem("baseURL", "http://localhost/api/");
// sessionStorage.setItem("baseURL", "http://192.168.137.190/api/");

const now = new Date();
const options = { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: 'Asia/Manila' };
const formattedTime = now.toLocaleTimeString('en-US', options);


document.addEventListener('DOMContentLoaded', async () => {

    const selectedPostType = sessionStorage.getItem('selectedPostType') || 'inquiry';

    document.getElementById('selectedPostType').value = selectedPostType;
    const concernTypeLabel = document.getElementById('concernTypeLabel');
    concernTypeLabel.value = capitalizeFirstLetter(selectedPostType);

    const inquirySelect = document.getElementById('inquiryType');
    try {
        const response = await axios.get(
            `${sessionStorage.getItem('baseURL')}inquiry.php?action=get_inquiry_types`,
            {
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                }
            }
        );
        if (response.data && response.data.success) {
            const types = response.data.types; // an array of {inquiry_id, inquiry_type, description}
            types.forEach(type => {
                // Create an <option> with the string inquiry_type as the value
                // so it matches the "post_type" your inquiry.php code looks up
                const option = document.createElement('option');
                option.value = type.inquiry_type;
                // Display "ENROLLMENT (Enrollment Process...)" etc.
                option.textContent = `${type.inquiry_type} (${type.description})`;
                inquirySelect.appendChild(option);
            });
        } else {
            console.error('Failed to retrieve inquiry types:', response.data);
        }
    } catch (error) {
        console.error('Error loading inquiry types:', error);
        Swal.fire('Error', 'Failed to load inquiry options: ' + error.message, 'error');
    }

    // 4. Handle form submission
    document.getElementById('concernForm').addEventListener('submit', async (e) => {
        e.preventDefault();

        const postTitle = document.getElementById('postTitle').value.trim();
        const postMessage = document.getElementById('postMessage').value.trim();
        const chosenPostType = document.getElementById('inquiryType').value || '';

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
