document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('articles-root');
  try {
    const response = await fetch('schedule.json');
    if (!response.ok) throw new Error('Failed to load schedule.json');
    const data = await response.json();
    const articles = data.slice(0, 4);
    articles.forEach((article, idx) => {
      root.appendChild(renderArticle(article, idx));
    });
  } catch (e) {
    root.innerHTML = '<p style="color:red">Failed to load schedule data.</p>';
  }
});

function renderArticle(article, idx) {
  const art = document.createElement('article');
  art.className = `schedule-column column-${idx + 1}`;

  // Header
  const header = document.createElement('header');
  header.className = 'column-header';
  header.innerHTML = `
    <span class="version-number">${article.version}</span>
    <span class="branch-date">${article.branch_date}</span>
  `;
  art.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'column-body';
  for (const section of article.sections) {
    body.appendChild(renderSection(section));
  }
  art.appendChild(body);
  return art;
}

function renderSection(section) {
  const sec = document.createElement('section');
  sec.className = 'milestone-section';
  const title = document.createElement('h2');
  title.className = 'section-title';
  title.textContent = section.title;
  sec.appendChild(title);

  const list = document.createElement('div');
  list.className = 'milestone-list';
  for (const ms of section.milestones) {
    list.appendChild(renderMilestone(ms));
  }
  sec.appendChild(list);
  return sec;
}

function renderMilestone(ms) {
  const row = document.createElement('div');
  row.className = 'milestone-row';
  if (ms.subtext) row.classList.add('with-subtext');

  // Label and value/owners/icon
  const labelSpan = document.createElement('span');
  labelSpan.textContent = ms.label;
  if (ms.subtext) {
    const small = document.createElement('small');
    small.textContent = ms.subtext;
    labelSpan.appendChild(small);
  }

  let valueSpan;
  if (ms.value) {
    valueSpan = document.createElement('span');
    valueSpan.textContent = ms.value;
  } else if (ms.icon === 'check') {
    valueSpan = document.createElement('span');
    valueSpan.className = 'icon-check';
    valueSpan.textContent = '✔';
  } else if (ms.owners) {
    valueSpan = document.createElement('span');
    valueSpan.className = 'owner-list';
    for (const owner of ms.owners) {
      const ownerSpan = document.createElement('span');
      ownerSpan.textContent = owner;
      valueSpan.appendChild(ownerSpan);
    }
  }

  row.appendChild(labelSpan);
  if (valueSpan) row.appendChild(valueSpan);
  return row;
} 