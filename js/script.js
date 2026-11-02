const portal = window.portalConfig || {};
const defaultLinks = Array.isArray(portal.nav_links)
    ? portal.nav_links.map(link => ({ name: link.name, url: link.url, iconUrl: link.iconUrl || '' }))
    : [];

const defaultSettings = {
    darkMode: 'default',
    openInNewTab: true,
    searchEngine: 'google',
};

let links = defaultLinks.map(link => ({ ...link }));
let editMode = false;
let editingIndex = -1;
let { darkMode, openInNewTab, searchEngine } = defaultSettings;

let displayedMonth = new Date().getMonth();
let displayedYear = new Date().getFullYear();

const searchEngines = {
    google: 'https://www.google.com/search?q=',
    bing: 'https://www.bing.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    noai: 'https://noai.duckduckgo.com/?ia=web&q=',
    ecosia: 'https://www.ecosia.org/search?q='
};

searchEngine = localStorage.getItem('searchEngine') || defaultSettings.searchEngine;
openInNewTab = localStorage.getItem('openInNewTab') === null
    ? defaultSettings.openInNewTab
    : localStorage.getItem('openInNewTab') === 'true';

const ICON_CACHE_KEY = 'iconCache';
const ICON_CACHE_VERSION = 'v3';
const ICON_CACHE_DURATION = 7 * 24 * 60 * 60 * 1000;

const DEFAULT_ICON = 'data:image/svg+xml,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" stroke-width="2"><circle cx="12" cy="12" r="8"/></svg>'
);

function escHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

function loadJsonp(url) {
    return new Promise((resolve, reject) => {
        const callbackName = 'portalSuggest' + Date.now() + Math.floor(Math.random() * 100000);
        const script = document.createElement('script');
        let settled = false;
        const finish = (error, data) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            script.remove();
            try { delete window[callbackName]; } catch (e) { window[callbackName] = undefined; }
            if (error) reject(error);
            else resolve(data);
        };
        const timer = setTimeout(() => finish(new Error('timeout')), 3500);
        window[callbackName] = (data) => finish(null, data);
        script.onerror = () => finish(new Error('jsonp'));
        script.src = url + (url.includes('?') ? '&' : '?') + 'callback=' + encodeURIComponent(callbackName);
        document.head.appendChild(script);
    });
}

function fillFeature(id, slot) {
    const cell = document.getElementById(id);
    if (!cell) return false;
    const text = String((slot && slot.text) || '').trim();
    const url = String((slot && slot.url) || '').trim();
    if (!text || !url) {
        cell.classList.add('hidden');
        cell.innerHTML = '';
        return false;
    }
    cell.classList.remove('hidden');
    cell.innerHTML = `<a class="feature-link" href="${escHtml(url)}">${escHtml(text)}</a>`;
    return true;
}

function renderCategoryCard(element, groups) {
    if (!element) return;
    const list = Array.isArray(groups) ? groups : [];
    element.innerHTML = list.map((group, index) => {
        const title = group[0] || '';
        const colored = group.length >= 3;
        const items = colored ? (group[2] || []) : (group[1] || []);
        const titleClass = colored ? 'cat-title cat-title--color' : 'cat-title';
        const style = colored ? ` style="--cat-color: ${escHtml(group[1])}"` : '';
        const linksHtml = items.map(link => {
            if (Array.isArray(link) && link.length === 1 && link[0] === '|') {
                return '<span class="cat-divider">｜</span>';
            }
            return `<a class="cat-link" href="${escHtml(link[1] || '#')}">${escHtml(link[0] || '')}</a>`;
        }).join('');
        const rule = index > 0 ? '<hr>' : '';
        return `${rule}<div class="cat-row"><h3 class="${titleClass}"${style}>${escHtml(title)}</h3><div class="cat-row__links">${linksHtml}</div></div>`;
    }).join('');
}

function renderDirectory() {
    const name = portal.site_name || '入口';
    const tagline = portal.tagline || '';
    const description = portal.description || tagline;
    document.title = tagline ? `${name} - ${tagline}` : name;
    const desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', description);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', document.title);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);
    const footerName = document.getElementById('footer-name');
    if (footerName) footerName.textContent = name;
    const footerYear = document.getElementById('footer-year');
    if (footerYear) footerYear.textContent = String(new Date().getFullYear());

    renderCategoryCard(document.getElementById('category-primary'), portal.categories_primary);
    renderCategoryCard(document.getElementById('category-secondary'), portal.categories_secondary);

    const tools = document.getElementById('side-tools');
    if (tools) {
        const list = Array.isArray(portal.tools) ? portal.tools : [];
        tools.innerHTML = list.map(tool => {
            const linksHtml = (tool[1] || []).map(link =>
                `<a class="tool-block__link" href="${escHtml(link[1] || '#')}">${escHtml(link[0] || '')}</a>`
            ).join('');
            return `<section class="card tool-block"><div class="weather-head"><h3 class="weather-title">${escHtml(tool[0] || '')}</h3></div><div class="tool-block__links">${linksHtml}</div></section>`;
        }).join('');
    }

    const features = portal.feature_links || {};
    const leftOn = fillFeature('feature-left', features.left);
    const rightOn = fillFeature('feature-right', features.right);
    const row = document.getElementById('search-row');
    if (row) row.classList.toggle('search-row--center', !(leftOn || rightOn));
    const mobile = document.getElementById('search-mobile-links');
    if (mobile) {
        mobile.innerHTML = '';
        if (leftOn) mobile.appendChild(document.getElementById('feature-left').firstChild.cloneNode(true));
        if (rightOn) mobile.appendChild(document.getElementById('feature-right').firstChild.cloneNode(true));
        mobile.classList.toggle('hidden', !(leftOn || rightOn));
    }
}

