// ===== 主题切换 =====
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
      // 按钮微交互
      btn.style.transform = 'rotate(180deg)';
      setTimeout(() => { btn.style.transform = ''; }, 300);
    });
  }
})();


// ===== 北京时钟 =====
function getBeijingTime() {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utcMs + 8 * 3600000);
}

function updateBeijingClock() {
  const clockTime = document.getElementById('clockTime');
  const clockDate = document.getElementById('clockDate');
  if (!clockTime || !clockDate) return;
  
  const beijing = getBeijingTime();
  
  const h = String(beijing.getHours()).padStart(2, '0');
  const m = String(beijing.getMinutes()).padStart(2, '0');
  const s = String(beijing.getSeconds()).padStart(2, '0');
  
  clockTime.innerHTML = `${h}<span class="seconds-blink">:</span>${m}<span class="seconds-blink">:</span>${s}`;
  
  const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
  const y = beijing.getFullYear();
  const mo = beijing.getMonth() + 1;
  const d = beijing.getDate();
  const wd = weekdays[beijing.getDay()];
  
  clockDate.textContent = `${y} 年 ${mo} 月 ${d} 日 · ${wd}`;
}

// ===== 线性时间表 =====
function updateTimelineBar() {
  const progress = document.getElementById('tlProgress');
  const marker = document.getElementById('tlMarker');
  const labels = document.getElementById('tlLabels');
  if (!progress || !marker || !labels) return;
  
  const beijing = getBeijingTime();
  const h = beijing.getHours();
  const m = beijing.getMinutes();
  const s = beijing.getSeconds();
  
  // 计算当天进度百分比 (0~24小时)
  const totalMinutes = h * 60 + m + s / 60;
  const pct = Math.min((totalMinutes / (24 * 60)) * 100, 100);
  
  // 更新进度条
  progress.style.width = pct + '%';
  marker.textContent = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  
  // 更新标记位置 (让标记始终在进度条末端)
  marker.style.left = `calc(${pct}% - 2px)`;
  
  // 生成小时刻度 (只生成一次)
  if (!labels.dataset.ready) {
    labels.dataset.ready = 'true';
    let html = '';
    for (let i = 0; i <= 24; i++) {
      const label = i === 24 ? '24' : String(i);
      const current = i === h;
      html += `<span class="tl-label${current ? ' active' : ''}" style="left:${(i / 24) * 100}%">${label}</span>`;
    }
    labels.innerHTML = html;
  }
  
  // 高亮当前小时
  labels.querySelectorAll('.tl-label').forEach((el, idx) => {
    el.classList.toggle('active', idx === h);
  });
}

// 页面加载后启动时钟和时间表
function initTimeDisplay() {
  if (!document.getElementById('timeSection')) return;
  updateBeijingClock();
  updateTimelineBar();
  setInterval(updateBeijingClock, 1000);
  setInterval(updateTimelineBar, 10000);  // 每10秒更新一次时间表进度
}

initTimeDisplay();
// ===== 博客数据加载 =====
async function loadPosts() {
  const res = await fetch('data/posts.json');
  if (!res.ok) throw new Error('无法加载文章');
  return res.json();
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = d.getMonth() + 1;
  const day = d.getDate();
  return `${year} 年 ${month} 月 ${day} 日`;
}

function getRelativeDate(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now - d;
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return '今天';
  if (days === 1) return '昨天';
  if (days < 7) return `${days} 天前`;
  if (days < 30) return `${Math.floor(days / 7)} 周前`;
  return formatDate(dateStr);
}

