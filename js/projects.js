/* Projects page — GitHub repos feed */

(function () {
  const GITHUB_USER = 'dvllvsberg';
  const EXCLUDE_REPOS = new Set([]);
  const ACTIVE_DAYS = 30;
  const STALE_DAYS = 120;

  const listEl = document.getElementById('projects-list');
  const loadingEl = document.getElementById('projects-loading');
  const errorEl = document.getElementById('projects-error');

  if (!listEl) return;

  function daysSince(iso) {
    if (!iso) return Infinity;
    return (Date.now() - new Date(iso).getTime()) / 86400000;
  }

  function statusLabel(repo) {
    if (repo.archived) return 'Заброшен';
    const days = daysSince(repo.pushed_at);
    if (days <= ACTIVE_DAYS) return 'В разработке';
    if (days <= STALE_DAYS) return 'На паузе';
    return 'Заброшен';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function buildTags(repo) {
    const tags = new Set();
    if (repo.language) tags.add(repo.language);
    (repo.topics || []).forEach((t) => tags.add(t));
    if (repo.fork) tags.add('fork');
    return [...tags].slice(0, 8);
  }

  function renderCard(repo) {
    const card = document.createElement('article');
    card.className = 'project-card';

    const status = statusLabel(repo);
    const desc = repo.description
      ? escapeHtml(repo.description)
      : '<span class="project-no-desc">Без описания на GitHub.</span>';

    const tags = buildTags(repo)
      .map((t) => `<span class="tech-tag">${escapeHtml(t)}</span>`)
      .join('');

    let links = `<a href="${escapeHtml(repo.html_url)}" target="_blank" rel="noopener noreferrer">GitHub</a>`;
    if (repo.homepage) {
      links += `<a href="${escapeHtml(repo.homepage)}" target="_blank" rel="noopener noreferrer">Демо</a>`;
    }

    const meta = [];
    if (repo.stargazers_count > 0) meta.push(`★ ${repo.stargazers_count}`);
    if (repo.forks_count > 0) meta.push(`⑂ ${repo.forks_count}`);
    const metaHtml = meta.length
      ? `<div class="project-meta">${meta.map(escapeHtml).join(' · ')}</div>`
      : '';

    card.innerHTML = `
      <div class="project-status">${escapeHtml(status)}</div>
      <h2 class="project-title">${escapeHtml(repo.name)}</h2>
      <div class="project-description">${desc}</div>
      ${metaHtml}
      <div class="project-tech">${tags || '<span class="tech-tag">misc</span>'}</div>
      <div class="project-links">${links}</div>
    `;

    return card;
  }

  function showError(message) {
    if (loadingEl) loadingEl.hidden = true;
    if (errorEl) {
      errorEl.hidden = false;
      errorEl.textContent = message;
    }
  }

  function hideLoading() {
    if (loadingEl) loadingEl.hidden = true;
  }

  async function loadRepos() {
    const url = `https://api.github.com/users/${GITHUB_USER}/repos?sort=pushed&direction=desc&per_page=100&type=owner`;

    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/vnd.github+json' }
      });

      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('GitHub API rate limit. Попробуй позже или зайди с github.com.');
        }
        throw new Error(`GitHub вернул ${res.status}`);
      }

      const repos = await res.json();
      const filtered = repos
        .filter((r) => !r.private && !EXCLUDE_REPOS.has(r.name))
        .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at));

      hideLoading();

      if (!filtered.length) {
        showError('Публичных репозиториев не найдено.');
        return;
      }

      listEl.replaceChildren();
      filtered.forEach((repo) => listEl.appendChild(renderCard(repo)));
    } catch (err) {
      console.error(err);
      showError(err.message || 'Не удалось загрузить проекты с GitHub.');
    }
  }

  loadRepos();
})();
