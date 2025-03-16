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
                const baseURL = sessionStorage.getItem("baseURL");
                sessionStorage.clear();
                sessionStorage.setItem("baseURL", baseURL);

                const sessionData = {
                    user_id: result.user_id,
                    user_schoolId: result.user_schoolId,
                    user_firstname: result.user_firstname,
                    user_middlename: result.user_middlename,
                    user_lastname: result.user_lastname,
                    user_suffix: result.user_suffix,
                    department_name: result.department_name,
                    user_departmentId: result.user_departmentId,
                    course_name: result.course_name,
                    user_schoolyearId: result.user_schoolyearId,
                    phinmaed_email: result.phinmaed_email,
                    user_contact: result.user_contact,
                    user_typeId: result.user_typeId,
                    user_email: result.user_email
                };


                Object.entries(sessionData).forEach(([key, value]) => {
                    sessionStorage.setItem(key, value);
                });


                sessionStorage.setItem("user", JSON.stringify(result));


                sessionStorage.setItem("isPOC", result.user_typeId === 5 ? "true" : "false");
                sessionStorage.setItem("isAdmin", result.user_typeId === 6 ? "true" : "false");

                const userTypeId = parseInt(result.user_typeId);


                if (
                    password === "phinma-coc" &&
                    (userTypeId === 1 ||
                        userTypeId === 2 ||
                        userTypeId === 3 ||
                        userTypeId === 4)
                ) {
                    toastr.warning("Please change your default password.");
                    setTimeout(() => {
                        window.location.href = "/change-password.html";
                    }, 2000);
                    return;
                }


                if (userTypeId === 5 || userTypeId === 6) {
                    toastr.success("Login successful!");
                    setTimeout(() => {
                        window.location.href = "dashboard/dashboard.html";
                    }, 2000);
                    return;
                }


                toastr.success("Login successful!");
                setTimeout(() => {
                    window.location.href = "/choose-concern.html";
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

    const togglePassword = document.getElementById("toggle-password");
    togglePassword.addEventListener("click", function () {
        const passwordField = document.getElementById("password");
        const type = passwordField.type === "password" ? "text" : "password";
        passwordField.type = type;
        this.classList.toggle("fa-eye");
        this.classList.toggle("fa-eye-slash");
    });

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
