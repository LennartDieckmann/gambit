<script>
/* ================== HEADER ================== */
class PerformantHeaderHide {
  constructor(headerSelector = '.header') {
    this.header = document.querySelector(headerSelector);
    if (!this.header) return;
    this.lastScrollY = window.pageYOffset;
    this.scrollThreshold = 5;
    this.hideThreshold = 100;
    this.ticking = false;
    this.applyHeaderStyles();
    window.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
    window.addEventListener('resize', this.handleResize.bind(this), { passive: true });
    this.updateHeader();
  }
  applyHeaderStyles() {
    Object.assign(this.header.style, {
      position:'fixed', top:'0', left:'0', width:'100%',
      zIndex:'1000', transition:'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)',
      willChange:'transform', transform:'translate3d(0,0,0)'
    });
    this.header.setAttribute('data-header-state','visible');
  }
  handleScroll() {
    if (!this.ticking) {
      requestAnimationFrame(this.updateHeader.bind(this));
      this.ticking = true;
    }
  }
  handleResize() {
    clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(()=>this.updateHeader(),100);
  }
  updateHeader() {
    const cY = window.pageYOffset;
    const diff = cY - this.lastScrollY;
    if (Math.abs(diff) < this.scrollThreshold) { this.ticking=false; return; }
    const down = diff>0;
    if (cY <= this.hideThreshold) this.showHeader();
    else if (down) this.hideHeader();
    else this.showHeader();
    this.lastScrollY = cY; this.ticking=false;
  }
  hideHeader() {
    if (this.header.getAttribute('data-header-state')!=='hidden') {
      this.header.style.transform='translate3d(0,-100%,0)';
      this.header.setAttribute('data-header-state','hidden');
      this.header.setAttribute('aria-hidden','true');
    }
  }
  showHeader() {
    if (this.header.getAttribute('data-header-state')!=='visible') {
      this.header.style.transform='translate3d(0,0,0)';
      this.header.setAttribute('data-header-state','visible');
      this.header.setAttribute('aria-hidden','false');
    }
  }
}
</script>

<script>
/* ============================================
   INIT-FUNKTIONEN (idempotent, Swup-kompatibel)
   ============================================ */

function initThemeToggle(root=document) {
  const html = document.documentElement;
  const applyTheme = (theme) => {
    html.classList.remove("u-theme-light","u-theme-dark");
    html.classList.add(`u-theme-${theme}`);
    localStorage.setItem("user-theme", theme);
  };
  root.querySelectorAll("[data-toggle-theme]").forEach(btn=>{
    btn.removeEventListener('click', btn._themeToggleHandler);
    btn._themeToggleHandler = (e) => {
      e.preventDefault();
      const current = localStorage.getItem("user-theme") || 
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
      applyTheme(current === "dark" ? "light" : "dark");
    };
    btn.addEventListener('click', btn._themeToggleHandler);
  });
}

function initSmoothScroll() {
  if (window._smoothScrollReady) return;
  window._smoothScrollReady = true;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const loco = new LocomotiveScroll({
    autoStart: true,
    lenisOptions: { lerp: 0.1, duration: 1.2, smoothWheel: true }
  });
  window.lenis = {
    stop:   () => loco.stop(),
    start:  () => loco.start(),
    destroy:() => loco.destroy(),
    scrollTo:(t,o={}) => loco.scrollTo(t,o)
  };
}

function initDirectionalButtonHover(root=document) {
  root.querySelectorAll('[data-btn-hover]').forEach(btn=>{
    btn.removeEventListener('mousemove', btn._btnHoverHandler);
    btn._btnHoverHandler = (e)=>{
      const r=btn.getBoundingClientRect(), w=r.width,h=r.height,cx=r.left+w/2;
      const offX=((e.clientX-r.left)/w)*100, offY=((e.clientY-r.top)/h)*100;
      let offC=((e.clientX-cx)/(w/2))*50; offC=Math.abs(offC);
      const circle=btn.querySelector('.btn__circle');
      if(circle){
circle.style.left  = `${offX.toFixed(1)}%`;
circle.style.top   = `${offY.toFixed(1)}%`;
circle.style.width = `${115 + offC * 2}%`;
      }
    };
    btn.addEventListener('mousemove', btn._btnHoverHandler);
  });
}

