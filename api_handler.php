<?php
header('Content-Type: application/json; charset=UTF-8');
header('Cache-Control: no-store');

$action = $_GET['action'] ?? '';

if ($action !== 'suggest') {
    http_response_code(400);
    echo json_encode(['error' => '無效的 action'], JSON_UNESCAPED_UNICODE);
    exit;
}

$engine = $_GET['engine'] ?? 'google';
$q = trim((string)($_GET['q'] ?? ''));
if ($q === '') {
    echo json_encode(['suggestions' => []]);
    exit;
}

$encoded = rawurlencode($q);
switch ($engine) {
    case 'bing':
        $url = "https://api.bing.com/osjson.aspx?query={$encoded}";
        break;
    case 'duckduckgo':
    case 'noai':
        $url = "https://duckduckgo.com/ac/?q={$encoded}&type=list";
        break;
    default:
        $url = "https://suggestqueries.google.com/complete/search?client=chrome&hl=zh-tw&q={$encoded}";
        break;
}

$ch = curl_init();
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_TIMEOUT => 3,
    CURLOPT_CONNECTTIMEOUT => 2,
    CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; SuggestProxy/1.0)',
]);
$response = curl_exec($ch);
curl_close($ch);

$suggestions = [];
$data = $response ? json_decode($response, true) : null;
if (is_array($data) && isset($data[1]) && is_array($data[1])) {
    foreach ($data[1] as $item) {
        if (is_string($item) && $item !== '') $suggestions[] = $item;
    }
}

echo json_encode(['suggestions' => array_slice($suggestions, 0, 8)], JSON_UNESCAPED_UNICODE);
