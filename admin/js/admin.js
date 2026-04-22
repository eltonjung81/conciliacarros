// ===== CONFIGURAÇÕES =====
const WPP_NUMBER = '5551999906748';

// ===== ESTADO =====
let leads = [];
let editingId = null;

// ===== STATUS LABELS =====
const STATUS_LABELS = {
  'NOVO': 'Novo',
  'AGUARDANDO_PAGAMENTO': 'Aguard. Pagamento',
  'DONO_LOCALIZADO': 'Dono Localizado',
  'EM_NEGOCIACAO': 'Em Negociação',
  'FINALIZADO_SUCESSO': 'Finalizado ✅',
  'REEMBOLSADO': 'Reembolsado',
};

// ===== CARREGAR LEADS =====
function loadLeads() {
  leads = JSON.parse(localStorage.getItem('cv_leads') || '[]');
  // Dados de demonstração se não houver nenhum
  if (leads.length === 0) {
    leads = [
      { id: 1, placa: 'ABC1234', whatsapp: '51991234567', nome: 'João Silva', status: 'EM_NEGOCIACAO', obs: 'Ligou 2x. Marcado retorno quinta.', createdAt: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 2, placa: 'MRC3E21', whatsapp: '51987654321', nome: 'Maria Souza', status: 'DONO_LOCALIZADO', obs: 'Dono localizado em Gramado/RS.', createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: 3, placa: 'QRS5678', whatsapp: '51999990000', nome: '', status: 'NOVO', obs: '', createdAt: new Date().toISOString() },
      { id: 4, placa: 'XYZ9012', whatsapp: '51988887777', nome: 'Carlos Mendes', status: 'FINALIZADO_SUCESSO', obs: 'Transferência concluída. Taxa de sucesso cobrada.', createdAt: new Date(Date.now() - 86400000 * 5).toISOString() },
    ];
    saveLeads();
  }
}

function saveLeads() {
  localStorage.setItem('cv_leads', JSON.stringify(leads));
}

// ===== RENDERIZAR TABELA =====
function renderTable(data) {
  const tbody = document.getElementById('leads-tbody');
  const empty = document.getElementById('empty-state');

  if (data.length === 0) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }

  empty.classList.add('hidden');
  tbody.innerHTML = data.map(lead => {
    const date = new Date(lead.createdAt).toLocaleDateString('pt-BR');
    const wppMsg = encodeURIComponent(
      `Olá! Sou da Concilia Veículos. Estou entrando em contato sobre a placa *${lead.placa}*. Podemos conversar?`
    );
    const nome = lead.nome || '–';
    return `
      <tr>
        <td>
          <span class="placa-badge">${lead.placa}</span>
          ${lead.nome ? `<br/><small style="color:#94a3b8;font-size:12px;margin-top:4px;display:block;">${lead.nome}</small>` : ''}
        </td>
        <td>
          <a href="https://wa.me/55${lead.whatsapp}?text=${wppMsg}" target="_blank" class="phone-link">
            (${lead.whatsapp.slice(0,2)}) ${lead.whatsapp.slice(2,7)}-${lead.whatsapp.slice(7)}
          </a>
        </td>
        <td><span class="status-badge status-${lead.status}">${STATUS_LABELS[lead.status] || lead.status}</span></td>
        <td><span class="date-text">${date}</span></td>
        <td>
          <div class="actions-cell">
            <a href="https://wa.me/55${lead.whatsapp}?text=${wppMsg}" target="_blank" class="btn-wpp-row" title="WhatsApp">💬</a>
            <button class="btn-edit" onclick="openModal(${lead.id})">✏️ Editar</button>
            <button class="btn-delete" onclick="deleteLead(${lead.id})" title="Excluir">🗑️</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// ===== ATUALIZAR CARDS DE RESUMO =====
function updateStats() {
  document.getElementById('stat-total').textContent = leads.length;
  document.getElementById('stat-aguardando').textContent = leads.filter(l => l.status === 'AGUARDANDO_PAGAMENTO').length;
  document.getElementById('stat-negociacao').textContent = leads.filter(l => l.status === 'EM_NEGOCIACAO').length;
  document.getElementById('stat-finalizados').textContent = leads.filter(l => l.status === 'FINALIZADO_SUCESSO').length;
}

// ===== FILTROS =====
function applyFilters() {
  const search = document.getElementById('search-input').value.toLowerCase();
  const status = document.getElementById('status-filter').value;
  const filtered = leads.filter(l => {
    const matchSearch = l.placa.toLowerCase().includes(search) || l.whatsapp.includes(search) || (l.nome || '').toLowerCase().includes(search);
    const matchStatus = !status || l.status === status;
    return matchSearch && matchStatus;
  });
  renderTable(filtered);
}

document.getElementById('search-input').addEventListener('input', applyFilters);
document.getElementById('status-filter').addEventListener('change', applyFilters);

// ===== MODAL: ABRIR =====
function openModal(id) {
  editingId = id || null;
  const lead = id ? leads.find(l => l.id === id) : null;
  const modal = document.getElementById('modal-overlay');
  const title = document.getElementById('modal-title');

  title.textContent = id ? `Editando Lead – ${lead.placa}` : 'Novo Lead';
  document.getElementById('modal-placa').value = lead ? lead.placa : '';
  document.getElementById('modal-whatsapp').value = lead ? lead.whatsapp : '';
  document.getElementById('modal-nome').value = lead ? (lead.nome || '') : '';
  document.getElementById('modal-status').value = lead ? lead.status : 'NOVO';
  document.getElementById('modal-obs').value = lead ? (lead.obs || '') : '';

  // Botão de WhatsApp
  if (lead) {
    const wppMsg = encodeURIComponent(`Olá! Sou da Concilia Veículos. Sobre a placa *${lead.placa}*...`);
    document.getElementById('modal-whatsapp-btn').href = `https://wa.me/55${lead.whatsapp}?text=${wppMsg}`;
  }

  modal.classList.remove('hidden');
}

