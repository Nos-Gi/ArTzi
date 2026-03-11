// Ensure script runs
console.log('=== MAIN.JS LOADED ===');

(function() {
    'use strict';

    // Internal link click: mark so next page skips loader (loader only on initial visit / reload)
    document.addEventListener('click', function(e) {
        var a = e.target.closest('a');
        if (!a || !a.href || a.target === '_blank') return;
        try {
            if (window.location.origin === new URL(a.href).origin) {
                sessionStorage.setItem('internalNav', '1');
            }
        } catch (err) {}
    }, true);

    // View transition direction: left menu -> right menu = out left, in from right (forward); opposite = backward
    function getMenuIndex(url) {
        try {
            var path = (url.pathname || '/').replace(/\/$/, '') || '/';
            var parts = path.split('/').filter(Boolean);
            var isEn = parts[0] === 'en';
            var page = (isEn ? parts[1] : parts[0]) || 'index';
            var name = (page.replace('.html', '') || 'index');
            var map = { index: 0, about: 1, facility: 2, services: 3, equipment: 4, contact: 5 };
            return map[name] !== undefined ? map[name] : 0;
        } catch (e) { return 0; }
    }

    window.addEventListener('pageswap', function(e) {
        if (!e.viewTransition || !e.activation) return;
        var fromUrl = window.location;
        var toUrl = e.activation.entry && e.activation.entry.url ? new URL(e.activation.entry.url) : null;
        if (!toUrl) return;
        var fromIndex = getMenuIndex(fromUrl);
        var toIndex = getMenuIndex(toUrl);
        var direction = toIndex > fromIndex ? 'forward' : (toIndex < fromIndex ? 'backward' : 'forward');
        sessionStorage.setItem('vtDirection', direction);
        e.viewTransition.types.add(direction);
    });

    window.addEventListener('pagereveal', function(e) {
        if (!e.viewTransition) return;
        var direction = sessionStorage.getItem('vtDirection') || 'forward';
        sessionStorage.removeItem('vtDirection');
        e.viewTransition.types.add(direction);
    });

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

        // JS is running, so remove no-js fallback class
        document.documentElement.classList.remove('no-js');

        // If we arrived via internal nav, loader was hidden by head script; remove it from DOM
        if (document.documentElement.classList.contains('skip-loader')) {
            var loader = document.getElementById('page-loader');
            if (loader) loader.remove();
        }

    // Photo sections: fade image with scroll position (tie opacity to visibility)
    (function initPhotoScrollFade() {
        var sections = document.querySelectorAll('.section-photo-bg');
        if (!sections.length) return;

        var thresholds = [];
        for (var i = 0; i <= 20; i++) thresholds.push(i / 20);

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                var ratio = entry.intersectionRatio;
                entry.target.style.setProperty('--photo-opacity', ratio);
            });
        }, {
            root: null,
            rootMargin: '0px',
            threshold: thresholds
        });

        sections.forEach(function(section) {
            observer.observe(section);
        });
    })();

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
    
    // Gallery: pop in/out with scroll (visibility tied to viewport)
    function initGalleryFadeIn() {
        const galleryScroll = document.querySelector('.gallery-scroll');
        const galleryItems = document.querySelectorAll('.gallery-item');
        const videoWrapper = document.querySelector('.video-wrapper.gallery-scroll-visible');

        if (!galleryScroll && !videoWrapper) {
            return;
        }

        // Elements to observe for scroll-based visibility
        const observeTargets = Array.from(galleryItems);
        if (videoWrapper) observeTargets.push(videoWrapper);

        if (observeTargets.length === 0) {
            return;
        }

        // Pre-load images to detect orientation, then sort and set up observer
        const imagePromises = Array.from(galleryItems).map((item) => {
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

                if (img.complete && img.naturalWidth > 0 && img.naturalHeight > 0) {
                    checkLandscape();
                } else {
                    img.addEventListener('load', checkLandscape, { once: true });
                    img.addEventListener('error', () => resolve({ item, isLandscape: false }), { once: true });
                    setTimeout(() => {
                        if (img.naturalWidth > 0 && img.naturalHeight > 0) checkLandscape();
                        else resolve({ item, isLandscape: false });
                    }, 500);
                }
            });
        });

        function setupScrollObserver() {
            const observerOptions = {
                threshold: [0, 0.1, 0.2, 0.3, 0.5, 0.7, 1],
                rootMargin: '0px 0px -40px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('gallery-visible');
                    } else {
                        entry.target.classList.remove('gallery-visible');
                    }
                });
            }, observerOptions);

            observeTargets.forEach((el) => observer.observe(el));
        }

        if (galleryItems.length === 0) {
            setupScrollObserver();
            return;
        }

        Promise.all(imagePromises).then((results) => {
            const landscapeItems = [];
            const verticalItems = [];
            results.forEach(({ item, isLandscape }) => {
                if (isLandscape) landscapeItems.push(item);
                else verticalItems.push(item);
            });

            const sortedItems = [];
            let li = 0, vi = 0;
            while (li < landscapeItems.length || vi < verticalItems.length) {
                if (li < landscapeItems.length) {
                    sortedItems.push(landscapeItems[li++]);
                }
                for (let i = 0; i < 3 && vi < verticalItems.length; i++) {
                    sortedItems.push(verticalItems[vi++]);
                }
            }

            sortedItems.forEach((item) => galleryScroll.appendChild(item));
            void galleryScroll.offsetHeight;

            // Rebuild observe list: reordered gallery items + video
            const toObserve = sortedItems.slice();
            if (videoWrapper) toObserve.push(videoWrapper);

            const observerOptions = {
                threshold: [0, 0.1, 0.2, 0.3, 0.5, 0.7, 1],
                rootMargin: '0px 0px -40px 0px'
            };

            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('gallery-visible');
                    } else {
                        entry.target.classList.remove('gallery-visible');
                    }
                });
            }, observerOptions);

            toObserve.forEach((el) => observer.observe(el));
        });
    }
    
    // Initialize gallery fade-in on page load
    initGalleryFadeIn();

    // Page loader: after load + 0.5s, fade out to reveal site (only when loader is shown = initial visit / reload)
    if (!document.documentElement.classList.contains('skip-loader')) {
        window.addEventListener('load', function() {
            setTimeout(function() {
                var loader = document.getElementById('page-loader');
                if (loader) {
                    loader.classList.add('page-loader-fade-out');
                    setTimeout(function() {
                        loader.remove();
                    }, 500);
                }
            }, 500);
        });
    }
    }
})();
