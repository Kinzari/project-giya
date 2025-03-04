(function() {
    // This script should be included at the top of all master files pages
    function checkAccess() {
        try {
            const userString = sessionStorage.getItem('user');
            if (!userString) {
                window.location.href = 'index.html';
                return;
            }

            const user = JSON.parse(userString);
            // If not admin (type 6), redirect to dashboard
            if (user.user_typeId != 6) {
                Swal.fire({
                    icon: 'error',
                    title: 'Access Denied',
                    text: 'You do not have permission to access this page',
                    confirmButtonColor: '#155f37',
                }).then(() => {
                    window.location.href = 'admin-dashboard.html';
                });
            }

            // Also verify with server
            const baseURL = sessionStorage.getItem("baseURL");
            if (baseURL) {
                axios.get(`${baseURL}check_access.php`, {
                    headers: { 'X-User-Type': user.user_typeId }
                }).then(response => {
                    if (!response.data.hasAccess) {
                        window.location.href = 'admin-dashboard.html';
                    }
                }).catch(() => {
                    // On error, fall back to client-side check
                });
            }
        } catch (e) {
            console.error('Error checking access:', e);
            window.location.href = 'index.html';
        }
    }

    // Run access check immediately
    checkAccess();
})();
