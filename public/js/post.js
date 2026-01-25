async function loadPost() {
    const path = window.location.pathname;
    const id = path.split('/').pop();
    if (!id) return;

    const container = document.getElementById('post-container');

    try {
        const res = await fetch(`/api/posts/${id}`);
        if (!res.ok) {
            if (res.status === 404) {
                container.innerHTML = '<h2>404 - 档案丢失</h2><p>请求的数据不存在或已被销毁。</p>';
            } else {
                throw new Error('Load failed');
            }
            return;
        }
        const post = await res.json();

        document.title = `${post.title} - Eva Blog`;

        container.innerHTML = `
      <header style="margin-bottom:30px; border-bottom:1px dashed var(--border-color); padding-bottom:20px;">
        <h1 style="font-size:2rem; margin-bottom:10px; color:var(--text-primary);">${escapeHtml(post.title)}</h1>
        <div class="post-meta">
           <span>📅 ${new Date(post.created_at).toLocaleDateString()}</span>
           <span>📝 ${new Date(post.created_at).toLocaleTimeString()}</span>
        </div>
      </header>
      <div class="post-content" style="font-size:1.1rem; line-height:1.8;">
        ${post.content} 
      </div>
    `;
        // Note: post.content is trusted here as admin inputs it. Ideally sanitize if multi-user.
    } catch (err) {
        console.error(err);
        container.innerHTML = '<p>系统错误: 无法读取档案。</p>';
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

document.addEventListener('DOMContentLoaded', loadPost);
