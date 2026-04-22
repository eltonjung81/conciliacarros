// ===== CONFIG =====
const WPP = CONFIG.WHATSAPP_CONTATO;
const API_BASE = CONFIG.API_BASE;

// ===== LÊ A PLACA DA URL =====
const params = new URLSearchParams(window.location.search);
const placaOriginal = (params.get('placa') || '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const loadingEl = document.getElementById('loading-placa');
if (loadingEl) loadingEl.textContent = placaOriginal;

// ===== CONTADOR REGRESSIVO =====
let tempoRestante = 70;
const timerEl = document.getElementById('countdown-timer');
const timerInterval = setInterval(() => {
  if (tempoRestante > 0) {
    tempoRestante--;
    if (timerEl) timerEl.textContent = tempoRestante + 's';
  } else {
    clearInterval(timerInterval);
  }
}, 1000);

function pararTimer() {
  clearInterval(timerInterval);
}

// ===== VALIDAÇÃO BÁSICA =====
if (!placaOriginal || (!/^[A-Z]{3}[0-9]{4}$/.test(placaOriginal) && !/^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(placaOriginal))) {
  pararTimer();
  ocultarLoading();
  document.getElementById('state-error')?.classList.remove('hidden');
}

function ocultarLoading() {
  document.getElementById('state-loading')?.classList.add('hidden');
}

// ===== CONSULTA REAL NO BACKEND PYTHON =====
async function consultarVeiculo(placa) {
  // Google Analytics: Busca iniciada
  gtag('event', 'search_started', { 'placa': placa });

  try {
    console.log(`[DEBUG] Buscando dados em: ${API_BASE}/api/consulta/${placa}`);
    const response = await fetch(`${API_BASE}/api/consulta/${placa}`, {
      headers: {
        'ngrok-skip-browser-warning': 'true'
      }
    });
    
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.error || "Veículo não encontrado nos registros.");
    }
    
    const data = await response.json();
    console.log("[DEBUG] Resposta bruta da API:", data);
    
    // Google Analytics: Resultado encontrado
    gtag('event', 'search_success', { 'placa': placa, 'veiculo': data.veiculo || '—' });

    const det = data.detalhes || {};
    const fipe = data.tabela_fipe || {};
    
    let valorFipe = '—';
    if (fipe.valores && Array.isArray(fipe.valores) && fipe.valores.length > 0) {
      valorFipe = fipe.valores[0].valor || fipe.valores[0].preco || '—';
    }

    return {
      placa: data.placa || placa,
      marca: det.marca || data.marca || '—',
      modelo: det.modelo || data.veiculo || data.modelo || '—',
      ano: det.ano_modelo || det.ano || data.ano || '—',
      cor: det.cor || '—',
      local: det.municipio ? `${det.municipio} / ${det.uf}` : (det.uf || '—'),
      combustivel: det.combustivel || data.combustivel || '—',
      cilindrada: det.cilindrada || data.cilindrada || '—',
      potencia: det.potencia || data.potencia || '—',
      tipo: det.tipo_veiculo || '—',
      chassi: det.chassi || '—',
      motor: det.motor || '—',
      logo: data.imagem_logo_url || '',
      fipe: valorFipe,
      fipeRef: fipe.data ? `Referência: ${fipe.data}` : 'Referência: Atual'
    };
  } catch (error) {
    console.error("[DEBUG] Erro na função consultarVeiculo:", error);
    throw error;
  }
}

// ===== EXIBE RESULTADO =====
function exibirResultado(dados) {
  console.log("[DEBUG] Iniciando preenchimento da tela com:", dados);
  
  pararTimer();
  ocultarLoading();
  const resultState = document.getElementById('state-result');
  if (resultState) resultState.classList.remove('hidden');

  // Lógica da Logo
  const logoImg = document.getElementById('brand-logo');
  const logoCont = document.getElementById('brand-logo-container');
  const defIcon = document.getElementById('vehicle-icon-default');
  if (dados.logo && logoImg && logoCont) {
    logoImg.src = dados.logo;
    logoCont.style.display = 'block';
    if (defIcon) defIcon.style.display = 'none';
  }

  // Função auxiliar para preencher texto com segurança
  const setTxt = (id, txt) => {
    const el = document.getElementById(id);
    if (el) el.textContent = txt || '—';
  };

  // Preenche os campos da página
  setTxt('result-placa-display', dados.placa);
  setTxt('vehicle-name', dados.modelo);
  setTxt('vi-placa', dados.placa);
  setTxt('vi-modelo', dados.modelo);
  setTxt('vi-ano', dados.ano);
  setTxt('vi-cor', dados.cor);
  setTxt('vi-local', dados.local);
  setTxt('vi-combustivel', dados.combustivel);
  setTxt('vi-cilindrada', dados.cilindrada);
  setTxt('vi-potencia', dados.potencia);
  setTxt('vi-tipo', dados.tipo);
  setTxt('vi-chassi', dados.chassi);
  setTxt('vi-motor', dados.motor);
  setTxt('vi-fipe', dados.fipe);
  setTxt('vi-fipe-ref', dados.fipeRef);

  // Pré-preenche o formulário de lead
  const setVal = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.value = (val && val !== '—') ? val : '';
  };

  setVal('f-placa', dados.placa);
  setVal('f-marca', dados.marca);
  setVal('f-modelo', dados.modelo);
  setVal('f-ano', dados.ano);

  // Anima barra de probabilidade
  setTimeout(() => {
    const bar = document.getElementById('prob-bar');
    if (bar) bar.style.width = '94%';
  }, 400);
}

