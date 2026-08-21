/* =========================================================
   FULL BLACK — interactions
   ========================================================= */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var fine = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };

  window.addEventListener('load', function () {
    document.body.classList.add('is-loaded');
  });
  requestAnimationFrame(function () { document.body.classList.add('is-loaded'); });

  /* ---------- header ---------- */
  (function () {
    var header = $('.header');
    var last = 0;

    window.addEventListener('scroll', function () {
      var y = window.scrollY;
      header.classList.toggle('is-stuck', y > 20);
      var menu = $('.menu');
      if (menu && !menu.classList.contains('is-open')) {
        header.classList.toggle('is-hidden', y > last && y > 400);
      }
      last = y;
    }, { passive: true });
  })();

  /* ---------- mobile menu ---------- */
  (function () {
    var burger = $('.burger');
    var menu = $('.menu');
    if (!burger || !menu) return;
    var scrollLock = 0;

    function lockScroll() {
      scrollLock = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = '-' + scrollLock + 'px';
      document.body.style.left = '0';
      document.body.style.right = '0';
    }

    function unlockScroll() {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.left = '';
      document.body.style.right = '';
      window.scrollTo(0, scrollLock);
    }

    function setOpen(open) {
      burger.setAttribute('aria-expanded', String(open));
      if (open) {
        lockScroll();
        $('.header').classList.remove('is-hidden');
        menu.hidden = false;
        requestAnimationFrame(function () {
          menu.classList.add('is-open');
          $$('.menu__nav a', menu).forEach(function (a, i) {
            a.style.transitionDelay = (80 + i * 55) + 'ms';
          });
        });
      } else {
        menu.classList.remove('is-open');
        $$('.menu__nav a', menu).forEach(function (a) { a.style.transitionDelay = '0ms'; });
        unlockScroll();
        setTimeout(function () { menu.hidden = true; }, 400);
      }
    }

    burger.addEventListener('click', function () {
      setOpen(burger.getAttribute('aria-expanded') !== 'true');
    });
    $$('a[href^="#"]', menu).forEach(function (a) {
      a.addEventListener('click', function () { setOpen(false); });
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') setOpen(false);
    });
  })();

  /* ---------- reveal on scroll ---------- */
  (function () {
    var items = $$('[data-reveal]');
    if (!items.length) return;

    if (reduced || !('IntersectionObserver' in window)) {
      items.forEach(function (el) { el.classList.add('is-in'); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        el.style.setProperty('--d', (el.dataset.delay || 0) + 'ms');
        el.classList.add('is-in');
        io.unobserve(el);
      });
    }, { rootMargin: '0px 0px -12% 0px', threshold: 0.12 });

    items.forEach(function (el) { io.observe(el); });
  })();

  /* ---------- counters ---------- */
  (function () {
    var nums = $$('[data-count]');
    if (!nums.length || !('IntersectionObserver' in window)) {
      nums.forEach(function (n) { n.textContent = n.dataset.count + (n.dataset.suffix || ''); });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        io.unobserve(el);
        var target = parseInt(el.dataset.count, 10);
        var suffix = el.dataset.suffix || '';
        if (reduced) { el.textContent = format(target) + suffix; return; }
        var dur = 1500, start = performance.now();
        requestAnimationFrame(function step(now) {
          var t = clamp((now - start) / dur, 0, 1);
          var e = 1 - Math.pow(1 - t, 4);
          el.textContent = format(Math.round(target * e)) + suffix;
          if (t < 1) requestAnimationFrame(step);
        });
      });
    }, { threshold: 0.6 });

    function format(n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' '); }
    nums.forEach(function (n) { io.observe(n); });
  })();

  /* ---------- parallax ---------- */
  (function () {
    if (reduced) return;
    var els = $$('[data-parallax]');
    if (!els.length) return;
    var ticking = false;

    function update() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < -200 || r.top > vh + 200) return;
        var speed = parseFloat(el.dataset.parallax) || 0.1;
        var center = r.top + r.height / 2 - vh / 2;
        /* individual `translate` property keeps the CSS `transform` scale intact */
        el.style.translate = '0 ' + (-center * speed).toFixed(2) + 'px';
      });
      ticking = false;
    }

    window.addEventListener('scroll', function () {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* ---------- accordion ---------- */
  (function () {
    $$('.acc details').forEach(function (d) {
      var summary = $('summary', d);
      var body = $('.acc__body', d);
      if (!summary || !body) return;

      body.style.height = '0px';

      function open() {
        d.open = true;
        body.style.height = '0px';
        requestAnimationFrame(function () {
          body.style.transition = 'height .45s cubic-bezier(.22,.61,.36,1)';
          body.style.height = body.scrollHeight + 'px';
        });
      }
      function close() {
        body.style.transition = 'height .35s cubic-bezier(.22,.61,.36,1)';
        body.style.height = body.scrollHeight + 'px';
        requestAnimationFrame(function () { body.style.height = '0px'; });
        setTimeout(function () { d.open = false; }, 340);
      }

      body.addEventListener('transitionend', function (e) {
        if (e.propertyName === 'height' && d.open) body.style.height = 'auto';
      });

      summary.addEventListener('click', function (e) {
        e.preventDefault();
        if (d.open) { close(); return; }
        $$('.acc details[open]').forEach(function (o) {
          if (o !== d) $('summary', o).click();
        });
        open();
      });
    });
  })();

  /* ---------- magnetic buttons ---------- */
  (function () {
    if (!fine || reduced) return;
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        el.style.transform = 'translate3d(' + dx * 0.22 + 'px,' + dy * 0.3 + 'px,0)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  })();

  /* ---------- phone mask + form ---------- */
  (function () {
    var form = $('.form');
    if (!form) return;
    var phone = $('#phone', form);
    if (!phone) return;

    form.addEventListener('click', function (e) { e.stopPropagation(); });

    function mask(v) {
      var d = v.replace(/\D/g, '');
      if (d[0] === '8') d = '7' + d.slice(1);
      if (d[0] !== '7') d = '7' + d;
      d = d.slice(0, 11);
      var out = '+7';
      if (d.length > 1) out += ' (' + d.slice(1, 4);
      if (d.length >= 4) out += ')';
      if (d.length > 4) out += ' ' + d.slice(4, 7);
      if (d.length > 7) out += '-' + d.slice(7, 9);
      if (d.length > 9) out += '-' + d.slice(9, 11);
      return out;
    }

    phone.addEventListener('focus', function () {
      if (!phone.value) phone.value = '+7 ';
    });
    phone.addEventListener('input', function () {
      phone.value = mask(phone.value);
    });
    phone.addEventListener('blur', function () {
      if (phone.value.replace(/\D/g, '').length < 2) phone.value = '';
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var name = $('#name', form);
      var service = $('#service', form);
      var comment = $('#comment', form);
      var submitBtn = $('button[type="submit"]', form);

      [[name, name.value.trim().length > 1],
       [phone, phone.value.replace(/\D/g, '').length === 11]].forEach(function (pair) {
        var field = pair[0].closest('.field');
        field.classList.toggle('is-error', !pair[1]);
        if (!pair[1]) ok = false;
      });

      if (!ok) {
        var bad = $('.is-error input', form);
        if (bad) bad.focus({ preventScroll: true });
        return;
      }

      var message = [
        '🔔 Новая заявка FULL BLACK',
        '',
        'Имя: ' + name.value.trim(),
        'Телефон: ' + phone.value.trim(),
        'Услуга: ' + (service ? service.value : '—'),
        'Комментарий: ' + (comment && comment.value.trim() ? comment.value.trim() : '—')
      ].join('\n');

      var cfg = window.FULLBLACK_TG || {};
      if (!cfg.botToken || !cfg.chatId) {
        window.alert('Telegram ещё не настроен. Заполните assets/js/telegram-config.js');
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Отправляем…';
      }

      var url = 'https://api.telegram.org/bot' + cfg.botToken + '/sendMessage';
      var body = 'chat_id=' + encodeURIComponent(cfg.chatId) +
        '&text=' + encodeURIComponent(message);

      fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      }).finally(function () {
        if (submitBtn) submitBtn.blur();
        form.classList.add('is-sent');
        var success = $('.form__success', form);
        if (success) {
          success.setAttribute('tabindex', '-1');
          success.focus({ preventScroll: true });
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Отправить заявку';
        }
      });
    });

    $$('.field input', form).forEach(function (i) {
      i.addEventListener('input', function () { i.closest('.field').classList.remove('is-error'); });
    });
  })();

  /* ---------- anchor scroll with header offset ---------- */
  (function () {
    document.addEventListener('click', function (e) {
      if (e.target.closest && e.target.closest('.form')) return;
      var a = e.target.closest && e.target.closest('a[href^="#"]');
      if (!a) return;
      var id = a.getAttribute('href');
      if (id === '#' || id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      var offset = id === '#top' ? 0 : 70;
      requestAnimationFrame(function () {
        var top = t.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: Math.max(0, top), behavior: reduced ? 'auto' : 'smooth' });
      });
    });
  })();

})();
