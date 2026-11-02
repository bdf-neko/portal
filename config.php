<?php
/**
 * 站台設定。架好之後只要改這個檔案。
 * 站名建議短一點，上方中間是用文字顯示的。
 * 若要換成自己的圖，把圖放到 img/，再填 logo_path，例如 'img/logo.png'。
 *
 * index.php 開頭會 require 這個檔案。
 */
return [
    'site_name' => '我的入口',
    'tagline' => '自己的網路起點',
    'description' => '一個可以自己架設的入口網站。',
    'theme_color' => '#3b82f6',
    'logo_path' => '',
    'logo_link' => '#',

    // 搜尋框左右的文字連結。text 或 url 留空就不顯示。
    'feature_links' => [
        'left' => ['text' => '', 'url' => ''],
        'right' => ['text' => '', 'url' => ''],
    ],

    // 上方捷徑，建議維持 8 個（左邊 4 個、右邊 4 個）。訪客可在瀏覽器裡再改。
    'nav_links' => [
        ['name' => 'Email', 'url' => 'https://mail.google.com'],
        ['name' => 'Plurk', 'url' => 'https://www.plurk.com'],
        ['name' => 'Facebook', 'url' => 'https://facebook.com'],
        ['name' => 'Instagram', 'url' => 'https://instagram.com'],
        ['name' => 'Threads', 'url' => 'https://threads.net'],
        ['name' => 'Bluesky', 'url' => 'https://bsky.app'],
        ['name' => 'YouTube', 'url' => 'https://youtube.com'],
        ['name' => 'Twitch', 'url' => 'https://twitch.tv'],
    ],

    // 分類連結。每一組是 [標題, 連結陣列]；要彩色標題再加中間的顏色。
    // 連結是 [名稱, 網址]。要插入分隔線就放 ['|']。
    'categories_primary' => [
        ['社群', [
            ['Facebook', 'https://www.facebook.com'],
            ['Instagram', 'https://www.instagram.com'],
            ['Threads', 'https://www.threads.net'],
            ['X', 'https://x.com'],
            ['Bluesky', 'https://bsky.app/'],
            ['噗浪', 'https://www.plurk.com'],
        ]],
        ['新聞', [
            ['中央社', 'https://www.cna.com.tw/'],
            ['公視', 'https://news.pts.org.tw/'],
            ['華視', 'https://news.cts.com.tw/'],
            ['報導者', 'https://www.twreporter.org/'],
        ]],
        ['影視', [
            ['Netflix', 'https://www.netflix.com'],
            ['Disney+', 'https://www.disneyplus.com'],
            ['YouTube', 'https://www.youtube.com'],
        ]],
        ['音樂', [
            ['Spotify', 'https://www.spotify.com'],
            ['KKBOX', 'https://www.kkbox.com'],
            ['Apple', 'https://music.apple.com'],
        ]],
    ],

    'categories_secondary' => [
        ['購物', 'var(--color-3)', [
            ['PChome', 'https://24h.pchome.com.tw'],
            ['momo', 'https://www.momoshop.com.tw'],
            ['蝦皮', 'https://shopee.tw'],
        ]],
        ['交通', 'var(--color-6)', [
            ['臺鐵', 'https://www.railway.gov.tw'],
            ['高鐵', 'https://www.thsrc.com.tw'],
            ['|'],
            ['台北捷運', 'https://www.metro.taipei'],
        ]],
        ['旅遊', 'var(--color-7)', [
            ['Agoda', 'https://www.agoda.com'],
            ['Booking', 'https://www.booking.com'],
        ]],
    ],

    // 右側工具列。每一組是 [按鈕名稱, 連結陣列]。
    'tools' => [
        ['地圖', [
            ['Google', 'https://www.google.com/maps'],
            ['Bing', 'https://www.bing.com/maps'],
            ['OpenStreetMap', 'https://www.openstreetmap.org'],
        ]],
        ['翻譯', [
            ['Google', 'https://translate.google.com'],
            ['DeepL', 'https://www.deepl.com/translator'],
        ]],
        ['雲端', [
            ['Google', 'https://drive.google.com'],
            ['Dropbox', 'https://www.dropbox.com'],
            ['iCloud', 'https://www.icloud.com'],
        ]],
    ],
];
