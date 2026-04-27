(function() {
    'use strict';

    function initPhotoScrollFade() {
        var sections = document.querySelectorAll('.section-photo-bg');
        if (!sections.length) return;
        var thresholds = [];
        for (var i = 0; i <= 20; i++) thresholds.push(i / 20);
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                entry.target.style.setProperty('--photo-opacity', entry.intersectionRatio);
            });
        }, { root: null, rootMargin: '0px', threshold: thresholds });
        sections.forEach(function(section) { observer.observe(section); });
    }

    function initPageContent() {
        initPhotoScrollFade();
        initContactForm();
        initGalleryFadeIn();
        initLightbox();
    }

    function hideLoader() {
        var el = document.getElementById('page-loader');
        if (!el) return;
        el.classList.add('page-loader-fade-out');
        setTimeout(function() { el.remove(); }, 500);
    }

    // SPA navigation: fetch page, replace main+header+title, simple fade (works everywhere)
    function applyPage(html) {
        var main = document.querySelector('main.main-content');
        if (!main) return false;
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var newMain = doc.querySelector('main.main-content');
        var newHeader = doc.querySelector('header.top-bar');
        var newTitle = doc.querySelector('title');
        var header = document.querySelector('header.top-bar');
        if (!newMain) return false;
        var mainHtml = newMain.innerHTML;
        var headerHtml = newHeader ? newHeader.innerHTML : '';
        var titleText = newTitle ? newTitle.textContent : document.title;
        var nextBodyClass = (doc.body && doc.body.className) ? doc.body.className : '';
        var nextHasPricingBg = !!doc.querySelector('.pricing-fixed-bg');
        var nextHasHomeBg = !!doc.querySelector('.home-fixed-bg');

        function updateDOM() {
            // Keep page-scoped fixed layers in sync (prevents background flashing/sticking between pages)
            function syncFixedLayer(selector, className, shouldExist) {
                var current = document.querySelector(selector);
                if (current && !shouldExist) {
                    current.remove();
                } else if (!current && shouldExist) {
                    var el = document.createElement('div');
                    el.className = className;
                    el.setAttribute('aria-hidden', 'true');
                    document.body.insertBefore(el, document.body.firstChild);
                }
            }

            syncFixedLayer('.pricing-fixed-bg', 'pricing-fixed-bg', nextHasPricingBg);
            syncFixedLayer('.home-fixed-bg', 'home-fixed-bg', nextHasHomeBg);

            // Sync body class (e.g. pricing-fixed)
            document.body.className = nextBodyClass;

            main.innerHTML = mainHtml;
            document.title = titleText;
            if (header && headerHtml) header.innerHTML = headerHtml;
        }

        document.documentElement.classList.add('spa-fade-out');
        main.classList.add('spa-fade-out');
        setTimeout(function() {
            try {
                updateDOM();
                initPageContent();
            } finally {
                main.classList.remove('spa-fade-out');
                document.documentElement.classList.remove('spa-fade-out');
            }
        }, 200);
        return true;
    }

    function spaNavigate(href) {
        fetch(href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(function(r) { return r.text(); })
            .then(function(html) {
                if (applyPage(html)) {
                    history.pushState({ spa: true }, '', href);
                    var seg = new URL(href, window.location.origin).pathname.split('/').filter(Boolean)[0];
                    document.documentElement.lang = seg === 'en' ? 'en' : 'el';
                }
            })
            .catch(function() { window.location.href = href; });
    }

    document.addEventListener('click', function(e) {
        var a = e.target.closest('a');
        if (!a || !a.href || a.target === '_blank') return;
        try {
            var url = new URL(a.href);
            if (window.location.origin !== url.origin) return;
            if (url.pathname === window.location.pathname && url.search === window.location.search && !url.hash) return;
            e.preventDefault();
            spaNavigate(a.href);
        } catch (err) {
            return;
        }
    }, true);

    window.addEventListener('popstate', function() {
        var href = window.location.href;
        fetch(href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(function(r) { return r.text(); })
            .then(function(html) {
                applyPage(html);
                var seg = window.location.pathname.split('/').filter(Boolean)[0];
                document.documentElement.lang = seg === 'en' ? 'en' : 'el';
            })
            .catch(function() { window.location.reload(); });
    });

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    function init() {
        document.documentElement.classList.remove('no-js');
        if (document.documentElement.classList.contains('skip-loader')) {
            var loader = document.getElementById('page-loader');
            if (loader) loader.remove();
            initPageContent();
            return;
        }
        initPageContent();
        var loaderDone = false;
        function doHideLoader() {
            if (loaderDone) return;
            loaderDone = true;
            hideLoader();
        }
        if (document.readyState === 'complete') {
            setTimeout(doHideLoader, 400);
        } else {
            window.addEventListener('load', function() { setTimeout(doHideLoader, 400); });
        }
        setTimeout(doHideLoader, 4000);
    }

    function initContactForm() {
        var submitBtnGr = document.getElementById('submit-btn-gr');
        var submitBtnEn = document.getElementById('submit-btn-en');
        var allButtons = document.querySelectorAll('.contact-form button');
        var buttons = [submitBtnGr, submitBtnEn].concat(Array.prototype.slice.call(allButtons));
        buttons.forEach(function(btn) {
            if (!btn) return;
            btn.onclick = function(e) {
                e.preventDefault();
                e.stopPropagation();
                var form = this.closest('form');
                if (form) handleFormSubmit(form);
                return false;
            };
        });
        var contactForms = document.querySelectorAll('.contact-form');
        contactForms.forEach(function(form) {
            form.removeAttribute('action');
            form.setAttribute('novalidate', 'novalidate');
            form.onsubmit = function(e) {
                e.preventDefault();
                handleFormSubmit(form);
                return false;
            };
        });
    }

    async function handleFormSubmit(form) {
        var submitBtn = form.querySelector('button[type="submit"]') || form.querySelector('button');
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
    
    var lightboxReady = false;

    function initLightbox() {
        if (lightboxReady) return;
        lightboxReady = true;

        var overlay = document.createElement('div');
        overlay.className = 'lightbox-overlay';
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-label', 'Image viewer');

        var img = document.createElement('img');
        img.alt = '';

        var closeBtn = document.createElement('button');
        closeBtn.className = 'lightbox-close';
        closeBtn.setAttribute('aria-label', 'Close');
        closeBtn.textContent = '×';

        overlay.appendChild(img);
        overlay.appendChild(closeBtn);
        document.body.appendChild(overlay);

        function open(src) {
            img.src = src;
            overlay.classList.add('active');
            document.documentElement.style.overflow = 'hidden';
        }

        function close() {
            overlay.classList.remove('active');
            document.documentElement.style.overflow = '';
            setTimeout(function() { img.src = ''; }, 250);
        }

        closeBtn.addEventListener('click', close);

        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) close();
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && overlay.classList.contains('active')) close();
        });

        document.addEventListener('click', function(e) {
            var item = e.target.closest('.gallery-item');
            if (!item) return;
            var src = item.dataset.image;
            if (src) open(src);
        }, true);
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
})();
