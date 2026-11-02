// 行事曆假日資料
let getHolidays;

const loadModules = import(`./holidays.js?v=${window.moduleVersions.holidays}`).then(m => {
    getHolidays = m.getHolidays;
});

const defaultLinks = Array.isArray(window.defaultLinks) ? window.defaultLinks.map(link => ({ ...link })) : [];

const defaultSettings = {
    darkMode: 'default',
    openInNewTab: true,
    searchEngine: 'google',
};

let links = defaultLinks.map(link => ({ ...link }));
let editMode = false;
let editingIndex = -1;
let { darkMode, openInNewTab, searchEngine } = defaultSettings;

let currentYear = new Date().getFullYear();
let holidays = {};

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

function buildLogo() {
    const el = document.createElement('div');
    el.className = 'logo-placeholder';
    const anchor = document.createElement('a');
    anchor.href = window.logoLink || '#';
    anchor.id = 'logo-link';
    anchor.className = 'logo-link';
    const siteName = window.siteName || '入口';
    if (window.logoPath) {
        const img = document.createElement('img');
        img.src = window.logoPath;
        img.alt = siteName;
        img.className = 'logo-img';
        anchor.appendChild(img);
    } else {
        const word = document.createElement('span');
        word.className = 'logo-wordmark';
        word.textContent = siteName;
        anchor.appendChild(word);
    }
    el.appendChild(anchor);
    return el;
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

            let linksUpdated = false;
            links.forEach(link => {
                if (link.url === 'https://plurk.com') {
                    link.url = 'https://www.plurk.com';
                    linksUpdated = true;
                }
            });
            if (linksUpdated) {
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

// 修改 applyDarkMode 函數
const applyDarkMode = () => {
    const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldApplyDark = 
        darkMode === 'dark' || 
        (darkMode === 'auto' && prefersDarkScheme);

    document.documentElement.classList.toggle('dark', shouldApplyDark);
    
    // 更新 theme-color
    const themeColorMeta = document.getElementById('themeColorMeta');
    themeColorMeta.content = shouldApplyDark ? '#1F2937' : '#ffffff';
};

// 修改 changeDarkMode 函數
function changeDarkMode(e) {
    darkMode = e.target.value;
    applyDarkMode();
    updateDarkModeUI();
    saveSettings();
}

// 添加新的函數來更新深色模式 UI
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

// 特定網站的圖示映射
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
        // 如果有自訂圖示網址，直接使用
        if (customIconUrl && customIconUrl.trim()) {
            const img = new Image();
            img.onload = () => {
                resolve(customIconUrl);
            };
            img.onerror = () => {
                // 如果自訂圖示載入失敗，回退到預設邏輯
                getFaviconUrlFromDomain(url).then(resolve);
            };
            img.src = customIconUrl;
            return;
        }
        
        // 沒有自訂圖示時，使用原本的邏輯
        getFaviconUrlFromDomain(url).then(resolve);
    });
}

