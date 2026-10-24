/* AKTUG CONSTRUCTION — interactions du site (sans dépendance) */
(function () {
  'use strict';
  var d = document, root = d.documentElement;
  root.classList.add('js');
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ----- Année ----- */
  $$('[data-year]').forEach(function (el) { el.textContent = new Date().getFullYear(); });

  /* ----- Navigation ----- */
  var nav = $('.nav'), btn = $('#menuBtn'), panel = $('#menuPanel');
  function onScroll() { if (nav) nav.classList.toggle('scrolled', window.scrollY > 24); }
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  function setMenu(open) {
    if (!btn || !panel) return;
    panel.classList.toggle('open', open);
    nav.classList.toggle('menu-open', open);
    d.body.classList.toggle('menu-open', open);
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
    btn.querySelector('.label').textContent = open ? 'Fermer' : 'Menu';
  }
  if (btn && panel) {
    btn.addEventListener('click', function () { setMenu(!panel.classList.contains('open')); });
    panel.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel.classList.contains('open')) { setMenu(false); btn.focus(); } });
    window.matchMedia('(min-width: 981px)').addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* ----- Section active dans le menu ----- */
  var links = $$('.nav-links a[href^="#"]');
  if (links.length && 'IntersectionObserver' in window) {
    var map = {};
    links.forEach(function (a) { var id = a.getAttribute('href').slice(1); var s = d.getElementById(id); if (s) map[id] = a; });
    var current = null;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          if (current) current.classList.remove('active');
          current = map[en.target.id]; if (current) current.classList.add('active');
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    Object.keys(map).forEach(function (id) { io.observe(d.getElementById(id)); });
  }

  /* ----- Apparitions au défilement (textes et images) ----- */
  var reveals = $$('.reveal, .reveal-img');
  if (reveals.length) {
    if (reduced || !('IntersectionObserver' in window)) { reveals.forEach(function (el) { el.classList.add('in'); }); }
    else {
      var ro = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); ro.unobserve(en.target); } });
      }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
      reveals.forEach(function (el) { ro.observe(el); });
    }
  }

  /* ----- Parallaxe douce du bandeau ----- */
  var para = $$('[data-parallax] img');
  if (para.length && !reduced && window.matchMedia('(min-width: 900px)').matches) {
    var ticking = false;
    function parallax() {
      para.forEach(function (img) {
        var r = img.parentElement.parentElement.getBoundingClientRect();
        var vh = window.innerHeight;
        if (r.bottom < 0 || r.top > vh) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh; /* -1 .. 1 */
        img.style.transform = 'translateY(' + (p * -8) + '%)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(parallax); ticking = true; } }, { passive: true });
    parallax();
  }

  /* ----- Galerie : filtres ----- */
  var filters = $$('.filters button'), frames = $$('.gallery .frame, .strip .card');
  filters.forEach(function (b) {
    b.addEventListener('click', function () {
      filters.forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      var f = b.getAttribute('data-filter');
      frames.forEach(function (fr) {
        var cats = (fr.getAttribute('data-cat') || '').split(' ');
        fr.classList.toggle('hidden', !(f === 'all' || cats.indexOf(f) !== -1));
      });
    });
  });

  /* ----- Galerie : visionneuse ----- */
  var lb = $('#lightbox');
  if (lb && frames.length) {
    var lbImg = $('img', lb), lbSrc = $('source', lb), lbTitle = $('.lb-title', lb), lbText = $('.lb-text', lb), lbCount = $('.lb-count', lb);
    var items = frames.map(function (fr) {
      return { el: fr, jpg: fr.getAttribute('data-full'), webp: fr.getAttribute('data-full-webp'), title: $('h3', fr).textContent, text: $('.cap p', fr).textContent, alt: $('img', fr).getAttribute('alt') };
    });
    var idx = 0, lastFocus = null, touchX = null;
    function visible() { return items.filter(function (it) { return !it.el.classList.contains('hidden'); }); }
    function show(i) {
      var list = visible(); if (!list.length) return;
      idx = (i + list.length) % list.length;
      var it = list[idx];
      lbSrc.srcset = it.webp || ''; lbImg.src = it.jpg; lbImg.alt = it.alt;
      lbTitle.textContent = it.title; lbText.textContent = it.text;
      lbCount.textContent = (idx + 1) + ' / ' + list.length;
    }
    function open(i) {
      lastFocus = d.activeElement; show(i);
      lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); d.body.classList.add('menu-open');
      $('.lb-close', lb).focus();
    }
    function close() {
      lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); d.body.classList.remove('menu-open');
      lbImg.removeAttribute('src'); if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    frames.forEach(function (fr) {
      $('button.open', fr).addEventListener('click', function () { open(visible().map(function (it) { return it.el; }).indexOf(fr)); });
    });
    $('.lb-close', lb).addEventListener('click', close);
    $('.lb-prev', lb).addEventListener('click', function () { show(idx - 1); });
    $('.lb-next', lb).addEventListener('click', function () { show(idx + 1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    d.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') show(idx - 1);
      else if (e.key === 'ArrowRight') show(idx + 1);
      else if (e.key === 'Tab') {
        var f = $$('button', lb); var first = f[0], last = f[f.length - 1];
        if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
      }
    });
    lb.addEventListener('touchstart', function (e) { touchX = e.changedTouches[0].clientX; }, { passive: true });
    lb.addEventListener('touchend', function (e) {
      if (touchX === null) return; var dx = e.changedTouches[0].clientX - touchX; touchX = null;
      if (Math.abs(dx) > 50) show(dx < 0 ? idx + 1 : idx - 1);
    }, { passive: true });
  }

  /* ----- Défilement horizontal des réalisations ----- */
  var strip = $('.strip');
  if (strip) {
    var prog = $('.strip-prog b'), prev = $('.strip-prev'), next = $('.strip-next');
    function cardW() { var c = strip.querySelector('.card:not(.hidden)'); return c ? c.getBoundingClientRect().width + parseFloat(getComputedStyle(strip).columnGap || getComputedStyle(strip).gap || 16) : 320; }
    function update() {
      var max = strip.scrollWidth - strip.clientWidth;
      if (!prog) return;
      var ratio = Math.max(.08, strip.clientWidth / strip.scrollWidth);
      prog.style.width = (ratio * 100) + '%';
      prog.style.left = (max > 0 ? (strip.scrollLeft / max) * (100 - ratio * 100) : 0) + '%';
    }
    strip.addEventListener('scroll', function () { requestAnimationFrame(update); }, { passive: true });
    window.addEventListener('resize', update);
    if (prev) prev.addEventListener('click', function () { strip.scrollBy({ left: -cardW() * 2, behavior: reduced ? 'auto' : 'smooth' }); });
    if (next) next.addEventListener('click', function () { strip.scrollBy({ left: cardW() * 2, behavior: reduced ? 'auto' : 'smooth' }); });
    filters.forEach(function (b) { b.addEventListener('click', function () { strip.scrollTo({ left: 0 }); setTimeout(update, 50); }); });
    update();
  }

  /* ----- Savoir-faire : liste interactive et image ----- */
  var show = $('.show');
  if (show) {
    var sitems = $$('.show-item', show), figImgs = $$('.show-fig img', show), cap = $('.show-fig figcaption', show);
    function activate(it) {
      sitems.forEach(function (x) { var on = x === it; x.classList.toggle('active', on); $('button', x).setAttribute('aria-expanded', on ? 'true' : 'false'); });
      var key = it.getAttribute('data-img');
      figImgs.forEach(function (im) {
        var on = im.getAttribute('data-key') === key;
        if (on && !im.getAttribute('src')) { im.src = im.getAttribute('data-src'); var ss = im.getAttribute('data-srcset'); if (ss) im.srcset = ss; }
        im.classList.toggle('on', on);
      });
      if (cap) cap.textContent = $('h3', it).firstChild.textContent.trim();
      var mi = $('.mob-img img', it); if (mi && !mi.getAttribute('src')) mi.src = mi.getAttribute('data-src');
    }
    sitems.forEach(function (it) {
      $('button', it).addEventListener('click', function () { activate(it); });
      it.addEventListener('mouseenter', function () { if (window.matchMedia('(min-width:980px)').matches) activate(it); });
    });
    if (sitems.length) activate(sitems[0]);
  }

  /* ----- Copier l'adresse e-mail ----- */
  $$('[data-copy]').forEach(function (b) {
    b.addEventListener('click', function () {
      var text = b.getAttribute('data-copy'), msg = $('#' + b.getAttribute('data-msg'));
      var ok = function () { if (msg) msg.textContent = 'Adresse copiée.'; };
      var ko = function () { if (msg) msg.textContent = text; };
      try { navigator.clipboard.writeText(text).then(ok, ko); } catch (err) { ko(); }
    });
  });

  /* ----- Formulaire de contact ----- */
  var form = $('#contactForm'), status = $('#status');
  if (form) {
    var fields = { nom: $('#f-nom'), email: $('#f-mail'), message: $('#f-msg'), rgpd: $('#f-rgpd') };
    function mark(el, bad) { var w = el.closest('.field') || el.closest('.rgpd'); if (w) w.classList.toggle('err', bad); }
    Object.keys(fields).forEach(function (k) { fields[k].addEventListener('input', function () { mark(fields[k], false); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var nom = fields.nom.value.trim(), mail = fields.email.value.trim(), msg = fields.message.value.trim();
      var type = $('#f-type').value, commune = $('#f-commune').value.trim(), ok = fields.rgpd.checked;
      var mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail);
      mark(fields.nom, !nom); mark(fields.email, !mailOk); mark(fields.message, !msg); mark(fields.rgpd, !ok);
      if (!nom || !mailOk || !msg || !ok) { status.className = 'status show'; status.innerHTML = '<strong>Il manque une information.</strong> Vérifiez les champs signalés : nom, e-mail, description du projet et case de consentement.'; return; }
      var submit = form.querySelector('button[type=submit]'); submit.disabled = true; submit.textContent = 'Envoi en cours…';
      status.className = 'status show'; status.textContent = 'Envoi en cours…';
      var payload = { nom: nom, email: mail, type: type, commune: commune || 'non précisée', message: msg, _subject: 'Site AKTUG CONSTRUCTION — demande de ' + nom, _template: 'table', _captcha: 'false', _honey: $('#f-site').value };
      fetch('https://formsubmit.co/ajax/aktug.construction@gmail.com', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().then(function (j) { return { ok: r.ok && j.success !== 'false' && j.success !== false }; }); })
        .then(function (res) {
          if (!res.ok) throw new Error('refus');
          status.innerHTML = '<strong>Votre demande est envoyée.</strong> Nous vous répondons par e-mail sous quelques jours ouvrés, avec les questions utiles à un chiffrage sérieux.';
          form.reset(); submit.textContent = 'Demande envoyée';
        })
        .catch(function () {
          var body = 'Demande de contact — AKTUG CONSTRUCTION\n\nNom : ' + nom + '\nE-mail : ' + mail + '\nType de projet : ' + type + '\nCommune : ' + (commune || 'non précisée') + '\n\nProjet :\n' + msg;
          status.innerHTML = '<strong>L\'envoi n\'a pas abouti.</strong> Copiez votre message et envoyez-le-nous directement à aktug.construction@gmail.com.<pre id="draft"></pre><div class="row"><button type="button" class="copy" id="copyBtn">Copier le message</button><span id="copyMsg"></span></div>';
          $('#draft').textContent = body;
          $('#copyBtn').addEventListener('click', function () {
            var done = function () { $('#copyMsg').textContent = 'Copié.'; };
            var fallback = function () { var r = d.createRange(); r.selectNodeContents($('#draft')); var s = getSelection(); s.removeAllRanges(); s.addRange(r); $('#copyMsg').textContent = 'Texte sélectionné : copiez-le.'; };
            try { navigator.clipboard.writeText(body).then(done, fallback); } catch (err) { fallback(); }
          });
          submit.disabled = false; submit.textContent = 'Envoyer ma demande';
        });
      status.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'nearest' });
    });
  }
})();
