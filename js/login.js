// sessionStorage.setItem("baseURL", "http://192.168.254.166/api/giya.php");
// Set baseURL in sessionStorage (this must be set before any API calls)
sessionStorage.setItem("baseURL", "http://localhost/api/");
// sessionStorage.setItem("baseURL", "http://192.168.137.190/api/");

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
                {
                    // headers: {
                    //     "Content-Type": "application/json",
                    //     Accept: "application/json",
                    // },
                    // withCredentials: true,
                }
            );

            const result = response.data;

            if (result.success) {
                const baseURL = sessionStorage.getItem("baseURL");
                sessionStorage.clear();
                sessionStorage.setItem("baseURL", baseURL);

                sessionStorage.setItem("user_id", result.user_id);
                sessionStorage.setItem("user_schoolId", result.user_schoolId);
                sessionStorage.setItem("user_firstname", result.user_firstname);
                sessionStorage.setItem(
                    "user_middlename",
                    result.user_middlename
                );
                sessionStorage.setItem("user_lastname", result.user_lastname);
                sessionStorage.setItem("user_suffix", result.user_suffix);
                sessionStorage.setItem(
                    "department_name",
                    result.department_name
                );
                sessionStorage.setItem("course_name", result.course_name);
                sessionStorage.setItem(
                    "user_schoolyearId",
                    result.user_schoolyearId
                );
                sessionStorage.setItem("phinmaed_email", result.phinmaed_email);
                sessionStorage.setItem("user_contact", result.user_contact);
                sessionStorage.setItem("user_typeId", result.user_typeId);
                sessionStorage.setItem("user_email", result.user_email);

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

                // If user is admin (userTypeId 5 or 6)
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
    // gen rng numbers
    const num1 = Math.floor(Math.random() * 50) + 10;
    const num2 = Math.floor(Math.random() * 9) + 1;
    document.getElementById("num1").textContent = num1;
    document.getElementById("num2").textContent = num2;


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

    // password toggle
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
