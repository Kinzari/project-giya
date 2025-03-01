document.addEventListener('DOMContentLoaded', function() {
    // Load the navbar component
    const navbarPlaceholder = document.getElementById('navbar-placeholder');
    if (navbarPlaceholder) {
        fetch('components/navbar.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load navbar component');
                }
                return response.text();
            })
            .then(data => {
                navbarPlaceholder.innerHTML = data;

                // Call setupSidebarToggle after a slight delay to ensure DOM is ready
                setTimeout(setupSidebarToggle, 100);
            })
            .catch(error => {
                console.error('Error loading navbar:', error);
                // Fallback - create a basic navbar if loading fails
                createBasicNavbar(navbarPlaceholder);
            });
    }

    // Load the sidebar component
    const sidebarPlaceholder = document.getElementById('sidebar-placeholder');
    if (sidebarPlaceholder) {
        fetch('components/sidebar.html')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load sidebar component');
                }
                return response.text();
            })
            .then(data => {
                sidebarPlaceholder.innerHTML = data;

                // Set active menu item based on current page
                highlightActiveMenuItem();

                // Add logout functionality
                const logoutButton = document.getElementById('logout-button');
                if (logoutButton) {
                    logoutButton.addEventListener('click', function() {
                        handleLogout();
                    });
                }

                // Update user information in sidebar
                updateUserInfo();
            })
            .catch(error => {
                console.error('Error loading sidebar:', error);
                // Fallback - create a basic sidebar if loading fails
                createBasicSidebar(sidebarPlaceholder);
            });
    }
});

// Helper function to highlight the active menu item
function highlightActiveMenuItem() {
    const currentPage = window.location.pathname.split('/').pop() || 'admin-dashboard.html';
    const navLinks = document.querySelectorAll('.nav-items a.nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && (href === currentPage ||
            (currentPage === 'admin-dashboard.html' && href.includes('admin-dashboard.html')))) {
            link.classList.add('active');
            link.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            link.style.borderRadius = '5px';
        }
    });
}

// Helper function to update user information
function updateUserInfo() {
    const userName = document.querySelector('.user-name');
    const userTitle = document.querySelector('.user-title'); // Add reference to user title element

    if (userName) {
        const firstName = sessionStorage.getItem('user_firstname');
        const lastName = sessionStorage.getItem('user_lastname');
        const userTypeId = sessionStorage.getItem('user_typeId');

        if (firstName && lastName) {
            userName.textContent = `${firstName} ${lastName}`;
        }

        // Update user title based on user type
        if (userTitle) {
            if (userTypeId === '3') {
                userTitle.textContent = 'Administrator';
            } else if (userTypeId === '4') {
                userTitle.textContent = 'Point of Contact';
            } else {
                userTitle.textContent = 'GIYA User';
            }
        }
    }
}

// Handle logout with confirmation
function handleLogout() {
    Swal.fire({
        title: 'Logout',
        text: 'Are you sure you want to logout?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#155f37',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, logout'
    }).then((result) => {
        if (result.isConfirmed) {
            sessionStorage.clear();
            window.location.href = 'index.html';
        }
    });
}

// Create basic navbar as fallback
function createBasicNavbar(container) {
    container.innerHTML = `
        <nav class="navbar navbar-expand-lg navbar-light bg-light shadow-sm">
            <div class="container-fluid">
                <button class="navbar-toggler sidebar-toggle" type="button">
                    <i class="bi bi-list"></i>
                </button>
                <a class="navbar-brand" href="admin-dashboard.html">
                    <img src="img/logo/cocicon.png" width="30" height="30" class="d-inline-block align-top me-2">
                    GIYA Admin
                </a>
            </div>
        </nav>
    `;

    // Attach click handler for the sidebar toggle
    const sidebarToggle = container.querySelector('.sidebar-toggle');
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            const sidebar = document.getElementById('sideSheet');
            if (sidebar) {
                const bsOffcanvas = new bootstrap.Offcanvas(sidebar);
                bsOffcanvas.toggle();
            }
        });
    }
}

// Create basic sidebar as fallback
function createBasicSidebar(container) {
    container.innerHTML = `
        <div class="offcanvas offcanvas-start bg-purple text-white" tabindex="-1" id="sideSheet">
            <div class="offcanvas-header">
                <h5 class="offcanvas-title text-white">GIYA Admin</h5>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="offcanvas"></button>
            </div>
            <div class="offcanvas-body">
                <div class="d-flex flex-column h-100">
                    <div class="nav-items">
                        <a href="admin-dashboard.html" class="nav-link text-white mb-2">
                            <i class="bi bi-house-door me-2"></i> Dashboard
                        </a>
                        <a href="latest-post.html" class="nav-link text-white mb-2">
                            <i class="bi bi-clock-history me-2"></i> Latest Posts
                        </a>
                        <a href="students.html" class="nav-link text-white mb-2">
                            <i class="bi bi-mortarboard me-2"></i> Student Posts
                        </a>
                        <a href="visitors.html" class="nav-link text-white mb-2">
                            <i class="bi bi-person-badge me-2"></i> Visitor Posts
                        </a>
                    </div>
                    <div class="mt-auto pt-3 border-top">
                        <button id="logout-button" class="btn btn-outline-light w-100">
                            <i class="bi bi-box-arrow-right me-2"></i>Logout
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;

    // Add logout functionality
    const logoutButton = container.querySelector('#logout-button');
    if (logoutButton) {
        logoutButton.addEventListener('click', handleLogout);
    }

    // Set active menu item
    highlightActiveMenuItem();
}

// Update the setupSidebarToggle function to enable closing by clicking outside
function setupSidebarToggle() {
    // Wait for DOM to be fully loaded
    setTimeout(() => {
        const sidebarToggle = document.querySelector('.sidebar-toggle');
        if (sidebarToggle) {
            // Remove any existing listeners to avoid duplicates
            const newSidebarToggle = sidebarToggle.cloneNode(true);
            sidebarToggle.parentNode.replaceChild(newSidebarToggle, sidebarToggle);

            newSidebarToggle.addEventListener('click', function(e) {
                // Prevent default behavior and event bubbling
                e.preventDefault();
                e.stopPropagation();

                const sidebar = document.getElementById('sideSheet');
                if (sidebar) {
                    // Remove data-bs-backdrop="static" to allow closing when clicking outside
                    sidebar.removeAttribute('data-bs-backdrop');

                    const bsOffcanvas = bootstrap.Offcanvas.getOrCreateInstance(sidebar);
                    bsOffcanvas.toggle();

                    // Clean up backdrop when sidebar is hidden
                    sidebar.addEventListener('hidden.bs.offcanvas', function() {
                        const backdrops = document.querySelectorAll('.offcanvas-backdrop');
                        backdrops.forEach(el => el.remove());
                        document.body.classList.remove('overflow-hidden');
                        document.body.style.paddingRight = '';
                    }, { once: true });
                }
            });
        }
    }, 200);
}