function getFaviconUrlFromDomain(url) {
    return new Promise((resolve) => {
        const domain = new URL(url).hostname;
        
        // 檢查記憶體緩存
        if (linkIconCache[domain]) {
            resolve(linkIconCache[domain]);
            return;
        }
        
        // 檢查本地儲存緩存
        const cachedIcons = JSON.parse(localStorage.getItem(ICON_CACHE_KEY) || '{}');
        const cachedIcon = cachedIcons[domain];
        
        // 檢查緩存版本，如果版本不匹配則清除緩存
        if (cachedIcons._version !== ICON_CACHE_VERSION) {
            localStorage.removeItem(ICON_CACHE_KEY);
            // 重新獲取空的緩存物件
            const emptyCachedIcons = {};
            emptyCachedIcons._version = ICON_CACHE_VERSION;
            localStorage.setItem(ICON_CACHE_KEY, JSON.stringify(emptyCachedIcons));
        }
        
        if (cachedIcon && cachedIcon.timestamp > Date.now() - ICON_CACHE_DURATION) {
            linkIconCache[domain] = cachedIcon.url;
            resolve(cachedIcon.url);
            return;
        }

        // 檢查是否有自定義圖示
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
                // 如果自定義圖示失敗，嘗試其他方法
                tryMultipleFaviconSources(domain, cachedIcons, resolve);
            };
            img.src = customIconUrl;
            return;
        }

        // 如果沒有自定義圖示，嘗試多種 favicon 來源
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
            // 所有來源都失敗，使用預設圖示
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
    const isMobile = window.innerWidth <= 768;

    const buildLogoPlaceholder = () => buildLogo();

    if (isMobile) {
        customLinksContainer.appendChild(buildLogoPlaceholder());
        for (let i = 0; i < links.length; i++) {
            customLinksContainer.appendChild(createLinkElement(links[i], i, defaultIconUrl));
        }
    } else {
        for (let i = 0; i < 4 && links[i]; i++) {
            customLinksContainer.appendChild(createLinkElement(links[i], i, defaultIconUrl));
        }
        customLinksContainer.appendChild(buildLogoPlaceholder());
        for (let i = 4; i < links.length; i++) {
            customLinksContainer.appendChild(createLinkElement(links[i], i, defaultIconUrl));
        }
    }

    // 然後在背景載入實際圖示，每個圖示獨立載入
    const iconPromises = links.map((link, index) => 
        getFaviconUrl(link.url, link.iconUrl).then(iconUrl => {
            let linkElement;
            if (isMobile) {
                // 手機版：需要跳過 Logo 佔位符（Logo 在第0個位置）
                linkElement = customLinksContainer.children[index + 1]; // +1 因為有 Logo 佔位符
            } else {
                // 桌面版：需要跳過 Logo 佔位符
                if (index < 4) {
                    linkElement = customLinksContainer.children[index];
                } else {
                    linkElement = customLinksContainer.children[index + 1]; // +1 因為有 Logo 佔位符
                }
            }
            const faviconElement = linkElement ? linkElement.querySelector('.nav-card__favicon') : null;
            if (faviconElement) {
                faviconElement.src = iconUrl;
            }
        })
    );

    // 等待所有圖示載入完成
    await Promise.all(iconPromises);

    if (!editMode) {
        // 在非編輯模式下，將 div 元素替換為 a 元素
        Array.from(customLinksContainer.children).forEach((div, index) => {
            // 跳過 Logo 佔位符
            if (div.classList.contains('logo-placeholder')) {
                return;
            }
            
            let linkIndex;
            if (isMobile) {
                // 手機版：需要跳過 Logo 佔位符（Logo 在第0個位置）
                linkIndex = index - 1; // -1 因為跳過了 Logo 佔位符
            } else {
                // 桌面版：需要跳過 Logo 佔位符
                if (index < 4) {
                    linkIndex = index;
                } else {
                    linkIndex = index - 1; // -1 因為跳過了 Logo 佔位符
                }
            }
            
            const link = links[linkIndex];
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
    
    if (editMode) {
        // 為單一容器設置拖拽功能
        sortableInstance = new Sortable(customLinksContainer, {
            animation: 150,
            filter: '.logo-placeholder', // 排除 Logo 佔位符
            onStart: function(evt) {
                // 開始拖拽時添加 CSS 類別
                customLinksContainer.classList.add('sortable-dragging');
            },
            onMove: function(evt) {
                // 拖拽過程中限制移動範圍，防止跨越 Logo
                if (!isMobile) {
                    const fromIndex = evt.oldIndex;
                    const toIndex = evt.newIndex;
                    
                    // 如果從左邊拖到右邊，限制只能到第5個位置（Logo 後面）
                    if (fromIndex < 4 && toIndex > 4) {
                        return false; // 阻止移動
                    }
                    
                    // 如果從右邊拖到左邊，限制只能到第4個位置（Logo 前面）
                    if (fromIndex > 4 && toIndex < 4) {
                        return false; // 阻止移動
                    }
                } else {
                    // 手機版：防止拖拽到 Logo 位置（第0個位置）
                    const toIndex = evt.newIndex;
                    if (toIndex === 0) {
                        return false; // 阻止移動到 Logo 位置
                    }
                }
                return true;
            },
            onEnd: function(evt) {
                // 結束拖拽時移除 CSS 類別
                customLinksContainer.classList.remove('sortable-dragging');
                
                const oldIndex = evt.oldIndex;
                const newIndex = evt.newIndex;
                if (oldIndex !== newIndex) {
                    // 調整索引以跳過 Logo 佔位符
                    let adjustedOldIndex = oldIndex;
                    let adjustedNewIndex = newIndex;
                    
                    if (isMobile) {
                        // 手機版：Logo 在第0個位置，所有連結索引都要 -1
                        adjustedOldIndex = oldIndex - 1;
                        adjustedNewIndex = newIndex - 1;
                    } else {
                        // 桌面版需要調整索引
                        if (oldIndex > 4) adjustedOldIndex = oldIndex - 1;
                        if (newIndex > 4) adjustedNewIndex = newIndex - 1;
                    }
                    
                    const [movedItem] = links.splice(adjustedOldIndex, 1);
                    links.splice(adjustedNewIndex, 0, movedItem);
                    saveSettings();
                }
            }
        });
    }

    // 在渲染連結後應用連結設置
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

    // 更新圖示預覽
    updateIconPreview();

    modal.classList.remove('hidden');

    // 移除重複的 saveEdit 函數，使用 setupEditModal 中的版本
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

    // 移除點擊事件監聽器
    document.removeEventListener('click', handleOutsideClick);
}

function handleOutsideClick(event) {
    const settingsPanel = document.getElementById('settingsPanel');
    const settingsButton = document.getElementById('settingsButton');
    const editModal = document.getElementById('editModal');
    const confirmModal = document.getElementById('confirmModal');
    const customLinks = document.getElementById('custom-links');

    // 檢查點擊是否在設定面板、設定按鈕、編輯模態框、確認模態框或自定義連結區域之外
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

    // 為桌機 / 行動版各自建立 autocomplete
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
const suggestCache = new Map(); // key = `${engine}|${q}`, value = string[]

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
            // 把命中文字（小寫比對）以 <mark> 包裝（淡色顯示已輸入部分）
            const html = highlightMatch(s, qLower);
            return `<button type="button" class="search-suggest__item" role="option" data-i="${i}">${html}</button>`;
        }).join('');
        listEl.classList.remove('hidden');

        listEl.querySelectorAll('.search-suggest__item').forEach((btn, i) => {
            btn.addEventListener('mousedown', (e) => {
                // mousedown 避免被 input blur 搶走 focus
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
            const res = await fetch(`api_handler.php?action=suggest&engine=${encodeURIComponent(searchEngine)}&q=${encodeURIComponent(q)}`);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const data = await res.json();
            const list = Array.isArray(data.suggestions) ? data.suggestions : [];
            suggestCache.set(key, list);
            // 過時的請求結果丟棄
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
        // 給 click 一點時間先觸發
        setTimeout(close, 150);
    });

    inputEl.addEventListener('focus', () => {
        if (currentQuery && items.length > 0) {
            listEl.classList.remove('hidden');
        }
    });
}

function highlightMatch(text, qLower) {
    // 將 text 中與 qLower 開頭相符的部分以原樣顯示，其餘以 <mark> 顯示為淡色
    const safe = String(text).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    if (!qLower) return safe;
    const idx = String(text).toLowerCase().indexOf(qLower);
    if (idx < 0) return safe;
    const safeBefore = String(text).slice(0, idx).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const safeMatch  = String(text).slice(idx, idx + qLower.length).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const safeAfter  = String(text).slice(idx + qLower.length).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    // 已輸入部分用 mark 標示（淡色），剩餘為主色（建議新增內容）
    return `<mark>${safeBefore}${safeMatch}</mark>${safeAfter}`;
}

function applyLinkSettings() {
    document.querySelectorAll(
        '#custom-links a:not(#logo-link), .cat-link, .feature-link, .dropdown__link, .footer-link'
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

async function fetchLunarDate(year, month, day) {
    try {
        const response = await fetch(`lunar.php?year=${year}&month=${month}&date=${day}`);
        if (!response.ok) {
            throw new Error('網路回應不正常');
        }
        const data = await response.json();
        return {
            month: data[1],
            day: data[2],
            yearName: data[3],
            zodiac: data[6]
        };
    } catch (error) {
        console.error('取得農曆日期時發生錯誤:', error);
        return null;
    }
}

function createCalendar() {
    const placeholder = document.getElementById('calendar-placeholder');
    let calendarContainer = document.getElementById('calendar-container');
    if (!calendarContainer) {
        // 移除載入骨架後再建立真正的日曆
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
                    <div class="calendar__holiday" id="holidayInfo"></div>
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

// 設定月份導航功能
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

// 切換月份
function changeMonth(direction) {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    // 計算新的月份和年份
    let newMonth = displayedMonth + direction;
    let newYear = displayedYear;
    
    // 處理年份跨越
    if (newMonth < 0) {
        newMonth = 11;
        newYear--;
    } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
    }
    
    // 限制在前後三個月範圍內
    const currentTotalMonths = currentYear * 12 + currentMonth;
    const newTotalMonths = newYear * 12 + newMonth;
    const monthDifference = Math.abs(newTotalMonths - currentTotalMonths);
    
    // 允許前後三個月的範圍（包含跨年）
    if (monthDifference <= 3) {
        displayedMonth = newMonth;
        displayedYear = newYear;
        
        // 檢查是否需要更新節日資料
        if (displayedYear !== currentYear) {
            holidays = getHolidays(displayedYear);
        }
        
        updateCalendar();
    } else {
        console.log('超出範圍限制:', {
            current: `${currentYear}年${currentMonth + 1}月`,
            target: `${newYear}年${newMonth + 1}月`,
            difference: monthDifference
        });
    }
}


// 更新導航按鈕狀態
function updateNavigationButtons() {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const prevBtn = document.getElementById('prevMonthBtn');
    const nextBtn = document.getElementById('nextMonthBtn');
    
    if (prevBtn && nextBtn) {
        // 計算當前月份與顯示月份的差距
        const currentTotalMonths = currentYear * 12 + currentMonth;
        const displayedTotalMonths = displayedYear * 12 + displayedMonth;
        const monthDifference = Math.abs(displayedTotalMonths - currentTotalMonths);
        
        // 更新按鈕狀態 - 檢查是否可以繼續向前或向後
        const canGoPrev = displayedTotalMonths > currentTotalMonths - 3;
        const canGoNext = displayedTotalMonths < currentTotalMonths + 3;
        
        prevBtn.disabled = !canGoPrev;
        nextBtn.disabled = !canGoNext;
    }
}

function createDayElement(day, month, year, isCurrentMonth) {
    const dayElement = document.createElement('div');
    dayElement.textContent = day;
    
    // 處理跨年的月份計算
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
    const dateString = `${actualMonth + 1}-${day}`;
    const holidayInfo = holidays[dateString];
    const isToday = (new Date().toDateString() === date.toDateString());

    dayElement.className = 'calendar__cell calendar__cell--day';

    if (isCurrentMonth) {
        if (isToday) {
            dayElement.classList.add(holidayInfo && holidayInfo.isHoliday
                ? 'calendar__cell--today-holiday'
                : 'calendar__cell--today');
        } else if (holidayInfo) {
            dayElement.classList.add(holidayInfo.isHoliday
                ? 'calendar__cell--holiday'
                : 'calendar__cell--workday');
        } else if (dayOfWeek === 0) {
            dayElement.classList.add('calendar__cell--sun');
        } else if (dayOfWeek === 6) {
            dayElement.classList.add('calendar__cell--sat');
        }
    } else {
        dayElement.classList.add('calendar__cell--out');
    }
    
    if (holidayInfo) {
        dayElement.setAttribute('data-holiday', holidayInfo.name);
        dayElement.setAttribute('data-is-holiday', holidayInfo.isHoliday);
        dayElement.addEventListener('mouseenter', showHolidayTooltip);
        dayElement.addEventListener('mouseleave', hideHolidayTooltip);
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

    const dateString = `${month}-${day}`;
    const holidayInfo = holidays[dateString];
    const holidayInfoElement = document.getElementById('holidayInfo');
    if (holidayInfo) {
        holidayInfoElement.textContent = holidayInfo.name;
        holidayInfoElement.className = 'calendar__holiday' + (holidayInfo.isHoliday ? '' : ' calendar__holiday--normal');
    } else {
        holidayInfoElement.textContent = '';
        holidayInfoElement.className = 'hidden';
    }

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
            dayEl.classList.remove('calendar__cell--today', 'calendar__cell--today-holiday');
        }
    });

    if (clickedDate.toDateString() !== today) {
        event.target.classList.add('calendar__cell--selected');
    }
}

function showHolidayTooltip(event) {
    const holidayName = event.target.getAttribute('data-holiday');
    let tooltip = event.target.querySelector('.holiday-tooltip');
    
    if (tooltip) {
        tooltip.style.display = 'block';
        return;
    }
    
    tooltip = document.createElement('div');
    tooltip.className = 'holiday-tooltip tooltip';
    tooltip.textContent = holidayName;

    const rect = event.target.getBoundingClientRect();
    const tooltipWidth = 200; // 估計的最大寬度
    const viewportWidth = window.innerWidth;
    if (rect.left + tooltipWidth / 2 > viewportWidth) {
        tooltip.style.left = 'auto';
        tooltip.style.right = '0';
        tooltip.style.transform = 'translateX(0)';
    }
    
    event.target.appendChild(tooltip);
}

function hideHolidayTooltip(event) {
    const tooltip = event.target.querySelector('.holiday-tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}

async function updateCalendar() {
    const now = new Date();
    const todayDate = now.getDate();
    const todayMonth = now.getMonth();
    const todayYear = now.getFullYear();
    const todayDay = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];

    // 更新按鈕狀態
    updateNavigationButtons();

    // 左側基本資訊（純運算，立即顯示）；農曆需查詢的日期先記下來，最後再非同步補上
    let lunarYear, lunarMonth, lunarDay;
    if (displayedMonth === todayMonth && displayedYear === todayYear) {
        document.getElementById('currentDate').textContent = `${todayMonth + 1}.${todayDate}`;
        document.getElementById('currentDay').textContent = todayDay;

        const dateString = `${todayMonth + 1}-${todayDate}`;
        const holidayInfo = holidays[dateString];
        const holidayInfoElement = document.getElementById('holidayInfo');
        if (holidayInfo) {
            holidayInfoElement.textContent = holidayInfo.name;
            holidayInfoElement.className = 'calendar__holiday' + (holidayInfo.isHoliday ? '' : ' calendar__holiday--normal');
        } else {
            holidayInfoElement.textContent = '';
            holidayInfoElement.className = 'hidden';
        }

        lunarYear = todayYear;
        lunarMonth = todayMonth + 1;
        lunarDay = todayDate;
    } else {
        // 如果不是當月，顯示該月第一天或清空資訊
        document.getElementById('currentDate').textContent = `${displayedMonth + 1}.1`;
        document.getElementById('currentDay').textContent = ['日', '一', '二', '三', '四', '五', '六'][new Date(displayedYear, displayedMonth, 1).getDay()];
        document.getElementById('holidayInfo').textContent = '';
        document.getElementById('holidayInfo').className = 'hidden';

        lunarYear = displayedYear;
        lunarMonth = displayedMonth + 1;
        lunarDay = 1;
    }

    // 右側日期格只靠日期運算，先立即渲染，不等農曆網路請求
    const daysInMonth = new Date(displayedYear, displayedMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(displayedYear, displayedMonth, 1).getDay();
    const daysInPrevMonth = new Date(displayedYear, displayedMonth, 0).getDate();

    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';

    // 計算需要顯示的總天數，確保總是6行（42天）
    const totalCells = 42; // 6行 × 7天 = 42個格子
    const currentMonthStartIndex = firstDayOfMonth;
    const currentMonthEndIndex = firstDayOfMonth + daysInMonth - 1;

    for (let i = 0; i < totalCells; i++) {
        let day, month, year, isCurrentMonth;
        
        if (i < currentMonthStartIndex) {
            // 上個月的日期
            day = daysInPrevMonth - (currentMonthStartIndex - 1 - i);
            month = displayedMonth - 1;
            year = displayedYear;
            isCurrentMonth = false;
            
            // 處理跨年情況
            if (month < 0) {
                month = 11;
                year = displayedYear - 1;
            }
        } else if (i <= currentMonthEndIndex) {
            // 當月的日期
            day = i - currentMonthStartIndex + 1;
            month = displayedMonth;
            year = displayedYear;
            isCurrentMonth = true;
        } else {
            // 下個月的日期
            day = i - currentMonthEndIndex;
            month = displayedMonth + 1;
            year = displayedYear;
            isCurrentMonth = false;
            
            // 處理跨年情況
            if (month > 11) {
                month = 0;
                year = displayedYear + 1;
            }
        }
        
        const dayElement = createDayElement(day, month, year, isCurrentMonth);
        calendarDays.appendChild(dayElement);
    }

    // 農曆資料最後再非同步補上，不阻塞左側基本資訊與右側日期格的顯示
    const lunarDate = await fetchLunarDate(lunarYear, lunarMonth, lunarDay);
    if (lunarDate) {
        document.getElementById('lunarDate').innerHTML = `${lunarDate.month}${lunarDate.day}<br>${lunarDate.yearName}年 (${lunarDate.zodiac})`;
    }
}

async function initializeApp() {
    holidays = getHolidays(currentYear);
    loadSettings();
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


// 更新圖示預覽
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

// 設定編輯模態框
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
        // 允許 http://, https://, ftp://, file://, 或無協議的 URL，包括國際化域名
        const urlPattern = /^(https?:\/\/|ftp:\/\/|file:\/\/|\/\/)?(?:www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.?[a-zA-Z0-9()]{1,6}\b(?:[-a-zA-Z0-9()@:%_\+.~#?&//=]*[^\s])$/u;
        
        let processedUrl = url.trim();
        
        // 如果 URL 沒有協議，預設添加 https://
        if (!processedUrl.match(/^[a-zA-Z]+:\/\//)) {
            processedUrl = 'https://' + processedUrl;
        }
        
        let isValid = false;
        try {
            // 嘗試創建 URL 物件來驗證
            new URL(processedUrl);
            isValid = true;
        } catch (e) {
            // 如果創建 URL 物件失敗，使用正則表達式次檢查
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
        
        // 如果 URL 沒有協議，預設添加 https://
        if (!processedUrl.match(/^[a-zA-Z]+:\/\//)) {
            processedUrl = 'https://' + processedUrl;
        }
        
        let isValid = false;
        try {
            // 嘗試創建 URL 物件來驗證
            new URL(processedUrl);
            isValid = true;
        } catch (e) {
            // 如果創建 URL 物件失敗，使用正則表達式次檢查
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
        await loadModules;
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