function initDynamicCustomTextCursor(root = document) {
  // 🚫 Auf Touch-Geräten deaktivieren
  if ("ontouchstart" in window || navigator.maxTouchPoints > 0) {
    const cursor = document.querySelector(".cursor");
    if (cursor) cursor.style.display = "none"; // Cursor komplett ausblenden
    return; // Keine weitere Initialisierung
  }

  const cursor = root.querySelector(".cursor") || document.querySelector(".cursor");
  if (!cursor) return;

  const p = cursor.querySelector("p");
  let current = null, last = "";

  // Startposition leicht versetzt
  gsap.set(cursor, { xPercent: 8, yPercent: 24 });

  // 🧹 Vorherige Event-Listener entfernen (Swup-sicher)
  if (window._cursorMoveHandler) {
    window.removeEventListener("mousemove", window._cursorMoveHandler);
  }

  // GSAP QuickTo für performante Mausbewegungen
  const xTo = gsap.quickTo(cursor, "x", { ease: "power3" });
  const yTo = gsap.quickTo(cursor, "y", { ease: "power3" });

  // 🖱️ Mausbewegung verfolgen
  window._cursorMoveHandler = (e) => {
    let xP = 8, yP = 24;
    const cX = e.clientX, cY = e.clientY;

    // Korrektur, falls Cursor nahe am Rand ist
    if (cX > window.innerWidth - (cursor.offsetWidth + 16)) xP = -100;
    if (cY > window.innerHeight * 0.9) yP = -120;

    // Text aktualisieren, falls nötig
    if (current) {
      const t = current.getAttribute("data-cursor");
      if (t !== last) {
        p.innerHTML = t;
        last = t;
      }
    }

    // Bewegung animieren
    gsap.to(cursor, { xPercent: xP, yPercent: yP, duration: 0.9, ease: "power3" });
    xTo(cX);
    yTo(cY);
  };

  window.addEventListener("mousemove", window._cursorMoveHandler);

  // 🎯 Hover-Effekte auf alle data-cursor-Elemente anwenden
  root.querySelectorAll("[data-cursor]").forEach((t) => {
    t.removeEventListener("mouseenter", t._cursorEnterHandler);
    t._cursorEnterHandler = () => {
      current = t;
      const txt = t.getAttribute("data-cursor");
      if (txt !== last) {
        p.innerHTML = txt;
        last = txt;
      }
    };
    t.addEventListener("mouseenter", t._cursorEnterHandler);
  });
}
function initContentRevealScroll(root=document){
  const html = document.documentElement;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const ctx = gsap.context(()=>{

    const scrollGroups = Array.from(root.querySelectorAll('[data-reveal-group]'));
    const loadGroups   = Array.from(root.querySelectorAll('[data-reveal-group-load]'));

    // ---------- 1) Initial-States ----------
    if (prefersReduced) {
      [...scrollGroups, ...loadGroups].forEach(el=>{
        gsap.set(el, { y:0, autoAlpha:1, clearProps:'transform,opacity,visibility' });
      });
      requestAnimationFrame(()=> html.classList.remove('reveal-boot'));
      return;
    }

    function setInitialStatesForGroup(groupEl, fallbackDistance='2em'){
      const groupDistance = groupEl.getAttribute('data-distance') || fallbackDistance;
      const directChildren = Array.from(groupEl.children).filter(el=>el.nodeType===1);
      if (!directChildren.length){
        gsap.set(groupEl, { y:groupDistance, autoAlpha:0 });
        return;
      }

      directChildren.forEach(child=>{
        const nestedGroup = child.matches('[data-reveal-group-nested]')
          ? child
          : child.querySelector(':scope [data-reveal-group-nested]');

        if (nestedGroup){
          const includeParent = child.getAttribute('data-ignore')==="false" 
                             || nestedGroup.getAttribute('data-ignore')==="false";
          if (includeParent) gsap.set(child, { y:groupDistance, autoAlpha:0 });
          const nestedD = nestedGroup.getAttribute('data-distance') || groupDistance;
          Array.from(nestedGroup.children).forEach(t=> gsap.set(t,{y:nestedD,autoAlpha:0}));
        } else {
          const isNestedSelf = child.matches('[data-reveal-group-nested]');
          const d = isNestedSelf ? groupDistance : (child.getAttribute('data-distance')||groupDistance);
          gsap.set(child, { y:d, autoAlpha:0 });
        }
      });
    }

    scrollGroups.forEach(el=>setInitialStatesForGroup(el));
    loadGroups.forEach(el=>setInitialStatesForGroup(el));

    requestAnimationFrame(()=> html.classList.remove('reveal-boot'));

    // ---------- 2) Scroll Groups ----------
    scrollGroups.forEach(groupEl=>{
      const groupStaggerSec = (parseFloat(groupEl.getAttribute('data-stagger')) || 100) / 1000;
      const groupDistance   = groupEl.getAttribute('data-distance') || '2em';
      const triggerStart    = groupEl.getAttribute('data-start') || 'top 80%';
      const animDuration    = 0.8;
      const animEase        = "power4.inOut";

      const directChildren = Array.from(groupEl.children).filter(el=>el.nodeType===1);
      if (!directChildren.length){
        ScrollTrigger.create({
          trigger: groupEl, start:triggerStart, once:true,
          onEnter: ()=> gsap.to(groupEl,{ y:0,autoAlpha:1,duration:animDuration,ease:animEase,
            onComplete:()=>gsap.set(groupEl,{clearProps:'transform,opacity,visibility'})
          })
        });
        return;
      }

      const slots=[];
      directChildren.forEach(child=>{
        const nestedGroup = child.matches('[data-reveal-group-nested]')
          ? child
          : child.querySelector(':scope [data-reveal-group-nested]');
        if (nestedGroup){
          const includeParent = child.getAttribute('data-ignore')==="false" 
                             || nestedGroup.getAttribute('data-ignore')==="false";
          slots.push({type:'nested',parentEl:child,nestedEl:nestedGroup,includeParent});
        } else {
          slots.push({type:'item',el:child});
        }
      });

      ScrollTrigger.create({
        trigger: groupEl, start:triggerStart, once:true,
        onEnter: ()=>{
          const tl=gsap.timeline();
          slots.forEach((slot,slotIndex)=>{
            const slotTime = slotIndex * groupStaggerSec;

            if (slot.type==='item'){
              tl.to(slot.el,{ y:0,autoAlpha:1,duration:animDuration,ease:animEase,
                onComplete:()=>gsap.set(slot.el,{clearProps:'transform,opacity,visibility'})
              },slotTime);
            } else {
              if (slot.includeParent){
                tl.to(slot.parentEl,{ y:0,autoAlpha:1,duration:animDuration,ease:animEase,
                  onComplete:()=>gsap.set(slot.parentEl,{clearProps:'transform,opacity,visibility'})
                },slotTime);
              }
              const nestedMs=parseFloat(slot.nestedEl.getAttribute('data-stagger'));
              const nestedStaggerSec=isNaN(nestedMs)?groupStaggerSec:nestedMs/1000;
              Array.from(slot.nestedEl.children).forEach((nestedChild,nestedIndex)=>{
                tl.to(nestedChild,{ y:0,autoAlpha:1,duration:animDuration,ease:animEase,
                  onComplete:()=>gsap.set(nestedChild,{clearProps:'transform,opacity,visibility'})
                },slotTime+nestedIndex*nestedStaggerSec);
              });
            }
          });
        }
      });
    });

    // ---------- 3) Load Groups ----------
    loadGroups.forEach(groupEl=>{
      const groupStaggerSec = (parseFloat(groupEl.getAttribute('data-stagger')) || 100) / 1000;
      const groupDistance   = groupEl.getAttribute('data-distance') || '2em';
      const animDuration    = 0.8;
      const animEase        = "power4.inOut";

      const directChildren = Array.from(groupEl.children).filter(el=>el.nodeType===1);
      if (!directChildren.length){
        gsap.to(groupEl,{ y:0,autoAlpha:1,duration:animDuration,ease:animEase });
        return;
      }

      const slots=[];
      directChildren.forEach(child=>{
        const nestedGroup = child.matches('[data-reveal-group-nested]')
          ? child
          : child.querySelector(':scope [data-reveal-group-nested]');
        if (nestedGroup){
          const includeParent = child.getAttribute('data-ignore')==="false" 
                             || nestedGroup.getAttribute('data-ignore')==="false";
          slots.push({type:'nested',parentEl:child,nestedEl:nestedGroup,includeParent});
        } else {
          slots.push({type:'item',el:child});
        }
      });

      // Timeline für Page Load Reveal (kein ScrollTrigger)
      const tl = gsap.timeline({delay:0.25});
      slots.forEach((slot,slotIndex)=>{
        const slotTime = slotIndex * groupStaggerSec;
        if (slot.type==='item'){
          tl.to(slot.el,{ y:0,autoAlpha:1,duration:animDuration,ease:animEase,
            onComplete:()=>gsap.set(slot.el,{clearProps:'transform,opacity,visibility'})
          },slotTime);
        } else {
          if (slot.includeParent){
            tl.to(slot.parentEl,{ y:0,autoAlpha:1,duration:animDuration,ease:animEase,
              onComplete:()=>gsap.set(slot.parentEl,{clearProps:'transform,opacity,visibility'})
            },slotTime);
          }
          const nestedMs=parseFloat(slot.nestedEl.getAttribute('data-stagger'));
          const nestedStaggerSec=isNaN(nestedMs)?groupStaggerSec:nestedMs/1000;
          Array.from(slot.nestedEl.children).forEach((nestedChild,nestedIndex)=>{
            tl.to(nestedChild,{ y:0,autoAlpha:1,duration:animDuration,ease:animEase,
              onComplete:()=>gsap.set(nestedChild,{clearProps:'transform,opacity,visibility'})
            },slotTime+nestedIndex*nestedStaggerSec);
          });
        }
      });
    });

  }, root);

  return ()=>ctx.revert();
}
  
