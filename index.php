<?php
$config = require __DIR__ . '/config.php';
$cssVersion = file_exists('css/style.css') ? filemtime('css/style.css') : time();
$jsVersion = file_exists('js/script.js') ? filemtime('js/script.js') : time();
$holidaysVersion = file_exists('js/holidays.js') ? filemtime('js/holidays.js') : time();

$siteName = (string)($config['site_name'] ?? '我的入口');
$tagline = (string)($config['tagline'] ?? '');
$description = (string)($config['description'] ?? $tagline);
$themeColor = (string)($config['theme_color'] ?? '#3b82f6');
$logoPath = (string)($config['logo_path'] ?? '');
$logoLink = (string)($config['logo_link'] ?? '#');
$featureLinks = $config['feature_links'] ?? [];
$navLinks = $config['nav_links'] ?? [];

function h($s) { return htmlspecialchars((string)$s, ENT_QUOTES, 'UTF-8'); }

function featureLinkHtml($slot) {
    $text = trim((string)($slot['text'] ?? ''));
    $url = trim((string)($slot['url'] ?? ''));
    if ($text === '' || $url === '') return '';
    return '<a href="' . h($url) . '" class="feature-link">' . h($text) . '</a>';
}

function renderCategoryRow($title, $links, $color = null) {
    $titleClass = 'cat-title' . ($color ? ' cat-title--color' : '');
    $style = $color ? ' style="--cat-color: ' . h($color) . '"' : '';
    echo '<div class="cat-row">';
    echo '<h3 class="' . $titleClass . '"' . $style . '>' . h($title) . '</h3>';
    echo '<div class="cat-row__links">';
    foreach ($links as $link) {
        if ($link === ['|'] || (isset($link[0]) && $link[0] === '|' && count($link) === 1)) {
            echo '<span class="cat-divider">｜</span>';
            continue;
        }
        echo '<a href="' . h($link[1] ?? '#') . '" class="cat-link">' . h($link[0] ?? '') . '</a>';
    }
    echo '</div></div>';
}

function renderCategoryCard($groups) {
    echo '<div class="card stack">';
    $first = true;
    foreach ($groups as $group) {
        if (!$first) echo '<hr>';
        $first = false;
        if (count($group) === 3) {
            renderCategoryRow($group[0], $group[2], $group[1]);
        } else {
            renderCategoryRow($group[0], $group[1] ?? []);
        }
    }
    echo '</div>';
}

$leftFeature = featureLinkHtml($featureLinks['left'] ?? []);
$rightFeature = featureLinkHtml($featureLinks['right'] ?? []);
$hasFeatures = $leftFeature !== '' || $rightFeature !== '';
$pageTitle = $tagline !== '' ? ($siteName . ' - ' . $tagline) : $siteName;
?>
<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo h($pageTitle); ?></title>
    <link rel="icon" href="favicon.svg" type="image/svg+xml">
    <meta name="theme-color" content="#ffffff" id="themeColorMeta">
    <meta name="description" content="<?php echo h($description); ?>">
    <meta property="og:type" content="website">
    <meta property="og:title" content="<?php echo h($pageTitle); ?>">
    <meta property="og:description" content="<?php echo h($description); ?>">
    <link rel="stylesheet" href="css/style.css?v=<?php echo $cssVersion; ?>">
    <script src="https://cdn.jsdelivr.net/npm/sortablejs@1.14.0/Sortable.min.js"></script>
    <script>
        window.moduleVersions = { holidays: '<?php echo $holidaysVersion; ?>' };
        window.siteName = <?php echo json_encode($siteName, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP); ?>;
        window.logoPath = <?php echo json_encode($logoPath, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP); ?>;
        window.logoLink = <?php echo json_encode($logoLink, JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP); ?>;
        window.defaultLinks = <?php echo json_encode(array_values($navLinks), JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP); ?>;
        (() => {
            const saved = localStorage.getItem('darkMode') || 'default';
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            const dark = saved === 'dark' || (saved === 'auto' && prefersDark);
            document.documentElement.classList.toggle('dark', dark);
            document.getElementById('themeColorMeta').content = dark ? '#1F2937' : '#ffffff';
        })();
    </script>
