const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const REACTION_TYPES = [
  { type: 'like', label: '♥', title: 'Лайк' },
  { type: 'skull', label: '☠', title: 'Респект' }
];

let currentUser = null;
let posts = [];
let reactions = [];
let comments = [];

const feedEl = document.getElementById('feed');
const loadingEl = document.getElementById('loading');
const authBarEl = document.getElementById('auth-bar');
const composerEl = document.getElementById('composer');
const loginFormEl = document.getElementById('login-form');
const loginErrorEl = document.getElementById('login-error');

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatContent(text) {
  return escapeHtml(text).replace(/\n/g, '<br>');
}

function formatDate(iso) {
  return new Date(iso).toLocaleString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function getVisitorId() {
  let id = localStorage.getItem('diary_visitor_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('diary_visitor_id', id);
  }
  return id;
}

function getSavedNick() {
  return localStorage.getItem('diary_nick') || '';
}

function setSavedNick(nick) {
  localStorage.setItem('diary_nick', nick);
}

function showError(el, message) {
  el.textContent = message;
  el.hidden = !message;
}

async function init() {
  const { data: { session } } = await db.auth.getSession();
  currentUser = session?.user ?? null;
  updateAuthUI();
  await loadFeed();
  loadingEl.hidden = true;

  db.auth.onAuthStateChange((_event, session) => {
    currentUser = session?.user ?? null;
    updateAuthUI();
    if (posts.length) renderFeed();
  });
}

function updateAuthUI() {
  if (currentUser) {
    authBarEl.innerHTML = `
      <span class="auth-status">☠ Автор: ${escapeHtml(currentUser.email)}</span>
      <button type="button" class="diary-btn diary-btn-ghost" id="logout-btn">Выйти</button>
    `;
    composerEl.hidden = false;
    document.getElementById('logout-btn').addEventListener('click', logout);
  } else {
    authBarEl.innerHTML = `
      <button type="button" class="diary-btn" id="show-login-btn">☠ Вход для автора</button>
    `;
    composerEl.hidden = true;
    document.getElementById('show-login-btn').addEventListener('click', () => {
      loginFormEl.hidden = !loginFormEl.hidden;
    });
  }
}

async function logout() {
  await db.auth.signOut();
  loginFormEl.hidden = true;
  renderFeed();
}

loginFormEl.addEventListener('submit', async (e) => {
  e.preventDefault();
  showError(loginErrorEl, '');

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;

  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    showError(loginErrorEl, error.message);
    return;
  }

  loginFormEl.hidden = true;
  loginFormEl.reset();
});

document.getElementById('publish-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const content = document.getElementById('post-content').value.trim();
  const mood = document.getElementById('post-mood').value.trim();
  const publishError = document.getElementById('publish-error');

  showError(publishError, '');

  if (!content) {
    showError(publishError, 'Напиши хоть что-нибудь.');
    return;
  }

  const { error } = await db.from('posts').insert({
    author_id: currentUser.id,
    content,
    mood: mood || null
  });

  if (error) {
    showError(publishError, error.message);
    return;
  }

  document.getElementById('publish-form').reset();
  await loadFeed();
});

async function loadFeed() {
  const [postsRes, reactionsRes, commentsRes] = await Promise.all([
    db.from('posts').select('*').order('created_at', { ascending: false }),
    db.from('reactions').select('*'),
    db.from('comments').select('*').order('created_at', { ascending: true })
  ]);

  if (postsRes.error) {
    feedEl.innerHTML = `<div class="diary-error">Ошибка загрузки: ${escapeHtml(postsRes.error.message)}<br><small>Таблицы созданы? Запусти supabase/setup.sql</small></div>`;
    return;
  }

  posts = postsRes.data || [];
  reactions = reactionsRes.data || [];
  comments = commentsRes.data || [];
  renderFeed();
}

function getReactionsForPost(postId) {
  return reactions.filter(r => r.post_id === postId);
}

function getCommentsForPost(postId) {
  return comments.filter(c => c.post_id === postId);
}