// ===== MODAL: FECHAR =====
function closeModal() {
  document.getElementById('modal-overlay').classList.add('hidden');
  editingId = null;
}

document.getElementById('modal-close').addEventListener('click', closeModal);
document.getElementById('btn-modal-cancel').addEventListener('click', closeModal);
document.getElementById('modal-overlay').addEventListener('click', (e) => {
  if (e.target === document.getElementById('modal-overlay')) closeModal();
});

// ===== MODAL: SALVAR =====
document.getElementById('btn-modal-save').addEventListener('click', () => {
  const placa = document.getElementById('modal-placa').value.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
  const whatsapp = document.getElementById('modal-whatsapp').value.replace(/\D/g, '');
  const nome = document.getElementById('modal-nome').value.trim();
  const status = document.getElementById('modal-status').value;
  const obs = document.getElementById('modal-obs').value.trim();

  if (!placa || placa.length < 7) { alert('Placa inválida'); return; }
  if (whatsapp.length < 10) { alert('WhatsApp inválido'); return; }

  if (editingId) {
    const idx = leads.findIndex(l => l.id === editingId);
    if (idx >= 0) leads[idx] = { ...leads[idx], placa, whatsapp, nome, status, obs };
  } else {
    leads.unshift({ id: Date.now(), placa, whatsapp, nome, status, obs, createdAt: new Date().toISOString() });
  }

  saveLeads();
  updateStats();
  applyFilters();
  closeModal();
});

// ===== DELETAR LEAD =====
function deleteLead(id) {
  if (!confirm('Tem certeza que deseja excluir este lead?')) return;
  leads = leads.filter(l => l.id !== id);
  saveLeads();
  updateStats();
  applyFilters();
}

// ===== EXPORTAR CSV =====
document.getElementById('btn-export').addEventListener('click', () => {
  const header = ['ID', 'Placa', 'WhatsApp', 'Nome', 'Status', 'Observações', 'Data'];
  const rows = leads.map(l => [
    l.id, l.placa, l.whatsapp, l.nome || '', l.status, (l.obs || '').replace(/,/g, ';'),
    new Date(l.createdAt).toLocaleDateString('pt-BR')
  ]);
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `leads_concilia_${new Date().toISOString().slice(0,10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
});

// ===== BOTÕES =====
document.getElementById('btn-refresh').addEventListener('click', () => {
  loadLeads();
  updateStats();
  applyFilters();
});

document.getElementById('btn-add-lead').addEventListener('click', () => openModal(null));

// ===== INIT =====
loadLeads();
updateStats();
applyFilters();
