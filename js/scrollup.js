document.addEventListener("DOMContentLoaded", () => {
  const scrollUpBtn = document.getElementById("scrollUpBtn");

  if (!scrollUpBtn) {
    console.error("Scroll-up button not found!");
    return;
  }

  // Show the button when scrolling down
  window.addEventListener("scroll", () => {
    if (window.scrollY > 100) {
      scrollUpBtn.style.display = "block";
    } else {
      scrollUpBtn.style.display = "none";
    }
  });

  // Scroll to the top when clicking the button
  scrollUpBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