function isLocalStorageAvailable() {
    try {
        const test = '__test__';
        localStorage.setItem(test, test);
        localStorage.removeItem(test);
        return true;
    } catch (e) {
        return false;
    }
}

function loadSettings() {
    if (isLocalStorageAvailable()) {
        try {
            links = JSON.parse(localStorage.getItem('customLinks')) || defaultLinks.map(link => ({ ...link }));

            const previousDefaults = [
                'https://mail.google.com',
                'https://beta.mosir.app/',
                'https://facebook.com',
                'https://instagram.com',
                'https://threads.net',
                'https://bsky.app',
                'https://youtube.com',
                'https://twitch.tv'
            ];
            const stillPreviousDefaults = links.length === previousDefaults.length
                && links.every((link, index) => link.url === previousDefaults[index]);
            if (stillPreviousDefaults) {
                links = defaultLinks.map(link => ({ ...link }));
                localStorage.setItem('customLinks', JSON.stringify(links));
            }

            const oldDarkMode = localStorage.getItem('darkMode');
            if (oldDarkMode === 'true') {
                darkMode = 'dark';
            } else if (oldDarkMode === 'false') {
                darkMode = 'default';
            } else {
                darkMode = oldDarkMode || defaultSettings.darkMode;
            }

            const storedNewTab = localStorage.getItem('openInNewTab');
            openInNewTab = storedNewTab === null ? defaultSettings.openInNewTab : storedNewTab === 'true';
            searchEngine = localStorage.getItem('searchEngine') || defaultSettings.searchEngine;
            localStorage.setItem('darkMode', darkMode);
        } catch (error) {
            console.error('讀取設定時發生錯誤:', error);
            links = defaultLinks.map(link => ({ ...link }));
            darkMode = defaultSettings.darkMode;
            openInNewTab = defaultSettings.openInNewTab;
            searchEngine = defaultSettings.searchEngine;
        }
    } else {
        links = defaultLinks.map(link => ({ ...link }));
        darkMode = defaultSettings.darkMode;
        openInNewTab = defaultSettings.openInNewTab;
        searchEngine = defaultSettings.searchEngine;
    }

    updateDarkModeUI();
    applyDarkMode();
    const darkInput = document.getElementById(`darkMode${capitalizeFirstLetter(darkMode)}`);
    if (darkInput) darkInput.checked = true;
    const newTabToggle = document.getElementById('newTabToggle');
    if (newTabToggle) newTabToggle.checked = openInNewTab;
    const searchEngineSelect = document.getElementById('searchEngineSelect');
    if (searchEngineSelect) searchEngineSelect.value = searchEngine;
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

function saveSettings() {
    if (isLocalStorageAvailable()) {
        try {
            localStorage.setItem('customLinks', JSON.stringify(links));
            localStorage.setItem('darkMode', darkMode);
            localStorage.setItem('openInNewTab', openInNewTab);
            localStorage.setItem('searchEngine', searchEngine);
        } catch (error) {
            console.error('儲存設定時發生錯誤:', error);
        }
    }
    applyLinkSettings();
    renderLinks();
}

const applyDarkMode = () => {
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldApplyDark =
        darkMode === 'dark' ||
        (darkMode === 'auto' && prefersDarkScheme);

    document.documentElement.classList.toggle('dark', shouldApplyDark);

    const themeColorMeta = document.getElementById('themeColorMeta');
    themeColorMeta.content = shouldApplyDark ? '#1F2937' : '#ffffff';
};

function changeDarkMode(e) {
    darkMode = e.target.value;
    applyDarkMode();
    updateDarkModeUI();
    saveSettings();
}

function updateDarkModeUI() {
    const options = ['default', 'dark', 'auto'];
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;

    options.forEach(option => {
        const input = document.getElementById(`darkMode${option.charAt(0).toUpperCase() + option.slice(1)}`);
        input.checked = darkMode === option;
    });
}

let linkIconCache = {};
let linksModified = false;

const customIcons = {
    'mail.google.com': 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
    'gmail.com': 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
    'www.gmail.com': 'https://ssl.gstatic.com/ui/v1/icons/mail/rfr/gmail.ico',
    'facebook.com': 'https://static.xx.fbcdn.net/rsrc.php/v3/yx/r/-XF4FQcre_i.png',
    'www.facebook.com': 'https://static.xx.fbcdn.net/rsrc.php/v3/yx/r/-XF4FQcre_i.png',
    'instagram.com': 'https://www.instagram.com/favicon.ico',
    'www.instagram.com': 'https://www.instagram.com/favicon.ico',
    'youtube.com': 'https://www.youtube.com/s/desktop/favicon.ico',
    'www.youtube.com': 'https://www.youtube.com/s/desktop/favicon.ico',
    'twitch.tv': 'https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png',
    'www.twitch.tv': 'https://static.twitchcdn.net/assets/favicon-32-e29e246c157142c94346.png'
};

function getFaviconUrl(url, customIconUrl = null) {
    return new Promise((resolve) => {

        if (customIconUrl && customIconUrl.trim()) {
            const img = new Image();
            img.onload = () => {
                resolve(customIconUrl);
            };
            img.onerror = () => {

                getFaviconUrlFromDomain(url).then(resolve);
            };
            img.src = customIconUrl;
            return;
        }

        getFaviconUrlFromDomain(url).then(resolve);
    });
}

function getFaviconUrlFromDomain(url) {
    return new Promise((resolve) => {
        const domain = new URL(url).hostname;

        if (linkIconCache[domain]) {
            resolve(linkIconCache[domain]);
            return;
        }

        const cachedIcons = JSON.parse(localStorage.getItem(ICON_CACHE_KEY) || '{}');
        const cachedIcon = cachedIcons[domain];

        if (cachedIcons._version !== ICON_CACHE_VERSION) {
            localStorage.removeItem(ICON_CACHE_KEY);

            const emptyCachedIcons = {};
            emptyCachedIcons._version = ICON_CACHE_VERSION;
            localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(emptyCachedIcons));
        }

        if (cachedIcon && cachedIcon.timestamp > Date.now() - ICON_CACHE_DURATION) {
            linkIconCache[domain] = cachedIcon.url;
            resolve(cachedIcon.url);
            return;
        }

        if (customIcons[domain]) {
            const customIconUrl = customIcons[domain];
            const img = new Image();
            img.onload = () => {
                linkIconCache[domain] = customIconUrl;
                cachedIcons[domain] = {
                    url: customIconUrl,
                    timestamp: Date.now()
                };
                cachedIcons._version = ICON_CACHE_VERSION;
                localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(cachedIcons));
                resolve(customIconUrl);
            };
            img.onerror = () => {

                tryMultipleFaviconSources(domain, cachedIcons, resolve);
            };
            img.src = customIconUrl;
            return;
        }

        tryMultipleFaviconSources(domain, cachedIcons, resolve);
    });
}

