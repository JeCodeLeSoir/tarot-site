// Le modèle et sa bibliothèque sont téléchargés au premier clic, puis exécutés dans le navigateur.
(() => {
  if (!validSelection || sourceCards.length !== 10) return;

  const MODEL_ID = 'onnx-community/LFM2.5-350M-ONNX';
  const TRANSFORMERS_URL = 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@4.3.0/+esm';
  const SYSTEM_PROMPT = `Tu es un guide de lecture du tarot. Réponds en français naturel et précis.
Utilise uniquement les dix cartes et leurs significations données. Les numéros indiquent l'ordre de sélection, pas des positions divinatoires. Aucune carte n'est renversée. N'invente aucune carte ni événement futur.
Écris trois paragraphes développés : (1) le fil conducteur du tirage, (2) les tensions et les ressources qui se répondent entre les cartes, (3) une piste de réflexion concrète pour comprendre le tirage.
Cite cinq ou six cartes différentes et explique leurs liens. Ne recopie pas la liste des dix cartes. Évite les répétitions. Termine par une seule question ouverte. Vise environ 170 à 220 mots. Les cartes proposent des pistes, pas des certitudes.`;

  const form = document.getElementById('aiForm');
  const submit = document.getElementById('aiSubmit');
  const status = document.getElementById('aiStatus');
  const result = document.getElementById('aiResult');
  document.getElementById('aiPromptPreview').textContent = SYSTEM_PROMPT;
  let generatorPromise;
  let phase = 'chargement de la bibliothèque';
  const log = (...items) => console.info('[Tarot IA]', ...items);
  const lastProgress = new Map();

  log('Script prêt', {model: MODEL_ID, page: window.location.href, cartes: sourceCards.map(card => card.title)});

  function showGuidedReading() {
    const focus = [0, 4, 9].map(index => ({card: sourceCards[index], index}));
    const majorCount = sourceCards.filter(card => card.family === 'major').length;
    const opening = sourceCards[0];
    const ending = sourceCards[9];
    const challenge = sourceCards.find(card => /rupture|incertitude|peur|conflit|perte|blocage|doute|tension|attente|illusion|crise/i.test(card.key + ' ' + card.meaning)) || sourceCards[3];
    const resource = sourceCards.find(card => card !== challenge && /espoir|confiance|clarté|création|initiative|stabilité|joie|équilibre|courage|abondance/i.test(card.key + ' ' + card.meaning)) || sourceCards[7];
    const label = card => card.key.toLocaleLowerCase('fr').replace(/\s*·\s*/g, ' et ');
    result.replaceChildren();
    const heading = document.createElement('h3');
    heading.textContent = 'Lecture guidée des cartes';
    const intro = document.createElement('p');
    intro.textContent = `${majorCount === 10 ? 'Avec dix arcanes majeurs, ce tirage met surtout en avant des choix et des changements importants. ' : majorCount >= 5 ? 'La présence de plusieurs arcanes majeurs donne du poids aux thèmes de ce tirage. ' : ''}${opening.title} ouvre la sélection sur ${label(opening)} ; ${ending.title} la termine sur ${label(ending)}. L’ordre ne fixe pas un destin : il offre une façon de relier ces deux idées.`;
    const contrast = document.createElement('p');
    contrast.textContent = `${challenge.title} attire l’attention sur ${label(challenge)}, tandis que ${resource.title} apporte ${label(resource)}. Ce contraste peut aider à distinguer ce qui demande de la prudence de ce qui constitue une ressource.`;
    const focusHeading = document.createElement('h3');
    focusHeading.textContent = 'Trois cartes à approfondir';
    const list = document.createElement('ol');
    list.className = 'ai-focus-list';
    focus.forEach(({card, index}) => {
      const item = document.createElement('li');
      const title = document.createElement('strong');
      title.textContent = `Carte ${index + 1} · ${card.title}`;
      const key = document.createElement('span');
      key.textContent = card.key;
      const meaning = document.createElement('p');
      meaning.textContent = card.meaning;
      item.append(title, key, meaning);
      list.append(item);
    });
    const close = document.createElement('p');
    close.textContent = 'Quelle tension ou ressource de ce tirage fait écho à votre situation ? Les dix descriptions complètes sont plus bas.';
    result.append(heading, intro, contrast, focusHeading, list, close);
    result.hidden = false;
  }

  showGuidedReading();

  function buildMessages() {
    const focalIndexes = [0, 3, 6, 9];
    const focalCards = focalIndexes.map(index => sourceCards[index]);
    const cardDetails = sourceCards.map((card, index) =>
      `${index + 1}. ${card.title} — ${card.key}. Sens : ${card.meaning}`
    ).join('\n');
    return [
      {role: 'system', content: SYSTEM_PROMPT},
      {role: 'user', content: `Voici les dix cartes. Développe surtout ${focalCards.map(card => card.title).join(', ')} ; les autres donnent le contexte.\n${cardDetails}\n\nFais une lecture générale détaillée. Réponds directement en trois paragraphes, sans numérotation.`}
    ];
  }

  function reportProgress(event) {
    if (event.status === 'progress' && Number.isFinite(event.progress)) {
      status.textContent = `Téléchargement du modèle : ${Math.round(event.progress)} % (${event.file || 'fichier'})`;
      const file = event.file || 'fichier';
      const step = Math.floor(event.progress / 10) * 10;
      if (lastProgress.get(file) !== step) {
        lastProgress.set(file, step);
        log('Téléchargement', {file, pourcentage: Math.round(event.progress)});
      }
    } else if (event.status === 'initiate') {
      status.textContent = 'Téléchargement du modèle depuis Hugging Face…';
      log('Début du téléchargement', event.file || event);
    } else if (event.status === 'ready') {
      status.textContent = 'Modèle prêt. Lecture du tirage…';
      log('Fichier prêt', event.file || event);
    }
  }

  async function loadGenerator() {
    if (!generatorPromise) {
      generatorPromise = (async () => {
        status.textContent = 'Chargement de la bibliothèque…';
        log('Chargement de Transformers.js', TRANSFORMERS_URL);
        const {pipeline, env} = await import(TRANSFORMERS_URL);
        if (typeof pipeline !== 'function') throw new Error('La bibliothèque chargée ne contient pas le module de génération.');
        log('Bibliothèque chargée');
        env.allowLocalModels = false;
        log('Environnement', {webgpuDisponible: !!navigator.gpu, crossOriginIsolated: window.crossOriginIsolated});
        phase = 'initialisation du modèle';
        if (navigator.gpu) {
          try {
            status.textContent = 'Préparation du modèle avec WebGPU…';
            log('Initialisation du modèle', {device: 'webgpu', dtype: 'q4f16'});
            const generator = await pipeline('text-generation', MODEL_ID, {
              device: 'webgpu', dtype: 'q4f16', progress_callback: reportProgress
            });
            log('Modèle prêt', {device: 'webgpu'});
            return generator;
          } catch (error) {
            console.warn('[Tarot IA] WebGPU indisponible ; essai sur le processeur.', error);
          }
        }
        status.textContent = 'Préparation du modèle sur le processeur…';
        log('Initialisation du modèle', {device: 'wasm', dtype: 'q8'});
        const generator = await pipeline('text-generation', MODEL_ID, {
          device: 'wasm', dtype: 'q8', progress_callback: reportProgress
        });
        log('Modèle prêt', {device: 'wasm'});
        return generator;
      })().catch(error => {
        generatorPromise = undefined;
        throw error;
      });
    }
    return generatorPromise;
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    submit.disabled = true;
    showGuidedReading();
    log('Interprétation demandée');
    try {
      if (window.location.protocol === 'file:') {
        log('Modèle non lancé : page ouverte en file://');
        status.textContent = 'Pour charger le modèle, ouvrez startserver.bat puis utilisez la page http://127.0.0.1:8765/ qui s’ouvre.';
        return;
      }
      const generator = await loadGenerator();
      phase = 'génération de la réponse';
      status.textContent = 'Le modèle lit les dix cartes… Cela peut prendre un moment.';
      const messages = buildMessages();
      log('Prompt système', SYSTEM_PROMPT);
      log('Cartes transmises au modèle', messages[1].content);
      log('Début de génération');
      const output = await generator(messages, {
        max_new_tokens: 400,
        do_sample: false,
        repetition_penalty: 1.15
      });
      const generated = output?.[0]?.generated_text;
      const answer = Array.isArray(generated) ? generated.at(-1)?.content : generated;
      log('Réponse brute du modèle', answer);
      if (typeof answer !== 'string' || !answer.trim()) throw new Error('Réponse vide');
      const modelReading = document.createElement('section');
      modelReading.className = 'ai-model-reading';
      const heading = document.createElement('h3');
      heading.textContent = 'Lecture du modèle';
      const paragraph = document.createElement('p');
      paragraph.textContent = answer.trim();
      modelReading.append(heading, paragraph);
      result.prepend(modelReading);
      status.textContent = 'Lecture terminée. Vous pouvez relancer l’interprétation.';
      log('Réponse affichée');
    } catch (error) {
      console.error('[Tarot IA] Échec', {phase, error});
      status.textContent = `Modèle indisponible pendant ${phase} (${error?.message || String(error)}). La lecture guidée reste affichée.`;
    } finally {
      submit.disabled = false;
    }
  });
})();
