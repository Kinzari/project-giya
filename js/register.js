document.addEventListener("DOMContentLoaded", function () {

   // sessionStorage.setItem("baseURL", "http://192.168.254.166/api/giya.php"); //KINZARI
   sessionStorage.setItem("baseURL", "http://localhost/api/"); //uncomment lang ni pag mag localhost



   const baseURL = sessionStorage.getItem("baseURL");
   const registerForm = document.getElementById("register-form");
   const passwordInput = document.getElementById("password");

   if (!registerForm) {
       toastr.error("Error: Registration form not found!", "Error");
       console.error("Error: The form element with ID 'register-form' was not found.");
       return;
   }

   // Password validation function
   function validatePassword(password) {
       const validations = {
           length: password.length >= 8,
           uppercase: /[A-Z]/.test(password),
           lowercase: /[a-z]/.test(password),
           number: /\d/.test(password)
       };

       // Update validation icons
       Object.entries(validations).forEach(([key, valid]) => {
           const item = document.getElementById(`${key}-check`);
           const checkIcon = item.querySelector('.fa-check');
           const timesIcon = item.querySelector('.fa-times');
           if (valid) {
               checkIcon.classList.remove('d-none');
               timesIcon.classList.add('d-none');
           } else {
               checkIcon.classList.add('d-none');
               timesIcon.classList.remove('d-none');
           }
       });

       return Object.values(validations).every(Boolean);
   }

   // Validate password on input
   passwordInput.addEventListener('input', function() {
       validatePassword(this.value);
   });

   // --- Privacy Policy Checkbox Logic ---
   const termsCheckbox = document.getElementById("terms");
   // Intercept click on the checkbox to show the privacy policy modal
   termsCheckbox.addEventListener("click", function (e) {
       // Prevent the checkbox from toggling automatically
       e.preventDefault();

       // Show SweetAlert for Privacy Policy
       Swal.fire({
           title: "Privacy Policy",
           html: "Please read the privacy policy carefully.<br><br>" +
                 "Your data will be processed according to our privacy policy.",
           icon: "info",
           showCancelButton: true,
           confirmButtonText: "Accept",
           confirmButtonColor: '#155f37',
           cancelButtonColor: '#d33',
           cancelButtonText: "Decline"
       }).then((result) => {
           if (result.isConfirmed) {
               // If accepted, check the checkbox and set privacy flag
               termsCheckbox.checked = true;
               sessionStorage.setItem("privacyPolicyAccepted", "true");
           } else {
               // If declined, ensure checkbox remains unchecked
               termsCheckbox.checked = false;
               sessionStorage.removeItem("privacyPolicyAccepted");
           }
       });
   });

   // --- Registration Form Submission ---
   registerForm.addEventListener("submit", async function (event) {
       event.preventDefault(); // Prevent page reload

       // Get field values
       const firstName = document.getElementById("first_name").value.trim();
       const middleName = document.getElementById("middle_name").value.trim();
       const lastName = document.getElementById("family_name").value.trim();
       const suffix = document.getElementById("suffix").value.trim();
       const email = document.getElementById("user_email").value.trim();
       const contactNumber = document.getElementById("user_contact").value.trim();
       const password = passwordInput.value.trim();
       const confirmPassword = document.getElementById("confirm_password").value.trim();
       const agreeTerms = termsCheckbox.checked;

       // Check if terms checkbox is checked (i.e., privacy policy accepted)
       if (!agreeTerms) {
           Swal.fire({
               icon: 'warning',
               title: 'Terms Not Accepted',
               text: 'You must accept the Privacy Policy to proceed.'
           });
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

       if (!validatePassword(password)) {
           toastr.error("Password does not meet requirements");
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
           const response = await axios.post(`${baseURL}giya.php?action=register`, userData, {
               headers: {
                   'Content-Type': 'application/json'
               }
           });
           if (response.data.status === "success") {
               // First, show a SweetAlert reminder about the email
               Swal.fire({
                   icon: 'info',
                   confirmButtonColor: '#155f37',
                   title: 'Note',
                   text: 'Remember your email address, as it will be required for logging in.'
               }).then(() => {
                   // Then, show another SweetAlert with the Visitor ID
                   Swal.fire({
                       icon: 'success',
                       confirmButtonColor: '#155f37',
                       title: 'Registration Successful!',
                       text: `Your Visitor ID is ${response.data.schoolId}`
                   }).then(() => {
                       window.location.href = "index.html";
                   });
               });
           } else {
               toastr.error(response.data.message || "Registration failed", "Error");
           }
       } catch (error) {
           console.error("Error:", error);
           const errorMessage = error.response?.data?.message || "An error occurred. Please try again.";
           toastr.error(errorMessage, "Error");
       }
   });

   // Toggle password visibility for both password fields
   const togglePassword = document.getElementById("toggle-password");
   const toggleConfirmPassword = document.getElementById("toggle-confirm-password");

   function toggleVisibility(fieldId, icon) {
       const field = document.getElementById(fieldId);
       if (field) {
           field.type = field.type === "password" ? "text" : "password";
           icon.classList.toggle("fa-eye");
           icon.classList.toggle("fa-eye-slash");
       }
   }

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
});
