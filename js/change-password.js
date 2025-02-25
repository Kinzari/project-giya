// Toggle password visibility
document.querySelectorAll('.toggle-password').forEach(icon => {
    icon.addEventListener('click', function() {
        const targetId = this.getAttribute('data-target');
        const input = document.getElementById(targetId);

        if (input.type === 'password') {
            input.type = 'text';
            this.classList.remove('fa-eye-slash');
            this.classList.add('fa-eye');
        } else {
            input.type = 'password';
            this.classList.remove('fa-eye');
            this.classList.add('fa-eye-slash');
        }
    });
});

// Add password requirement checker
function updatePasswordRequirements(password) {
    const requirements = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        lowercase: /[a-z]/.test(password),
        number: /\d/.test(password)
    };

    // Update requirement list items with check/x marks
    document.querySelectorAll('.password-requirement').forEach(item => {
        const requirementType = item.getAttribute('data-requirement');
        const icon = item.querySelector('i');

        if (requirements[requirementType]) {
            icon.className = 'fas fa-check text-success';
            item.classList.add('text-success');
            item.classList.remove('text-danger');
        } else {
            icon.className = 'fas fa-times text-danger';
            item.classList.add('text-danger');
            item.classList.remove('text-success');
        }
    });

    return Object.values(requirements).every(Boolean);
}

// Add input event listener for password field
document.getElementById('newPassword').addEventListener('input', function() {
    updatePasswordRequirements(this.value);
});

document.getElementById('change-password-form').addEventListener('submit', async function(e) {
    e.preventDefault();

    const newPassword = document.getElementById('newPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        Swal.fire({
            icon: 'error',
            title: 'Invalid Password',
            text: 'Password does not meet the requirements'
        });
        return;
    }

    if (newPassword !== confirmPassword) {
        Swal.fire({
            icon: 'error',
            title: 'Password Mismatch',
            text: 'Passwords do not match'
        });
        return;
    }

    try {
        const userId = localStorage.getItem('user_id');

        // Show loading state
        Swal.fire({
            title: 'Changing Password',
            text: 'Please wait...',
            allowOutsideClick: false,
            showConfirmButton: false,
            willOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await axios.post(
            `${sessionStorage.getItem("baseURL")}?action=change_password`,
            {
                user_id: userId,
                new_password: newPassword
            }
        );

        if (response.data.success) {
            await Swal.fire({
                icon: 'success',
                title: 'Success!',
                text: 'Password changed successfully',
                timer: 2000,
                showConfirmButton: false
            });
            window.location.href = 'index.html';
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: response.data.message || 'Failed to change password'
            });
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'An error occurred. Please try again.'
        });
    }
});

// Check if user is authorized to access this page
document.addEventListener('DOMContentLoaded', function() {
    const userId = localStorage.getItem('user_id');
    const userTypeId = localStorage.getItem('user_typeId');

    if (!userId || ![1, 2].includes(parseInt(userTypeId))) {
        window.location.href = 'index.html';
    }
});
