
// --- THEME TOGGLE LOGIC ---

function toggleTheme() {
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');

    body.classList.toggle('dark-mode');

    if (body.classList.contains('dark-mode')) {
        themeIcon.textContent = '☀️';
        localStorage.setItem('theme', 'dark');
    } else {
        themeIcon.textContent = '🌙';
        localStorage.setItem('theme', 'light');
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem('theme');
    const body = document.body;
    const themeIcon = document.getElementById('theme-icon');

    if (savedTheme === 'dark') {
        body.classList.add('dark-mode');
        if (themeIcon) themeIcon.textContent = '☀️';
    } else {
        body.classList.remove('dark-mode');
        if (themeIcon) themeIcon.textContent = '🌙';
    }
}

// Initialize theme on load
document.addEventListener('DOMContentLoaded', function () {
    loadTheme();
    // Re-run loadTheme to ensure icon is set if DOMContentLoaded fired before script parsed fully (rare but safe)
    setTimeout(loadTheme, 100);
});

window.toggleTheme = toggleTheme;
