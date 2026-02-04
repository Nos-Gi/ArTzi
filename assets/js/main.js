// Ensure script runs
console.log('=== MAIN.JS LOADED ===');

(function() {
    'use strict';
    
    console.log('=== IIFE STARTED ===');
    
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        console.log('DOM is loading, waiting...');
        document.addEventListener('DOMContentLoaded', init);
    } else {
        console.log('DOM already ready, calling init immediately');
        init();
    }
    
    function init() {
        console.log('=== INIT FUNCTION CALLED ===');
    const carousels = document.querySelectorAll('[data-carousel]');

    carousels.forEach((carousel) => {
        const track = carousel.querySelector('[data-carousel-track]');
        const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
        const dots = Array.from(carousel.querySelectorAll('[data-carousel-dot]'));
        const prevBtn = carousel.querySelector('[data-carousel-prev]');
        const nextBtn = carousel.querySelector('[data-carousel-next]');

        if (!track || slides.length === 0) {
            return;
        }

        let index = 0;
        let autoTimer;
        const slideCount = slides.length;
        const intervalMs = 6000;

        function goToSlide(newIndex) {
            index = (newIndex + slideCount) % slideCount;
            const offset = -index * 100;

            track.style.transform = `translateX(${offset}%)`;

            slides.forEach((slide, i) => {
                slide.classList.toggle('is-active', i === index);
            });

            dots.forEach((dot, i) => {
                dot.classList.toggle('is-active', i === index);
            });
        }

        function next() {
            goToSlide(index + 1);
        }

        function prev() {
            goToSlide(index - 1);
        }

        function startAuto() {
            stopAuto();
            autoTimer = window.setInterval(next, intervalMs);
        }

        function stopAuto() {
            if (autoTimer) {
                window.clearInterval(autoTimer);
                autoTimer = undefined;
            }
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                stopAuto();
                next();
                startAuto();
            });
        }

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                stopAuto();
                prev();
                startAuto();
            });
        }

        dots.forEach((dot) => {
            const targetIndex = Number(dot.getAttribute('data-carousel-dot'));
            if (!Number.isNaN(targetIndex)) {
                dot.addEventListener('click', () => {
                    stopAuto();
                    goToSlide(targetIndex);
                    startAuto();
                });
            }
        });

        carousel.addEventListener('mouseenter', stopAuto);
        carousel.addEventListener('mouseleave', startAuto);

        // initial state
        goToSlide(0);
        startAuto();
    });

    // Contact form handling with Formspree (AJAX submission)
    console.log('=== INITIALIZING CONTACT FORM HANDLERS ===');
    
    // Use setTimeout to ensure DOM is fully ready
    setTimeout(function() {
        console.log('=== SETTING UP BUTTONS (after timeout) ===');
        
        // Find buttons directly by ID
        const submitBtnGr = document.getElementById('submit-btn-gr');
        const submitBtnEn = document.getElementById('submit-btn-en');
        
        console.log('submit-btn-gr found:', !!submitBtnGr);
        console.log('submit-btn-en found:', !!submitBtnEn);
        
        // Find all buttons in contact forms
        const allButtons = document.querySelectorAll('.contact-form button[type="button"]');
        console.log('All buttons in forms:', allButtons.length);
        
        // Set up handlers for all found buttons
        [submitBtnGr, submitBtnEn, ...allButtons].forEach((btn) => {
            if (!btn) return;
            
            console.log('Setting up button:', btn.id || 'no-id', btn.textContent);
            
            btn.onclick = function(e) {
                console.log('=== BUTTON CLICKED ===', this.id || this.textContent);
                e.preventDefault();
                e.stopPropagation();
                
                const form = this.closest('form');
                if (form) {
                    console.log('Form found, calling handleFormSubmit');
                    handleFormSubmit(form);
                } else {
                    console.error('No form found for button');
                }
                return false;
            };
        });
        
        // Set up form prevention
        const contactForms = document.querySelectorAll('.contact-form');
        console.log('Contact forms found:', contactForms.length);
        
        contactForms.forEach((form) => {
            form.removeAttribute('action');
            form.setAttribute('novalidate', 'novalidate');
            
            form.onsubmit = function(e) {
                console.log('Form submit prevented');
                e.preventDefault();
                return false;
            };
        });
        
        console.log('=== BUTTON SETUP COMPLETE ===');
    }, 100);
    
    async function handleFormSubmit(form) {
        console.log('handleFormSubmit called');
        
        const submitBtn = form.querySelector('button[type="submit"]');
        if (!submitBtn) {
            console.error('Submit button not found');
            return;
        }
        
        const originalBtnText = submitBtn.textContent;
        const isGreek = document.documentElement.lang === 'el';
        
        // Validation before submission
        const nameInput = form.querySelector('input[name="name"]');
        const emailInput = form.querySelector('input[type="email"]');
        const messageInput = form.querySelector('textarea[name="message"]');
        
        if (!nameInput || !emailInput || !messageInput) {
            console.error('Form inputs not found');
            showNotification(
                isGreek ? 'Σφάλμα φόρμας.' : 'Form error.',
                'error'
            );
            return;
        }
        
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();
        const message = messageInput.value.trim();
        
        console.log('Form values:', { name, email, message: message.substring(0, 20) + '...' });
        
        // Client-side validation
        if (!name || !email || !message) {
            showNotification(
                isGreek ? 'Παρακαλώ συμπληρώστε όλα τα πεδία.' : 'Please fill in all fields.',
                'error'
            );
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification(
                isGreek ? 'Παρακαλώ εισάγετε έγκυρο email.' : 'Please enter a valid email address.',
                'error'
            );
            return;
        }
        
        // Set reply-to field to user's email
        const replyToInput = form.querySelector('input[name="_replyto"]');
        if (replyToInput) {
            replyToInput.value = email;
        }
        
        // Show loading state
        submitBtn.disabled = true;
        submitBtn.textContent = isGreek ? 'Αποστολή...' : 'Sending...';
        
        try {
            // Formspree endpoint
            const formspreeUrl = 'https://formspree.io/f/mbdknbbn';
            
            // Prepare form data
            const formData = new FormData(form);
            
            console.log('Submitting to Formspree:', formspreeUrl);
            
            // Submit via fetch (AJAX)
            const response = await fetch(formspreeUrl, {
                method: 'POST',
                body: formData,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            console.log('Response received:', response.status, response.statusText);
            
            if (response.ok) {
                // Success
                console.log('Form submitted successfully!');
                showNotification(
                    isGreek ? 'Η υποβολή ολοκληρώθηκε επιτυχώς!' : 'Submission succeeded!',
                    'success'
                );
                form.reset();
            } else {
                // Error from Formspree
                let errorMsg = 'Submission failed';
                try {
                    const data = await response.json();
                    errorMsg = data.error || errorMsg;
                } catch (e) {
                    errorMsg = response.statusText || errorMsg;
                }
                console.error('Formspree error:', errorMsg);
                throw new Error(errorMsg);
            }
            
        } catch (error) {
            console.error('Form submission error:', error);
            showNotification(
                isGreek ? 'Σφάλμα κατά την αποστολή. Παρακαλώ δοκιμάστε ξανά.' : 'Error sending message. Please try again.',
                'error'
            );
        } finally {
            // Reset button state
            submitBtn.disabled = false;
            submitBtn.textContent = originalBtnText;
        }
    }
    
    // Notification popup function
    function showNotification(message, type = 'success') {
        console.log('Showing notification:', message, type);
        
        // Remove any existing notifications
        const existing = document.querySelector('.form-notification');
        if (existing) {
            existing.remove();
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `form-notification form-notification-${type}`;
        notification.textContent = message;
        
        // Add to body
        document.body.appendChild(notification);
        
        console.log('Notification element created and added to DOM');
        
        // Trigger animation
        setTimeout(() => {
            notification.classList.add('show');
            console.log('Notification show class added');
        }, 10);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300); // Wait for fade out animation
        }, 5000);
    }
    
    function showMessage(element, grText, enText, type) {
        if (!element) return;
        
        const isGreek = document.documentElement.lang === 'el';
        const text = isGreek ? grText : enText;
        
        element.textContent = text;
        element.className = 'form-note';
        
        if (type === 'success') {
            element.style.color = '#10b981';
        } else if (type === 'error') {
            element.style.color = '#ef4444';
        } else {
            element.style.color = '#6b7280';
        }
    }
    
    function isValidEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }
    
    // Gallery scroll fade-in animation and landscape detection with sorting
    function initGalleryFadeIn() {
        const galleryScroll = document.querySelector('.gallery-scroll');
        const galleryItems = document.querySelectorAll('.gallery-item');
        const videoWrapper = document.querySelector('.video-wrapper.fade-in');
        
        if (galleryItems.length === 0 && !videoWrapper || !galleryScroll) {
            return;
        }
        
        // Pre-load all images to detect orientation before layout
        const imagePromises = Array.from(galleryItems).map((item, index) => {
            const img = item.querySelector('img');
            if (!img) return Promise.resolve({ item, isLandscape: false });
            
            return new Promise((resolve) => {
                const checkLandscape = function() {
                    if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                        const isLandscape = img.naturalWidth > img.naturalHeight;
                        if (isLandscape) {
                            item.classList.add('landscape');
                            item.style.gridColumn = '1 / 4';
                        }
                        resolve({ item, isLandscape });
                    } else {
                        resolve({ item, isLandscape: false });
                    }
                };
                
                // Check immediately if already loaded
                if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                    checkLandscape();
                } else {
                    // Wait for load
                    img.addEventListener('load', checkLandscape, { once: true });
                    img.addEventListener('error', () => resolve({ item, isLandscape: false }), { once: true });
                    // Fallback timeout
                    setTimeout(() => {
                        if (img.naturalWidth > 0 && img.naturalHeight > 0) {
                            checkLandscape();
                        } else {
                            resolve({ item, isLandscape: false });
                        }
                    }, 500);
                }
            });
        });
        
        // Wait for all images to be checked, then sort and reorder
        Promise.all(imagePromises).then((results) => {
            // Separate landscape and vertical images
            const landscapeItems = [];
            const verticalItems = [];
            
            results.forEach(({ item, isLandscape }) => {
                if (isLandscape) {
                    landscapeItems.push(item);
                } else {
                    verticalItems.push(item);
                }
            });
            
            // Create sorted array following pattern: 1 landscape, 3 vertical, repeat
            const sortedItems = [];
            let landscapeIndex = 0;
            let verticalIndex = 0;
            
            while (landscapeIndex < landscapeItems.length || verticalIndex < verticalItems.length) {
                // Add 1 landscape if available
                if (landscapeIndex < landscapeItems.length) {
                    sortedItems.push(landscapeItems[landscapeIndex]);
                    landscapeIndex++;
                }
                
                // Add 3 vertical images if available
                for (let i = 0; i < 3 && verticalIndex < verticalItems.length; i++) {
                    sortedItems.push(verticalItems[verticalIndex]);
                    verticalIndex++;
                }
            }
            
            // Reorder DOM elements to match sorted order
            sortedItems.forEach((item) => {
                galleryScroll.appendChild(item);
            });
            
            // Force grid recalculation by triggering reflow
            void galleryScroll.offsetHeight;
            
            // Set up fade-in observer after reordering
            const observerOptions = {
                threshold: 0.05,
                rootMargin: '0px 0px -20px 0px'
            };
            
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('fade-in');
                        observer.unobserve(entry.target);
                    }
                });
            }, observerOptions);
            
            // Observe all reordered items
            sortedItems.forEach((item, index) => {
                // First item should be visible immediately
                if (index === 0) {
                    item.classList.add('fade-in');
                } else {
                    observer.observe(item);
                }
            });
            
            if (videoWrapper) {
                observer.observe(videoWrapper);
            }
        });
    }
    
    // Initialize gallery fade-in on page load
    initGalleryFadeIn();
    }
})();
