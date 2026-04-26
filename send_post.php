<?php
header('Content-Type: application/json; charset=utf-8');

function respond($ok, $message, $statusCode)
{
    http_response_code($statusCode);
    echo json_encode(
        array(
            'ok' => $ok,
            'message' => $message,
        ),
        JSON_UNESCAPED_UNICODE
    );
    exit;
}

function clean_value($value)
{
    return trim(strip_tags((string) $value));
}

if (!isset($_SERVER['REQUEST_METHOD']) || $_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(false, 'Метод не поддерживается.', 405);
}

$payload = $_POST;

if (empty($payload)) {
    $rawInput = file_get_contents('php://input');
    $decoded = json_decode($rawInput, true);
    if (is_array($decoded)) {
        $payload = $decoded;
    }
}

$name = isset($payload['name']) ? clean_value($payload['name']) : '';
$phone = isset($payload['phone']) ? clean_value($payload['phone']) : '';
$message = isset($payload['message']) ? trim((string) $payload['message']) : '';
$source = isset($payload['source']) ? clean_value($payload['source']) : 'Сайт Генпрофи';
$consent = isset($payload['personal_data_consent']) ? clean_value($payload['personal_data_consent']) : '';
$consentVersion = isset($payload['consent_version']) ? clean_value($payload['consent_version']) : 'не указана';

if ($name === '' || $phone === '') {
    respond(false, 'Укажите имя и телефон.', 422);
}

if ($consent !== 'accepted') {
    respond(false, 'Подтвердите согласие на обработку персональных данных.', 422);
}

$subject = 'Новая заявка с сайта Генпрофи';
$recipients = array(
    'snab@gpsnab.ru',
    'dadorindmitriy@gmail.com',
    'ms2397970@gmail.com',
);

$body = ''
    . '<p><strong>Новая заявка с сайта Генпрофи</strong></p>'
    . '<p><strong>Источник:</strong> ' . htmlspecialchars($source, ENT_QUOTES, 'UTF-8') . '</p>'
    . '<p><strong>Имя:</strong> ' . htmlspecialchars($name, ENT_QUOTES, 'UTF-8') . '</p>'
    . '<p><strong>Телефон:</strong> ' . htmlspecialchars($phone, ENT_QUOTES, 'UTF-8') . '</p>'
    . '<p><strong>Сообщение:</strong><br>'
    . nl2br(htmlspecialchars($message !== '' ? $message : 'Не указано', ENT_QUOTES, 'UTF-8'))
    . '</p>'
    . '<p><strong>Согласие на обработку персональных данных:</strong> получено через чекбокс формы. '
    . 'Редакция согласия: ' . htmlspecialchars($consentVersion, ENT_QUOTES, 'UTF-8') . '.</p>';

$headers = array();
$headers[] = 'MIME-Version: 1.0';
$headers[] = 'Content-Type: text/html; charset=UTF-8';
$headers[] = 'From: info@genprofi.ru';
$headers[] = 'Reply-To: info@genprofi.ru';
$headers[] = 'X-Mailer: PHP/' . phpversion();

$encodedSubject = '=?UTF-8?B?' . base64_encode($subject) . '?=';
$sent = @mail(implode(',', $recipients), $encodedSubject, $body, implode("\r\n", $headers));

if (!$sent) {
    respond(false, 'Не удалось отправить заявку. Позвоните нам по телефону +7 (495) 108-99-93.', 500);
}

respond(true, 'Заявка отправлена.', 200);
