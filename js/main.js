// ===== Theme Toggle =====
(function() {
  const themeKey = 'blog-theme';
  const stored = localStorage.getItem(themeKey) || 'light';
  document.documentElement.setAttribute('data-theme', stored);
  const btn = document.getElementById('themeToggle');
  if (btn) {
    btn.textContent = stored === 'dark' ? '☀️' : '🌙';
    btn.addEventListener('click', () => {
      const current = document.documentElement.getAttribute('data-theme');
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      localStorage.setItem(themeKey, next);
      btn.textContent = next === 'dark' ? '☀️' : '🌙';
    });
  }
})();

// ===== Blog Data =====
async function loadPosts() {
  const res = await fetch('data/posts.json');
  if (!res.ok) throw new Error('无法加载文章');
  return res.json();
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日`;
}

function renderPostCard(post) {
  const tagsHTML = (post.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
  return `
    <div class="post-card fade-in" data-slug="${post.slug}">
      <div class="meta">
        <span>${formatDate(post.date)}</span>
      </div>
      ${tagsHTML ? `<div class="tags">${tagsHTML}</div>` : ''}
      <h2>${post.title}</h2>
      <p class="excerpt">${post.excerpt || ''}</p>
    </div>
  `;
}

// ===== Home Page =====
const postListEl = document.getElementById('postList');
if (postListEl) {
  (async () => {
    postListEl.innerHTML = '<div class="loading"><div class="spinner"></div><p>加载中...</p></div>';
    try {
      const data = await loadPosts();
      if (!data.posts || data.posts.length === 0) {
        postListEl.innerHTML = '<div class="empty-state"><div class="icon">📝</div><p>还没有文章，敬请期待</p></div>';
        return;
      }
      postListEl.innerHTML = data.posts
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .map(renderPostCard)
        .join('');

      // Click to view post
      document.querySelectorAll('.post-card').forEach(card => {
        card.addEventListener('click', () => {
          const slug = card.dataset.slug;
          window.location.href = `post.html?slug=${slug}`;
        });
      });
    } catch (e) {
      postListEl.innerHTML = `<div class="error-state"><div class="icon">⚠️</div><p>${e.message}</p></div>`;
    }
  })();
}

// ===== Post Page =====
const postContainer = document.getElementById('postContainer');
if (postContainer) {
  (async () => {
    postContainer.innerHTML = '<div class="loading"><div class="spinner"></div><p>加载中...</p></div>';
    try {
      const params = new URLSearchParams(window.location.search);
      const slug = params.get('slug');
      if (!slug) throw new Error('未指定文章');

      const data = await loadPosts();
      const post = data.posts.find(p => p.slug === slug);
      if (!post) throw new Error('文章未找到');

      const tagsHTML = (post.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
      document.title = `${post.title} - 我的博客`;

      const html = `
        <button class="back-btn" onclick="history.back()">← 返回</button>
        <article class="fade-in">
          <div class="post-header">
            ${tagsHTML ? `<div class="tags">${tagsHTML}</div>` : ''}
            <h1>${post.title}</h1>
            <div class="meta">
              <span>${formatDate(post.date)}</span>
              ${post.author ? `<span>· ${post.author}</span>` : ''}
              ${post.readTime ? `<span>· ${post.readTime}</span>` : ''}
            </div>
          </div>
          <div class="post-content">${post.content}</div>
        </article>
      `;
      postContainer.innerHTML = html;
    } catch (e) {
      postContainer.innerHTML = `<div class="error-state"><div class="icon">⚠️</div><p>${e.message}</p></div>`;
    }
  })();
}
