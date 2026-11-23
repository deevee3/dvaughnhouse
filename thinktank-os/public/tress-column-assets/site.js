(function(){
  "use strict";

  "use strict";
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll reveal ---------- */
  var rvEls = document.querySelectorAll(".rv");
  if (reduceMotion || !("IntersectionObserver" in window)) {
    for (var i = 0; i < rvEls.length; i++) rvEls[i].classList.add("in");
  } else {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    rvEls.forEach(function(el){ io.observe(el); });
    /* Safety net: content must never stay hidden — if anything has not
       been revealed shortly after load (print views, full-page captures,
       odd embed webviews), reveal everything. */
    window.addEventListener("load", function(){
      setTimeout(function(){
        for (var j = 0; j < rvEls.length; j++) rvEls[j].classList.add("in");
      }, 1200);
    });
  }

  /* ---------- hero video + glass card ---------- */
  /* The card is a window onto a refracted duplicate of the background video.
     Sizing the duplicate to the hero section (not the viewport) is deliberate:
     the filter shifts each colour channel by a different amount, so the filtered
     element's own leading edges show hard channel-separation bands. At hero
     size those bands fall outside the card and only clean refraction shows.
     The duplicate stays at 1x even on retina: the SVG filter's cost scales
     with pixel count, and what shows through is a soft refraction where 4x
     the filter work buys nothing. Anchoring to the hero (not the viewport)
     keeps the refraction aligned while the page scrolls. */
  var DUP_PIXEL_RATIO = 1;
  var heroEl = document.getElementById("pearls-hero");
  var bgVideo = document.getElementById("bg-video");
  var glassCard = document.querySelector("[data-glass-card]");
  var dupContainer = document.getElementById("dup-video-container");
  var dupCanvas = document.getElementById("dup-image");
  var dupCtx = dupCanvas ? dupCanvas.getContext("2d") : null;
  var dupW = 0, dupH = 0;

  function drawGlass(){
    if (!glassCard || !bgVideo || !heroEl || !dupCtx) return;
    var rect = glassCard.getBoundingClientRect();
    var heroRect = heroEl.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0 && bgVideo.videoWidth > 0 && bgVideo.videoHeight > 0) {
      var hw = heroEl.clientWidth;
      var hh = heroEl.clientHeight;
      /* Position the container so it lands exactly over the hero origin:
         absolutely positioned inside the card, the negative offset cancels
         the card's own position within the hero, so its pixels line up 1:1
         with the real video. */
      dupContainer.style.left = (-(rect.left - heroRect.left)) + "px";
      dupContainer.style.top = (-(rect.top - heroRect.top)) + "px";
      dupContainer.style.width = hw + "px";
      dupContainer.style.height = hh + "px";
      var w = Math.round(hw * DUP_PIXEL_RATIO);
      var h = Math.round(hh * DUP_PIXEL_RATIO);
      if (w !== dupW || h !== dupH) {
        dupCanvas.width = w;
        dupCanvas.height = h;
        dupW = w; dupH = h;
      }
      try {
        /* Reproduce object-fit: cover for the draw. */
        var cover = Math.max(hw / bgVideo.videoWidth, hh / bgVideo.videoHeight);
        var sw = hw / cover;
        var sh = hh / cover;
        var sx = (bgVideo.videoWidth - sw) / 2;
        var sy = (bgVideo.videoHeight - sh) / 2;
        dupCtx.drawImage(bgVideo, sx, sy, sw, sh, 0, 0, w, h);
      } catch (e) {
        /* A frame may not be decodable yet; try again next frame. */
      }
    }
  }

  function glassLoop(){
    drawGlass();
    if (!reduceMotion) requestAnimationFrame(glassLoop);
  }

  if (bgVideo) {
    if (reduceMotion) {
      bgVideo.pause();
      bgVideo.addEventListener("loadeddata", drawGlass);
      drawGlass();
    } else {
      var playAttempt = bgVideo.play();
      if (playAttempt && playAttempt.catch) playAttempt.catch(function(){ /* autoplay blocked; poster shows */ });
      requestAnimationFrame(glassLoop);
    }
  }

  /* ---------- hero menu ---------- */
  var menu = document.getElementById("menu");
  var menuOpenBtn = document.getElementById("menu-open");
  var menuCloseBtn = document.getElementById("menu-close");
  var menuBackdrop = document.getElementById("menu-backdrop");

  function setMenu(open){
    if (!menu || !menuOpenBtn) return;
    menu.classList.toggle("is-open", open);
    menuOpenBtn.setAttribute("aria-expanded", String(open));
    if (open) {
      if (menuCloseBtn) menuCloseBtn.focus({ preventScroll: true });
    } else {
      menuOpenBtn.focus({ preventScroll: true });
    }
  }

  if (menuOpenBtn) menuOpenBtn.addEventListener("click", function(){ setMenu(true); });
  if (menuCloseBtn) menuCloseBtn.addEventListener("click", function(){ setMenu(false); });
  if (menuBackdrop) menuBackdrop.addEventListener("click", function(){ setMenu(false); });
  if (menu) {
    menu.querySelectorAll(".menu__link").forEach(function(link){
      link.addEventListener("click", function(){ setMenu(false); });
    });
  }
  document.addEventListener("keydown", function(event){
    if (event.key === "Escape" && menu && menu.classList.contains("is-open")) {
      setMenu(false);
    }
  });

  
})();
