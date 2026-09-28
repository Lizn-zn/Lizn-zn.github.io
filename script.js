const DATA_BASE = new URL('data/', document.currentScript.src);
const CATEGORY_NAMES = {
  'theorem-proving': 'Formal reasoning & theorem proving',
  'neuro-symbolic': 'Neuro-symbolic AI & LLM reasoning',
  'trustworthy-ml': 'Trustworthy & uncertainty-aware ML'
};
const publicationState = {
  papers: [], category: 'all', query: '', mode: 'topic'
};

function externalLinks(root = document) {
  root.querySelectorAll('a[href]').forEach(link => {
    if (/^https?:$/.test(link.protocol) && link.origin !== location.origin) {
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
    }
  });
}

async function loadData(name, container, render) {
  if (!container) return;
  try {
    const response = await fetch(new URL(`${name}.json`, DATA_BASE), { cache: 'no-cache' });
    if (!response.ok) throw new Error(`Could not load ${name}`);
    const items = await response.json();
    render(items);
    externalLinks(container);
  } catch (error) {
    container.replaceChildren();
    const message = document.createElement('p');
    message.className = 'load-error';
    message.append(`Unable to load ${name}. `);
    const retry = document.createElement('button');
    retry.type = 'button';
    retry.textContent = 'Try again';
    retry.addEventListener('click', () => loadData(name, container, render));
    message.append(retry);
    container.append(message);
  }
}

function setupNavigation() {
  const button = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#nav-links');
  if (!button || !menu) return;
  const closeMenu = () => {
    button.setAttribute('aria-expanded', 'false');
    button.setAttribute('aria-label', 'Open navigation');
    menu.classList.remove('is-open');
  };
  button.addEventListener('click', () => {
    const open = button.getAttribute('aria-expanded') !== 'true';
    button.setAttribute('aria-expanded', String(open));
    button.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    menu.classList.toggle('is-open', open);
  });
  menu.addEventListener('click', event => {
    if (event.target.closest('a')) closeMenu();
  });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && button.getAttribute('aria-expanded') === 'true') {
      closeMenu();
      button.focus();
    }
  });
  document.addEventListener('click', event => {
    if (!event.target.closest('.site-header')) closeMenu();
  });
  const wideScreen = window.matchMedia('(min-width: 681px)');
  wideScreen.addEventListener('change', closeMenu);
  const links = Array.from(menu.querySelectorAll('a[href^="#"]'));
  const sections = links.map(link => document.querySelector(link.getAttribute('href')));
  let ticking = false;
  const update = () => {
    let active = 0;
    sections.forEach((section, i) => {
      if (section && section.getBoundingClientRect().top <= 160) active = i;
    });
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 3) active = links.length - 1;
    links.forEach((link, i) => {
      link.classList.toggle('active', i === active);
      if (i === active) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
    ticking = false;
  };
  window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(update); ticking = true; }
  }, { passive: true });
  update();
}

function renderNews(items, container, limit) {
  container.replaceChildren();
  items.slice(0, limit).forEach(item => {
    const row = document.createElement('div');
    row.className = 'news-item';
    const date = document.createElement('span');
    date.className = 'news-date';
    date.textContent = item.date;
    const content = document.createElement('div');
    content.className = 'news-content';
    // Editorial HTML comes from the repository's own data files.
    content.innerHTML = item.content;
    const links = item.links?.length ? item.links : item.link && item.link !== '#' ? [{ url: item.link, text: 'Read more ↗' }] : [];
    links.forEach(itemLink => {
      const link = document.createElement('a');
      link.href = itemLink.url;
      link.textContent = itemLink.text;
      content.append(' ', link);
    });
    row.append(date, content);
    container.append(row);
  });
}

function renderHonors(items, container) {
  container.replaceChildren();
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'honor-item';
    const year = document.createElement('span');
    year.className = 'honor-year';
    year.textContent = item.date;
    const content = document.createElement('div');
    content.className = 'honor-content';
    const title = document.createElement(container.id === 'all-honors-container' ? 'h2' : 'h3');
    title.textContent = item.title;
    const org = document.createElement('p');
    org.textContent = item.org;
    content.append(title, org);
    row.append(year, content);
    container.append(row);
  });
}

