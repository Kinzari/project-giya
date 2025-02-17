document.addEventListener("DOMContentLoaded", function () {
  const startingInfo = document.querySelector(".starting-info");
  const classArea = document.querySelector(".class-area");
  const faqArea = document.querySelector(".faq-area");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (entry.target === startingInfo) {
            startingInfo.classList.add("visible");
          } else if (entry.target === classArea) {
            const classItems = classArea.querySelectorAll(".single-class");
            classItems.forEach((item, index) => {
              setTimeout(() => {
                item.classList.add("visible");
              }, index * 150);
            });
          } else if (entry.target === faqArea) {
            faqArea.classList.add("visible");
          }
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.5 }
  );

  if (startingInfo) observer.observe(startingInfo);
  if (classArea) observer.observe(classArea);
  if (faqArea) observer.observe(faqArea);
});