function initCopyEmailClipboard(root=document){
  root.querySelectorAll('[data-email-clipboard]').forEach(el=>{
    el.removeEventListener('click', el._copyHandler);
    el._copyHandler = ()=>navigator.clipboard.writeText(el.dataset.emailClipboard||'').catch(()=>{});
    el.addEventListener('click', el._copyHandler);
  });
}

function initSwiper(root = document) {
  // Definiere hier alle Slider-Klassen, die Swiper verwenden sollen
  const sliderClasses = ['.slider-cases_comp', '.slider-images', '.slider-mixed-media'];

  // Alte Swiper-Instanzen entfernen (nur innerhalb des root)
  root.querySelectorAll('.swiper').forEach(s => {
    if (s.swiper) s.swiper.destroy(true, true);
  });

  // Jeden Slider-Typ durchgehen
  sliderClasses.forEach(selector => {
    root.querySelectorAll(selector).forEach(container => {
      const swiperEl = container.querySelector(':scope > .swiper');
      if (!swiperEl) return;

      // Vorhandene Instanz zerstören (falls nötig)
      if (swiperEl.swiper) swiperEl.swiper.destroy(true, true);

      // Attribute auslesen
      const loop = container.getAttribute('data-swiper-loop') === 'true';
      const freeMode = container.getAttribute('data-swiper-free-mode') === 'true';
      const grabCursor = container.getAttribute('data-swiper-grab-cursor') === 'true';
      const keyboardEnabled = container.getAttribute('data-swiper-keyboard') === 'true';
      const mousewheelEnabled = container.getAttribute('data-swiper-mousewheel') === 'true';
      const hasAutoplay = container.getAttribute('data-swiper-autoplay') === 'true';
      const autoplayDelay = Number(container.getAttribute('data-swiper-autoplay-delay')) || 3000;
      const pauseOnHover = container.getAttribute('data-swiper-pause-on-hover') === 'true';
      const pauseOnInteraction = container.getAttribute('data-swiper-pause-on-interaction') !== 'false';
      const speed = Number(container.getAttribute('data-swiper-speed')) || 300;

      // Neue Swiper-Instanz
      const swiper = new Swiper(swiperEl, {
        slidesPerView: 'auto',
        loop,
        speed,
        freeMode,
        grabCursor,
        keyboard: keyboardEnabled ? { enabled: true, onlyInViewport: true } : false,
        mousewheel: mousewheelEnabled ? { enabled: true, forceToAxis: true } : false,
        autoplay: hasAutoplay
          ? { delay: autoplayDelay, disableOnInteraction: pauseOnInteraction }
          : false,
        pagination: {
          el: container.querySelector('.swiper-bullet-wrapper'),
          clickable: true
        },
        navigation: {
          nextEl: container.querySelector('.swiper-next'),
          prevEl: container.querySelector('.swiper-prev')
        }
      });

      // Hover-Pause (Autoplay)
      if (hasAutoplay && pauseOnHover) {
        container.addEventListener('mouseenter', () => swiper.autoplay.stop());
        container.addEventListener('mouseleave', () => swiper.autoplay.start());
      }

      console.log(`✅ Swiper initialized for ${selector}`, swiper);
    });
  });
}

// Initialisierung beim Laden
document.addEventListener("DOMContentLoaded", () => {
  initSwiper();
});
  
