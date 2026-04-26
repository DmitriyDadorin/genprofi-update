const YM_COUNTER_ID = 85038316;
const COOKIE_CONSENT_KEY = 'genprofi_cookie_consent_v1';
const COOKIE_CONSENT_ACCEPTED = 'accepted';

function getCookieConsent() {
  try {
    return window.localStorage.getItem(COOKIE_CONSENT_KEY);
  } catch (error) {
    return null;
  }
}

function setCookieConsent(value) {
  try {
    window.localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch (error) {
    // If storage is unavailable, the current page session still respects the click.
  }
}

function loadYandexMetrika() {
  if (window.__genprofiYandexMetrikaLoaded) {
    return;
  }

  window.__genprofiYandexMetrikaLoaded = true;

  (function (m, e, t, r, i, k, a) {
    m[i] =
      m[i] ||
      function () {
        (m[i].a = m[i].a || []).push(arguments);
      };
    m[i].l = 1 * new Date();
    k = e.createElement(t);
    a = e.getElementsByTagName(t)[0];
    k.async = 1;
    k.src = r;
    a.parentNode.insertBefore(k, a);
  })(window, document, 'script', 'https://mc.yandex.ru/metrika/tag.js', 'ym');

  window.ym(YM_COUNTER_ID, 'init', {
    clickmap: true,
    trackLinks: true,
    accurateTrackBounce: true,
  });
}

function removeCookieBanner() {
  const banner = document.querySelector('[data-cookie-consent]');

  if (banner) {
    banner.remove();
  }
}

function showCookieBanner(force = false) {
  if (!force) {
    const consent = getCookieConsent();

    if (consent === COOKIE_CONSENT_ACCEPTED) {
      loadYandexMetrika();
      return;
    }

  }

  if (document.querySelector('[data-cookie-consent]')) {
    return;
  }

  const banner = document.createElement('section');
  banner.className = 'cookie-consent';
  banner.setAttribute('data-cookie-consent', '');
  banner.setAttribute('role', 'dialog');
  banner.setAttribute('aria-label', 'Согласие на использование cookie');
  banner.innerHTML = `
    <div class="cookie-consent__text">
      <p>
        Мы используем файлы cookie (файлы с данными о прошлых посещениях сайта). Продолжая
        использовать сайт, вы соглашаетесь с <a href="agreement.html">Политикой конфиденциальности</a>
        и использованием нами этих файлов cookie. Вы можете запретить сохранение cookie в настройках
        своего браузера.
      </p>
    </div>
    <div class="cookie-consent__actions">
      <button class="button button--primary button--sm" type="button" data-cookie-accept>Согласен</button>
    </div>
  `;

  document.body.appendChild(banner);

  banner.querySelector('[data-cookie-accept]').addEventListener('click', () => {
    setCookieConsent(COOKIE_CONSENT_ACCEPTED);
    loadYandexMetrika();
    removeCookieBanner();
  });
}

const navToggle = document.querySelector('[data-nav-toggle]');
const nav = document.querySelector('[data-nav]');

if (navToggle && nav) {
  navToggle.addEventListener('click', () => {
    const isOpen = nav.classList.toggle('is-open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  nav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      nav.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

const modal = document.querySelector('[data-modal]');
const modalOpeners = document.querySelectorAll('[data-open-modal]');
const modalClosers = document.querySelectorAll('[data-close-modal]');

function closeModal() {
  if (!modal) {
    return;
  }
  modal.classList.remove('is-open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function openModal() {
  if (!modal) {
    return;
  }
  modal.classList.add('is-open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

modalOpeners.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    openModal();
  });
});

modalClosers.forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    closeModal();
  });
});

if (modal) {
  modal.addEventListener('click', (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });
}

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});

const forms = document.querySelectorAll('[data-lead-form]');
const mapLoaders = document.querySelectorAll('[data-load-map]');

function setStatus(form, message, type) {
  const status = form.querySelector('[data-form-status]');
  if (!status) {
    return;
  }

  status.textContent = message;
  status.classList.remove('is-success', 'is-error');

  if (type) {
    status.classList.add(type === 'success' ? 'is-success' : 'is-error');
  }
}

forms.forEach((form) => {
  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    const submitButton = form.querySelector('[type="submit"]');
    const data = new FormData(form);

    setStatus(form, 'Отправляем заявку...', null);

    if (submitButton) {
      submitButton.disabled = true;
    }

    try {
      const payload = new URLSearchParams();
      payload.set('name', String(data.get('name') || ''));
      payload.set('phone', String(data.get('phone') || ''));
      payload.set('message', String(data.get('message') || ''));
      payload.set('source', String(data.get('source') || window.location.pathname));
      payload.set('personal_data_consent', String(data.get('personal_data_consent') || ''));
      payload.set('consent_version', '2026-04-24');

      const response = await fetch('/send_post.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        },
        body: payload.toString(),
      });

      const raw = await response.text();
      let result = null;

      if (raw.trim()) {
        try {
          result = JSON.parse(raw);
        } catch (parseError) {
          result = null;
        }
      }

      if (!response.ok) {
        throw new Error(
          (result && result.message) || 'Не удалось отправить форму. Попробуйте позвонить нам напрямую.'
        );
      }

      if (result && result.ok === false) {
        throw new Error(result.message || 'Не удалось отправить форму.');
      }

      form.reset();
      setStatus(form, 'Заявка отправлена. Менеджер свяжется с вами в ближайшее время.', 'success');

      if (form.closest('.modal__dialog')) {
        window.setTimeout(closeModal, 1400);
      }
    } catch (error) {
      setStatus(
        form,
        error instanceof Error ? error.message : 'Ошибка отправки. Попробуйте позвонить нам напрямую.',
        'error'
      );
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
      }
    }
  });
});

mapLoaders.forEach((button) => {
  button.addEventListener('click', () => {
    const mapCard = button.closest('[data-map-src]');

    if (!mapCard) {
      return;
    }

    const mapSrc = mapCard.getAttribute('data-map-src');

    if (!mapSrc) {
      return;
    }

    mapCard.classList.remove('map-card--placeholder');
    mapCard.innerHTML = '';

    const script = document.createElement('script');
    script.type = 'text/javascript';
    script.charset = 'utf-8';
    script.async = true;
    script.src = mapSrc;

    mapCard.appendChild(script);
  });
});

showCookieBanner();
