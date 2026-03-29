// ===========================
// ARROW WHOOSH SOUND (Web Audio API)
// ===========================
function playArrowWhoosh() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const now = ctx.currentTime;
        const duration = 0.9;

        const bufSize = ctx.sampleRate * duration;
        const noiseBuf = ctx.createBuffer(1, bufSize, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0);
        for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;

        const bpf = ctx.createBiquadFilter();
        bpf.type = 'bandpass';
        bpf.Q.value = 6;
        bpf.frequency.setValueAtTime(150, now);
        bpf.frequency.exponentialRampToValueAtTime(3500, now + duration * 0.35);
        bpf.frequency.exponentialRampToValueAtTime(600, now + duration);

        const noiseGain = ctx.createGain();
        noiseGain.gain.setValueAtTime(0, now);
        noiseGain.gain.linearRampToValueAtTime(0.4, now + 0.04);
        noiseGain.gain.setValueAtTime(0.4, now + duration * 0.25);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

        noise.connect(bpf).connect(noiseGain).connect(ctx.destination);

        const osc = ctx.createOscillator();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(900, now);
        osc.frequency.exponentialRampToValueAtTime(180, now + duration);

        const oscGain = ctx.createGain();
        oscGain.gain.setValueAtTime(0, now);
        oscGain.gain.linearRampToValueAtTime(0.1, now + 0.03);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.5);

        osc.connect(oscGain).connect(ctx.destination);

        const impactTime = now + 0.85;
        const impactOsc = ctx.createOscillator();
        impactOsc.type = 'sine';
        impactOsc.frequency.setValueAtTime(120, impactTime);
        impactOsc.frequency.exponentialRampToValueAtTime(40, impactTime + 0.15);

        const impactGain = ctx.createGain();
        impactGain.gain.setValueAtTime(0, impactTime);
        impactGain.gain.linearRampToValueAtTime(0.25, impactTime + 0.01);
        impactGain.gain.exponentialRampToValueAtTime(0.001, impactTime + 0.2);

        impactOsc.connect(impactGain).connect(ctx.destination);

        noise.start(now); noise.stop(now + duration);
        osc.start(now); osc.stop(now + duration);
        impactOsc.start(impactTime); impactOsc.stop(impactTime + 0.3);

        setTimeout(() => ctx.close(), 2500);
    } catch (e) { /* silent */ }
}

// ===========================
// SPLASH — PARABOLIC ARROW ANIMATION
// ===========================
function initSplash() {
    const splash = document.getElementById('splash');
    const arrow = document.getElementById('splash-arrow');
    const targetO = document.getElementById('target-o');

    if (!splash || !arrow || !targetO) return;

    // Wait for layout to settle
    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            const targetRect = targetO.getBoundingClientRect();
            const endX = targetRect.left + targetRect.width / 2;
            const endY = targetRect.top + targetRect.height / 2;

            // Arrow starts off-screen right, below center
            const startX = window.innerWidth + 100;
            const startY = window.innerHeight * 0.75;

            // Parabolic arc height (arrow arcs ABOVE straight line)
            const arcHeight = Math.min(window.innerHeight * 0.3, 250);
            const duration = 1200;

            setTimeout(() => {
                playArrowWhoosh();
                const startTime = performance.now();

                function animate(now) {
                    const elapsed = now - startTime;
                    let t = Math.min(elapsed / duration, 1);

                    // Ease-out cubic for natural deceleration
                    const eased = 1 - Math.pow(1 - t, 3);

                    // Position: linear interpolation + parabolic arc
                    const x = startX + eased * (endX - startX);
                    const y = startY + eased * (endY - startY) - arcHeight * 4 * eased * (1 - eased);

                    // Tangent angle for rotation
                    const dt = 0.01;
                    const t2 = Math.min(eased + dt, 1);
                    const x2 = startX + t2 * (endX - startX);
                    const y2 = startY + t2 * (endY - startY) - arcHeight * 4 * t2 * (1 - t2);
                    const angle = Math.atan2(y2 - y, x2 - x) * (180 / Math.PI);

                    arrow.style.left = x + 'px';
                    arrow.style.top = y + 'px';
                    arrow.style.transform = 'translate(-50%,-50%) rotate(' + angle + 'deg)';
                    arrow.style.opacity = '1';

                    if (elapsed < duration) {
                        requestAnimationFrame(animate);
                    } else {
                        onArrowImpact(splash, arrow, endX, endY, angle);
                    }
                }

                requestAnimationFrame(animate);
            }, 400);
        });
    });
}

function onArrowImpact(splash, arrow, x, y, finalAngle) {
    const targetO = document.getElementById('target-o');

    // Impact particles
    createImpactParticles(splash, x, y);

    // Target glow pulse
    if (targetO) targetO.classList.add('target-hit');

    // Arrow vibration
    arrow.style.setProperty('--final-angle', finalAngle + 'deg');
    arrow.classList.add('arrow-vibrating');

    // Fade out splash
    setTimeout(() => {
        splash.style.transition = 'opacity 0.8s ease-out';
        splash.style.opacity = '0';
        setTimeout(() => {
            splash.style.pointerEvents = 'none';
            setTimeout(() => splash.remove(), 300);
        }, 800);
    }, 500);
}

