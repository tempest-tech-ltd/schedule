document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('articles-root');
  try {
    const response = await fetch('schedule.json');
    if (!response.ok) throw new Error('Failed to load schedule.json');
    const data = await response.json();
    const projects = data.slice(0, 3); // Show first 3 projects
    projects.forEach((project, idx) => {
      root.appendChild(renderProject(project, idx));
    });
  } catch (e) {
    root.innerHTML = '<p style="color:red">Failed to load schedule data.</p>';
  }
});

function toDateOnly(dateString) {
  // Returns a Date at local midnight for date-only comparisons
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function getTodayDateOnly() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function renderProject(project, idx) {
  const art = document.createElement('article');
  art.className = `schedule-column column-${idx + 1}`;

  // Header
  const header = document.createElement('header');
  header.className = 'column-header';
  header.innerHTML = `
    <span class="project-title">${project.title}</span>
  `;
  art.appendChild(header);

  // Body
  const body = document.createElement('div');
  body.className = 'column-body';
  
  // Render versions for this project
  for (const version of project.versions) {
    body.appendChild(renderVersion(version));
  }
  
  art.appendChild(body);
  return art;
}

function renderVersion(version) {
  const sec = document.createElement('section');
  sec.className = 'version-section';
  
  const title = document.createElement('h2');
  title.className = 'version-title';
  title.innerHTML = `
    <span class="version-number">${version.version}</span>
  `;
  sec.appendChild(title);

  const list = document.createElement('div');
  list.className = 'milestone-list';
  // Determine current milestone based on today's date and milestone ranges defined by date_start to next date_start
  const today = getTodayDateOnly();
  let currentIndex = null;
  const starts = version.milestones
    .map((ms, i) => ({ index: i, start: ms.date_start ? toDateOnly(ms.date_start) : null }))
    .filter(x => !!x.start)
    .sort((a, b) => a.start - b.start);

  for (let i = 0; i < starts.length; i++) {
    const cur = starts[i];
    const next = starts[i + 1];
    const inRange = next
      ? (cur.start <= today && today < next.start)
      : (cur.start <= today ? true : false); // last item inclusive start, no explicit end
    if (inRange) {
      currentIndex = cur.index;
      break;
    }
  }

  for (let i = 0; i < version.milestones.length; i++) {
    const ms = version.milestones[i];
    const isCurrent = currentIndex === i;
    list.appendChild(renderMilestone(ms, isCurrent));
  }
  sec.appendChild(list);
  return sec;
}

function renderMilestone(ms, isCurrent) {
  const row = document.createElement('div');
  row.className = 'milestone-row';
  if (ms.subtext) row.classList.add('with-subtext');
  if (isCurrent) row.classList.add('current');

  // Label and value/owners/icon
  const labelSpan = document.createElement('span');
  labelSpan.textContent = ms.label;

  let valueSpan;
  if (ms.value) {
    valueSpan = document.createElement('span');
    valueSpan.textContent = ms.value;
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