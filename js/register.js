document.addEventListener("DOMContentLoaded", function () {
    const registerForm = document.getElementById("register-form");

    if (!registerForm) {
        toastr.error("Error: Registration form not found!", "Error");
        console.error("Error: The form element with ID 'register-form' was not found.");
        return;
    }

    registerForm.addEventListener("submit", async function (event) {
        event.preventDefault(); // Prevent page reload

        // Get form inputs safely
        const firstName = document.getElementById("first_name").value.trim();
        const middleName = document.getElementById("middle_name").value.trim();
        const lastName = document.getElementById("family_name").value.trim();
        const suffix = document.getElementById("suffix").value.trim();
        const email = document.getElementById("user_email").value.trim();
        const contactNumber = document.getElementById("user_contact").value.trim();
        const password = document.getElementById("password").value.trim();
        const confirmPassword = document.getElementById("confirm_password").value.trim();
        const agreeTerms = document.getElementById("terms").checked;

        if (!agreeTerms) {
            toastr.warning("You must agree to the Terms and Conditions.", "Warning");
            return;
        }

        if (password !== confirmPassword) {
            toastr.error("Passwords do not match.", "Validation Error");
            return;
        }

        if (!firstName || !lastName || !email || !contactNumber || !password) {
            toastr.error("All required fields must be filled.", "Validation Error");
            return;
        }

        const userData = {
            first_name: firstName,
            middle_name: middleName,
            family_name: lastName,
            suffix: suffix,
            user_email: email,
            user_contact: contactNumber,
            user_password: password,
        };

        try {
            const baseURL = sessionStorage.getItem("baseURL");
            const response = await axios.post(`${baseURL}?action=register`, userData);

            console.log("API Response:", response.data); // Debugging output

            if (response.data.status === "success") {
                toastr.success(response.data.message, "Registration Successful");
                setTimeout(() => {
                    window.location.href = "index.html"; // Redirect after success
                }, 2000);
            } else {
                toastr.error(response.data.message, "Registration Failed");
            }
        } catch (error) {
            console.error("Error:", error);
            toastr.error("An error occurred. Please try again.", "Error");
        }
    });

    // Toggle Password Visibility
    const togglePassword = document.getElementById("toggle-password");
    const toggleConfirmPassword = document.getElementById("toggle-confirm-password");

    if (togglePassword && toggleConfirmPassword) {
        togglePassword.addEventListener("click", function () {
            toggleVisibility("password", this);
        });

        toggleConfirmPassword.addEventListener("click", function () {
            toggleVisibility("confirm_password", this);
        });
    } else {
        console.error("Error: Toggle password elements not found.");
    }

    function toggleVisibility(fieldId, icon) {
        const field = document.getElementById(fieldId);
        field.type = field.type === "password" ? "text" : "password";
        icon.classList.toggle("fa-eye");
        icon.classList.toggle("fa-eye-slash");
    }
});