function createImpactParticles(container, cx, cy) {
    const count = 18;
    for (let i = 0; i < count; i++) {
        const p = document.createElement('div');
        const size = 2 + Math.random() * 4;
        p.style.cssText = 'position:absolute;width:' + size + 'px;height:' + size +
            'px;background:#FFD700;border-radius:50%;left:' + cx + 'px;top:' + cy +
            'px;pointer-events:none;z-index:100;box-shadow:0 0 6px rgba(255,215,0,0.8);';
        container.appendChild(p);

        const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.6;
        const vel = 60 + Math.random() * 180;
        const vx = Math.cos(angle) * vel;
        const vy = Math.sin(angle) * vel;
        const dur = 500 + Math.random() * 400;
        const st = performance.now();

        (function animP(now) {
            const t = Math.min((now - st) / dur, 1);
            p.style.left = (cx + vx * t) + 'px';
            p.style.top = (cy + vy * t + 120 * t * t) + 'px';
            p.style.opacity = (1 - t).toString();
            if (t < 1) requestAnimationFrame(animP);
            else p.remove();
        })(performance.now());
    }
}

// ===========================
// CHEMICAL ENGINEERING BACKGROUND
// ===========================
function initChemBackground() {
    const chemBg = document.getElementById('chem-bg');
    if (!chemBg) return;

    const svg = [
        '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="300" viewBox="0 0 300 300">',
        '<rect x="50" y="0" width="3" height="300" fill="rgba(255,215,0,0.06)" rx="1"/>',
        '<rect x="250" y="0" width="3" height="300" fill="rgba(255,215,0,0.06)" rx="1"/>',
        '<rect x="150" y="0" width="2" height="300" fill="rgba(255,215,0,0.035)" rx="1"/>',
        '<rect x="50" y="75" width="200" height="1.5" fill="rgba(255,215,0,0.05)"/>',
        '<rect x="50" y="150" width="200" height="1.5" fill="rgba(255,215,0,0.05)"/>',
        '<rect x="50" y="225" width="200" height="1.5" fill="rgba(255,215,0,0.05)"/>',
        '<path d="M80,75 Q80,60 95,60 Q110,60 110,75" fill="none" stroke="rgba(255,215,0,0.06)" stroke-width="1"/>',
        '<path d="M170,75 Q170,62 182,62 Q194,62 194,75" fill="none" stroke="rgba(255,215,0,0.06)" stroke-width="1"/>',
        '<path d="M95,150 Q95,136 108,136 Q121,136 121,150" fill="none" stroke="rgba(255,215,0,0.06)" stroke-width="1"/>',
        '<path d="M190,150 Q190,138 202,138 Q214,138 214,150" fill="none" stroke="rgba(255,215,0,0.06)" stroke-width="1"/>',
        '<path d="M110,225 Q110,212 122,212 Q134,212 134,225" fill="none" stroke="rgba(255,215,0,0.06)" stroke-width="1"/>',
        '<circle cx="50" cy="112" r="10" fill="none" stroke="rgba(255,215,0,0.06)" stroke-width="1"/>',
        '<line x1="50" y1="102" x2="50" y2="106" stroke="rgba(255,215,0,0.06)" stroke-width="0.8"/>',
        '<line x1="50" y1="118" x2="50" y2="122" stroke="rgba(255,215,0,0.06)" stroke-width="0.8"/>',
        '<circle cx="250" cy="187" r="10" fill="none" stroke="rgba(255,215,0,0.06)" stroke-width="1"/>',
        '<line x1="250" y1="177" x2="250" y2="181" stroke="rgba(255,215,0,0.06)" stroke-width="0.8"/>',
        '<polygon points="147,73 153,73 158,82 142,82" fill="none" stroke="rgba(255,215,0,0.05)" stroke-width="0.8"/>',
        '<polygon points="147,148 153,148 158,157 142,157" fill="none" stroke="rgba(255,215,0,0.05)" stroke-width="0.8"/>',
        '<circle cx="75" cy="98" r="3" fill="rgba(255,215,0,0.03)"/>',
        '<circle cx="115" cy="130" r="4" fill="rgba(255,215,0,0.025)"/>',
        '<circle cx="190" cy="175" r="3" fill="rgba(255,215,0,0.03)"/>',
        '<circle cx="230" cy="200" r="2.5" fill="rgba(255,215,0,0.025)"/>',
        '<circle cx="70" cy="205" r="3.5" fill="rgba(255,215,0,0.025)"/>',
        '<circle cx="140" cy="255" r="2.5" fill="rgba(255,215,0,0.03)"/>',
        '<polygon points="100,25 113,33 113,47 100,55 87,47 87,33" fill="none" stroke="rgba(255,215,0,0.035)" stroke-width="0.8"/>',
        '<polygon points="210,265 223,273 223,287 210,295 197,287 197,273" fill="none" stroke="rgba(255,215,0,0.035)" stroke-width="0.8"/>',
        '<rect x="0" y="30" width="50" height="2" fill="rgba(255,215,0,0.04)" rx="1"/>',
        '<rect x="250" y="30" width="50" height="2" fill="rgba(255,215,0,0.04)" rx="1"/>',
        '<rect x="0" y="270" width="50" height="2" fill="rgba(255,215,0,0.04)" rx="1"/>',
        '<rect x="250" y="270" width="50" height="2" fill="rgba(255,215,0,0.04)" rx="1"/>',
        '</svg>'
    ].join('');

    chemBg.style.backgroundImage = 'url("data:image/svg+xml,' + encodeURIComponent(svg) + '")';
    chemBg.style.backgroundRepeat = 'repeat';
    chemBg.style.backgroundSize = '300px 300px';

    const hero = document.getElementById('hero');
    let heroBottom = hero ? hero.offsetTop + hero.offsetHeight : window.innerHeight;

    function updateOpacity() {
        const scrollY = window.scrollY;
        const fadeStart = heroBottom * 0.4;
        const fadeEnd = heroBottom * 1.1;

        if (scrollY <= fadeStart) {
            chemBg.style.opacity = '0';
        } else if (scrollY >= fadeEnd) {
            chemBg.style.opacity = '1';
        } else {
            chemBg.style.opacity = ((scrollY - fadeStart) / (fadeEnd - fadeStart)).toString();
        }
    }

    window.addEventListener('scroll', updateOpacity, { passive: true });
    window.addEventListener('resize', () => {
        heroBottom = hero ? hero.offsetTop + hero.offsetHeight : window.innerHeight;
    });
}

