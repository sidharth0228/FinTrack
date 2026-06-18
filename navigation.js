/**
 * FinTrack Unified Navigation Sidebar Component
 * Dynamically injects the sidebar and handles active highlighting and logout.
 */

const sidebarRoutes = [
    {
        name: 'Dashboard',
        path: 'dashboard.html',
        icon: '<svg viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>'
    },
    {
        name: 'FinTrack Daily',
        path: 'newspaper.html',
        icon: '<svg viewBox="0 0 24 24"><path d="M22 6.5A1.5 1.5 0 0 0 20.5 5H3.5A1.5 1.5 0 0 0 2 6.5v11A1.5 1.5 0 0 0 3.5 19h17a1.5 1.5 0 0 0 1.5-1.5v-11zm-15 10H4v-8h3v8zm4 0H8v-2h3v2zm0-4H8v-2h3v2zm0-4H8v-2h3v2zm9 8h-7v-2h7v2zm0-4h-7v-2h7v2zm0-4h-7v-2h7v2z"/></svg>'
    },
    {
        name: 'Smart Budget',
        path: 'budget.html',
        icon: '<svg viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>'
    },
    {
        name: 'Expenses',
        path: 'expenses.html',
        icon: '<svg viewBox="0 0 24 24"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>'
    },
    {
        name: 'Goals',
        path: 'goals.html',
        icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>'
    },

    {
        name: 'Debt',
        path: 'loans.html',
        icon: '<svg viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>'
    },
    {
        name: 'Portfolio',
        path: 'portfolio.html',
        icon: '<svg viewBox="0 0 24 24"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>'
    },
    {
        name: 'AI Advisor Report',
        path: 'report.html',
        icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>'
    },
    {
        name: 'Health Score',
        path: 'score.html',
        icon: '<svg viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>'
    },
    {
        name: 'Suggestions',
        path: 'recommendation.html',
        icon: '<svg viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>'
    }
];

