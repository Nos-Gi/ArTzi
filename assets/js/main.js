document.addEventListener('DOMContentLoaded', () => {
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
});

