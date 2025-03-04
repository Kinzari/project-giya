// Only keep baseURL initialization at the start
sessionStorage.setItem("baseURL", "http://localhost/api/");

document
    .getElementById("login-form")
    .addEventListener("submit", async function (event) {
        event.preventDefault();

        const loginInput = document.getElementById("login_input").value.trim();
        const password = document.getElementById("password").value.trim();
        const num1 = parseInt(document.getElementById("num1").textContent);
        const num2 = parseInt(document.getElementById("num2").textContent);
        const mathAnswer = parseInt(
            document.getElementById("math-answer").value.trim()
        );

        toastr.clear();

        if (!loginInput || !password || isNaN(mathAnswer)) {
            toastr.error("All fields are required.");
            return;
        }

        const mathAnswerInput = document.getElementById("math-answer");
        if (mathAnswer !== num1 + num2) {
            toastr.error("Incorrect math verification. Please try again.");
            mathAnswerInput.classList.add("incorrect");
            mathAnswerInput.classList.remove("correct");
            return;
        } else {
            mathAnswerInput.classList.add("correct");
            mathAnswerInput.classList.remove("incorrect");
        }

        try {
            const response = await axios.post(
                `${sessionStorage.getItem("baseURL")}giya.php?action=login`,
                {
                    loginInput: loginInput,
                    password: password,
                },
            );

            const result = response.data;

            if (result.success) {
                // Clear any existing session data except baseURL
                const baseURL = sessionStorage.getItem("baseURL");
                sessionStorage.clear();
                sessionStorage.setItem("baseURL", baseURL);

                // Store all user data at once during login
                const sessionData = {
                    user_id: result.user_id,
                    user_schoolId: result.user_schoolId,
                    user_firstname: result.user_firstname,
                    user_middlename: result.user_middlename,
                    user_lastname: result.user_lastname,
                    user_suffix: result.user_suffix,
                    department_name: result.department_name,
                    user_departmentId: result.user_departmentId, // Make sure department ID is stored
                    course_name: result.course_name,
                    user_schoolyearId: result.user_schoolyearId,
                    phinmaed_email: result.phinmaed_email,
                    user_contact: result.user_contact,
                    user_typeId: result.user_typeId,
                    user_email: result.user_email
                };

                // Set all session data at once
                Object.entries(sessionData).forEach(([key, value]) => {
                    sessionStorage.setItem(key, value);
                });

                // Store complete user data object
                sessionStorage.setItem("user", JSON.stringify(result));

                // Add specific flags for user types to use for permissions
                sessionStorage.setItem("isPOC", result.user_typeId === 5 ? "true" : "false");
                sessionStorage.setItem("isAdmin", result.user_typeId === 6 ? "true" : "false");

                const userTypeId = parseInt(result.user_typeId);

                // Check if password is default 'phinma-coc' and user is student/visitor
                if (
                    password === "phinma-coc" &&
                    (userTypeId === 1 ||
                        userTypeId === 2 ||
                        userTypeId === 3 ||
                        userTypeId === 4)
                ) {
                    toastr.warning("Please change your default password.");
                    setTimeout(() => {
                        window.location.href = "change-password.html";
                    }, 2000);
                    return;
                }

                // If user is admin or POC (userTypeId 5 or 6)
                if (userTypeId === 5 || userTypeId === 6) {
                    toastr.success("Login successful!");
                    setTimeout(() => {
                        window.location.href = "admin-dashboard.html";
                    }, 2000);
                    return;
                }

                // For Visitor (1), Student (2), Faculty (3), Staff (4)
                toastr.success("Login successful!");
                setTimeout(() => {
                    window.location.href = "choose-concern.html";
                }, 2000);

            } else {
                toastr.error(result.message || "Login failed.");
            }
        } catch (error) {
            console.error("Login error:", error);
            toastr.error("An error occurred during login. Please try again.");
        }
    });

document.addEventListener("DOMContentLoaded", () => {
    // Generate random numbers for the math verification
    const num1 = Math.floor(Math.random() * 50) + 10;
    const num2 = Math.floor(Math.random() * 9) + 1;
    document.getElementById("num1").textContent = num1;
    document.getElementById("num2").textContent = num2;

    // Add input validation for the math answer
    const mathAnswerInput = document.getElementById("math-answer");
    mathAnswerInput.addEventListener("input", () => {
        const mathAnswer = parseInt(mathAnswerInput.value.trim());
        if (mathAnswer === num1 + num2) {
            mathAnswerInput.classList.add("correct");
            mathAnswerInput.classList.remove("incorrect");
        } else {
            mathAnswerInput.classList.add("incorrect");
            mathAnswerInput.classList.remove("correct");
        }
    });

    // Password visibility toggle
    const togglePassword = document.getElementById("toggle-password");
    togglePassword.addEventListener("click", function () {
        const passwordField = document.getElementById("password");
        const type = passwordField.type === "password" ? "text" : "password";
        passwordField.type = type;
        this.classList.toggle("fa-eye");
        this.classList.toggle("fa-eye-slash");
    });

    // Caps Lock detection
    const passwordField = document.getElementById("password");
    const capsLockTooltip = document.getElementById("caps-lock-tooltip");
    passwordField.addEventListener("keyup", (event) => {
        if (event.getModifierState("CapsLock")) {
            capsLockTooltip.style.display = "block";
        } else {
            capsLockTooltip.style.display = "none";
        }
    });
});

// Add this function to ensure baseURL is set correctly

function handleLogin() {
    // Get form values
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Validate inputs
    if (!username || !password) {
        showError('Please enter both username and password.');
        return;
    }

    // Clear previous errors
    clearError();

    // Show loading indicator
    document.getElementById('loginBtn').disabled = true;
    document.getElementById('loginBtn').innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';

    // Set baseURL correctly based on your API location
    // This is the critical part that was likely missing
    const baseURL = 'http://localhost/giya-api/'; // Update this to match your actual API location
    sessionStorage.setItem('baseURL', baseURL);

    // Make POST request to login API
    $.ajax({
        url: baseURL + 'login.php',
        type: 'POST',
        data: {
            username: username,
            password: password,
            action: 'login'
        },
        success: function(response) {
            try {
                // Check if response is already an object or needs to be parsed
                const data = typeof response === 'object' ? response : JSON.parse(response);

                if (data.success) {
                    // Store user data and token in sessionStorage
                    sessionStorage.setItem('token', data.token);
                    sessionStorage.setItem('user', JSON.stringify(data.user));

                    // Important: Confirm baseURL is set
                    if (!sessionStorage.getItem('baseURL')) {
                        sessionStorage.setItem('baseURL', baseURL);
                        console.log("baseURL set to:", baseURL);
                    }

                    // Redirect based on user type
                    if (data.user.user_typeId == '6' || data.user.user_typeId == '5') {
                        // Admin or POC redirect
                        window.location.href = 'admin-dashboard.html';
                    } else {
                        // Regular user redirect
                        window.location.href = 'dashboard.html';
                    }
                } else {
                    // Display error message
                    showError(data.message || 'Login failed. Please try again.');
                }
            } catch (e) {
                console.error('Error parsing response:', e);
                showError('An unexpected error occurred. Please try again.');
            }
        },
        error: function(xhr, status, error) {
            // Handle network or server errors
            console.error('AJAX Error:', status, error);
            showError('Connection error. Please check your internet connection and try again.');
        },
        complete: function() {
            // Reset button
            document.getElementById('loginBtn').disabled = false;
            document.getElementById('loginBtn').innerHTML = 'Sign In';
        }
    });
}