window.initLogoWallCycle = function initLogoWallCycle(root = document) {
  const roots = Array.from(root.querySelectorAll('[data-logo-wall-cycle-init]'));
  if (!roots.length) return;

  roots.forEach((rootEl) => {
    // 🔁 Vorherige Instanz säubern
    if (rootEl._logoWallCtx) {
      rootEl._logoWallCtx.revert();
      rootEl._logoWallCtx = null;
    }
    if (rootEl._logoWallRO) {
      rootEl._logoWallRO.disconnect();
      rootEl._logoWallRO = null;
    }
    if (rootEl._logoWallVisHandler) {
      document.removeEventListener('visibilitychange', rootEl._logoWallVisHandler);
      rootEl._logoWallVisHandler = null;
    }

    // Neuer GSAP-Kontext → alles, was hier erstellt wird, kann sauber revertet werden
    const ctx = gsap.context(() => {
      const loopDelay = parseFloat(rootEl.getAttribute('data-logo-wall-delay')) || 1.5;
      const duration  = parseFloat(rootEl.getAttribute('data-logo-wall-duration')) || 0.9;

      const list = rootEl.querySelector('[data-logo-wall-list]');
      if (!list) return;
      const items = Array.from(list.querySelectorAll('[data-logo-wall-item]'));
      if (!items.length) return;

      const shuffleFront = rootEl.getAttribute('data-logo-wall-shuffle') !== 'false';
      const originalTargets = items
        .map(item => item.querySelector('[data-logo-wall-target]'))
        .filter(Boolean);

      let visibleItems = [];
      let visibleCount = 0;
      let pool = [];
      let pattern = [];
      let patternIndex = 0;
      let tl = null;

      // Hilfsfunktionen
      const isVisible = el => window.getComputedStyle(el).display !== 'none';
      const shuffleArray = arr => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };

      // Setup – initialer Aufbau oder Neuaufbau bei Resize
      function setup() {
        if (tl) {
          tl.kill();
          tl = null;
        }

        visibleItems = items.filter(isVisible);
        visibleCount = visibleItems.length;
        if (!visibleCount) return;

        // Reihenfolge der Slot-Wechsel
        pattern = shuffleArray([...Array(visibleCount).keys()]);
        patternIndex = 0;

        // Vorherige Targets entfernen
        items.forEach(item => {
          item.querySelectorAll('[data-logo-wall-target]').forEach(n => n.remove());
        });

        // Pool aufbauen (Kopien der Original-Targets)
        pool = originalTargets.map(n => n.cloneNode(true));

        let front, rest;
        if (shuffleFront) {
          const shuffled = shuffleArray(pool);
          front = shuffled.slice(0, visibleCount);
          rest = shuffleArray(shuffled.slice(visibleCount));
        } else {
          front = pool.slice(0, visibleCount);
          rest = shuffleArray(pool.slice(visibleCount));
        }
        pool = [...front, ...rest];

        // Sichtbare Slots initial befüllen
        for (let i = 0; i < visibleCount; i++) {
          const parent =
            visibleItems[i].querySelector('[data-logo-wall-target-parent]') ||
            visibleItems[i];
          if (pool[0]) parent.appendChild(pool.shift());
        }

        // GSAP-Timeline für den endlosen Zyklus
        tl = gsap.timeline({ repeat: -1, repeatDelay: loopDelay });
        tl.call(swapNext);
        tl.play();

        rootEl._logoWallTL = tl;
      }

      // Tauscht das nächste Element in der Wall aus
      function swapNext() {
        const nowCount = items.filter(isVisible).length;
        if (nowCount !== visibleCount) {
          setup();
          return;
        }
        if (!pool.length || !visibleCount) return;

        const idx = pattern[patternIndex % visibleCount];
        patternIndex++;

        const container = visibleItems[idx];
        const parent =
          container.querySelector('[data-logo-wall-target-parent]') ||
          container;

        const current = parent.querySelector('[data-logo-wall-target]');
        const incoming = pool.shift();

        gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
        parent.appendChild(incoming);

        if (current) {
          gsap.to(current, {
            yPercent: -50,
            autoAlpha: 0,
            duration,
            ease: 'expo.inOut',
            onComplete: () => {
              current.remove();
              pool.push(current);
            },
          });
        }

        gsap.to(incoming, {
          yPercent: 0,
          autoAlpha: 1,
          duration,
          delay: 0.1,
          ease: 'expo.inOut',
        });
      }

      // Initialer Aufbau
      setup();

      // ScrollTrigger pausiert/resumed Timeline bei Sichtbarkeit
      const st = ScrollTrigger.create({
        trigger: rootEl,
        start: 'top bottom',
        end: 'bottom top',
        onEnter: () => tl && tl.play(),
        onLeave: () => tl && tl.pause(),
        onEnterBack: () => tl && tl.play(),
        onLeaveBack: () => tl && tl.pause(),
      });

      // ResizeObserver → rebuild bei Breakpoint-Wechsel
      const ro = new ResizeObserver(() => {
        if (rootEl._logoWallResizeRAF) cancelAnimationFrame(rootEl._logoWallResizeRAF);
        rootEl._logoWallResizeRAF = requestAnimationFrame(setup);
      });
      ro.observe(rootEl);
      rootEl._logoWallRO = ro;

      // Sichtbarkeit des Tabs steuert Animation
      const visHandler = () => {
        if (!tl) return;
        document.hidden ? tl.pause() : tl.play();
      };
      document.addEventListener('visibilitychange', visHandler);
      rootEl._logoWallVisHandler = visHandler;

      // Cleanup bei ctx.revert()
      ctx.add(() => {
        st.kill();
        ro.disconnect();
        document.removeEventListener('visibilitychange', visHandler);
        if (tl) tl.kill();
        tl = null;
      });
    }, rootEl);

    rootEl._logoWallCtx = ctx;
  });
};

// Initialisierung beim ersten Seitenaufruf
document.addEventListener('DOMContentLoaded', () => {
  window.initLogoWallCycle(document);
});

function initHeaderController() {
  if (!window.headerController && typeof PerformantHeaderHide === 'function') {
    window.headerController = new PerformantHeaderHide('.header');
  }
}

