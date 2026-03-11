// Ensure script runs
console.log('=== MAIN.JS LOADED ===');

(function() {
    'use strict';

    function getMenuIndex(url) {
        try {
            var u = typeof url === 'string' ? new URL(url, window.location.origin) : url;
            var path = (u.pathname || '/').replace(/\/$/, '') || '/';
            var parts = path.split('/').filter(Boolean);
            var isEn = parts[0] === 'en';
            var page = (isEn ? parts[1] : parts[0]) || 'index';
            var name = (page.replace('.html', '') || 'index');
            var map = { index: 0, about: 1, facility: 2, services: 3, equipment: 4, contact: 5 };
            return map[name] !== undefined ? map[name] : 0;
        } catch (e) { return 0; }
    }

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
    }

    function hideLoader() {
        var el = document.getElementById('page-loader');
        if (!el) return;
        el.classList.add('page-loader-fade-out');
        setTimeout(function() { el.remove(); }, 500);
    }

    function getSectionBgImageUrls() {
        var link = document.querySelector('link[rel="stylesheet"]');
        if (!link || !link.href) return [];
        var parts = link.href.split('/');
        parts.pop();
        parts.pop();
        parts.push('images');
        var base = parts.join('/') + '/';
        return [
            base + 'IMG_8227.jpeg',
            base + 'IMG_8222.jpeg',
            base + 'IMG_8237.jpeg',
            base + 'IMG_8239.jpeg'
        ];
    }

    function loadImage(url) {
        return new Promise(function(resolve) {
            var img = new Image();
            img.onload = resolve;
            img.onerror = resolve;
            img.src = url;
        });
    }

    function waitForFontsAndImages() {
        var fontReady = (document.fonts && document.fonts.ready) ? document.fonts.ready : Promise.resolve();
        var imgEls = document.querySelectorAll('img[src]');
        var urls = [];
        for (var i = 0; i < imgEls.length; i++) {
            var src = imgEls[i].src || imgEls[i].getAttribute('src');
            if (src) urls.push(src);
        }
        var bgUrls = getSectionBgImageUrls();
        for (var j = 0; j < bgUrls.length; j++) urls.push(bgUrls[j]);
        var unique = urls.filter(function(u, i, a) { return a.indexOf(u) === i; });
        var imagePromises = unique.map(loadImage);
        var allReady = Promise.all([fontReady].concat(imagePromises));
        var timeout = new Promise(function(r) { setTimeout(r, 15000); });
        return Promise.race([allReady, timeout]);
    }

    // SPA navigation: fetch page, replace main+header+title, animate with same-document View Transition
    function applyPage(html, direction) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var newMain = doc.querySelector('main.main-content');
        var newHeader = doc.querySelector('header.top-bar');
        var newTitle = doc.querySelector('title');
        var main = document.querySelector('main.main-content');
        var header = document.querySelector('header.top-bar');
        if (!main || !newMain) return false;
        var mainHtml = newMain.innerHTML;
        var headerHtml = newHeader ? newHeader.innerHTML : '';
        var titleText = newTitle ? newTitle.textContent : document.title;
        var dirClass = direction === 'backward' ? 'vt-backward' : 'vt-forward';
        document.documentElement.classList.add(dirClass);

        function updateDOM() {
            main.innerHTML = mainHtml;
            document.title = titleText;
            if (header && headerHtml) header.innerHTML = headerHtml;
        }

        if (document.startViewTransition) {
            document.startViewTransition(updateDOM).finished.then(function() {
                document.documentElement.classList.remove('vt-forward', 'vt-backward');
                initPageContent();
            }).catch(function() {
                document.documentElement.classList.remove('vt-forward', 'vt-backward');
                initPageContent();
            });
        } else {
            main.classList.add('spa-fade-out');
            setTimeout(function() {
                updateDOM();
                main.classList.remove('spa-fade-out');
                initPageContent();
            }, 220);
        }
        return true;
    }

    function spaNavigate(href) {
        fetch(href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(function(r) { return r.text(); })
            .then(function(html) {
                var fromIndex = getMenuIndex(window.location.href);
                var toIndex = getMenuIndex(href);
                var direction = toIndex >= fromIndex ? 'forward' : 'backward';
                if (applyPage(html, direction)) {
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
        } catch (err) {}
    }, true);

    window.addEventListener('popstate', function() {
        var href = window.location.href;
        fetch(href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
            .then(function(r) { return r.text(); })
            .then(function(html) {
                applyPage(html, 'backward');
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
        function runWhenReady() {
            waitForFontsAndImages().then(function() {
                setTimeout(hideLoader, 300);
            }).catch(function() {
                setTimeout(hideLoader, 300);
            });
        }
        if (document.readyState === 'complete') {
            runWhenReady();
        } else {
            window.addEventListener('load', runWhenReady);
        }
    }

    function initContactForm() {
        var submitBtnGr = document.getElementById('submit-btn-gr');
        var submitBtnEn = document.getElementById('submit-btn-en');
        var allButtons = document.querySelectorAll('.contact-form button[type="button"]');
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
                return false;
            };
        });
    }

    async function handleFormSubmit(form) {
        var submitBtn = form.querySelector('button[type="submit"]');
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
})();