// ===========================
// SCROLL ANIMATIONS
// ===========================
function initScrollAnimations() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const el = entry.target;
                    const delay = parseInt(el.dataset.delay) || 0;
                    setTimeout(() => el.classList.add('visible'), delay);
                    observer.unobserve(el);
                }
            });
        },
        { threshold: 0.08, rootMargin: '0px 0px -40px 0px' }
    );

    document.querySelectorAll('[data-animate]').forEach((el) => observer.observe(el));
}

// ===========================
// COUNTER ANIMATION
// ===========================
function initCounters() {
    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    animateCount(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        },
        { threshold: 0.5 }
    );

    document.querySelectorAll('[data-count]').forEach((el) => observer.observe(el));
}

function animateCount(el) {
    const target = parseInt(el.dataset.count);
    const duration = 1800;
    const start = performance.now();

    function update(now) {
        const progress = Math.min((now - start) / duration, 1);
        const eased = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        el.textContent = Math.round(eased * target);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// ===========================
// NAVBAR
// ===========================
function initNavbar() {
    const navbar = document.getElementById('navbar');
    const links = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    const toggle = document.getElementById('mobile-toggle');
    const mobileMenu = document.getElementById('mobile-menu');

    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 50);

        let current = '';
        sections.forEach((s) => {
            if (window.scrollY >= s.offsetTop - 200) current = s.id;
        });
        links.forEach((l) => {
            l.classList.toggle('active', l.dataset.section === current);
        });
    });

    if (toggle && mobileMenu) {
        toggle.addEventListener('click', () => {
            toggle.classList.toggle('active');
            mobileMenu.classList.toggle('open');
        });

        mobileMenu.querySelectorAll('a').forEach((a) => {
            a.addEventListener('click', () => {
                toggle.classList.remove('active');
                mobileMenu.classList.remove('open');
            });
        });
    }
}

// ===========================
// SMOOTH SCROLL
// ===========================
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                window.scrollTo({
                    top: target.offsetTop - 80,
                    behavior: 'smooth',
                });
            }
        });
    });
}

// ===========================
// TILT EFFECT
// ===========================
function initTilt() {
    if (window.innerWidth < 768) return;

    document.querySelectorAll('.card-glass').forEach((card) => {
        card.addEventListener('mousemove', (e) => {
            const r = card.getBoundingClientRect();
            const x = (e.clientX - r.left - r.width / 2) / (r.width / 2);
            const y = (e.clientY - r.top - r.height / 2) / (r.height / 2);
            card.style.transform = `perspective(800px) rotateX(${y * -2}deg) rotateY(${x * 2}deg) translateY(-4px)`;
        });
        card.addEventListener('mouseleave', () => {
            card.style.transform = '';
        });
    });
}

// ===========================
// INIT
// ===========================
document.addEventListener('DOMContentLoaded', () => {
    initSplash();
    initScrollAnimations();
    initCounters();
    initNavbar();
    initSmoothScroll();
    initTilt();
    initChemBackground();
});
