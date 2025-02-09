// Add event listener to the Privacy Policy link
document.getElementById("openPolicy").addEventListener("click", function (e) {
  e.preventDefault(); // Prevent default link behavior

  // Create an AJAX request to fetch the privacy policy
  const xhr = new XMLHttpRequest();
  xhr.open("GET", "policy.php", true);
  xhr.onreadystatechange = function () {
    if (xhr.readyState === 4 && xhr.status === 200) {
      // Parse the response and extract the .content div
      const parser = new DOMParser();
      const doc = parser.parseFromString(xhr.responseText, "text/html");
      const content = doc.querySelector(".content").innerHTML;

      // Inject the extracted content into the modal
      document.getElementById("policyContent").innerHTML = content;

      // Display the modal
      document.getElementById("policyModal").style.display = "block";
    }
  };
  xhr.send();
});

// Close the modal when the close button is clicked
document.getElementById("closePolicy").addEventListener("click", function () {
  document.getElementById("policyModal").style.display = "none";
});

// Close the modal if the user clicks outside of it
window.addEventListener("click", function (e) {
  const modal = document.getElementById("policyModal");
  if (e.target === modal) {
    modal.style.display = "none";
  }
});
