(function() {
    'use strict';

    var lightboxReady = false;

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
        initGalleryFadeIn();
        initLightbox();
        initEquipmentFilter();
        initScrollReveal();
    }

    // Full body swap — used when crossing homepage boundary
    function doBodySwap(doc, href) {
        var newTitle = doc.querySelector('title');
        document.body.innerHTML = doc.body.innerHTML;
        document.body.className = doc.body.className || '';
        if (newTitle) document.title = newTitle.textContent;
        if (href) {
            history.pushState({ spa: true }, '', href);
            var seg = new URL(href, window.location.origin).pathname.split('/').filter(Boolean)[0];
            document.documentElement.lang = seg === 'en' ? 'en' : 'el';
        }
        lightboxReady = false;
        init();
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
        if (!newMain) {
            // Target is homepage — fade out current page then body-swap
            document.documentElement.classList.add('spa-fade-out');
            main.classList.add('spa-fade-out');
            setTimeout(function() {
                document.documentElement.classList.remove('spa-fade-out');
                doBodySwap(doc, null);
            }, 200);
            return true;
        }
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
                } else {
                    window.location.href = href;
                }
            })
            .catch(function() { window.location.href = href; });
    }

    function isHomepage(p) {
        return p === '/' || p === '/index.html' || p === '/en/' || p === '/en/index.html';
    }

    document.addEventListener('click', function(e) {
        if (!document.querySelector('main.main-content')) return;
        var a = e.target.closest('a');
        if (!a || !a.href || a.target === '_blank') return;
        try {
            var url = new URL(a.href);
            if (window.location.origin !== url.origin) return;
            if (url.pathname === window.location.pathname && url.search === window.location.search && !url.hash) return;
            if (isHomepage(url.pathname)) {
                e.preventDefault();
                var c = document.createElement('div');
                c.id = 'nav-curtain';
                c.style.cssText = 'position:fixed;inset:0;background:#000;z-index:9999;opacity:0;pointer-events:none;transition:opacity 0.3s ease';
                document.documentElement.appendChild(c);
                requestAnimationFrame(function() {
                    requestAnimationFrame(function() { c.style.opacity = '1'; });
                });
                setTimeout(function() {
                    fetch(a.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
                        .then(function(r) { return r.text(); })
                        .then(function(html) {
                            var parser = new DOMParser();
                            var doc = parser.parseFromString(html, 'text/html');
                            doBodySwap(doc, a.href);
                        })
                        .catch(function() { window.location.href = a.href; });
                }, 320);
                return;
            }
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

    function initHomepageExit() {
        if (!document.body.classList.contains('home-immersive')) return;
        var entryCurtain = document.getElementById('nav-curtain') || document.getElementById('hi-curtain');
        if (entryCurtain) {
            entryCurtain.style.transition = 'opacity 0.3s ease';
            requestAnimationFrame(function() {
                requestAnimationFrame(function() {
                    entryCurtain.style.opacity = '0';
                    setTimeout(function() { entryCurtain.parentNode && entryCurtain.parentNode.removeChild(entryCurtain); }, 350);
                });
            });
        }
        document.querySelectorAll('.hi-wrap a').forEach(function(link) {
            link.addEventListener('click', function(e) {
                var href = this.href;
                if (!href) return;
                try {
                    var url = new URL(href);
                    if (url.origin !== window.location.origin) return;
                    if (url.pathname === window.location.pathname) return;
                } catch(err) { return; }
                e.preventDefault();
                var curtain = document.createElement('div');
                curtain.style.cssText = 'position:fixed;inset:0;background:#000;z-index:9999;opacity:0;pointer-events:none;transition:opacity 0.3s ease';
                document.body.appendChild(curtain);
                requestAnimationFrame(function() {
                    requestAnimationFrame(function() { curtain.style.opacity = '1'; });
                });
                setTimeout(function() { window.location.href = href; }, 320);
            });
        });
    }

    function init() {
        document.documentElement.classList.remove('no-js');
        var yr = document.querySelectorAll('#year'); yr.forEach(function(el){ el.textContent = new Date().getFullYear(); });
        initPageContent();
        initHomepageExit();
    }

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
            var item = e.target.closest('.gallery-item, .equip-card-img');
            if (!item) return;
            var src = item.dataset.image;
            if (!src) {
                var img = item.querySelector('img');
                if (img) src = img.src;
            }
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

    function initScrollReveal() {
        var groups = [
            { sel: '.home-ticker',          stagger: 0   },
            { sel: '.home-col',             stagger: 110 },
            { sel: '.home-photo',           stagger: 130 },
            { sel: '.home-cta-bar',         stagger: 0   },
            { sel: '.video-wrapper',        stagger: 0   },
            { sel: '.facility-intro',       stagger: 0   },
            { sel: '.pricing-row',          stagger: 90  },
            { sel: '.page-2col > *',        stagger: 120 },
            { sel: '.equip-card',           stagger: 50  },
            { sel: '.social-row',           stagger: 60  },
            { sel: '.contact-detail-col',   stagger: 80  },
            { sel: '.contact-header-inner', stagger: 0   },
        ];

        var toObserve = [];
        groups.forEach(function(g) {
            document.querySelectorAll(g.sel).forEach(function(el, i) {
                if (el.classList.contains('reveal')) return;
                el.classList.add('reveal');
                if (g.stagger) el.style.setProperty('--reveal-delay', (i * g.stagger) + 'ms');
                toObserve.push(el);
            });
        });

        if (!toObserve.length) return;

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('revealed');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.05, rootMargin: '0px 0px 60px 0px' });

        toObserve.forEach(function(el) { observer.observe(el); });
    }

    function initEquipmentFilter() {
        var pills = document.querySelectorAll('.filter-pill');
        var cards = document.querySelectorAll('.equip-card');
        if (!pills.length || !cards.length) return;

        pills.forEach(function(pill) {
            pill.addEventListener('click', function() {
                var filter = this.dataset.filter;
                pills.forEach(function(p) { p.classList.remove('active'); });
                this.classList.add('active');
                cards.forEach(function(card) {
                    if (filter === 'all' || card.dataset.category === filter) {
                        card.classList.remove('hidden');
                        card.classList.add('fade-in');
                        setTimeout(function() { card.classList.remove('fade-in'); }, 300);
                    } else {
                        card.classList.add('hidden');
                    }
                });
            });
        });
    }
})();
