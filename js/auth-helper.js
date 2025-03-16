const AuthHelper = {
    isVisitor() {
        return sessionStorage.getItem('user_typeId') === '1';
    },
    isStudent() {
        return sessionStorage.getItem('user_typeId') === '2';
    },
    isPOC() {
        return sessionStorage.getItem('user_typeId') === '5';
    },
    isAdmin() {
        return sessionStorage.getItem('user_typeId') === '6';
    },
    checkAuth() {
        const userTypeId = sessionStorage.getItem('user_typeId');
        const firstName = sessionStorage.getItem('user_firstname');
        const id = sessionStorage.getItem('user_id');
        return {
            isValid: !!(userTypeId && firstName && id),
            userTypeId,
            firstName,
            id
        };
    }
};

/**
 * Check if current user has specific access rights
 * @param {Array} allowedTypes - Array of user_typeId values that have access
 * @returns {boolean} - Whether user has access
 */
function checkAccess(allowedTypes) {
    try {
        const userString = sessionStorage.getItem('user');
        if (!userString) return false;

        const user = JSON.parse(userString);
        return allowedTypes.includes(parseInt(user.user_typeId));
    } catch (e) {
        console.error('Error checking user access:', e);
        return false;
    }
}

/**
 * Restrict page access based on user type
 * @param {Array} allowedTypes - Array of user_typeId values that can access this page
 * @param {string} redirectUrl - URL to redirect if access denied
 */
function restrictAccess(allowedTypes, redirectUrl = '/index.html') {
    if (!checkAccess(allowedTypes)) {
        window.location.href = redirectUrl;
    }
}

/**
 * Apply UI restrictions based on user role
 */
function applyRoleBasedUI() {
    try {
        const userString = sessionStorage.getItem('user');
        if (!userString) return;

        const user = JSON.parse(userString);

        // Hide masterfiles for non-admin users (POC is type 5)
        if (user.user_typeId != 6) {
            // Try different selectors to find the masterfiles menu
            const selectors = [
                'a[data-menu="masterfiles"]',
                '#masterFilesDropdown',
                'a.nav-link.dropdown-toggle[role="button"]'
            ];

            let masterfilesMenu = null;
            for (const selector of selectors) {
                masterfilesMenu = document.querySelector(selector);
                if (masterfilesMenu) break;
            }

            if (masterfilesMenu) {
                masterfilesMenu.style.display = 'none';
            } else {
                // Retry after a delay to ensure the sidebar is loaded
                setTimeout(() => {
                    for (const selector of selectors) {
                        const retryMenu = document.querySelector(selector);
                        if (retryMenu) {
                            retryMenu.style.display = 'none';
                            break;
                        }
                    }
                }, 500);
            }
        }
    } catch (e) {
        console.error('Error applying role-based UI:', e);
    }
}

/**
 * Configure axios to include user type in all requests
 */
function setupAxiosInterceptors() {
    axios.interceptors.request.use(function (config) {
        try {
            const userString = sessionStorage.getItem('user');
            if (userString) {
                const user = JSON.parse(userString);
                // Add user type as header to all requests
                config.headers['X-User-Type'] = user.user_typeId;
            }
        } catch (e) {
            console.error('Error setting up axios interceptors:', e);
        }
        return config;
    }, function (error) {
        return Promise.reject(error);
    });

    // Add response interceptor to handle 403/401 errors
    axios.interceptors.response.use(function (response) {
        return response;
    }, function (error) {
        if (error.response) {
            if (error.response.status === 403) {
                // Access denied
                Swal.fire('Access Denied', 'You do not have permission to access this resource', 'error');
                // Could also redirect to dashboard here
            } else if (error.response.status === 401) {
                // Not authenticated
                Swal.fire('Authentication Required', 'Please log in to continue', 'warning')
                .then(() => {
                    sessionStorage.clear();
                    window.location.href = '/index.html';
                });
            }
        }
        return Promise.reject(error);
    });
}

// Helper function to get API base URL
function getApiBaseUrl() {
    return sessionStorage.getItem('baseURL') || window.location.origin + '/';
}

// Function to handle logout with confirmation
function handleLogout() {
    Swal.fire({
        title: 'Are you sure?',
        text: 'You will be logged out of the system',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#155f37',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, log out!'
    }).then((result) => {
        if (result.isConfirmed) {
            sessionStorage.clear();
            window.location.href = '/index.html';
        }
    });
}

// Initialize functions when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    // Setup axios interceptors
    setupAxiosInterceptors();

    // Apply UI restrictions after a delay to ensure sidebar is loaded
    setTimeout(applyRoleBasedUI, 500);

    // Observe DOM for sidebar loading
    const observer = new MutationObserver(function(mutations) {
        for (const mutation of mutations) {
            if (mutation.addedNodes.length > 0) {
                // Check if sidebar has been added to the DOM
                if (document.getElementById('sideSheet')) {
                    applyRoleBasedUI();
                    observer.disconnect();
                    break;
                }
            }
        }
    });

    // Observe the document body for changes
    observer.observe(document.body, { childList: true, subtree: true });
});