function initUnifiedNavigation() {
    // Inject browser favicon if not present
    if (!document.querySelector('link[rel="icon"]')) {
        const favicon = document.createElement('link');
        favicon.rel = 'icon';
        favicon.type = 'image/png';
        favicon.href = 'favicon.png';
        document.head.appendChild(favicon);
    }

    let currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
    
    // Alias root/index to dashboard if authenticated
    if (currentPath === '' || currentPath === 'index.html') {
        currentPath = 'dashboard.html';
    }

    // Identify active links including special details pages (e.g., category-details.html points to dashboard or budget)
    let activePath = currentPath;
    if (currentPath === 'category-details.html') {
        activePath = 'dashboard.html';
    } else if (currentPath === 'improvements.html') {
        activePath = 'score.html';
    }

    const navLinksHtml = sidebarRoutes.map(route => {
        const isActive = activePath === route.path;
        return `
            <a href="${route.path}" class="sidebar-link ${isActive ? 'active' : ''}">
                <span class="sidebar-icon">${route.icon}</span>
                ${route.name}
            </a>
        `;
    }).join('');

    const sidebarHtml = `
        <aside class="sidebar">
            <div class="sidebar-header">
                <div class="logo" onclick="window.location.href='dashboard.html'">
                    <img src="media/logo.png" alt="FinTrack Logo" class="logo-img">
                </div>
            </div>

            <nav class="sidebar-nav">
                ${navLinksHtml}
            </nav>

            <div class="sidebar-footer">
                <a href="profile.html" class="sidebar-link ${activePath === 'profile.html' ? 'active' : ''}">
                    <span class="sidebar-icon"><svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg></span>
                    Profile
                </a>
                <a href="#" id="global-logout-btn" class="sidebar-link mt-1 text-danger">
                    <span class="sidebar-icon text-danger"><svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg></span>
                    Log Out
                </a>
            </div>
        </aside>
    `;

    // Inject sidebar into the app-container (prepend it)
    const container = document.querySelector('.app-container') || document.body;
    
    // Remove any existing sidebar to avoid duplicates
    const existingSidebar = container.querySelector('.sidebar');
    if (existingSidebar) {
        existingSidebar.remove();
    }

    const sidebarWrapper = document.createElement('div');
    sidebarWrapper.innerHTML = sidebarHtml.trim();
    const sidebarElement = sidebarWrapper.firstElementChild;
    container.insertBefore(sidebarElement, container.firstChild);

    // Bind logout click handler
    document.getElementById('global-logout-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Render consistent top navigation bar
    renderUnifiedTopbar();
}

function renderUnifiedTopbar() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    let topbar = mainContent.querySelector('.topbar');
    let pageTitleText = 'Dashboard';
    
    if (topbar) {
        const pageTitleEl = topbar.querySelector('.page-title');
        if (pageTitleEl) {
            pageTitleText = pageTitleEl.textContent.trim();
        }
    } else {
        // Create topbar if not exists
        topbar = document.createElement('header');
        topbar.className = 'topbar';
        mainContent.insertBefore(topbar, mainContent.firstChild);
        
        // Derive page title from filename
        const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
        if (currentPath.includes('expenses')) pageTitleText = 'Expense Tracker';
        else if (currentPath.includes('goals')) pageTitleText = 'Savings Goals';
        else if (currentPath.includes('loans')) pageTitleText = 'Debt Management';
        else if (currentPath.includes('portfolio')) pageTitleText = 'Portfolio Holdings';
        else if (currentPath.includes('profile')) pageTitleText = 'User Profile';
        else if (currentPath.includes('newspaper')) pageTitleText = 'FinTrack Daily Newspaper Desk';
        else if (currentPath.includes('budget')) pageTitleText = 'Smart Budget';
        else if (currentPath.includes('score')) pageTitleText = 'Financial Health Score';
        else if (currentPath.includes('report')) pageTitleText = 'AI Advisor Report';
        else if (currentPath.includes('recommendation')) pageTitleText = 'Personalized Suggestions';
        else if (currentPath.includes('improvements')) pageTitleText = 'Recommended Improvements';
        else if (currentPath.includes('category-details')) pageTitleText = 'Category Details';
    }

    const currentPath = window.location.pathname.split('/').pop() || 'dashboard.html';
    const isNewspaper = currentPath.includes('newspaper.html');

    // Retrieve user initials
    let userInitials = 'JD';
    const user = JSON.parse(localStorage.getItem('user'));
    if (user && user.name) {
        userInitials = user.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }

    // Prepare topbar layout
    let leftSideHtml = `<div class="page-title">${pageTitleText}</div>`;
    
    // Middle section for page-specific buttons (newspaper)
    let middleSideHtml = '';
    if (isNewspaper) {
        middleSideHtml = `
            <div style="display: flex; align-items: center; gap: 12px; margin-left: 20px; flex-grow: 1; justify-content: flex-end; padding-right: 20px;">
                <button id="bookmarks-btn" class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--primary-color); color: var(--primary-color); font-weight: 600; cursor: pointer; background: transparent; transition: all 0.2s ease; border-radius: 4px; line-height: 1;">🔖 Bookmarks</button>
                <button id="manual-refresh-btn" class="btn btn-outline" style="padding: 6px 12px; font-size: 0.8rem; border-color: var(--primary-color); color: var(--primary-color); font-weight: 600; cursor: pointer; background: transparent; transition: all 0.2s ease; border-radius: 4px; line-height: 1;">🔄 Refresh News</button>
            </div>
        `;
    }

    // Right section with notification bell, theme toggle, and profile avatar
    let rightSideHtml = `
        <div class="user-profile" style="display: flex; align-items: center; gap: 1.25rem; margin-left: auto;">
            <!-- Notifications Bell -->
            <div class="topbar-notifications-wrapper">
                <button id="notifications-btn" class="theme-toggle" style="position: relative; cursor: pointer;" title="Notifications">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                    </svg>
                    <span id="topbar-alert-badge" class="alert-badge" style="display: none;">0</span>
                </button>
                <div id="topbar-notifications-dropdown" class="notifications-dropdown" style="display: none;">
                    <div class="notifications-dropdown-header">
                        <span>Notifications</span>
                        <button id="dismiss-all-alerts-btn" class="clear-all-btn">Clear all</button>
                    </div>
                    <div id="notifications-dropdown-list" class="notifications-dropdown-list">
                        <div class="notifications-empty">Loading notifications...</div>
                    </div>
                    <a href="newspaper.html" class="notifications-dropdown-footer">View FinTrack Daily</a>
                </div>
            </div>

            <!-- Theme Toggle -->
            <button id="theme-toggle" class="theme-toggle" title="Toggle Theme">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
            </button>

            <!-- Profile Avatar -->
            <div class="avatar" id="avatar-letters" style="cursor: pointer;" onclick="window.location.href='profile.html'">${userInitials}</div>
        </div>
    `;

    topbar.style.display = 'flex';
    topbar.style.alignItems = 'center';
    topbar.style.justifyContent = 'space-between';
    topbar.style.width = '100%';
    
    // Clear and build topbar content
    topbar.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.style.display = 'flex';
    wrapper.style.alignItems = 'center';
    wrapper.style.width = '100%';
    wrapper.innerHTML = leftSideHtml + middleSideHtml + rightSideHtml;
    
    topbar.appendChild(wrapper);

    // Initialize notification functions
    initTopbarNotifications();
    initTopbarThemeToggle();
}

