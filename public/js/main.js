async function loadPosts() {
    const container = document.getElementById('posts');
    try {
        const resp = await fetch('/api/posts');
        if (!resp.ok) throw new Error('Failed to load posts');
        const posts = await resp.json();

        // Sort by date desc
        posts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Filter published only
        const publishedPosts = posts.filter(p => p.status === 'published');

        if (publishedPosts.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);">暂无发布的文章。</p>';
            return;
        }

        container.innerHTML = publishedPosts.map(post => `
      <article class="post-card">
        <h2>
          <a href="/post/${post.id}">${escapeHtml(post.title)}</a>
        </h2>
        <div class="post-meta">
          <span>📅 ${new Date(post.created_at).toLocaleDateString()}</span>
        </div>
        <div class="post-content-preview">
          ${stripHtml(post.content)}
        </div>
        <a href="/post/${post.id}" class="read-more">阅读全文 →</a>
      </article>
    `).join('');

    } catch (err) {
        console.error(err);
        container.innerHTML = '<p>无法加载文章列表。</p>';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function stripHtml(html) {
    if (!html) return '';
    const tmp = document.createElement("DIV");
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || "";
}

document.addEventListener('DOMContentLoaded', loadPosts);
