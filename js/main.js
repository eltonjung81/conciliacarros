// ===== NAVBAR SCROLL =====
window.addEventListener('scroll', () => {
  const navbar = document.getElementById('navbar');
  if (navbar) {
    navbar.style.background = window.scrollY > 50 ? 'rgba(10,15,30,0.97)' : 'rgba(10,15,30,0.85)';
  }
});

// ===== VALIDAÇÃO DE PLACA =====
function formatPlaca(val) {
  return val.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 7);
}

function validarPlaca(placa) {
  const antiga   = /^[A-Z]{3}[0-9]{4}$/;
  const mercosul = /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/;
  return antiga.test(placa) || mercosul.test(placa);
}

// ===== FORMULÁRIO DA LANDING PAGE =====
const placaForm  = document.getElementById('placa-form');
const placaInput = document.getElementById('placa-input');

if (placaInput) {
  placaInput.addEventListener('input', (e) => {
    e.target.value = formatPlaca(e.target.value);
  });
}

if (placaForm) {
  placaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const placa = (placaInput.value || '').trim();

    if (!validarPlaca(placa)) {
      placaInput.style.borderColor = '#ef4444';
      placaInput.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.2)';
      showToast('⚠️ Placa inválida. Use o formato ABC1234 ou ABC1D23', 'error');
      return;
    }

    // Redireciona para a página de resultado
    window.location.href = `resultado.html?placa=${encodeURIComponent(placa)}`;
  });
}

// ===== FAQ ACCORDION =====
document.querySelectorAll('.faq-question').forEach((btn) => {
  btn.addEventListener('click', () => {
    const answerId = btn.id.replace('faq-q', 'faq-a');
    const answer   = document.getElementById(answerId);
    const arrow    = btn.querySelector('.faq-arrow');
    const isOpen   = answer && answer.classList.contains('open');

    document.querySelectorAll('.faq-answer').forEach(a => a.classList.remove('open'));
    document.querySelectorAll('.faq-arrow').forEach(a => a.classList.remove('open'));

    if (!isOpen && answer) {
      answer.classList.add('open');
      arrow && arrow.classList.add('open');
    }
  });
});

// ===== SCROLL SUAVE INTERNO =====
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});

// ===== INTERSECTION OBSERVER (animações) =====
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.style.opacity = '1';
      e.target.style.transform = 'translateY(0)';
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.step-card, .audience-card, .testimonial-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(24px)';
  el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
  observer.observe(el);
});

// ===== TOAST =====
function showToast(msg, type = 'info') {
  const existing = document.getElementById('toast-notification');
  if (existing) existing.remove();

  const toast = document.createElement('div');
  toast.id = 'toast-notification';
  toast.textContent = msg;
  Object.assign(toast.style, {
    position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
    background: type === 'error' ? '#ef4444' : '#10b981',
    color: 'white', padding: '14px 24px', borderRadius: '10px',
    fontWeight: '600', fontSize: '14px', zIndex: '9999',
    boxShadow: '0 8px 24px rgba(0,0,0,0.4)', whiteSpace: 'nowrap'
  });
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
