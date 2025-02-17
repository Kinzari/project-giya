document.addEventListener('DOMContentLoaded', () => {
    const auth = AuthHelper.checkAuth();

    if (!auth.isValid) {
        window.location.href = 'index.html';
        return;
    }

    // Display user's name
    document.getElementById('userFirstName').textContent = auth.firstName;



    // Initialize Bootstrap dropdowns
    const dropdowns = document.querySelectorAll('.dropdown-toggle');
    dropdowns.forEach(dropdown => {
        new bootstrap.Dropdown(dropdown);
    });

    let selectedFormUrl = '';
    const privacyModal = new bootstrap.Modal(document.getElementById('privacyModal'));
    const privacyContent = document.getElementById('privacyContent');
    const acceptBtn = document.getElementById('acceptPrivacyBtn');

    // Improved scroll detection
    privacyContent.addEventListener('scroll', () => {
        const isAtBottom = Math.abs(
            privacyContent.scrollHeight -
            privacyContent.scrollTop -
            privacyContent.clientHeight
        ) < 2; // Added tolerance for floating point

        if (isAtBottom) {
            acceptBtn.removeAttribute('disabled');
            // Optional: Add visual feedback
            acceptBtn.classList.add('btn-pulse');
        }
    });

    // Reset scroll state when modal opens
    document.getElementById('privacyModal').addEventListener('show.bs.modal', () => {
        acceptBtn.setAttribute('disabled', 'disabled');
        acceptBtn.classList.remove('btn-pulse');
        privacyContent.scrollTop = 0;
    });

    // Update privacy modal accept handler with toastr
    document.getElementById('acceptPrivacyBtn').addEventListener('click', () => {
        const pendingUrl = localStorage.getItem('pendingRedirect');
        if (pendingUrl) {
            const type = pendingUrl.split('-')[0]; // get the concern type from URL

            // Configure friendly messages
            const concernMessages = {
                'inquiry': 'Opening inquiry form...',
                'feedback': 'Opening feedback form...',
                'suggestion': 'Opening suggestion form...'
            };

            // Show toastr after accepting privacy policy
            toastr.success(concernMessages[type] || 'Redirecting...', 'Privacy Policy Accepted');

            // Remove stored URL and redirect
            localStorage.removeItem('pendingRedirect');
            setTimeout(() => {
                window.location.href = pendingUrl;
            }, 1500); // Give time for toastr to be visible
        }
    });

    // Simplified concern button handlers
    document.querySelectorAll('.concern-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type;
            const formType = AuthHelper.isVisitor() ? 'visitor' : 'student';
            const url = `${type}-${formType}.html`;

            // Store both the URL and the selected type
            localStorage.setItem('pendingRedirect', url);
            localStorage.setItem('selectedPostType', type);

            // Show privacy modal
            const privacyModal = new bootstrap.Modal(document.getElementById('privacyModal'));
            privacyModal.show();
        });
    });

    // Logout functionality
    document.getElementById('logoutBtn').addEventListener('click', function() {
        Swal.fire({
            title: 'Logout Confirmation',
            text: 'Are you sure you want to logout?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#155f37',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, logout'
        }).then((result) => {
            if (result.isConfirmed) {
                toastr.success('Logging out...');

                // Clear user data
                localStorage.clear(); // Clear all stored data

                // Redirect after delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        });
    });
});
