// List of schedule json files (in display order)
const SCHEDULE_SOURCES = [
  'schedule_desktop.json',
  'schedule_android.json',
  'schedule_ios.json'
];

document.addEventListener('DOMContentLoaded', async () => {
  const root = document.getElementById('articles-root');
  try {
    let columnIndex = 0;
    for (const source of SCHEDULE_SOURCES) {
      // Load one platform file at a time to preserve column order
      const response = await fetch(source);
      if (!response.ok) throw new Error(`Failed to load ${source}`);
      const data = await response.json();
      // Each file is an array of projects (usually one)
      const projects = Array.isArray(data) ? data : [data];
      for (const project of projects) {
        root.appendChild(renderProject(project, columnIndex));
        columnIndex += 1;
      }
    }
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
  let renderedAnyVersion = false;
  for (const version of project.versions) {
    const versionSection = renderVersion(version);
    if (versionSection) {
      body.appendChild(versionSection);
      renderedAnyVersion = true;
    }
  }

  // If no versions had highlighted milestones, do not render this project column
  if (renderedAnyVersion) {
    art.appendChild(body);
    return art;
  }
  return null;
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
  // Determine highlighted milestones based on today's date.
  const today = getTodayDateOnly();
  let anyHighlighted = false;
  let anyUpcoming = false;

  // Support two schemas:
  // - New: explicit "start" and "end" (inclusive)
  // - Legacy: "date_start" with range until next "date_start" (as before)
  // First, precompute legacy ranges if needed
  let legacyCurrentIndex = null;
  const hasExplicitRanges = version.milestones.some(ms => ms.start);
  if (!hasExplicitRanges) {
    const starts = version.milestones
      .map((ms, i) => ({ index: i, start: ms.date_start ? toDateOnly(ms.date_start) : null }))
      .filter(x => !!x.start)
      .sort((a, b) => a.start - b.start);
    for (let i = 0; i < starts.length; i++) {
      const cur = starts[i];
      const next = starts[i + 1];
      const inRange = next
        ? (cur.start <= today && today < next.start)
        : (cur.start <= today ? true : false);
      if (inRange) {
        legacyCurrentIndex = cur.index;
        break;
      }
    }
  }

  for (let i = 0; i < version.milestones.length; i++) {
    const ms = version.milestones[i];
    let isCurrent = false;
    let isUpcoming = false;
    if (ms.start) {
      const startDate = toDateOnly(ms.start);
      const endDate = ms.end ? toDateOnly(ms.end) : null;
      isCurrent = !!startDate && (startDate <= today) && (!endDate || today <= endDate);
      if (startDate && startDate > today) {
        isUpcoming = true;
      }
    } else {
      isCurrent = legacyCurrentIndex === i;
      if (ms.date_start) {
        const startDate = toDateOnly(ms.date_start);
        if (startDate && startDate > today) {
          isUpcoming = true;
        }
      }
    }
    if (isCurrent) anyHighlighted = true;
    if (isUpcoming) anyUpcoming = true;
    list.appendChild(renderMilestone(ms, isCurrent));
  }
  sec.appendChild(list);
  // If no milestones are current or upcoming, skip rendering this version
  if (!anyHighlighted && !anyUpcoming) {
    return null;
  }
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