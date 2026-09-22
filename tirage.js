const drawGrid = document.getElementById('drawGrid');
const drawStatus = document.getElementById('drawStatus');
const readDraw = document.getElementById('readDraw');
const mobileLayout = window.matchMedia('(max-width: 680px)');
let deck = [];
let selected = [];
let groupSize = 26;
const cardButtons = [];

function cardId(card) { return card.image.replace(/\.jpg$/, ''); }

function shuffledDeck() {
  const result = [...cards];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function updateSelection() {
  document.getElementById('drawCount').textContent = selected.length + ' / 10 cartes choisies';
  readDraw.disabled = selected.length !== 10;
  deck.forEach((card, index) => {
    const button = cardButtons[index];
    const order = selected.indexOf(index);
    const isSelected = order !== -1;
    button.classList.toggle('revealed', isSelected);
    button.style.zIndex = String(isSelected ? 100 + order : index % groupSize + 1);
    button.setAttribute('aria-pressed', String(isSelected));
    button.setAttribute('aria-label', isSelected ? 'Carte choisie ' + (order + 1) + ' : ' + card.title + '. Cliquez pour la remettre face cachée.' : 'Retourner la carte face cachée ' + (index + 1));
    button.querySelector('.draw-order').textContent = isSelected ? String(order + 1) : '';
  });
}

function toggleCard(index) {
  const order = selected.indexOf(index);
  if (order !== -1) {
    selected.splice(order, 1);
    drawStatus.textContent = deck[index].title + ' remise face cachée.';
  } else if (selected.length < 10) {
    selected.push(index);
    drawStatus.textContent = selected.length === 10 ? 'Vos dix cartes sont choisies. Vous pouvez lire leurs descriptions.' : 'Carte ' + selected.length + ' : ' + deck[index].title + '.';
  } else {
    drawStatus.textContent = 'Dix cartes sont déjà choisies. Remettez-en une face cachée pour en retourner une autre.';
    return;
  }
  updateSelection();
}

function renderDeck() {
  drawGrid.replaceChildren();
  cardButtons.length = 0;
  const compact = mobileLayout.matches;
  groupSize = compact ? (window.innerWidth <= 360 ? 5 : 6) : 26;
  const cardWidth = window.innerWidth <= 350 ? 72 : 78;
  const sideInset = 20;
  const availableWidth = Math.max(200, window.innerWidth - 34);
  const mobileStep = Math.max(24, Math.min(54, Math.floor((availableWidth - cardWidth - sideInset * 2) / (groupSize - 1))));
  for (let group = 0; group < Math.ceil(deck.length / groupSize); group++) {
    const start = group * groupSize;
    const count = Math.min(groupSize, deck.length - start);
    const section = document.createElement('section');
    section.className = 'fan-section';
    const heading = document.createElement('h2');
    heading.className = 'fan-heading';
    heading.textContent = 'Éventail ' + (group + 1);
    const viewport = document.createElement('div');
    viewport.className = 'draw-fan-viewport';
    viewport.setAttribute('aria-label', 'Éventail ' + (group + 1) + ', cartes ' + (start + 1) + ' à ' + (start + count));
    const fan = document.createElement('div');
    fan.className = 'draw-fan';
    if (compact) fan.style.width = (cardWidth + (count - 1) * mobileStep + sideInset * 2) + 'px';
    for (let slot = 0; slot < count; slot++) {
      const index = start + slot;
      const card = deck[index];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'draw-card';
      const middle = (count - 1) / 2;
      button.style.setProperty('--fan-left', (compact ? sideInset + slot * mobileStep : 40 + slot * 35) + 'px');
      button.style.setProperty('--fan-angle', ((slot - middle) * (compact ? 5 : 1.7)) + 'deg');
      button.style.setProperty('--fan-y', (Math.pow((slot - middle) / middle, 2) * (compact ? 18 : 47)) + 'px');
      if (compact) button.style.setProperty('--mobile-card-width', cardWidth + 'px');
      button.style.zIndex = String(slot + 1);
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', 'Retourner la carte face cachée ' + (index + 1));
      const inner = document.createElement('span');
      inner.className = 'draw-card-inner';
      const back = document.createElement('span');
      back.className = 'draw-card-back';
      back.innerHTML = '<span class="back-ornament" aria-hidden="true">✧</span>';
      const front = document.createElement('span');
      front.className = 'draw-card-front';
      const image = document.createElement('img');
      image.src = 'images/' + card.image;
      image.alt = '';
      image.loading = group === 0 ? 'eager' : 'lazy';
      const order = document.createElement('span');
      order.className = 'draw-order';
      order.setAttribute('aria-hidden', 'true');
      const name = document.createElement('span');
      name.className = 'draw-card-name';
      name.textContent = card.title;
      front.append(image, order, name);
      inner.append(back, front);
      button.append(inner);
      button.addEventListener('click', () => toggleCard(index));
      fan.append(button);
      cardButtons.push(button);
    }
    viewport.append(fan);
    section.append(heading, viewport);
    drawGrid.append(section);
  }
  updateSelection();
}

let resizeTimer;
window.addEventListener('resize', () => {
  if (!deck.length) return;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(renderDeck, 150);
});

function newDraw() {
  deck = shuffledDeck();
  selected = [];
  renderDeck();
  drawStatus.textContent = 'Les 78 cartes sont mélangées. Choisissez-en jusqu’à dix.';
}

document.getElementById('newDraw').addEventListener('click', newDraw);
readDraw.addEventListener('click', () => {
  if (selected.length !== 10) return;
  const params = new URLSearchParams({selection: selected.map(index => cardId(deck[index])).join(','), source: 'tirage'});
  window.location.href = 'cartes.html?' + params.toString();
});
newDraw();