function renderFeed() {
  if (!posts.length) {
    feedEl.innerHTML = '<div class="diary-empty">Пока пусто. Автор ещё ничего не выложил — или не залит seed.</div>';
    return;
  }

  feedEl.innerHTML = posts.map(post => renderPost(post)).join('');
  bindFeedEvents();
}

function renderPost(post) {
  const postReactions = getReactionsForPost(post.id);
  const postComments = getCommentsForPost(post.id);
  const visitorId = getVisitorId();
  const isAuthor = currentUser?.id === post.author_id;

  const reactionButtons = REACTION_TYPES.map(({ type, label, title }) => {
    const count = postReactions.filter(r => r.reaction_type === type).length;
    const active = postReactions.some(r => r.reaction_type === type && r.visitor_id === visitorId);
    return `<button type="button" class="reaction-btn${active ? ' active' : ''}" data-post-id="${post.id}" data-reaction="${type}" title="${title}">${label} <span>${count}</span></button>`;
  }).join('');

  const commentsHtml = postComments.map(c => `
    <div class="comment-item">
      <span class="comment-author">${escapeHtml(c.author_name)}</span>
      <span class="comment-date">${formatDate(c.created_at)}</span>
      <div class="comment-text">${formatContent(c.content)}</div>
    </div>
  `).join('');

  const authorActions = isAuthor ? `
    <div class="author-actions">
      <button type="button" class="diary-btn diary-btn-small diary-btn-ghost edit-btn" data-post-id="${post.id}">Редактировать</button>
      <button type="button" class="diary-btn diary-btn-small diary-btn-danger delete-btn" data-post-id="${post.id}">Удалить</button>
    </div>
  ` : '';

  const moodHtml = post.mood ? `<div class="diary-mood">Настроение: ${escapeHtml(post.mood)}</div>` : '';

  return `
    <article class="diary-entry" data-post-id="${post.id}">
      <div class="diary-meta">
        <div class="diary-date">${formatDate(post.created_at)}</div>
        <div class="diary-author">☠ IAYSISDEAD</div>
      </div>
      <div class="diary-content" id="content-${post.id}">${formatContent(post.content)}</div>
      ${moodHtml}
      <div class="reactions-row">${reactionButtons}</div>
      <div class="comments-section">
        <button type="button" class="comments-toggle" data-post-id="${post.id}">
          Комментарии (${postComments.length})
        </button>
        <div class="comments-panel" id="comments-${post.id}" hidden>
          <div class="comments-list">${commentsHtml || '<div class="comment-empty">Тишина. Подозрительно.</div>'}</div>
          <form class="comment-form" data-post-id="${post.id}">
            <input type="text" class="comment-nick" placeholder="Ник (необязательно)" maxlength="40" value="${escapeHtml(getSavedNick())}">
            <textarea class="comment-input" placeholder="Напиши коммент..." rows="2" maxlength="2000" required></textarea>
            <button type="submit" class="diary-btn diary-btn-small">Отправить</button>
          </form>
        </div>
      </div>
      ${authorActions}
    </article>
  `;
}

function bindFeedEvents() {
  feedEl.querySelectorAll('.reaction-btn').forEach(btn => {
    btn.addEventListener('click', () => toggleReaction(btn.dataset.postId, btn.dataset.reaction));
  });

  feedEl.querySelectorAll('.comments-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const panel = document.getElementById(`comments-${btn.dataset.postId}`);
      panel.hidden = !panel.hidden;
    });
  });

  feedEl.querySelectorAll('.comment-form').forEach(form => {
    form.addEventListener('submit', (e) => submitComment(e, form));
  });

  feedEl.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', () => deletePost(btn.dataset.postId));
  });

  feedEl.querySelectorAll('.edit-btn').forEach(btn => {
    btn.addEventListener('click', () => startInlineEdit(btn.dataset.postId));
  });
}

