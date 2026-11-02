#!/usr/bin/env bash
set -euo pipefail

echo "入口網站只需要 PHP，不用資料庫，也不用安裝套件。"
echo

if ! command -v php >/dev/null 2>&1; then
    echo "這台電腦還沒有 PHP。請先安裝 PHP 8.0 以上，或用 MAMP / 其他網站伺服器。"
    exit 1
fi

php -r 'exit(PHP_VERSION_ID >= 80000 ? 0 : 1);' || {
    echo "需要 PHP 8.0 以上。現在是：$(php -r 'echo PHP_VERSION;')"
    exit 1
}

echo "PHP $(php -r 'echo PHP_VERSION;') 可以用。"
echo
echo "接下來："
echo "  1. 把這個資料夾放到網站根目錄（MAMP 就是 htdocs）。"
echo "  2. 打開 config.php，改站名、上方捷徑、分類連結。"
echo "  3. 用瀏覽器打開 index.php。"
echo
echo "想先在這台電腦看："
echo "  php -S 127.0.0.1:8080"
echo "  然後打開 http://127.0.0.1:8080"