function initCSSMarquee(root=document) {
  const marquees = root.querySelectorAll('[data-css-marquee]');
  marquees.forEach(marquee=>{
    if (marquee.dataset.marqueeInit==="true") return;
    marquee.dataset.marqueeInit="true";
    requestAnimationFrame(()=>{
      setTimeout(()=>{
        marquee.querySelectorAll('[data-css-marquee-list]').forEach(list=>{
          const clone1=list.cloneNode(true), clone2=list.cloneNode(true);
          marquee.appendChild(clone1); marquee.appendChild(clone2);
          const dur=list.offsetWidth/75;
          [list,clone1,clone2].forEach(l=>{ l.style.animationDuration=dur+'s'; });
        });
        const observer=new IntersectionObserver(entries=>{
          entries.forEach(entry=>{
            marquee.querySelectorAll('[data-css-marquee-list]').forEach(list=>{
              list.style.animationPlayState=entry.isIntersecting?'running':'paused';
            });
          });
        });
        observer.observe(marquee);
      },50);
    });
  });
}

function initStackingCardsParallax(root=document){
  const cards=root.querySelectorAll("[data-stacking-cards-item]");
  if (cards.length<2) return;
  cards.forEach((card,i)=>{
    if (i===0) return;
    const prev=cards[i-1], img=prev.querySelector("[data-stacking-cards-img]");
    gsap.timeline({scrollTrigger:{trigger:card,start:"top bottom",end:"top top",scrub:true}})
      .fromTo(prev,{yPercent:0},{yPercent:50})
      .fromTo(img,{rotate:0,yPercent:0},{rotate:-5,yPercent:-25},"<");
  });
}
  
function initPlayVideoHover(root = document) {
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;

  root.querySelectorAll('[data-video-on-hover]').forEach(wrapper => {
    const video = wrapper.querySelector('video');
    const src = wrapper.getAttribute('data-video-src') || '';
    if (!video || !src) return;

    // Vorherige Event-Handler (Swup-kompatibel) entfernen
    wrapper.removeEventListener('mouseenter', wrapper._vhEnter);
    wrapper.removeEventListener('mouseleave', wrapper._vhLeave);
    if (wrapper._io) { try { wrapper._io.disconnect(); } catch(_) {} wrapper._io = null; }
    if (wrapper._hls) { try { wrapper._hls.destroy(); } catch(_) {} wrapper._hls = null; }

    const isHls = src.includes('.m3u8');
    const isSafariNative = !!video.canPlayType('application/vnd.apple.mpegurl');
    const canUseHlsJs = !!(window.Hls && Hls.isSupported()) && !isSafariNative;

    // Grundsetup
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    if (typeof video.disableRemotePlayback !== 'undefined') video.disableRemotePlayback = true;

    // Gemeinsame Funktion zum Initialisieren der Videoquelle
    function attachVideoSource() {
      if (video._attached) return;
      video._attached = true;

      if (isHls) {
        if (isSafariNative) {
          video.src = src;
          video.load();
        } else if (canUseHlsJs) {
          const hls = new Hls({ maxBufferLength: 10 });
          hls.attachMedia(video);
          hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(src));
          wrapper._hls = hls;
        } else {
          video.src = src;
        }
      } else {
        video.src = src;
      }
    }

    // --- Desktop: Hover-Verhalten ---
    if (!isTouch) {
      wrapper._vhEnter = () => {
        wrapper.dataset.videoOnHover = 'active';
        attachVideoSource();
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === 'function') {
          playPromise.catch(err => console.warn('Play on hover blocked:', err));
        }
      };

      wrapper._vhLeave = () => {
        wrapper.dataset.videoOnHover = 'not-active';
        setTimeout(() => {
          video.pause();
          video.currentTime = 0;
        }, 200);
      };

      wrapper.addEventListener('mouseenter', wrapper._vhEnter);
      wrapper.addEventListener('mouseleave', wrapper._vhLeave);
    }

    // --- Mobile: wie BackgroundVideo (autoplay bei Sichtbarkeit) ---
    else {
      wrapper.dataset.videoOnHover = 'idle';
      attachVideoSource();

      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          const inView = entry.isIntersecting && entry.intersectionRatio > 0;
          if (inView) {
            wrapper.dataset.videoOnHover = 'active';
            const playPromise = video.play();
            if (playPromise && typeof playPromise.catch === 'function') {
              playPromise.catch(() => {});
            }
          } else {
            wrapper.dataset.videoOnHover = 'not-active';
            video.pause();
          }
        });
      }, { threshold: 0.25 });

      io.observe(wrapper);
      wrapper._io = io;
    }
  });
}
  
function initCountUp(root=document){
  const observerKey = '_countupObserver';
  // Falls vorher schon ein Observer existiert → Disconnect (Swup-kompatibel)
  if (window[observerKey]) {
    try { window[observerKey].disconnect(); } catch {}
  }

  // Deutsche Formatierung (mit max. 2 Nachkommastellen)
  function formatNumber(num, decimals){
    return num.toLocaleString('de-DE',{
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  // Haupt-Countup-Funktion
  function animateCount(el){
    const rawTarget = (el.dataset.target || '').trim();
    if (!rawTarget) return;

    const duration = parseInt(el.dataset.duration) || 2000;
    const resetOnView = el.dataset.reset === 'true';

    // Parsing der Zielzahl
    const target = parseFloat(rawTarget.replace(/\./g,'').replace(',','.'));
    const isDecimal = rawTarget.includes(',');
    const decimals = isDecimal ? (rawTarget.split(',')[1]?.length || 1) : 0;
    const integerTarget = Math.floor(target);
    const startTime = performance.now();

    el.dataset.animating = 'true';

    function update(currentTime){
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      let displayValue;

      if (isDecimal){
        if (progress < 0.8){
          const currentInt = Math.floor(integerTarget * (progress / 0.8));
          displayValue = formatNumber(currentInt, 0);
        } else {
          const decimalProgress = (progress - 0.8) / 0.2;
          const currentValue = integerTarget + (target - integerTarget) * decimalProgress;
          displayValue = formatNumber(currentValue, decimals);
        }
      } else {
        const currentValue = target * progress;
        displayValue = formatNumber(currentValue, 0);
      }

      el.textContent = displayValue;

      if (progress < 1){
        requestAnimationFrame(update);
      } else {
        el.textContent = formatNumber(target, decimals);
        el.dataset.animating = 'false';
        if (resetOnView) el.dataset.hasAnimated = 'false';
        else el.dataset.hasAnimated = 'true';
      }
    }

    requestAnimationFrame(update);
  }

  // IntersectionObserver (20 % Sichtbarkeit)
  const observer = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      const el = entry.target;
      if (entry.intersectionRatio >= 0.2){
        if (el.dataset.animating !== 'true' && el.dataset.hasAnimated !== 'true'){
          animateCount(el);
        }
      } else if (el.dataset.reset === 'true'){
        el.textContent = '0';
        el.dataset.hasAnimated = 'false';
      }
    });
  },{ threshold:[0.2] });

  // Alle [data-countup]-Elemente initialisieren
  const countElements = root.querySelectorAll('[data-countup]');
  countElements.forEach(el=>{
    el.textContent = '0';
    observer.observe(el);
  });

  window[observerKey] = observer;
}
  