</head>
<body>
    <div id="confirmModal" class="modal hidden">
        <div class="modal__panel">
            <h3 class="modal__title">恢復預設</h3>
            <p class="modal__desc">你改過的上方捷徑會被清掉，而且無法復原。</p>
            <div class="modal__actions">
                <button id="cancelReset" class="btn btn--secondary" type="button">取消</button>
                <button id="confirmReset" class="btn btn--danger" type="button">確定</button>
            </div>
        </div>
    </div>

    <div class="container">
        <div class="nav-container">
            <div class="nav-links">
                <div id="custom-links"></div>
            </div>
        </div>

        <div class="card card--md">
            <div class="search-row<?php echo $hasFeatures ? '' : ' search-row--center'; ?>">
                <?php if ($leftFeature !== ''): ?><div class="search-row__cell"><?php echo $leftFeature; ?></div><?php endif; ?>
                <div class="search-row__cell">
                    <form id="searchForm">
                        <div class="search-bar">
                            <svg class="search-bar__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <div class="search-bar__field">
                                <input type="text" id="searchInput" class="search-bar__input" autocomplete="off" aria-label="搜尋">
                                <div id="searchSuggest" class="search-suggest hidden" role="listbox"></div>
                            </div>
                            <button type="submit" id="searchButton" class="search-bar__btn">
                                <span class="search-bar__btn-label">搜尋</span>
                            </button>
                        </div>
                    </form>
                </div>
                <?php if ($rightFeature !== ''): ?><div class="search-row__cell"><?php echo $rightFeature; ?></div><?php endif; ?>
            </div>

            <div class="search-mobile">
                <div class="search-row__cell">
                    <form id="searchFormMobile" style="width: 100%; max-width: 24rem;">
                        <div class="search-bar">
                            <svg class="search-bar__icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" aria-hidden="true">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                            </svg>
                            <div class="search-bar__field">
                                <input type="text" id="searchInputMobile" class="search-bar__input" autocomplete="off" aria-label="搜尋">
                                <div id="searchSuggestMobile" class="search-suggest hidden" role="listbox"></div>
                            </div>
                            <button type="submit" id="searchButtonMobile" class="search-bar__btn">
                                <span class="search-bar__btn-label">搜尋</span>
                            </button>
                        </div>
                    </form>
                </div>
                <?php if ($hasFeatures): ?>
                <div class="search-mobile__links">
                    <?php echo $leftFeature; ?>
                    <?php echo $rightFeature; ?>
                </div>
                <?php endif; ?>
            </div>
        </div>

        <div class="layout">
            <div class="layout__main stack-lg">
                <?php renderCategoryCard($config['categories_primary'] ?? []); ?>
                <?php renderCategoryCard($config['categories_secondary'] ?? []); ?>
            </div>

            <div class="layout__side layout__sticky">
                <div id="calendar-placeholder">
                    <div class="calendar calendar--skeleton" aria-hidden="true">
                        <div class="calendar__row">
                            <div class="calendar__left">
                                <span class="skeleton-bar skeleton-bar--cal-date"></span>
                                <span class="skeleton-bar skeleton-bar--cal-day"></span>
                                <span class="skeleton-bar skeleton-bar--cal-lunar"></span>
                            </div>
                            <div class="calendar__right">
                                <div class="calendar__weekrow">
                                    <?php for ($i = 0; $i < 7; $i++): ?><span class="cal-skeleton-cell"></span><?php endfor; ?>
                                </div>
                                <div class="calendar__days">
                                    <?php for ($i = 0; $i < 42; $i++): ?><span class="cal-skeleton-cell"></span><?php endfor; ?>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <?php $tools = $config['tools'] ?? []; if ($tools): ?>
                <div id="tools-container" class="card mt-4">
                    <div class="weather-head">
                        <h3 class="weather-title">工具</h3>
                        <div class="weather-tools">
                            <?php foreach ($tools as $i => $tool): ?>
                                <?php if ($i > 0): ?><div class="weather-tools__divider"></div><?php endif; ?>
                                <div class="dropdown">
                                    <button type="button" class="feature-link"><?php echo h($tool[0] ?? ''); ?></button>
                                    <div class="dropdown__bridge"></div>
                                    <div class="dropdown__menu dropdown__menu--wide">
                                        <?php foreach (($tool[1] ?? []) as $link): ?>
                                            <a href="<?php echo h($link[1] ?? '#'); ?>" class="dropdown__link"><?php echo h($link[0] ?? ''); ?></a>
                                        <?php endforeach; ?>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
                <?php endif; ?>
            </div>
        </div>

        <button id="settingsButton" class="icon-btn settings-button" type="button">
            <span class="sr-only">設定</span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
            </svg>
        </button>

        <div id="editModal" class="modal hidden">
            <div class="modal__panel">
                <h3 class="modal__title">編輯連結</h3>
                <div class="stack-lg">
                    <div>
                        <label for="editName" class="label">名稱</label>
                        <input type="text" id="editName" class="input">
                    </div>
                    <div>
                        <label for="editUrl" class="label">網址</label>
                        <input type="url" id="editUrl" class="input">
                    </div>
                    <div>
                        <label for="editIconUrl" class="label">圖示網址 <span class="text-xs text-muted">(選填)</span></label>
                        <div class="flex gap-2">
                            <input type="url" id="editIconUrl" placeholder="https://example.com/icon.png" class="input">
                            <div id="iconPreview" style="width:2.5rem;height:2.5rem;border:1px solid var(--border);border-radius:var(--radius-sm);background:var(--bg-tag);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                                <span class="text-xs text-muted">預覽</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="modal__actions">
                    <button id="cancelEdit" class="btn btn--secondary" type="button">取消</button>
                    <button id="saveEdit" class="btn btn--primary" type="button">確定</button>
                </div>
            </div>
        </div>

        <footer class="footer">
            <div class="footer__inner">
                <div class="footer__copy">
                    <p class="footer__copy-line"><?php echo h($siteName); ?> &copy; <?php echo date('Y'); ?></p>
                </div>
            </div>
        </footer>
    </div>

    <div id="settingsPanel" class="settings-panel hidden">
        <div class="stack-lg">
            <div class="segmented">
                <label class="segmented__item">
                    <input type="radio" name="darkMode" value="default" id="darkModeDefault">
                    <span class="segmented__label">明亮</span>
                </label>
                <div class="segmented__divider"></div>
                <label class="segmented__item">
                    <input type="radio" name="darkMode" value="dark" id="darkModeDark">
                    <span class="segmented__label">灰暗</span>
                </label>
                <div class="segmented__divider"></div>
                <label class="segmented__item">
                    <input type="radio" name="darkMode" value="auto" id="darkModeAuto">
                    <span class="segmented__label">自動</span>
                </label>
            </div>

            <div class="settings-row">
                <h3 class="text-sm font-medium">上方捷徑</h3>
                <div class="text-xs text-muted" style="text-align:right;">
                    <span class="font-bold">點擊</span><span>編輯</span>
                    <span class="footer__divider" style="display:inline-block;vertical-align:middle;margin:0 0.5rem;"></span>
                    <span class="font-bold">拖曳</span><span>排序</span>
                </div>
            </div>

            <div class="settings-row">
                <span class="text-sm font-medium">新分頁開啟連結</span>
                <label class="switch">
                    <input type="checkbox" id="newTabToggle">
                    <span class="switch__slider"></span>
                </label>
            </div>

            <div>
                <label for="searchEngineSelect" class="label">搜尋引擎</label>
                <select id="searchEngineSelect" class="select">
                    <option value="google">Google</option>
                    <option value="bing">Bing</option>
                    <option value="duckduckgo">DuckDuckGo</option>
                    <option value="noai">DuckDuckGo（無 AI）</option>
                    <option value="ecosia">Ecosia</option>
                </select>
            </div>
        </div>

        <div class="mt-4 flex justify-between items-center">
            <button id="resetButton" class="text-sm font-medium text-red" type="button">恢復預設</button>
        </div>
    </div>

    <script type="module" src="js/script.js?v=<?php echo $jsVersion; ?>"></script>
</body>
</html>
