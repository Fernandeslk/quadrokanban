var cards = [];
var arrastando = null;
var toastTimer;

/* ── storage ── */
function salvar() {
  localStorage.setItem('kanban-simples', JSON.stringify(cards));
}

function carregar() {
  var salvo = localStorage.getItem('kanban-simples');
  if (salvo) {
    cards = JSON.parse(salvo);
  } else {
    var agora = Date.now();
    cards = [
      { id: uid(), texto: 'Definir requisitos',      coluna: 'done',  prioridade: 'alta',    ts: agora - 86400000 },
      { id: uid(), texto: 'Criar wireframes',        coluna: 'done',  prioridade: 'media',   ts: agora - 72000000 },
      { id: uid(), texto: 'Implementar drag & drop', coluna: 'doing', prioridade: 'alta',    ts: agora - 36000000 },
      { id: uid(), texto: 'Escrever testes',         coluna: 'doing', prioridade: 'media',   ts: agora - 18000000 },
      { id: uid(), texto: 'Publicar no servidor',    coluna: 'todo',  prioridade: 'urgente', ts: agora - 3600000  },
      { id: uid(), texto: 'Documentar o codigo',     coluna: 'todo',  prioridade: 'baixa',   ts: agora            }
    ];
  }
}

/* ── UTILS ── */
function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function dataRelativa(ts) {
  var diff = Date.now() - ts;
  if (diff < 60000)    return 'agora mesmo';
  if (diff < 3600000)  return Math.floor(diff / 60000) + 'min atras';
  if (diff < 86400000) return Math.floor(diff / 3600000) + 'h atras';
  var d = new Date(ts);
  return (d.getDate()+'').padStart(2,'0') + '/' + ((d.getMonth()+1)+'').padStart(2,'0');
}

function labelPrio(p) {
  return { urgente:'Urgente', alta:'Alta', media:'Media', baixa:'Baixa' }[p] || p;
}

/* ── TOAST ── */
function toast(msg) {
  var el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(function() { el.classList.remove('show'); }, 2000);
}

/* ── RENDER ── */
function render() {
  ['todo','doing','done'].forEach(function(col) {
    document.getElementById('area-' + col).innerHTML = '';
  });

  cards.forEach(function(c) {
    document.getElementById('area-' + c.coluna).appendChild(criarCard(c));
  });

  atualizarContadores();
}

function criarCard(c) {
  var div = document.createElement('div');
  div.className = 'card';
  div.draggable = true;
  div.dataset.id = c.id;
  div.dataset.prioridade = c.prioridade;

  /* topo */
  var top = document.createElement('div');
  top.className = 'card-top';

  var tag = document.createElement('span');
  tag.className = 'tag tag-' + c.prioridade;
  tag.textContent = labelPrio(c.prioridade);

  var acoes = document.createElement('div');
  acoes.className = 'card-acoes';

  var btnE = document.createElement('button');
  btnE.className = 'btn-acao editar';
  btnE.textContent = '✏️';
  btnE.title = 'Editar';

  var btnX = document.createElement('button');
  btnX.className = 'btn-acao excluir';
  btnX.textContent = '✕';
  btnX.title = 'Excluir';
  btnX.onclick = function() { excluir(c.id); };

  acoes.appendChild(btnE);
  acoes.appendChild(btnX);
  top.appendChild(tag);
  top.appendChild(acoes);

  /* texto */
  var p = document.createElement('p');
  p.className = 'card-texto';
  p.textContent = c.texto;
  p.title = 'Duplo clique para editar';
  p.ondblclick = function() { editar(p, c.id); };

  btnE.onclick = function() { editar(p, c.id); };

  /* data */
  var dataEl = document.createElement('div');
  dataEl.className = 'card-data';
  dataEl.textContent = dataRelativa(c.ts || Date.now());

  div.appendChild(top);
  div.appendChild(p);
  div.appendChild(dataEl);

  /* drag */
  div.addEventListener('dragstart', function(e) {
    arrastando = div;
    div.classList.add('dragging');
    e.dataTransfer.setData('text/plain', c.id);
    e.dataTransfer.effectAllowed = 'move';
  });

  div.addEventListener('dragend', function() {
    div.classList.remove('dragging');
    arrastando = null;
    document.querySelectorAll('.cards-area').forEach(function(a) {
      a.classList.remove('drag-over');
    });
  });

  return div;
}

function atualizarContadores() {
  ['todo','doing','done'].forEach(function(col) {
    var n = cards.filter(function(c) { return c.coluna === col; }).length;
    document.getElementById('badge-' + col).textContent = n;
    document.getElementById('stat-' + col).textContent = n;
  });
  document.getElementById('stat-total').textContent = cards.length;
}

/* ── ADICIONAR ── */
function adicionarCard() {
  var input = document.getElementById('input-card');
  var prio  = document.getElementById('sel-prio');
  var texto = input.value.trim();
  if (!texto) {
    input.focus();
    input.style.outline = '2px solid #ef4444';
    setTimeout(function() { input.style.outline = ''; }, 700);
    return;
  }
  cards.unshift({ id: uid(), texto: texto, coluna: 'todo', prioridade: prio.value, ts: Date.now() });
  salvar();
  render();
  toast('✓ Card adicionado');
  input.value = '';
  input.focus();
}

/* ── EXCLUIR ── */
function excluir(id) {
  cards = cards.filter(function(c) { return c.id !== id; });
  salvar();
  render();
  toast('Card excluido');
}

/* ── EDITAR ── */
function editar(el, id) {
  el.contentEditable = 'true';
  el.focus();

  var range = document.createRange();
  range.selectNodeContents(el);
  window.getSelection().removeAllRanges();
  window.getSelection().addRange(range);

  el.addEventListener('blur', function handler() {
    el.removeEventListener('blur', handler);
    el.contentEditable = 'false';
    var novoTexto = el.textContent.trim();
    var card = cards.find(function(c) { return c.id === id; });
    if (!novoTexto) { if (card) el.textContent = card.texto; return; }
    if (card && card.texto !== novoTexto) {
      card.texto = novoTexto;
      salvar();
      toast('✓ Card atualizado');
    }
  });

  el.addEventListener('keydown', function handler(e) {
    if (e.key === 'Enter')  { e.preventDefault(); el.blur(); }
    if (e.key === 'Escape') {
      el.removeEventListener('keydown', handler);
      var card = cards.find(function(c) { return c.id === id; });
      if (card) el.textContent = card.texto;
      el.contentEditable = 'false';
    }
  });
}

/* ── DRAG & DROP ── */
function dragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  e.currentTarget.classList.add('drag-over');
}

function dragLeave(e) {
  e.currentTarget.classList.remove('drag-over');
}

function drop(e) {
  e.preventDefault();
  var area = e.currentTarget;
  area.classList.remove('drag-over');
  var id = e.dataTransfer.getData('text/plain');
  var novaCol = area.id.replace('area-', '');
  var card = cards.find(function(c) { return c.id === id; });
  if (card && card.coluna !== novaCol) {
    card.coluna = novaCol;
    salvar();
    render();
    var nomes = { todo:'A Fazer', doing:'Fazendo', done:'Concluido' };
    toast('→ Movido para ' + nomes[novaCol]);
  }
}

/* ── ENTER no input ── */
document.getElementById('input-card').addEventListener('keydown', function(e) {
  if (e.key === 'Enter') adicionarCard();
});

/* ── INIT ── */
carregar();
render();