function tryMultipleFaviconSources(domain, cachedIcons, resolve) {
    const faviconSources = [
        `https://www.google.com/s2/favicons?domain=${domain}&sz=64`,
        `https://favicons.githubusercontent.com/${domain}`,
        `https://icons.duckduckgo.com/ip3/${domain}.ico`,
        `https://${domain}/favicon.ico`
    ];

    let currentIndex = 0;

    function tryNextSource() {
        if (currentIndex >= faviconSources.length) {

            const defaultIconUrl = DEFAULT_ICON;
            linkIconCache[domain] = defaultIconUrl;
            cachedIcons[domain] = {
                url: defaultIconUrl,
                timestamp: Date.now()
            };
            cachedIcons._version = ICON_CACHE_VERSION;
            localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(cachedIcons));
            resolve(defaultIconUrl);
            return;
        }

        const faviconUrl = faviconSources[currentIndex];
        const img = new Image();

        img.onload = () => {
            linkIconCache[domain] = faviconUrl;
            cachedIcons[domain] = {
                url: faviconUrl,
                timestamp: Date.now()
            };
            cachedIcons._version = ICON_CACHE_VERSION;
            localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(cachedIcons));
            resolve(faviconUrl);
        };

        img.onerror = () => {
            currentIndex++;
            tryNextSource();
        };

        img.src = faviconUrl;
    }

    tryNextSource();
}

function createLinkElement(link, index, iconUrl) {
    const linkElement = document.createElement('div');
    linkElement.className = 'nav-card' + (editMode ? ' nav-card--edit' : '');
    linkElement.setAttribute('data-index', index);
    linkElement.innerHTML = `
        <div class="nav-card__icon-wrap">
            <div class="nav-card__icon-bg-1"></div>
            <div class="nav-card__icon-bg-2"></div>
            <div class="nav-card__icon-bg-3"></div>
            <div class="nav-card__favicon-box nav-card__favicon-box--solo">
                <img src="${escHtml(iconUrl)}" alt="" class="nav-card__favicon">
            </div>
        </div>
        <span class="nav-card__label">${escHtml(link.name)}</span>
    `;

    if (editMode) {
        linkElement.addEventListener('click', (e) => {
            e.preventDefault();
            showEditModal(link, index);
        });
    }

    return linkElement;
}

let sortableInstance = null;