function renderPostCard(post, index) {
  const tagsHTML = (post.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
  const delayClass = index === 0 ? '' : index === 1 ? ' fade-in-d2' : index === 2 ? ' fade-in-d3' : '';
  const d = new Date(post.date);
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  return `
    <div class="timeline-item fade-in${delayClass}" data-slug="${post.slug}">
      <div class="timeline-dot"></div>
      <div class="timeline-date">
        <span class="tl-day">${day}</span>
        <span class="tl-month">${month}月</span>
        <span class="tl-year">${year}</span>
      </div>
      <div class="timeline-content">
        <div class="post-card">
          <div class="meta">
            <span>${formatDate(post.date)}</span>
            ${post.readTime ? `<span class="dot"></span><span>${post.readTime}</span>` : ''}
          </div>
          ${tagsHTML ? `<div class="tags">${tagsHTML}</div>` : ''}
          <h2>${post.title}</h2>
          <p class="excerpt">${post.excerpt || ''}</p>
          <span class="read-more">阅读全文 →</span>
        </div>
      </div>
    </div>
  `;
}

// ===== 首页 =====
const postListEl = document.getElementById('postList');
if (postListEl) {
  (async () => {
    postListEl.innerHTML = '<div class="loading"><div class="spinner"></div><p>加载中...</p></div>';
    try {
      const data = await loadPosts();
      if (!data.posts || data.posts.length === 0) {
        postListEl.innerHTML = '<div class="empty-state"><span class="icon">📝</span><p>还没有文章，敬请期待</p></div>';
        return;
      }

      // 排序
      const sorted = [...data.posts].sort((a, b) => new Date(b.date) - new Date(a.date));
      
      // 更新统计信息
      const postCountEl = document.getElementById('postCount');
      if (postCountEl) postCountEl.textContent = sorted.length;

      const tagCountEl = document.getElementById('tagCount');
      if (tagCountEl) {
        const allTags = [...new Set(sorted.flatMap(p => p.tags || []))];
        tagCountEl.textContent = allTags.length;
      }

      const updateInfoEl = document.getElementById('updateInfo');
      if (updateInfoEl) {
        const latest = sorted[0];
        updateInfoEl.textContent = getRelativeDate(latest.date);
      }

      // 渲染文章列表
      postListEl.innerHTML = sorted.map((post, idx) => renderPostCard(post, idx)).join('');

      // 点击跳转 + 微交互
      document.querySelectorAll('.timeline-item').forEach(card => {
        card.addEventListener('click', () => {
          const slug = card.dataset.slug;
          card.style.transform = 'scale(0.98)';
          setTimeout(() => {
            window.location.href = `post.html?slug=${slug}`;
          }, 150);
        });
      });
    } catch (e) {
      postListEl.innerHTML = `<div class="error-state"><span class="icon">⚠️</span><p>${e.message}</p></div>`;
    }
  })();
}

// ===== 文章页面 =====
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
      document.title = `${post.title} · 溪言笔记`;

      // 找到上一篇和下一篇文章
      const sorted = [...data.posts].sort((a, b) => new Date(b.date) - new Date(a.date));
      const currentIdx = sorted.findIndex(p => p.slug === slug);
      const prevPost = currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null;
      const nextPost = currentIdx > 0 ? sorted[currentIdx - 1] : null;

      const prevHTML = prevPost ? `<a href="post.html?slug=${prevPost.slug}">← ${prevPost.title}</a>` : '';
      const nextHTML = nextPost ? `<a href="post.html?slug=${nextPost.slug}">${nextPost.title} →</a>` : '';

      const html = `
        <div class="fade-in">
          <button class="back-btn" onclick="window.location.href='/'">← 返回首页</button>
          <article>
            <div class="post-header">
              ${tagsHTML ? `<div class="tags">${tagsHTML}</div>` : ''}
              <h1>${post.title}</h1>
              <div class="meta">
                <span>${formatDate(post.date)}</span>
                <span class="dot"></span>
                <span>${getRelativeDate(post.date)}</span>
                ${post.author ? `<span class="dot"></span><span>✍ ${post.author}</span>` : ''}
                ${post.readTime ? `<span class="dot"></span><span>📖 ${post.readTime}</span>` : ''}
              </div>
            </div>
            <div class="post-content">${post.content}</div>
            <div class="post-footer">
              <div class="post-nav">
                ${prevHTML}
                ${nextHTML}
              </div>
              <a href="/" class="back-home">← 全部文章</a>
            </div>
          </article>
        </div>
      `;
      postContainer.innerHTML = html;

      // 为文章内容中的块级元素添加 reveal 动画
      document.querySelectorAll('.post-content h2, .post-content h3, .post-content blockquote, .post-content pre, .post-content img').forEach(el => {
        el.classList.add('reveal');
      });

      // 触发滚动观察
      setupRevealObserver();
    } catch (e) {
      postContainer.innerHTML = `<div class="error-state"><span class="icon">⚠️</span><p>${e.message}</p></div>`;
    }
  })();
}

// ===== 滚动入场动画 =====
function setupRevealObserver() {
  if (typeof IntersectionObserver === 'undefined') {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -40px 0px'
  });

  document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

// 首页也启用滚动动画
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(setupRevealObserver, 100);
});



