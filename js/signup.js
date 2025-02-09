document.addEventListener("DOMContentLoaded", function () {
  // Set the baseURL in session storage
  sessionStorage.setItem("baseURL", "http://localhost/api/giya.php");
  const baseURL = sessionStorage.getItem("baseURL");

  // Toggle password visibility
  const togglePassword = document.getElementById("toggle-password");
  const toggleConfirmPassword = document.getElementById(
    "toggle-confirm-password"
  );

  togglePassword.addEventListener("click", function () {
    const passwordField = document.getElementById("password");
    const type = passwordField.type === "password" ? "text" : "password";
    passwordField.type = type;
    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
  });

  toggleConfirmPassword.addEventListener("click", function () {
    const confirmPasswordField = document.getElementById("confirm_password");
    const type = confirmPasswordField.type === "password" ? "text" : "password";
    confirmPasswordField.type = type;
    this.classList.toggle("fa-eye");
    this.classList.toggle("fa-eye-slash");
  });

  // Form submission
  document
    .getElementById("signup-form")
    .addEventListener("submit", function (e) {
      e.preventDefault();

      const userData = {
        first_name: document.getElementById("first_name").value.trim(),
        middle_name: document.getElementById("middle_name").value.trim(),
        family_name: document.getElementById("family_name").value.trim(),
        suffix: document.getElementById("suffix").value.trim(),
        user_contact: document.getElementById("user_contact").value.trim(),
        password: document.getElementById("password").value.trim(),
        confirm_password: document
          .getElementById("confirm_password")
          .value.trim(),
      };

      // Password match validation
      if (userData.password !== userData.confirm_password) {
        toastr.error("Passwords do not match!", "Validation Error");
        return;
      }

      // Post data to the API
      axios
        .post(`${baseURL}`, userData)
        .then((response) => {
          const res = response.data;

          if (res.status === "success") {
            toastr.success(res.message, "Registration Successful");
            document.getElementById("signup-form").reset();
          } else {
            toastr.error(res.message, "Registration Failed");
          }
        })
        .catch((error) => {
          toastr.error("An unexpected error occurred.", "Error");
          console.error("Signup error:", error);
        });
    });
});