async function renderLinks() {
    const customLinksContainer = document.getElementById('custom-links');
    customLinksContainer.innerHTML = '';

    const defaultIconUrl = DEFAULT_ICON;

    for (let i = 0; i < links.length; i++) {
        customLinksContainer.appendChild(createLinkElement(links[i], i, defaultIconUrl));
    }

    const iconPromises = links.map((link, index) =>
        getFaviconUrl(link.url, link.iconUrl).then(iconUrl => {
            const linkElement = customLinksContainer.children[index];
            const faviconElement = linkElement ? linkElement.querySelector('.nav-card__favicon') : null;
            if (faviconElement) {
                faviconElement.src = iconUrl;
            }
        })
    );

    await Promise.all(iconPromises);

    if (!editMode) {
        Array.from(customLinksContainer.children).forEach((div, index) => {
            const link = links[index];
            if (!link) return;
            const anchorElement = document.createElement('a');
            anchorElement.href = link.url;
            anchorElement.className = div.className;
            anchorElement.innerHTML = div.innerHTML;
            if (openInNewTab) {
                anchorElement.target = '_blank';
                anchorElement.rel = 'noopener noreferrer';
            }
            div.replaceWith(anchorElement);
        });
    }

    if (editMode && sortableInstance) {
        sortableInstance.destroy();
    }

    if (editMode && window.Sortable) {
        sortableInstance = new Sortable(customLinksContainer, {
            animation: 150,
            onStart: function() {
                customLinksContainer.classList.add('sortable-dragging');
            },
            onEnd: function(evt) {
                customLinksContainer.classList.remove('sortable-dragging');
                const oldIndex = evt.oldIndex;
                const newIndex = evt.newIndex;
                if (oldIndex !== newIndex) {
                    const [movedItem] = links.splice(oldIndex, 1);
                    links.splice(newIndex, 0, movedItem);
                    saveSettings();
                }
            }
        });
    }

    applyLinkSettings();
}

function showEditModal(link, index) {
    const modal = document.getElementById('editModal');
    const nameInput = document.getElementById('editName');
    const urlInput = document.getElementById('editUrl');
    const iconUrlInput = document.getElementById('editIconUrl');
    const saveButton = document.getElementById('saveEdit');
    const cancelButton = document.getElementById('cancelEdit');

    nameInput.value = link.name;
    urlInput.value = link.url;
    iconUrlInput.value = link.iconUrl || '';
    editingIndex = index;

    updateIconPreview();

    modal.classList.remove('hidden');

    cancelButton.onclick = () => {
        modal.classList.add('hidden');
    };
}

function toggleSettingsPanel() {
    const settingsPanel = document.getElementById('settingsPanel');
    if (settingsPanel.classList.contains('hidden')) {
        openSettingsPanel();
    } else {
        closeSettingsPanel();
    }
}

function openSettingsPanel() {
    editMode = true;

    const settingsPanel = document.getElementById('settingsPanel');
    settingsPanel.classList.remove('hidden');

    const darkInput = document.getElementById(`darkMode${capitalizeFirstLetter(darkMode)}`);
    if (darkInput) darkInput.checked = true;
    document.getElementById('newTabToggle').checked = openInNewTab;
    document.getElementById('searchEngineSelect').value = searchEngine;

    document.querySelectorAll('input[name="darkMode"]').forEach(radio => {
        radio.removeEventListener('change', changeDarkMode);
        radio.addEventListener('change', changeDarkMode);
    });
    const newTabToggle = document.getElementById('newTabToggle');
    const searchEngineSelect = document.getElementById('searchEngineSelect');
    const resetButton = document.getElementById('resetButton');
    newTabToggle.removeEventListener('change', toggleNewTab);
    searchEngineSelect.removeEventListener('change', changeSearchEngine);
    resetButton.removeEventListener('click', resetToDefault);
    newTabToggle.addEventListener('change', toggleNewTab);
    searchEngineSelect.addEventListener('change', changeSearchEngine);
    resetButton.addEventListener('click', resetToDefault);

    renderLinks();
    document.addEventListener('click', handleOutsideClick);
}

function closeSettingsPanel() {
    editMode = false;
    if (sortableInstance) {
        sortableInstance.destroy();
        sortableInstance = null;
    }
    document.getElementById('settingsPanel').classList.add('hidden');
    renderLinks();

    document.removeEventListener('click', handleOutsideClick);
}

function handleOutsideClick(event) {
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsButton = document.getElementById('settingsButton');
    const editModal = document.getElementById('editModal');
    const confirmModal = document.getElementById('confirmModal');
    const customLinks = document.getElementById('custom-links');

    if (!settingsPanel.contains(event.target) &&
        event.target !== settingsButton &&
        !settingsButton.contains(event.target) &&
        !editModal.contains(event.target) &&
        !confirmModal.contains(event.target) &&
        !customLinks.contains(event.target)) {
        closeSettingsPanel();
    }
}

function toggleNewTab(e) {
    openInNewTab = e.target.checked;
    applyLinkSettings();
    saveSettings();
}

function changeSearchEngine(e) {
    searchEngine = e.target.value;
    suggestCache.clear();
    document.querySelectorAll('.search-suggest').forEach(el => {
        el.classList.add('hidden');
        el.innerHTML = '';
    });
    saveSettings();
}

function showConfirmModal() {
    document.getElementById('confirmModal').classList.remove('hidden');
}

function hideConfirmModal() {
    document.getElementById('confirmModal').classList.add('hidden');
}

function resetToDefault() {
    showConfirmModal();
    document.getElementById('confirmReset').onclick = () => {
        links = defaultLinks.map(link => ({ ...link }));
        darkMode = defaultSettings.darkMode;
        openInNewTab = defaultSettings.openInNewTab;
        searchEngine = defaultSettings.searchEngine;
        applyDarkMode();
        updateDarkModeUI();
        renderLinks();
        const darkInput = document.getElementById(`darkMode${capitalizeFirstLetter(darkMode)}`);
        if (darkInput) darkInput.checked = true;
        document.getElementById('newTabToggle').checked = openInNewTab;
        document.getElementById('searchEngineSelect').value = searchEngine;
        saveSettings();
        hideConfirmModal();
    };
    document.getElementById('cancelReset').onclick = hideConfirmModal;
}

