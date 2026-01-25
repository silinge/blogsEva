document.addEventListener('DOMContentLoaded', () => {
    const currentTheme = localStorage.getItem('eva-theme') || 'eva-00';
    document.documentElement.setAttribute('data-theme', currentTheme);

    // Initialize switchers if they exist
    const switchers = document.querySelectorAll('.theme-btn');
    switchers.forEach(btn => {
        btn.addEventListener('click', () => {
            const theme = btn.getAttribute('data-theme');
            document.documentElement.setAttribute('data-theme', theme);
            localStorage.setItem('eva-theme', theme);
        });
    });
});
