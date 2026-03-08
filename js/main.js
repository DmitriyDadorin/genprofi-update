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
