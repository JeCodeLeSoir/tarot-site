const grid = document.getElementById('cardGrid');
const search = document.getElementById('search');
const selectedList = document.getElementById('selectedList');
const status = document.getElementById('status');
const families = {all:'Toutes',major:'Arcanes majeurs',wands:'Bâtons',cups:'Coupes',swords:'Épées',pents:'Deniers'};
let family = 'all';
let selected = [];

function cardId(card) { return card.image.replace(/\.jpg$/, ''); }
function normalize(value) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }

function renderCards() {
  const query = normalize(search.value.trim());
  const visible = cards.filter(card => (family === 'all' || card.family === family) && (!query || normalize(card.title + ' ' + card.key).includes(query)));
  document.getElementById('resultCount').textContent = visible.length + ' carte' + (visible.length > 1 ? 's' : '');
  grid.replaceChildren();
  if (!visible.length) {
    const message = document.createElement('p');
    message.className = 'empty';
    message.textContent = 'Aucune carte trouvée.';
    grid.append(message);
    return;
  }
  visible.forEach(card => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'pick-card';
    button.setAttribute('aria-pressed', String(selected.includes(cardId(card))));
    button.setAttribute('aria-label', card.title + (selected.includes(cardId(card)) ? ', sélectionnée' : ', non sélectionnée'));
    button.innerHTML = `<img src="images/${card.image}" alt="" loading="lazy"><span class="selected-mark" aria-hidden="true">✓</span><span class="name">${card.title}</span><span class="number">${card.family === 'major' ? 'Arcane ' + card.number : families[card.family]}</span>`;
    button.addEventListener('click', () => toggleCard(card, button));
    grid.append(button);
  });
}

function renderSelection() {
  document.getElementById('selectionCount').textContent = selected.length + ' / 10';
  document.getElementById('readSelection').disabled = selected.length === 0;
  selectedList.replaceChildren();
  if (!selected.length) {
    const empty = document.createElement('li');
    empty.textContent = 'Aucune carte retrouvée pour le moment.';
    selectedList.append(empty);
  }
  for (let i = 0; i < selected.length; i++) {
    const item = document.createElement('li');
    const number = document.createElement('span');
    number.className = 'slot-number';
    number.textContent = String(i + 1);
    item.append(number);
    item.className = 'filled';
    const id = selected[i];
    const card = cards.find(c => cardId(c) === id);
    const remove = document.createElement('button');
    remove.type = 'button';
    remove.className = 'remove-card';
    remove.textContent = card.title + ' ×';
    remove.setAttribute('aria-label', 'Retirer ' + card.title);
    remove.addEventListener('click', () => { selected = selected.filter(value => value !== id); status.textContent = card.title + ' retirée.'; renderSelection(); renderCards(); });
    item.append(remove);
    selectedList.append(item);
  }
}

function toggleCard(card, button) {
  const id = cardId(card);
  if (selected.includes(id)) {
    selected = selected.filter(value => value !== id);
    status.textContent = card.title + ' retirée.';
  } else if (selected.length < 10) {
    selected.push(id);
    status.textContent = card.title + ' ajoutée aux cartes à retrouver.';
  } else {
    status.textContent = 'Vous pouvez retrouver au maximum dix cartes à la fois. Retirez-en une pour en ajouter une autre.';
    return;
  }
  const chosen = selected.includes(id);
  button.setAttribute('aria-pressed', String(chosen));
  button.setAttribute('aria-label', card.title + (chosen ? ', sélectionnée' : ', non sélectionnée'));
  renderSelection();
}

document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  family = button.dataset.family;
  document.querySelectorAll('.filter').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  renderCards();
}));
search.addEventListener('input', renderCards);
document.getElementById('clearSelection').addEventListener('click', () => { selected = []; status.textContent = 'Sélection effacée.'; renderSelection(); renderCards(); });
document.getElementById('readSelection').addEventListener('click', () => {
  if (!selected.length) return;
  const params = new URLSearchParams({selection:selected.join(',')});
  window.location.href = 'cartes.html?' + params.toString();
});
renderSelection();
renderCards();