function setupSearch() {
    const searchForm = document.getElementById('searchForm');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const searchSuggest = document.getElementById('searchSuggest');

    const searchFormMobile = document.getElementById('searchFormMobile');
    const searchInputMobile = document.getElementById('searchInputMobile');
    const searchButtonMobile = document.getElementById('searchButtonMobile');
    const searchSuggestMobile = document.getElementById('searchSuggestMobile');

    if (searchForm) {
        searchForm.addEventListener('submit', (e) => {
            e.preventDefault();
            performSearch();
        });
    }
    if (searchButton) {
        searchButton.addEventListener('click', (e) => {
            e.preventDefault();
            performSearch();
        });
    }
    if (searchFormMobile) {
        searchFormMobile.addEventListener('submit', (e) => {
            e.preventDefault();
            performSearch();
        });
    }
    if (searchButtonMobile) {
        searchButtonMobile.addEventListener('click', (e) => {
            e.preventDefault();
            performSearch();
        });
    }

    function performSearch() {
        const query = (searchInput ? searchInput.value.trim() : '') ||
                     (searchInputMobile ? searchInputMobile.value.trim() : '');
        if (!query) return;
        runSearch(query);
    }

    if (searchInput && searchSuggest) attachSuggest(searchInput, searchSuggest);
    if (searchInputMobile && searchSuggestMobile) attachSuggest(searchInputMobile, searchSuggestMobile);
}

function runSearch(query) {
    const searchUrl = searchEngines[searchEngine] + encodeURIComponent(query);
    if (openInNewTab) {
        window.open(searchUrl, '_blank');
    } else {
        window.location.href = searchUrl;
    }
}

const SUGGEST_DEBOUNCE_MS = 180;
const suggestCache = new Map();

function attachSuggest(inputEl, listEl) {
    let debounceTimer = null;
    let currentQuery = '';
    let activeIdx = -1;
    let items = [];
    let lastReqId = 0;

    const close = () => {
        listEl.classList.add('hidden');
        listEl.innerHTML = '';
        activeIdx = -1;
        items = [];
    };

    const renderItems = (list, q) => {
        if (!Array.isArray(list) || list.length === 0) {
            close();
            return;
        }
        items = list;
        activeIdx = -1;
        const qLower = q.toLowerCase();
        listEl.innerHTML = list.map((s, i) => {

            const html = highlightMatch(s, qLower);
            return `<button type="button" class="search-suggest__item" role="option" data-i="${i}">${html}</button>`;
        }).join('');
        listEl.classList.remove('hidden');

        listEl.querySelectorAll('.search-suggest__item').forEach((btn, i) => {
            btn.addEventListener('mousedown', (e) => {

                e.preventDefault();
                const value = items[i];
                inputEl.value = value;
                close();
                runSearch(value);
            });
            btn.addEventListener('mouseenter', () => {
                setActive(i);
            });
        });
    };

    const setActive = (i) => {
        const buttons = listEl.querySelectorAll('.search-suggest__item');
        buttons.forEach((b, j) => b.classList.toggle('is-active', i === j));
        activeIdx = i;
    };

    const fetchSuggest = async (q) => {
        const key = `${searchEngine}|${q}`;
        if (suggestCache.has(key)) {
            return suggestCache.get(key);
        }
        const reqId = ++lastReqId;
        try {
            const data = await loadJsonp(`https://suggestqueries.google.com/complete/search?client=chrome&hl=zh-TW&q=${encodeURIComponent(q)}`);
            const raw = Array.isArray(data) && Array.isArray(data[1]) ? data[1] : [];
            const list = raw.filter(item => typeof item === 'string' && item !== '').slice(0, 8);
            suggestCache.set(key, list);

            if (reqId !== lastReqId) return null;
            return list;
        } catch (err) {
            console.warn('搜尋建議載入失敗', err);
            return [];
        }
    };

    inputEl.addEventListener('input', () => {
        const q = inputEl.value.trim();
        currentQuery = q;
        if (debounceTimer) clearTimeout(debounceTimer);
        if (q === '') {
            close();
            return;
        }
        debounceTimer = setTimeout(async () => {
            if (q !== currentQuery) return;
            const list = await fetchSuggest(q);
            if (list && q === currentQuery) renderItems(list, q);
        }, SUGGEST_DEBOUNCE_MS);
    });

    inputEl.addEventListener('keydown', (e) => {
        if (listEl.classList.contains('hidden') || items.length === 0) {
            if (e.key === 'Escape') inputEl.blur();
            return;
        }
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setActive((activeIdx + 1) % items.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setActive(activeIdx <= 0 ? items.length - 1 : activeIdx - 1);
        } else if (e.key === 'Enter') {
            if (activeIdx >= 0) {
                e.preventDefault();
                const value = items[activeIdx];
                inputEl.value = value;
                close();
                runSearch(value);
            }
        } else if (e.key === 'Escape') {
            close();
        }
    });

    inputEl.addEventListener('blur', () => {

        setTimeout(close, 150);
    });

    inputEl.addEventListener('focus', () => {
        if (currentQuery && items.length > 0) {
            listEl.classList.remove('hidden');
        }
    });
}