async function toggleReaction(postId, reactionType) {
  const visitorId = getVisitorId();
  const existing = reactions.find(r =>
    r.post_id === postId && r.visitor_id === visitorId && r.reaction_type === reactionType
  );

  if (existing) {
    const { error } = await db.from('reactions').delete().eq('id', existing.id);
    if (error) return;
  } else {
    const { error } = await db.from('reactions').insert({
      post_id: postId,
      visitor_id: visitorId,
      reaction_type: reactionType
    });
    if (error) return;
  }

  await loadFeed();
}

async function submitComment(e, form) {
  e.preventDefault();
  const postId = form.dataset.postId;
  const nickInput = form.querySelector('.comment-nick');
  const textInput = form.querySelector('.comment-input');
  const nick = nickInput.value.trim() || 'Аноним';
  const content = textInput.value.trim();

  if (!content) return;

  setSavedNick(nickInput.value.trim());

  const { error } = await db.from('comments').insert({
    post_id: postId,
    author_name: nick,
    content
  });

  if (error) return;

  textInput.value = '';
  await loadFeed();
  const panel = document.getElementById(`comments-${postId}`);
  if (panel) panel.hidden = false;
}

async function deletePost(postId) {
  if (!confirm('Удалить этот мемуарчик навсегда?')) return;

  const { error } = await db.from('posts').delete().eq('id', postId);
  if (error) {
    alert(error.message);
    return;
  }

  await loadFeed();
}

function startInlineEdit(postId) {
  const post = posts.find(p => p.id === postId);
  if (!post) return;

  const article = feedEl.querySelector(`[data-post-id="${postId}"]`);
  if (!article || article.querySelector('.edit-form')) return;

  const contentEl = article.querySelector('.diary-content');
  const moodEl = article.querySelector('.diary-mood');
  const authorActions = article.querySelector('.author-actions');

  if (moodEl) moodEl.hidden = true;
  if (authorActions) authorActions.hidden = true;
  contentEl.hidden = true;

  const editForm = document.createElement('div');
  editForm.className = 'edit-form';

  const contentLabel = document.createElement('label');
  contentLabel.className = 'diary-label';
  contentLabel.textContent = 'Текст записи';

  const contentInput = document.createElement('textarea');
  contentInput.className = 'diary-textarea edit-content';
  contentInput.value = post.content;

  const moodLabel = document.createElement('label');
  moodLabel.className = 'diary-label';
  moodLabel.textContent = 'Настроение';

  const moodInput = document.createElement('input');
  moodInput.className = 'diary-input edit-mood';
  moodInput.type = 'text';
  moodInput.value = post.mood || '';
  moodInput.placeholder = 'void, 404...';

  const actions = document.createElement('div');
  actions.className = 'edit-actions';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'diary-btn diary-btn-small';
  saveBtn.textContent = 'Сохранить';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'diary-btn diary-btn-small diary-btn-ghost';
  cancelBtn.textContent = 'Отмена';

  const errorEl = document.createElement('p');
  errorEl.className = 'form-error edit-error';
  errorEl.hidden = true;

  actions.append(saveBtn, cancelBtn);
  editForm.append(contentLabel, contentInput, moodLabel, moodInput, actions, errorEl);
  contentEl.after(editForm);

  saveBtn.addEventListener('click', () => saveInlineEdit(postId, editForm));
  cancelBtn.addEventListener('click', () => loadFeed());
  contentInput.focus();
}

async function saveInlineEdit(postId, editForm) {
  const content = editForm.querySelector('.edit-content').value.trim();
  const mood = editForm.querySelector('.edit-mood').value.trim();
  const errorEl = editForm.querySelector('.edit-error');

  showError(errorEl, '');

  if (!content) {
    showError(errorEl, 'Текст не может быть пустым.');
    return;
  }

  const saveBtn = editForm.querySelector('.save-edit-btn') || editForm.querySelector('.diary-btn');
  saveBtn.disabled = true;
  saveBtn.textContent = 'Сохраняю...';

  const { error } = await db.from('posts').update({
    content,
    mood: mood || null,
    updated_at: new Date().toISOString()
  }).eq('id', postId);

  if (error) {
    saveBtn.disabled = false;
    saveBtn.textContent = 'Сохранить';
    showError(errorEl, error.message);
    return;
  }

  await loadFeed();
}

init();