function initServiceVisuals(root=document){
  gsap.registerPlugin(ScrollTrigger);

  // ----- DOM References -----
  const serviceList  = root.querySelector(".service_list");
  const serviceItems = Array.from(root.querySelectorAll(".service_item"));
  const visuals      = Array.from(root.querySelectorAll(".service_visual_wrap > div"));
  const visualWrap   = root.querySelector(".service_visual_wrap");

  if (!serviceList || !serviceItems.length || !visuals.length || !visualWrap) return;

  // ----- Settings -----
  const touchDevice   = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const isTinyMobile  = () => window.innerWidth <= 479;
  let listHeight = serviceList.offsetHeight;
  let wrapHeight = visualWrap.offsetHeight;

  // ----- Helper: recalc heights -----
  const recalcHeights = ()=>{
    listHeight = serviceList.offsetHeight;
    wrapHeight = visualWrap.offsetHeight;
  };

  // ----- Cleanup (Swup kompatibel) -----
  // alte Trigger + Events entfernen
  try { ScrollTrigger.getAll().forEach(st=>{ 
    if (serviceList.contains(st.trigger)) st.kill(); 
  }); } catch {}

  serviceItems.forEach(item=>{
    item.replaceWith(item.cloneNode(true)); // entfernt alte Events
  });

  // Re-Query nach Clone (Events gelöscht)
  const freshServiceItems = Array.from(root.querySelectorAll(".service_item"));

  // ----- Aktivierung & Bewegung -----
  const activateItem = (index)=>{
    freshServiceItems.forEach((item,i)=>item.classList.toggle("active", i===index));
    visuals.forEach((vis,i)=>vis.classList.toggle("active", i===index));
    moveVisualWrap(index);
  };

  const deactivateAll = ()=>{
    freshServiceItems.forEach(item=>item.classList.remove("active"));
    visuals.forEach(vis=>vis.classList.remove("active"));
  };

  const moveVisualWrap = (index)=>{
    if (isTinyMobile()){
      gsap.to(visualWrap,{ y:0, duration:0.3, ease:"power3.out" });
      return;
    }

    const firstMid = freshServiceItems[0].offsetTop + freshServiceItems[0].offsetHeight/2;
    const lastMid  = freshServiceItems.at(-1).offsetTop + freshServiceItems.at(-1).offsetHeight/2;
    const activeMid= freshServiceItems[index].offsetTop + freshServiceItems[index].offsetHeight/2;

    const progress = gsap.utils.clamp(0,1,(activeMid-firstMid)/(lastMid-firstMid));
    const newY = progress * (listHeight - wrapHeight);

    gsap.to(visualWrap,{ y:newY, duration:0.6, ease:"power3.out" });
  };

  // ----- Hover (Desktop) -----
  const setupHover = ()=>{
    freshServiceItems.forEach((item,index)=>{
      item.addEventListener("mouseenter", ()=>activateItem(index));
      item.addEventListener("mouseleave", ()=>deactivateAll());
    });
  };

  // ----- ScrollTrigger (Touch) -----
  const setupScrollTrigger = ()=>{
    const updateOnScroll = ()=>{
      const viewportMiddle = window.innerHeight / 2;
      let closestIndex = -1;
      let closestDistance = Infinity;

      freshServiceItems.forEach((item,i)=>{
        const rect = item.getBoundingClientRect();
        const itemMiddle = rect.top + rect.height/2;
        const distance = Math.abs(viewportMiddle - itemMiddle);
        if (distance < closestDistance && rect.top < window.innerHeight && rect.bottom > 0){
          closestDistance = distance;
          closestIndex = i;
        }
      });

      const activeThreshold = window.innerHeight * 0.25;
      if (closestDistance < activeThreshold && closestIndex >= 0){
        activateItem(closestIndex);
      } else {
        deactivateAll();
      }
    };

    ScrollTrigger.create({
      trigger: serviceList,
      start: "top bottom",
      end: "bottom top",
      onUpdate: updateOnScroll,
      onEnter: updateOnScroll,
      onLeave: deactivateAll,
      onLeaveBack: deactivateAll,
      onEnterBack: updateOnScroll
    });
  };

  // ----- Init -----
  recalcHeights();
  if (touchDevice) setupScrollTrigger();
  else setupHover();

  // ----- Handle Resize / Refresh -----
  window.addEventListener("resize", ()=>{
    recalcHeights();
    ScrollTrigger.refresh();
  });
  ScrollTrigger.addEventListener("refresh", recalcHeights);
}

/* ============ ZENTRALE REINIT STRUKTUR (stabil & Swup-kompatibel) ============ */
if (!window.reinitPage) {
  window.reinitPage = function(root=document){};
}

// Hilfsfunktion zum sicheren Anhängen neuer Module an reinitPage
window.attachReinit = function(fn) {
  const prev = window.reinitPage;
  window.reinitPage = function(root=document) {
    prev(root);
    try { fn(root); } catch(e) { console.warn("Init-Fehler in", fn.name, e); }
  };
};
  