function highlightMatch(text, qLower) {

    const safe = String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    if (!qLower) return safe;
    const idx = String(text).toLowerCase().indexOf(qLower);
    if (idx < 0) return safe;
    const safeBefore = String(text).slice(0, idx).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const safeMatch  = String(text).slice(idx, idx + qLower.length).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const safeAfter  = String(text).slice(idx + qLower.length).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

    return `<mark>${safeBefore}${safeMatch}</mark>${safeAfter}`;
}

function applyLinkSettings() {
    document.querySelectorAll(
        '#custom-links a, .cat-link, .feature-link, .tool-block__link, .dropdown__link, .footer-link'
    ).forEach(link => {
        if (openInNewTab) {
            link.setAttribute('target', '_blank');
            link.setAttribute('rel', 'noopener noreferrer');
        } else {
            link.removeAttribute('target');
            link.removeAttribute('rel');
        }
    });
}

function fetchLunarDate(year, month, day) {
    try {
        return solarToLunar(year, month, day);
    } catch (error) {
        console.error('取得農曆日期時發生錯誤:', error);
        return null;
    }
}

function createCalendar() {
    const placeholder = document.getElementById('calendar-placeholder');
    let calendarContainer = document.getElementById('calendar-container');
    if (!calendarContainer) {

        const skeleton = placeholder ? placeholder.querySelector('.calendar--skeleton') : null;
        if (skeleton) skeleton.remove();

        calendarContainer = document.createElement('div');
        calendarContainer.id = 'calendar-container';
        calendarContainer.className = 'calendar';

        placeholder.appendChild(calendarContainer);
    }

    calendarContainer.innerHTML = `
        <div class="calendar__rings" aria-hidden="true">
            <span class="calendar__ring"></span>
            <span class="calendar__ring"></span>
        </div>
        <div class="calendar__row">
            <div class="calendar__left">
                <div>
                    <div class="calendar__date" id="currentDate"></div>
                    <div class="calendar__day" id="currentDay"></div>
                </div>
                <div>
                    <div class="calendar__nav">
                        <button id="prevMonthBtn" class="calendar__nav-btn" title="上一個月">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                            </svg>
                        </button>
                        <button id="nextMonthBtn" class="calendar__nav-btn" title="下一個月">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                            </svg>
                        </button>
                    </div>
                    <div class="calendar__lunar" id="lunarDate"></div>
                </div>
            </div>
            <div class="calendar__right">
                <div class="calendar__weekrow">
                    <div class="calendar__cell calendar__cell--head-sun">日</div>
                    <div class="calendar__cell calendar__cell--head-day">一</div>
                    <div class="calendar__cell calendar__cell--head-day">二</div>
                    <div class="calendar__cell calendar__cell--head-day">三</div>
                    <div class="calendar__cell calendar__cell--head-day">四</div>
                    <div class="calendar__cell calendar__cell--head-day">五</div>
                    <div class="calendar__cell calendar__cell--head-sat">六</div>
                </div>
                <div class="calendar__days" id="calendarDays"></div>
            </div>
        </div>
    `;

    setupMonthNavigation();
    updateCalendar();
}

function setupMonthNavigation() {
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');

    if (prevBtn && nextBtn) {
        prevBtn.addEventListener('click', () => {
            changeMonth(-1);
        });

        nextBtn.addEventListener('click', () => {
            changeMonth(1);
        });
    }
}

function changeMonth(direction) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    let newMonth = displayedMonth + direction;
    let newYear = displayedYear;

    if (newMonth < 0) {
        newMonth = 11;
        newYear--;
    } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
    }

    const currentTotalMonths = currentYear * 12 + currentMonth;
    const newTotalMonths = newYear * 12 + newMonth;
    const monthDifference = Math.abs(newTotalMonths - currentTotalMonths);

    if (monthDifference <= 3) {
        displayedMonth = newMonth;
        displayedYear = newYear;
        updateCalendar();
    } else {
        console.log('超出範圍限制:', {
            current: `${currentYear}年${currentMonth + 1}月`,
            target: `${newYear}年${newMonth + 1}月`,
            difference: monthDifference
        });
    }
}

function updateNavigationButtons() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');

    if (prevBtn && nextBtn) {

        const currentTotalMonths = currentYear * 12 + currentMonth;
        const displayedTotalMonths = displayedYear * 12 + displayedMonth;
        const monthDifference = Math.abs(displayedTotalMonths - currentTotalMonths);

        const canGoPrev = displayedTotalMonths > currentTotalMonths - 3;
        const canGoNext = displayedTotalMonths < currentTotalMonths + 3;

        prevBtn.disabled = !canGoPrev;
        nextBtn.disabled = !canGoNext;
    }
}

