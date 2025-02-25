// Make sure you set this once at the start, e.g. in a global script or top of choose-concern.js:
sessionStorage.setItem("baseURL", "http://localhost/api/");

document.addEventListener('DOMContentLoaded', () => {
    const auth = AuthHelper.checkAuth();
    if (!auth.isValid) {
        window.location.href = 'index.html';
        return;
    }

    // Display user's name
    document.getElementById('userFirstName').textContent = auth.firstName;

    // Initialize Bootstrap dropdowns
    document.querySelectorAll('.dropdown-toggle').forEach(dropdown => {
        new bootstrap.Dropdown(dropdown);
    });

    // Privacy Modal
    const privacyModalElement = document.getElementById('privacyModal');
    const privacyModal = new bootstrap.Modal(privacyModalElement);
    const privacyContent = document.getElementById('privacyContent');
    const acceptBtn = document.getElementById('acceptPrivacyBtn');

    privacyContent.addEventListener('scroll', () => {
        const isAtBottom = Math.abs(
            privacyContent.scrollHeight - privacyContent.scrollTop - privacyContent.clientHeight
        ) < 2;
        if (isAtBottom) {
            acceptBtn.removeAttribute('disabled');
            acceptBtn.classList.add('btn-pulse');
        }
    });

    privacyModalElement.addEventListener('show.bs.modal', () => {
        acceptBtn.setAttribute('disabled', 'disabled');
        acceptBtn.classList.remove('btn-pulse');
        privacyContent.scrollTop = 0;
    });

    document.getElementById('acceptPrivacyBtn').addEventListener('click', async () => {
        const pendingUrl = sessionStorage.getItem('pendingRedirect');
        if (pendingUrl) {
            try {
                const userId = sessionStorage.getItem('user_id');
                console.log("User ID from sessionStorage:", userId);
                await axios.post(
                    `${sessionStorage.getItem('baseURL')}inquiry.php?action=update_privacy_policy`,
                    {
                        user_id: userId,
                        privacy_policy_check: 1
                    }
                );
                sessionStorage.setItem('privacyPolicyAccepted', 'true');
                Swal.fire({
                    icon: 'success',
                    title: 'Privacy Policy Accepted',
                    text: 'Redirecting...',
                    timer: 1500,
                    showConfirmButton: false
                });
                sessionStorage.removeItem('pendingRedirect');
                setTimeout(() => {
                    window.location.href = pendingUrl;
                }, 1500);
            } catch (error) {
                console.error('Failed to update privacy policy flag:', error);
            }
        }
    });


    // Concern Buttons
    document.querySelectorAll('.concern-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const type = btn.dataset.type; // inquiry, feedback, or suggestion
            sessionStorage.setItem('selectedPostType', type);

            const targetUrl = 'form.html';
            sessionStorage.setItem('pendingRedirect', targetUrl);

            if (sessionStorage.getItem('privacyPolicyAccepted') === 'true') {
                window.location.href = targetUrl;
            } else {
                privacyModal.show();
            }
        });
    });

    // Logout
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
                sessionStorage.clear();
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 2000);
            }
        });
    });
});