// ================================================
// BUNNY.NET HLS BACKGROUND PLAYER INITIALIZATION
// Swup-kompatibel & Lazyload-fähig
// ================================================

function initBunnyPlayerBackground(root = document) {
  root.querySelectorAll('[data-bunny-background-init]').forEach(function(player) {
    var src = player.getAttribute('data-player-src');
    if (!src) return;

    var video = player.querySelector('video');
    if (!video) return;

    try { video.pause(); } catch(_) {}
    try { video.removeAttribute('src'); video.load(); } catch(_) {}

    // --- Attribute Helper ---
    function setStatus(s) {
      if (player.getAttribute('data-player-status') !== s) {
        player.setAttribute('data-player-status', s);
      }
    }
    function setActivated(v) { player.setAttribute('data-player-activated', v ? 'true' : 'false'); }
    if (!player.hasAttribute('data-player-activated')) setActivated(false);

    // --- Flags ---
    var lazyMode   = player.getAttribute('data-player-lazy');
    var isLazyTrue = lazyMode === 'true';
    var autoplay   = player.getAttribute('data-player-autoplay') === 'true';
    var initialMuted = player.getAttribute('data-player-muted') === 'true';

    var pendingPlay = false;

    // --- Base Config ---
    if (autoplay) { video.muted = true; video.loop = true; }
    else { video.muted = initialMuted; }

    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;
    if (typeof video.disableRemotePlayback !== 'undefined') video.disableRemotePlayback = true;
    if (autoplay) video.autoplay = false;

    var isSafariNative = !!video.canPlayType('application/vnd.apple.mpegurl');
    var canUseHlsJs    = !!(window.Hls && Hls.isSupported()) && !isSafariNative;

    // --- Attach Media (once) ---
    var isAttached = false;
    var userInteracted = false;
    var lastPauseBy = ''; // 'io' | 'manual' | ''

    function attachMediaOnce() {
      if (isAttached) return;
      isAttached = true;

      if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }

      if (isSafariNative) {
        video.preload = isLazyTrue ? 'none' : 'auto';
        video.src = src;
        video.addEventListener('loadedmetadata', function() {
          readyIfIdle(player, pendingPlay);
        }, { once: true });
      } else if (canUseHlsJs) {
        var hls = new Hls({ maxBufferLength: 10 });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, function() { hls.loadSource(src); });
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          readyIfIdle(player, pendingPlay);
        });
        player._hls = hls;
      } else {
        video.src = src;
      }
    }

    // --- Lazy Init ---
    if (isLazyTrue) {
      video.preload = 'none';
    } else {
      attachMediaOnce();
    }

    // --- Controls ---
    function togglePlay() {
      userInteracted = true;
      if (video.paused || video.ended) {
        if (isLazyTrue && !isAttached) attachMediaOnce();
        pendingPlay = true;
        lastPauseBy = '';
        setStatus('loading');
        safePlay(video);
      } else {
        lastPauseBy = 'manual';
        video.pause();
      }
    }

    function toggleMute() {
      video.muted = !video.muted;
      player.setAttribute('data-player-muted', video.muted ? 'true' : 'false');
    }

    // Click Delegation (Play / Mute Buttons)
    player.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-player-control]');
      if (!btn || !player.contains(btn)) return;
      var type = btn.getAttribute('data-player-control');
      if (type === 'play' || type === 'pause' || type === 'playpause') togglePlay();
      else if (type === 'mute') toggleMute();
    });

    // --- Media Events ---
    video.addEventListener('play', function() { setActivated(true); setStatus('playing'); });
    video.addEventListener('playing', function() { pendingPlay = false; setStatus('playing'); });
    video.addEventListener('pause', function() { pendingPlay = false; setStatus('paused'); });
    video.addEventListener('waiting', function() { setStatus('loading'); });
    video.addEventListener('canplay', function() { readyIfIdle(player, pendingPlay); });
    video.addEventListener('ended', function() { pendingPlay = false; setStatus('paused'); setActivated(false); });

    // --- In-View Auto Play/Pause (Autoplay Mode) ---
    if (autoplay) {
      if (player._io) { try { player._io.disconnect(); } catch(_) {} }
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          var inView = entry.isIntersecting && entry.intersectionRatio > 0;
          if (inView) {
            if (isLazyTrue && !isAttached) attachMediaOnce();
            if ((lastPauseBy === 'io') || (video.paused && lastPauseBy !== 'manual')) {
              setStatus('loading');
              if (video.paused) togglePlay();
              lastPauseBy = '';
            }
          } else {
            if (!video.paused && !video.ended) {
              lastPauseBy = 'io';
              video.pause();
            }
          }
        });
      }, { threshold: 0.1 });
      io.observe(player);
      player._io = io;
    }
  });

  // --- Helpers ---
  function readyIfIdle(player, pendingPlay) {
    if (!pendingPlay &&
        player.getAttribute('data-player-activated') !== 'true' &&
        player.getAttribute('data-player-status') === 'idle') {
      player.setAttribute('data-player-status', 'ready');
    }
  }

  function safePlay(video) {
    var p = video.play();
    if (p && typeof p.then === 'function') p.catch(function(){});
  }
}
  
function initTeamCardHoverAnimation(root = document) {
  const isTouch = "ontouchstart" in window || navigator.maxTouchPoints > 0;
  const cards = root.querySelectorAll('.team_card');
  if (!cards.length) return;

  cards.forEach(card => {
    const meta = card.querySelector('.team_meta-infos');
    const image = card.querySelector('.team_image');
    if (!meta || !image) return;

    // 👉 Auf Touch-Geräten nichts animieren – Inhalte direkt sichtbar
    if (isTouch) return;

    // 👉 Desktop: Initialzustand und Transitionen
    meta.style.transform   = 'translateY(100%)'; // startet unten
    image.style.transform  = 'translateY(0%)';

    meta.style.transition  = 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94)';
    image.style.transition = 'transform 0.4s cubic-bezier(0.25,0.46,0.45,0.94) 0.1s';

    // Hover-Animation
    card.addEventListener('mouseenter', () => {
      meta.style.transform  = 'translateY(0%)';      // fährt in Ausgangsposition hoch
      image.style.transform = 'translateY(-2.5%)';   // leicht nach oben
    });

    card.addEventListener('mouseleave', () => {
      meta.style.transform  = 'translateY(100%)';    // wieder nach unten
      image.style.transform = 'translateY(0%)';
    });
  });
}