function createDayElement(day, month, year, isCurrentMonth) {
    const dayElement = document.createElement('div');
    dayElement.textContent = day;

    let actualMonth = month;
    let actualYear = year;

    if (month < 0) {
        actualMonth = 11;
        actualYear = year - 1;
    } else if (month > 11) {
        actualMonth = 0;
        actualYear = year + 1;
    }

    const date = new Date(actualYear, actualMonth, day);
    const dayOfWeek = date.getDay();
    const isToday = (new Date().toDateString() === date.toDateString());

    dayElement.className = 'calendar__cell calendar__cell--day';

    if (isCurrentMonth) {
        if (isToday) {
            dayElement.classList.add('calendar__cell--today');
        } else if (dayOfWeek === 0) {
            dayElement.classList.add('calendar__cell--sun');
        } else if (dayOfWeek === 6) {
            dayElement.classList.add('calendar__cell--sat');
        }
    } else {
        dayElement.classList.add('calendar__cell--out');
    }

    dayElement.setAttribute('data-date', `${actualYear}-${actualMonth + 1}-${day}`);
    dayElement.addEventListener('click', handleDayClick);

    return dayElement;
}

async function handleDayClick(event) {
    const [year, month, day] = event.target.getAttribute('data-date').split('-').map(Number);
    const clickedDate = new Date(year, month - 1, day);
    const currentDay = ['日', '一', '二', '三', '四', '五', '六'][clickedDate.getDay()];

    document.getElementById('currentDate').textContent = `${month}.${day}`;
    document.getElementById('currentDay').textContent = currentDay;

    const lunarDate = await fetchLunarDate(year, month, day);
    if (lunarDate) {
        document.getElementById('lunarDate').innerHTML = `${lunarDate.month}${lunarDate.day}<br>${lunarDate.yearName}年 (${lunarDate.zodiac})`;
    }

    const allDays = document.querySelectorAll('#calendarDays > div');
    const today = new Date().toDateString();
    allDays.forEach(dayEl => {
        const [dayYear, dayMonth, dayDate] = dayEl.getAttribute('data-date').split('-').map(Number);
        const dayDateObj = new Date(dayYear, dayMonth - 1, dayDate);
        const isToday = dayDateObj.toDateString() === today;

        dayEl.classList.remove('calendar__cell--selected');
        if (!isToday) {
            dayEl.classList.remove('calendar__cell--today');
        }
    });

    if (clickedDate.toDateString() !== today) {
        event.target.classList.add('calendar__cell--selected');
    }
}

async function updateCalendar() {
    const now = new Date();
    const todayDate = now.getDate();
    const todayMonth = now.getMonth();
    const todayYear = now.getFullYear();
    const todayDay = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];

    updateNavigationButtons();

    let lunarYear, lunarMonth, lunarDay;
    if (displayedMonth === todayMonth && displayedYear === todayYear) {
        document.getElementById('currentDate').textContent = `${todayMonth + 1}.${todayDate}`;
        document.getElementById('currentDay').textContent = todayDay;

        lunarYear = todayYear;
        lunarMonth = todayMonth + 1;
        lunarDay = todayDate;
    } else {

        document.getElementById('currentDate').textContent = `${displayedMonth + 1}.1`;
        document.getElementById('currentDay').textContent = ['日', '一', '二', '三', '四', '五', '六'][new Date(displayedYear, displayedMonth, 1).getDay()];

        lunarYear = displayedYear;
        lunarMonth = displayedMonth + 1;
        lunarDay = 1;
    }

    const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(displayedYear, displayedMonth, 1).getDay();
    const daysInPrevMonth = new Date(displayedYear, displayedMonth, 0).getDate();

    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    const totalCells = 42;
    const currentMonthStartIndex = firstDayOfMonth;
    const currentMonthEndIndex = firstDayOfMonth + daysInMonth - 1;

    for (let i = 0; i < totalCells; i++) {
        let day, month, year, isCurrentMonth;

        if (i < currentMonthStartIndex) {

            day = daysInPrevMonth - (currentMonthStartIndex - 1 - i);
            month = displayedMonth - 1;
            year = displayedYear;
            isCurrentMonth = false;

            if (month < 0) {
                month = 11;
                year = displayedYear - 1;
            }
        } else if (i <= currentMonthEndIndex) {

            day = i - currentMonthStartIndex + 1;
            month = displayedMonth;
            year = displayedYear;
            isCurrentMonth = true;
        } else {

            day = i - currentMonthEndIndex;
            month = displayedMonth + 1;
            year = displayedYear;
            isCurrentMonth = false;

            if (month > 11) {
                month = 0;
                year = displayedYear + 1;
            }
        }

        const dayElement = createDayElement(day, month, year, isCurrentMonth);
        calendarDays.appendChild(dayElement);
    }

    const lunarDate = await fetchLunarDate(lunarYear, lunarMonth, lunarDay);
    if (lunarDate) {
        document.getElementById('lunarDate').innerHTML = `${lunarDate.month}${lunarDate.day}<br>${lunarDate.yearName}年 (${lunarDate.zodiac})`;
    }
}

async function initializeApp() {
    loadSettings();
    renderDirectory();
    setupSearch();
    renderLinks();
    applyLinkSettings();
    createCalendar();

    const settingsButton = document.getElementById('settingsButton');
    settingsButton.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleSettingsPanel();
    });

    setupEditModal();
    document.getElementById('resetButton').addEventListener('click', resetToDefault);
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', applyDarkMode);

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => renderLinks(), 150);
    });
}

