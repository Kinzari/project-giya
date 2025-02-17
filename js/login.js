sessionStorage.setItem("baseURL", "http://192.168.254.166/api/giya.php");
// sessionStorage.setItem("baseURL", "http://localhost/api/giya.php"); //uncomment lang ni pag mag localhost
document.getElementById("login-form").addEventListener("submit", async function (event) {
    event.preventDefault();

    const loginInput = document.getElementById("login_input").value.trim();
    const password = document.getElementById("password").value.trim();
    const num1 = parseInt(document.getElementById("num1").textContent);
    const num2 = parseInt(document.getElementById("num2").textContent);
    const mathAnswer = parseInt(document.getElementById("math-answer").value.trim());

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
            `${sessionStorage.getItem("baseURL")}?action=login`,
            {
                loginInput: loginInput,
                password: password,
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                withCredentials: true
            }
        );

        const result = response.data;

        if (result.success) {
            localStorage.clear();

            // e store niya tanan data sa localStorage
            localStorage.setItem('user_id', result.user_id);
            localStorage.setItem('user_schoolId', result.user_schoolId);
            localStorage.setItem('user_firstname', result.user_firstname);
            localStorage.setItem('user_middlename', result.user_middlename);
            localStorage.setItem('user_lastname', result.user_lastname);
            localStorage.setItem('user_suffix', result.user_suffix);
            localStorage.setItem('department_name', result.department_name);
            localStorage.setItem('course_name', result.course_name);
            localStorage.setItem('user_schoolyearId', result.user_schoolyearId);
            localStorage.setItem('phinmaed_email', result.phinmaed_email);
            localStorage.setItem('user_contact', result.user_contact);
            localStorage.setItem('user_typeId', result.user_typeId);
            localStorage.setItem('user_email', result.user_email);

            const userTypeId = parseInt(result.user_typeId);

            // Check if password is default 'phinma-coc' and user is student/visitor
            if (password === 'phinma-coc' && (userTypeId === 1 || userTypeId === 2)) {
                toastr.warning("Please change your default password.");
                setTimeout(() => {
                    window.location.href = "change-password.html";
                }, 2000);
                return;
            }

            // userTypeId 5 = POC, 6 = Admin
            if (userTypeId === 5 || userTypeId === 6) {
                toastr.success("Welcome Admin!");
                setTimeout(() => {
                    window.location.href = "admin-dashboard.html";
                }, 2000);
                return;
            }

            // userTypeId 1 = Visitor, 2 = Student, 3 = Faculty, 4 = Staff
            toastr.success("Login successful!");
            setTimeout(() => {
                window.location.href = "choose-concern.html";
            }, 2000);
        } else {
            toastr.error(result.message || "Login failed.");
        }
    } catch (error) {
        console.error('Login error:', error);
        toastr.error("An error occurred during login. Please try again.");
    }
});

// Initialize Math Verification (mura mag SIS)
document.addEventListener("DOMContentLoaded", () => {
    // rng numbers
    const num1 = Math.floor(Math.random() * 50) + 10;
    const num2 = Math.floor(Math.random() * 9) + 1;
    document.getElementById("num1").textContent = num1;
    document.getElementById("num2").textContent = num2;

    // math answer input handler
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

    // password visibility toggle
    const togglePassword = document.getElementById("toggle-password");
    togglePassword.addEventListener("click", function () {
        const passwordField = document.getElementById("password");
        const type = passwordField.type === "password" ? "text" : "password";
        passwordField.type = type;
        this.classList.toggle("fa-eye");
        this.classList.toggle("fa-eye-slash");
    });

    // Caps Lock detection (WOW!)
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