function initBunnyPlayer(root = document) {
  const players = root.querySelectorAll('[data-bunny-player-init]');
  if (!players.length) return;

  players.forEach((player) => {
    const video = player.querySelector('video');
    const src   = player.getAttribute('data-player-src');
    if (!video || !src) return;

    // 🧹 Reset alte Instanzen (Swup-kompatibel)
    if (player._bunnyHandlers) {
      player._bunnyHandlers.forEach(({ el, type, fn }) =>
        el.removeEventListener(type, fn)
      );
    }
    player._bunnyHandlers = [];

    // ---------------------------
    // ⚙️ Grundzustand
    // ---------------------------
    video.src = src;
    video.autoplay = true;
    video.loop = true;
    video.muted = true;
    video.playsInline = true;
    video.setAttribute('playsinline', '');
    video.setAttribute('muted', '');
    player.setAttribute('data-player-muted', 'true');
    player.setAttribute('data-player-status', 'playing');
    player.setAttribute('data-player-expanded', 'false');
    player.setAttribute('data-player-controls', 'hidden');

    // Sicherstellen, dass Video läuft
    video.play().catch(() => {});

    // ---------------------------
    // ✨ Expand / Collapse Animation
    // ---------------------------

    const expandToFullscreen = () => {
      if (player.getAttribute('data-player-expanded') === 'true') return;
      player.setAttribute('data-player-expanded', 'true');
      player.style.zIndex = 1020;

      // 1️⃣ Smooth transition auf viewport-Größe
      gsap.to(player, {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        duration: 0.6,
        ease: 'power3.inOut',
        onStart: () => {
          // Soft Fade auf ersten Frame
          gsap.to(video, { autoAlpha: 0, duration: 0.2 });
          video.pause();
          video.currentTime = 0;
        },
        onComplete: () => {
          // Video mit Sound neu starten
          video.muted = false;
          player.setAttribute('data-player-muted', 'false');
          player.setAttribute('data-player-controls', 'visible');
          gsap.to(video, { autoAlpha: 1, duration: 0.4 });
          video.play().catch(() => {});
        },
      });
    };

    const collapseToBackground = () => {
      if (player.getAttribute('data-player-expanded') === 'false') return;
      player.setAttribute('data-player-expanded', 'false');
      player.setAttribute('data-player-controls', 'hidden');

      gsap.to(video, { autoAlpha: 0.6, duration: 0.3 });
      video.pause();
      video.currentTime = 0;

      gsap.to(player, {
        position: 'relative',
        width: '',
        height: '',
        top: '',
        left: '',
        zIndex: '',
        duration: 0.6,
        ease: 'power3.inOut',
        onComplete: () => {
          video.muted = true;
          player.setAttribute('data-player-muted', 'true');
          video.play().catch(() => {});
          gsap.to(video, { autoAlpha: 1, duration: 0.4 });
        },
      });
    };

    // ---------------------------
    // 🎛️ Controls Handling
    // ---------------------------
    const onControlClick = (e) => {
      const btn = e.target.closest('[data-player-control]');
      if (!btn) return;
      const type = btn.getAttribute('data-player-control');
      if (type === 'playpause') {
        if (video.paused) video.play();
        else video.pause();
      } else if (type === 'mute') {
        video.muted = !video.muted;
        player.setAttribute('data-player-muted', video.muted ? 'true' : 'false');
      } else if (type === 'fullscreen') {
        // 👉 custom expand/collapse statt native fullscreen
        if (player.getAttribute('data-player-expanded') === 'true') collapseToBackground();
        else expandToFullscreen();
      }
    };
    player.addEventListener('click', onControlClick);
    player._bunnyHandlers.push({ el: player, type: 'click', fn: onControlClick });

    // ---------------------------
    // 🎬 Click-to-Expand
    // ---------------------------
    const onVideoClick = (e) => {
      const isControl = e.target.closest('[data-player-control]');
      if (isControl) return;
      if (player.getAttribute('data-player-expanded') === 'true') return;
      expandToFullscreen();
    };
    video.addEventListener('click', onVideoClick);
    player._bunnyHandlers.push({ el: video, type: 'click', fn: onVideoClick });

    // ---------------------------
    // ⏯️ Status Updates
    // ---------------------------
    const updateStatus = () => {
      player.setAttribute('data-player-status', video.paused ? 'paused' : 'playing');
    };
    video.addEventListener('play', updateStatus);
    video.addEventListener('pause', updateStatus);
    player._bunnyHandlers.push({ el: video, type: 'play', fn: updateStatus });
    player._bunnyHandlers.push({ el: video, type: 'pause', fn: updateStatus });
  });
}

// ====== ALLE MODULE REGISTRIEREN ======
attachReinit(initThemeToggle);
attachReinit(initDirectionalButtonHover);
attachReinit(initDynamicCustomTextCursor);
attachReinit(initSwiper);
attachReinit(initContentRevealScroll);
attachReinit(initCopyEmailClipboard);
attachReinit(initCSSMarquee);
attachReinit(initHeaderController);
attachReinit(initStackingCardsParallax);
attachReinit(initPlayVideoHover);
attachReinit(initCountUp);
attachReinit(initLogoWallCycle);
attachReinit(initServiceVisuals);
attachReinit(initBunnyPlayerBackground);
attachReinit(initTeamCardHoverAnimation);
attachReinit(initBunnyPlayer);


/* ============ FIRST LOAD ============ */
document.addEventListener("DOMContentLoaded", ()=>{
  initSmoothScroll();
  initHeaderController();
  window.reinitPage(document);
});
</script>
