/**
 * FAQ Loader - Load and display FAQs on index.html
 */

$(document).ready(function() {
    // Get the base URL from session storage or use default
    const baseURL = sessionStorage.getItem('baseURL') || 'http://localhost/api/';

    // Fetch FAQs from API
    $.ajax({
        url: `${baseURL}faq.php?action=get_published_faqs`,
        type: 'GET',
        dataType: 'json',
        success: function(response) {
            if (response.success && response.data && response.data.length > 0) {
                displayFaqs(response.data);
            } else {
                displayNoFaqs();
            }
        },
        error: function(xhr, status, error) {
            console.error('Error loading FAQs:', error);
            displayNoFaqs();
        }
    });

    /**
     * Display FAQs in the accordion
     */
    function displayFaqs(faqs) {
        const faqContainer = $('#faqAccordion');
        faqContainer.empty();

        // Add static FAQ about registration
        faqs.push({
            faq_id: 'static-reg',
            question: 'How do I create an account?',
            answer: 'To create an account, you can <a href="register.html" class="register-link"><strong>register here</strong></a>.'
        });

        faqs.forEach(function(faq, index) {
            const faqId = `faq-${faq.faq_id}`;
            const isFirst = index === 0;

            const faqHtml = `
                <div class="accordion-item">
                    <h2 class="accordion-header" id="heading-${faqId}">
                        <button class="accordion-button ${isFirst ? '' : 'collapsed'}"
                                type="button"
                                data-bs-toggle="collapse"
                                data-bs-target="#collapse-${faqId}"
                                aria-expanded="${isFirst ? 'true' : 'false'}"
                                aria-controls="collapse-${faqId}">
                            ${faq.question}
                        </button>
                    </h2>
                    <div id="collapse-${faqId}"
                         class="accordion-collapse collapse ${isFirst ? 'show' : ''}"
                         aria-labelledby="heading-${faqId}"
                         data-bs-parent="#faqAccordion">
                        <div class="accordion-body">
                            ${faq.answer}
                        </div>
                    </div>
                </div>
            `;

            faqContainer.append(faqHtml);
        });
    }

    /**
     * Display message when no FAQs available
     */
    function displayNoFaqs() {
        const faqContainer = $('#faqAccordion');
        faqContainer.html(`
            <div class="alert alert-info">
                <i class="bi bi-info-circle me-2"></i>
                No FAQs available at this time.
            </div>
        `);
    }
});
