// Set API base URL (Ensure it correctly points to the API folder)
// sessionStorage.setItem("baseURL", "http://localhost/api/giya.php");
// sessionStorage.setItem("baseURL", "https://coc-studentinfo.net/api/giya.php"); // COC
sessionStorage.setItem("baseURL", "http://192.168.254.166/api/giya.php"); // KINZARI

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

    toastr.clear(); // Clear any previous Toastr notifications

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
        `${sessionStorage.getItem("baseURL")}?action=login`, // Corrected URL
        {
          loginInput: loginInput,
          password: password,
        }
      );

      const result = response.data;

      if (result.success) {
        // Store user details in localStorage or sessionStorage
        localStorage.setItem("user_typeId", result.user_typeId);
        localStorage.setItem("first_name", result.first_name);

        toastr.success("Login successful!");

        // Redirect based on user type
        if (result.user_typeId === 5 || result.user_typeId === 6) {
          setTimeout(() => {
            window.location.href = "dashboard.html";
          }, 1500); // Delay the redirect to show the success message
        } else {
          toastr.error("You do not have access to this page.");
        }
      } else {
        toastr.error(result.message || "Login failed.");
      }
    } catch (error) {
      toastr.error("An error occurred during login. Please try again.");
      console.error(error);
    }
  });

// Initialize Math Verification
document.addEventListener("DOMContentLoaded", () => {
  const num1 = Math.floor(Math.random() * 50) + 10; // Range: 10-99
  const num2 = Math.floor(Math.random() * 9) + 1; // Range: 1-9

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

  // Toggle password visibility
  const togglePassword = document.getElementById("toggle-password");
  togglePassword.addEventListener("click", function () {
    const passwordField = document.getElementById("password");
    const type = passwordField.type === "password" ? "text" : "password";
    passwordField.type = type;
    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
  });

  // Caps Lock warning
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
