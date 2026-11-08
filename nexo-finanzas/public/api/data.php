<?php
// API mínima de NEXO Finanzas: guarda los datos en data.json (reemplaza a json-server).
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
$file = __DIR__ . '/data.json';

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    echo file_exists($file) ? file_get_contents($file) : '{}';
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $raw = file_get_contents('php://input');
    if (strlen($raw) > 100000) { http_response_code(413); echo '{"ok":false,"error":"demasiado grande"}'; exit; }
    $d = json_decode($raw, true);
    if (!is_array($d) || !isset($d['inc'], $d['gas'], $d['cats']) || !is_numeric($d['inc']) || !is_numeric($d['gas']) || !is_array($d['cats'])) {
        http_response_code(400); echo '{"ok":false,"error":"datos no válidos"}'; exit;
    }
    $ok = file_put_contents($file, json_encode($d, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), LOCK_EX);
    if ($ok === false) { http_response_code(500); echo '{"ok":false,"error":"no se pudo escribir data.json"}'; exit; }
    echo '{"ok":true}';
    exit;
}

http_response_code(405);
echo '{"ok":false}';