function updateIconPreview() {
    const iconPreview = document.getElementById('iconPreview');
    const editIconUrlInput = document.getElementById('editIconUrl');

    if (!iconPreview || !editIconUrlInput) return;

    const iconUrl = editIconUrlInput.value.trim();

    if (!iconUrl) {
        iconPreview.innerHTML = '<span class="text-xs text-muted">預覽</span>';
        return;
    }

    let processedUrl = iconUrl;
    if (!processedUrl.match(/^[a-zA-Z]+:\/\//)) {
        processedUrl = 'https://' + processedUrl;
    }

    const img = new Image();
    img.onload = () => {
        iconPreview.innerHTML = `<img src="${processedUrl}" alt="預覽" style="width:2.5rem;height:2.5rem;object-fit:contain;border-radius:var(--radius-sm);">`;
    };
    img.onerror = () => {
        iconPreview.innerHTML = '<span class="text-xs text-red">載入失敗</span>';
    };
    img.src = processedUrl;
}

function setupEditModal() {
    const editNameInput = document.getElementById('editName');
    const editUrlInput = document.getElementById('editUrl');
    const editIconUrlInput = document.getElementById('editIconUrl');
    const saveEditButton = document.getElementById('saveEdit');
    const urlErrorMessage = document.createElement('div');
    urlErrorMessage.className = 'text-sm text-red mt-1 hidden';
    editUrlInput.parentNode.insertBefore(urlErrorMessage, editUrlInput.nextSibling);

    const iconUrlErrorMessage = document.createElement('div');
    iconUrlErrorMessage.className = 'text-sm text-red mt-1 hidden';
    editIconUrlInput.parentNode.insertBefore(iconUrlErrorMessage, editIconUrlInput.nextSibling);

    function validateUrl(url) {

        const urlPattern = /^(https?:\/\/|ftp:\/\/|file:\/\/|\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.?[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*[^\s])$/u;

        let processedUrl = url.trim();

        if (!processedUrl.match(/^[a-zA-Z]+:\/\//)) {
            processedUrl = 'https://' + processedUrl;
        }

        let isValid = false;
        try {

            new URL(processedUrl);
            isValid = true;
        } catch (e) {

            isValid = urlPattern.test(processedUrl);
        }

        urlErrorMessage.textContent = isValid ? '' : '請輸入有效的網址';
        urlErrorMessage.classList.toggle('hidden', isValid);
        return { isValid, processedUrl };
    }

    function validateIconUrl(iconUrl) {
        if (!iconUrl || !iconUrl.trim()) {
            iconUrlErrorMessage.textContent = '';
            iconUrlErrorMessage.classList.add('hidden');
            return { isValid: true, processedUrl: '' };
        }

        const urlPattern = /^(https?:\/\/|ftp:\/\/|file:\/\/|\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.?[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*[^\s])$/u;

        let processedUrl = iconUrl.trim();

        if (!processedUrl.match(/^[a-zA-Z]+:\/\//)) {
            processedUrl = 'https://' + processedUrl;
        }

        let isValid = false;
        try {

            new URL(processedUrl);
            isValid = true;
        } catch (e) {

            isValid = urlPattern.test(processedUrl);
        }

        iconUrlErrorMessage.textContent = isValid ? '' : '請輸入有效的圖示網址';
        iconUrlErrorMessage.classList.toggle('hidden', isValid);
        return { isValid, processedUrl };
    }

    function saveEdit() {
        const name = editNameInput.value;
        const url = editUrlInput.value;
        const iconUrl = editIconUrlInput.value;
        const { isValid: urlValid, processedUrl } = validateUrl(url);
        const { isValid: iconUrlValid, processedUrl: processedIconUrl } = validateIconUrl(iconUrl);

        if (editingIndex !== -1 && urlValid && iconUrlValid) {
            links[editingIndex] = {
                name,
                url: processedUrl,
                iconUrl: processedIconUrl || undefined
            };
            renderLinks();
            saveSettings();
            document.getElementById('editModal').classList.add('hidden');
        }
    }

    editUrlInput.addEventListener('input', () => {
        validateUrl(editUrlInput.value);
    });

    editIconUrlInput.addEventListener('input', () => {
        validateIconUrl(editIconUrlInput.value);
        updateIconPreview();
    });

    saveEditButton.addEventListener('click', saveEdit);

    document.getElementById('cancelEdit').addEventListener('click', () => {
        document.getElementById('editModal').classList.add('hidden');
    });
}

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initializeApp();
    } catch (error) {
        console.error('載入時發生錯誤:', error);
    }
});

document.querySelectorAll('.dropdown').forEach(dropdown => {
    const button = dropdown.querySelector('button');
    const menu = dropdown.querySelector('.dropdown__menu');
    if (!button || !menu) return;
    const isMobile = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    if (!isMobile) return;
    button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const willOpen = !menu.classList.contains('show');
        document.querySelectorAll('.dropdown__menu.show').forEach(openMenu => openMenu.classList.remove('show'));
        if (willOpen) menu.classList.add('show');
    });
});

if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
    document.addEventListener('click', () => {
        document.querySelectorAll('.dropdown__menu.show').forEach(menu => menu.classList.remove('show'));
    });
}