// ===== INICIA O FLUXO =====
if (placaOriginal && (/^[A-Z]{3}[0-9]{4}$/.test(placaOriginal) || /^[A-Z]{3}[0-9][A-Z][0-9]{2}$/.test(placaOriginal))) {
  consultarVeiculo(placaOriginal)
    .then(exibirResultado)
    .catch((err) => {
      console.error("[DEBUG] Erro capturado no fluxo principal:", err);
      ocultarLoading();
      const errState = document.getElementById('state-error');
      if (errState) {
        errState.classList.remove('hidden');
        const p = errState.querySelector('p');
        if (p) p.textContent = err.message || "Erro ao carregar dados.";
      }
    });
}

// ===== BOTÃO REGULARIZAR → ABRE FORMULÁRIO =====
document.getElementById('btn-regularizar')?.addEventListener('click', () => {
  const form = document.getElementById('form-solicitacao');
  if (form) {
    form.classList.remove('hidden');
    setTimeout(() => form.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  }
});

// ===== FORMULÁRIO → WHATSAPP =====
document.getElementById('lead-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const nome = document.getElementById('f-nome')?.value.trim();
  const tel = document.getElementById('f-telefone')?.value.trim();
  const pl = document.getElementById('f-placa')?.value.trim();
  const marca = document.getElementById('f-marca')?.value.trim();
  const modelo = document.getElementById('f-modelo')?.value.trim();
  const ano = document.getElementById('f-ano')?.value.trim();
  const opcao = document.getElementById('f-opcao')?.value;
  const situacao = document.getElementById('f-situacao')?.value.trim();

  if (!nome || !tel) {
    alert('Por favor, preencha seu nome e WhatsApp.');
    return;
  }

  // Google Analytics: Lead Gerado
  gtag('event', 'generate_lead', {
    'placa': pl,
    'servico': opcao
  });

  let opcaoTexto = '';
  if (opcao === 'opcao1') {
    opcaoTexto = 'Opção 1 – Entrega de Contato (R$ 79,90)';
  } else if (opcao === 'opcao2') {
    opcaoTexto = 'Opção 2 – Solução Completa (R$ 279,00 – pago ao final)';
  } else {
    opcaoTexto = 'Decidirei depois (falar com consultor)';
  }

  const msg = `🚗 *NOVA SOLICITAÇÃO – Concilia Veículos*

👤 *Nome:* ${nome}
📱 *WhatsApp:* ${tel}
🔖 *Placa:* ${pl}
🚙 *Veículo:* ${modelo || '—'} (${ano || '—'})
⚙️ *Marca:* ${marca || '—'}

📦 *Serviço escolhido:* ${opcaoTexto}

💬 *Situação descrita:*
${situacao || 'Não informada'}

_Lead capturado via site Concilia Veículos_`;

  // Salva no CRM local
  try {
    const leads = JSON.parse(localStorage.getItem('cv_leads') || '[]');
    leads.unshift({ id: Date.now(), placa: pl, whatsapp: tel.replace(/\D/g, ''), nome, status: 'NOVO', obs: `${opcaoTexto}. ${situacao}`, createdAt: new Date().toISOString() });
    localStorage.setItem('cv_leads', JSON.stringify(leads));
  } catch(e) {}

  // Envia para o banco de dados via API
  fetch(`${API_BASE}/api/leads`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true'
    },
    body: JSON.stringify({ nome, whatsapp: tel, placa: pl, marca, modelo, ano, opcao, situacao })
  }).then(r => r.json())
    .then(res => console.log("[DEBUG] Lead salvo no banco:", res))
    .catch(err => console.error("[DEBUG] Erro ao salvar lead no banco:", err));

  window.open(`https://wa.me/${WPP}?text=${encodeURIComponent(msg)}`, '_blank');
  
  // Confirmação visual
  const formArea = document.getElementById('form-solicitacao');
  if (formArea) {
    formArea.innerHTML = `
      <div style="text-align:center;padding:40px 20px;">
        <div style="font-size:72px;margin-bottom:20px;">🎉</div>
        <h2 style="font-size:24px;font-weight:900;margin-bottom:12px;">Solicitação enviada!</h2>
        <p style="color:#94a3b8;font-size:16px;max-width:440px;margin:0 auto 28px;line-height:1.6;">
          Nossa equipe recebeu seus dados e entrará em contato pelo WhatsApp <strong style="color:#fff">${tel}</strong> em até <strong style="color:#fff">2 horas</strong>.
        </p>
        <a href="index.html" style="display:inline-flex;align-items:center;gap:8px;padding:14px 28px;background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:10px;color:#fff;font-weight:600;text-decoration:none;font-size:15px;">
          ← Fazer nova consulta
        </a>
      </div>
    `;
  }
});

// ===== MÁSCARA TELEFONE =====
document.getElementById('f-telefone')?.addEventListener('input', (e) => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 11);
  if (v.length <= 2) v = v;
  else if (v.length <= 7) v = `(${v.slice(0,2)}) ${v.slice(2)}`;
  else v = `(${v.slice(0,2)}) ${v.slice(2,7)}-${v.slice(7)}`;
  e.target.value = v;
});