async function initTopbarNotifications() {
    const notificationsBtn = document.getElementById('notifications-btn');
    const dropdown = document.getElementById('topbar-notifications-dropdown');
    const badge = document.getElementById('topbar-alert-badge');
    const listContainer = document.getElementById('notifications-dropdown-list');
    const clearAllBtn = document.getElementById('dismiss-all-alerts-btn');
    
    if (!notificationsBtn || !dropdown) return;

    // Toggle dropdown visibility
    notificationsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const isVisible = dropdown.style.display === 'block';
        dropdown.style.display = isVisible ? 'none' : 'block';
        if (!isVisible) {
            fetchAndRenderAlerts();
        }
    });

    // Close dropdown on clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target) && e.target !== notificationsBtn && !notificationsBtn.contains(e.target)) {
            dropdown.style.display = 'none';
        }
    });

    // Fetch alerts count on load
    await updateAlertsCount();

    // Clear all alerts click
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            const token = localStorage.getItem('token');
            try {
                // Fetch alerts first
                const res = await fetch('/api/alerts', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    const alerts = await res.json();
                    // Dismiss each alert
                    await Promise.all(alerts.map(alert => 
                        fetch(`/api/alerts/${alert._id}/dismiss`, {
                            method: 'PUT',
                            headers: { 'Authorization': `Bearer ${token}` }
                        })
                    ));
                    // Refresh dropdown list
                    fetchAndRenderAlerts();
                    // Update badge count
                    updateAlertsCount();
                    // Also trigger local event or refresh if on newspaper page
                    if (typeof fetchNewspaperData === 'function') {
                        fetchNewspaperData();
                    }
                }
            } catch (err) {
                console.error('Failed to clear alerts:', err);
            }
        });
    }

    async function updateAlertsCount() {
        const token = localStorage.getItem('token');
        if (!token) return;
        try {
            const res = await fetch('/api/alerts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const alerts = await res.json();
                if (alerts.length > 0) {
                    badge.innerText = alerts.length;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }
        } catch (err) {
            console.error('Error fetching alerts count:', err);
        }
    }

    async function fetchAndRenderAlerts() {
        const token = localStorage.getItem('token');
        if (!token) return;
        listContainer.innerHTML = '<div class="notifications-empty">Loading notifications...</div>';
        try {
            const res = await fetch('/api/alerts', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const alerts = await res.json();
                if (alerts.length === 0) {
                    listContainer.innerHTML = '<div class="notifications-empty">No active notifications</div>';
                    return;
                }
                
                listContainer.innerHTML = alerts.map(alert => {
                    const dateStr = new Date(alert.date || Date.now()).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                    });
                    return `
                        <div class="notification-item" data-id="${alert._id}">
                            <div class="notification-item-text">${alert.text}</div>
                            <div class="notification-item-date">${dateStr}</div>
                            <button class="notification-dismiss-btn" title="Dismiss">✕</button>
                        </div>
                    `;
                }).join('');

                // Bind dismiss button handlers
                listContainer.querySelectorAll('.notification-dismiss-btn').forEach(btn => {
                    btn.addEventListener('click', async (e) => {
                        e.stopPropagation();
                        const item = e.target.closest('.notification-item');
                        const id = item.dataset.id;
                        try {
                            const dismissRes = await fetch(`/api/alerts/${id}/dismiss`, {
                                method: 'PUT',
                                headers: { 'Authorization': `Bearer ${token}` }
                            });
                            if (dismissRes.ok) {
                                item.remove();
                                if (listContainer.children.length === 0) {
                                    listContainer.innerHTML = '<div class="notifications-empty">No active notifications</div>';
                                }
                                updateAlertsCount();
                                // Also trigger local event or refresh if on newspaper page
                                if (typeof fetchNewspaperData === 'function') {
                                    fetchNewspaperData();
                                }
                            }
                        } catch (err) {
                            console.error('Failed to dismiss alert:', err);
                        }
                    });
                });
            } else {
                listContainer.innerHTML = '<div class="notifications-empty">Failed to load notifications</div>';
            }
        } catch (err) {
            console.error('Error fetching alerts:', err);
            listContainer.innerHTML = '<div class="notifications-empty">Network error</div>';
        }
    }
}

function initTopbarThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (!themeToggle) return;

    const updateIcon = (isDark) => {
        themeToggle.innerHTML = isDark 
            ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`
            : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`;
    };

    updateIcon(document.documentElement.classList.contains('dark-mode'));

    themeToggle.addEventListener('click', () => {
        document.documentElement.classList.toggle('dark-mode');
        const isDark = document.documentElement.classList.contains('dark-mode');
        localStorage.setItem('dark-mode', isDark ? 'enabled' : 'disabled');
        updateIcon(isDark);
    });
}

// Automatically initialize unified navigation
initUnifiedNavigation();