function paperLinks(paper) {
  return (paper.tags || []).filter(tag => /^https?:\/\//i.test((tag.link || '').trim()));
}

// Conference names follow the bibliography in the original homepage.
function formatVenue(paper) {
  if (!paper.venue) return paper.year ? `Preprint, ${paper.year}` : 'Preprint';
  const abbreviation = paper.venue.replace(/\s*\d{4}/g, '').trim();
  const names = {
    COLM: 'Conference on Language Modeling',
    OOPSLA: 'ACM SIGPLAN Conference on Object-Oriented Programming, Systems, Languages, and Applications',
    ICML: 'International Conference on Machine Learning',
    ICLR: 'International Conference on Learning Representations',
    NeurIPS: 'Advances in Neural Information Processing Systems',
    OSDI: 'USENIX Symposium on Operating Systems Design and Implementation',
    CAV: 'International Conference on Computer Aided Verification',
    CVPR: 'IEEE/CVF Conference on Computer Vision and Pattern Recognition',
    KDD: 'ACM SIGKDD Conference on Knowledge Discovery and Data Mining',
    ICSE: 'International Conference on Software Engineering',
    'ICSE-NIER': 'International Conference on Software Engineering, New Ideas and Emerging Results',
    'ESEC/FSE': 'ACM Joint European Software Engineering Conference and Symposium on the Foundations of Software Engineering'
  };
  return names[abbreviation] ? `${names[abbreviation]} (${paper.venue})` : paper.venue;
}

function renderPaper(paper, citationNumber) {
  const row = document.createElement('li');
  row.className = 'pub-list-item';
  const citation = document.createElement('span');
  citation.className = 'pub-citation';
  citation.setAttribute('aria-hidden', 'true');
  citation.textContent = `[${String(citationNumber).padStart(2, '0')}]`;
  row.append(citation);
  const meta = document.createElement('div');
  meta.className = 'pub-meta';
  const venue = document.createElement('span');
  venue.className = 'pub-venue-tag';
  venue.textContent = formatVenue(paper);
  meta.append(venue);
  if (paper.highlight) {
    const highlight = document.createElement('span');
    highlight.className = 'pub-badge-highlight';
    highlight.textContent = paper.highlight;
    meta.append(highlight);
  }
  const title = document.createElement(document.getElementById('all-publications') ? 'h3' : 'h4');
  title.className = 'pub-title';
  const links = paperLinks(paper);
  const paperLink = links.find(tag => tag.text === 'Paper');
  if (paperLink) {
    const anchor = document.createElement('a');
    anchor.href = paperLink.link;
    anchor.textContent = paper.title;
    title.append(anchor);
  } else title.textContent = paper.title;
  const authors = document.createElement('p');
  authors.className = 'pub-authors';
  authors.innerHTML = (paper.authors || '').replace(/<br\s*\/?\s*>/gi, ' ');
  row.append(title, authors, meta);
  const resources = document.createElement('div');
  resources.className = 'pub-links';
  links.forEach(tag => {
    const anchor = document.createElement('a');
    anchor.className = 'pub-link-btn';
    anchor.href = tag.link;
    anchor.textContent = `[${tag.text}]`;
    anchor.setAttribute('aria-label', `${tag.text}: ${paper.title}`);
    resources.append(anchor);
  });
  if (paper.thumbnail) {
    const preview = document.createElement('button');
    preview.type = 'button';
    preview.className = 'pub-link-btn';
    preview.textContent = 'Preview +';
    preview.setAttribute('aria-expanded', 'false');
    const img = document.createElement('img');
    img.className = 'pub-thumbnail';
    img.src = new URL(paper.thumbnail, new URL('../', DATA_BASE)).href;
    img.alt = `Research figure for ${paper.title}`;
    img.loading = 'lazy';
    img.hidden = true;
    preview.addEventListener('click', () => {
      img.hidden = !img.hidden;
      preview.setAttribute('aria-expanded', String(!img.hidden));
      preview.textContent = img.hidden ? 'Preview +' : 'Hide preview −';
    });
    resources.append(preview);
    row.append(resources, img);
  } else if (links.length) row.append(resources);
  return row;
}

function renderPublications() {
  const list = document.querySelector('.publications-list');
  if (!list) return;
  const { papers, category, query, mode } = publicationState;
  const normalizedQuery = query.trim().normalize('NFKC').toLowerCase();
  const filtered = papers.filter(paper => {
    const text = `${paper.title} ${paper.authors} ${paper.venue} ${paper.year} ${CATEGORY_NAMES[paper.category] || ''}`.replace(/<[^>]*>/g, '').normalize('NFKC').toLowerCase();
    return (category === 'all' || paper.category === category) && (!normalizedQuery || text.includes(normalizedQuery));
  }).sort((a, b) => (Number(b.year) || 9999) - (Number(a.year) || 9999));
  const isFiltered = category !== 'all' || Boolean(normalizedQuery);
  const shown = filtered;
  list.replaceChildren();
  const count = document.querySelector('.pub-result-count');
  count.textContent = isFiltered ? `${filtered.length} matching publication${filtered.length === 1 ? '' : 's'}` : `${papers.length} publications`;
  if (!shown.length) {
    const empty = document.createElement('p');
    empty.className = 'empty-state';
    empty.append('No publications match your search. ');
    const reset = document.createElement('button');
    reset.type = 'button';
    reset.textContent = 'Clear filters';
    reset.addEventListener('click', () => {
      publicationState.query = '';
      document.querySelector('#publication-search').value = '';
      setCategory('all');
    });
    empty.append(reset);
    list.append(empty);
  }
  const groups = new Map();
  shown.forEach(paper => {
    const key = mode === 'topic' ? paper.category || 'other' : paper.year || 'Preprint';
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(paper);
  });
  const keys = mode === 'topic' ? [...new Set([...Object.keys(CATEGORY_NAMES), ...groups.keys()])].filter(key => groups.has(key)) : [...groups.keys()];
  let citationNumber = 0;
  keys.forEach(key => {
    const group = document.createElement('div');
    group.className = 'pub-year-group';
    const heading = document.createElement(document.getElementById('all-publications') ? 'h2' : 'h3');
    heading.className = 'pub-year-header';
    heading.textContent = mode === 'topic' ? CATEGORY_NAMES[key] || 'Other research' : key;
    const ul = document.createElement('ol');
    ul.className = 'pub-list-ul';
    ul.start = citationNumber + 1;
    groups.get(key).forEach(paper => ul.append(renderPaper(paper, ++citationNumber)));
    group.append(heading, ul);
    list.append(group);
  });
  externalLinks(list);
}

function setCategory(category) {
  publicationState.category = category;
  document.querySelectorAll('.filter-btn').forEach(button => {
    const selected = button.dataset.category === category;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  renderPublications();
}

function setupPublications() {
  const list = document.querySelector('.publications-list');
  if (!list) return;
  document.querySelectorAll('.filter-btn').forEach(button => {
    button.addEventListener('click', () => setCategory(button.dataset.category));
  });
  document.querySelectorAll('[data-research]').forEach(link => {
    link.addEventListener('click', () => {
      publicationState.query = '';
      document.querySelector('#publication-search').value = '';
      setCategory(link.dataset.research);
      const controls = document.querySelector('.publication-tools');
      if (controls) controls.open = true;
    });
  });
  document.querySelector('#publication-search').addEventListener('input', event => {
    publicationState.query = event.target.value;
    renderPublications();
  });
  document.querySelectorAll('.pub-toggle-btn').forEach(button => {
    button.addEventListener('click', () => {
      publicationState.mode = button.dataset.mode;
      document.querySelectorAll('.pub-toggle-btn').forEach(item => {
        const selected = item.dataset.mode === publicationState.mode;
        item.classList.toggle('active', selected);
        item.setAttribute('aria-pressed', String(selected));
      });
      renderPublications();
    });
  });
  loadData('publications', list, papers => {
    publicationState.papers = papers;
    renderPublications();
  });
}

externalLinks();
setupNavigation();
setupPublications();
const newsContainer = document.getElementById('news-container') || document.getElementById('all-news-container');
loadData('news', newsContainer, items => renderNews(items, newsContainer, newsContainer.id === 'news-container' ? 3 : undefined));
const honorsContainer = document.getElementById('honors-container') || document.getElementById('all-honors-container');
loadData('honors', honorsContainer, items => renderHonors(items, honorsContainer));
const year = document.getElementById('current-year');
if (year) year.textContent = new Date().getFullYear();
