function showPrivacyModal(onAccept) {
    const modalHTML = `
    <div class="modal fade" id="privacyModal" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-lg modal-dialog-scrollable">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title">DATA PRIVACY CLAUSE</h5>
                </div>
                <div class="modal-body" style="max-height: 60vh; overflow-y: auto;">
                    <!-- Insert your privacy policy content here -->
                    ${document.getElementById('privacyPolicyModal').querySelector('.modal-body').innerHTML}
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Decline</button>
                    <button type="button" class="btn btn-primary" id="acceptPrivacy" disabled>Accept</button>
                </div>
            </div>
        </div>
    </div>`;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    const modal = new bootstrap.Modal(document.getElementById('privacyModal'));

    const modalBody = document.querySelector('#privacyModal .modal-body');
    const acceptBtn = document.getElementById('acceptPrivacy');

    modalBody.addEventListener('scroll', () => {
        if (modalBody.scrollHeight - modalBody.scrollTop <= modalBody.clientHeight + 1) {
            acceptBtn.disabled = false;
        }
    });

    acceptBtn.addEventListener('click', () => {
        modal.hide();
        if (onAccept) onAccept();
    });

    modal.show();
}

// Check submenu clicks - update the event listener
document.addEventListener('DOMContentLoaded', () => {
    const subMenuLinks = document.querySelectorAll('.sub-menu a, .dropdown-menu a');
    subMenuLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const userTypeId = localStorage.getItem('user_typeId');
            if (!userTypeId) {
                window.location.href = 'index.html#login-area';
                toastr.warning('Please login first to access this feature.');
                return;
            }
            // Instead of showing modal directly, redirect to concern page
            window.location.href = 'choose-concern.html';
        });
    });
});

// Remove the showConcernModal function from here as it will be moved to choose-concern.js
