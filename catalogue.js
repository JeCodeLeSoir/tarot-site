const catalogList = document.getElementById('catalogList');
const search = document.getElementById('search');
const familyLabels = {all:'Toutes les cartes',major:'Arcanes majeurs',wands:'Bâtons',cups:'Coupes',swords:'Épées',pents:'Deniers'};
const byId = new Map(cards.map(card => [card.image.replace(/\.jpg$/, ''), card]));
const requested = new URLSearchParams(window.location.search).get('selection');
const fromRandomDraw = new URLSearchParams(window.location.search).get('source') === 'tirage' && requested?.split(',').length === 10;
const requestedIds = requested ? requested.split(',') : [];
const validSelection = requestedIds.length > 0 && requestedIds.length <= 10 && new Set(requestedIds).size === requestedIds.length && requestedIds.every(id => byId.has(id));
const sourceCards = validSelection ? requestedIds.map(id => byId.get(id)) : cards;
let family = 'all';

if (validSelection) {
  document.title = 'Mes cartes — Atlas du Tarot';
  document.getElementById('pageTitle').textContent = fromRandomDraw ? 'Mes 10 cartes tirées' : 'Mes cartes retrouvées';
  document.getElementById('pageIntro').textContent = fromRandomDraw ? 'Retrouvez les images, les symboles et la signification des dix cartes de votre tirage.' : 'Retrouvez les images, les symboles et la signification des cartes que vous avez retrouvées.';
  document.getElementById('selectedNote').hidden = false;
  document.getElementById('aiPanel').hidden = sourceCards.length !== 10;
  if (fromRandomDraw) {
    document.getElementById('selectionIntro').textContent = 'Voici les cartes de votre tirage aléatoire, dans l’ordre où elles sont apparues.';
    document.getElementById('retryLink').href = 'tirage.html';
    document.getElementById('retryLink').textContent = 'Faire un nouveau tirage';
  }
}

function normalize(value) { return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase(); }
function renderCatalogue() {
  const query = normalize(search.value.trim());
  const visible = sourceCards.filter(card => (family === 'all' || card.family === family) && (!query || normalize(card.title + ' ' + card.key + ' ' + card.visual + ' ' + card.meaning).includes(query)));
  document.getElementById('sectionHeading').textContent = validSelection && family === 'all' ? 'Ma sélection' : familyLabels[family];
  document.getElementById('resultCount').textContent = visible.length + ' carte' + (visible.length > 1 ? 's' : '');
  catalogList.replaceChildren();
  if (!visible.length) {
    const empty = document.createElement('p');
    empty.className = 'empty';
    empty.textContent = 'Aucune carte trouvée. Essayez un autre mot ou une autre famille.';
    catalogList.append(empty);
    return;
  }
  visible.forEach((card, index) => {
    const article = document.createElement('article');
    article.className = 'catalog-card';
    const img = document.createElement('img');
    img.src = 'images/' + card.image;
    img.alt = 'Illustration de ' + card.title;
    img.loading = index < 3 ? 'eager' : 'lazy';
    const body = document.createElement('div');
    const eyebrow = document.createElement('p');
    eyebrow.className = 'eyebrow';
    eyebrow.textContent = (validSelection ? 'Carte ' + (requestedIds.indexOf(card.image.replace(/\.jpg$/, '')) + 1) + ' · ' : '') + (card.family === 'major' ? 'Arcane majeur · ' + card.number : familyLabels[card.family] + ' · ' + card.number);
    const title = document.createElement('h2');
    title.textContent = card.title;
    const keywords = document.createElement('p');
    keywords.className = 'keywords';
    keywords.textContent = card.key;
    const visualHeading = document.createElement('h3');
    visualHeading.textContent = 'Ce que montre la carte';
    const visual = document.createElement('p');
    visual.textContent = card.visual;
    const meaningHeading = document.createElement('h3');
    meaningHeading.textContent = 'Signification';
    const meaning = document.createElement('p');
    meaning.textContent = card.meaning;
    body.append(eyebrow, title, keywords, visualHeading, visual, meaningHeading, meaning);
    article.append(img, body);
    catalogList.append(article);
  });
}

document.querySelectorAll('.filter').forEach(button => button.addEventListener('click', () => {
  family = button.dataset.family;
  document.querySelectorAll('.filter').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  renderCatalogue();
}));
search.addEventListener('input', renderCatalogue);
renderCatalogue();
