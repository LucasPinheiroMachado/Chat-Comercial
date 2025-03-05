<?php

/* Descomentar se seu servidor for de origem direta do PHP, .htaccess serve somente para quem usa apache.
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Authorization, Content-Type");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    header("HTTP/1.1 200 OK");
    exit();
}
*/
require_once __DIR__ . '/../funcs/main.php';

$url = $_SERVER['REQUEST_URI'];
$method = $_SERVER['REQUEST_METHOD'];
$matches = [];

date_default_timezone_set('America/Sao_Paulo');

// Regex para rotas
$regexCreateUser = '/^.*\/api\/api.php\/createuser\/?$/i';
$regexUserById = '/^.*\/api\/api.php\/userid\/(\d+)\/?$/i';
$regexLogin = '/^.*\/api\/api.php\/login\/?$/i';
$regexLogout = '/^.*\/api\/api.php\/logout\/?$/i';
$regexAllUsers = '/^.*\/api\/api.php\/allusers\/?$/i';
$regexUserConversations = '/^.*\/api\/api.php\/userconversations\/?$/i';
$regexUserLogin = '/^.*\/api\/api.php\/userlogin\/([^\/]+)\/?$/i';
$regexConversation = '/^.*\/api\/api.php\/conversation\/(\d+)\/?$/i';
$regexConversationDetails = '/^.*\/api\/api.php\/conversationdetails\/(\d+)\/?$/i';
$regexTwoUsersConversation = '/^.*\/api\/api.php\/twousersconversation\/(\d+)\/?$/i';
$regexLastMessageInConversation = '/^.*\/api\/api.php\/lastmessageinconversation\/(\d+)\/?$/i';
$regexBeginConversation = '/^.*\/api\/api.php\/beginconversation\/(\d+)\/?$/i';
$regexSendMessage = '/^.*\/api\/api.php\/sendmessage\/?$/i';
$regexSearchUser = '/^.*\/api\/api.php\/search\/([^\/]+)\/?$/i';

header('Content-Type: application/json');

// Rota de criar usuario
if (preg_match($regexCreateUser, $url) && $method == 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $name = $data['name'] ?? '';
    $type = $data['type'] ?? 'standard';
    $login = $data['login'] ?? '';
    $pass = $data['pass'] ?? '';

    try {
    $createdUser = new User(0, $name, $type, date('Y-m-d H:i:s'), $login, $pass);
    $created = createUser($createdUser);
    
    $user = getUserByLoginAndPass($login, $pass);
    if ($user) {
        $token = generateJWT($user->getId());
        die(json_encode([
            'token' => $token,
            'user' => [
                'id' => $user->getId(),
                'name' => $user->getName(),
                'type' => $user->getType(),
                'login' => $user->getLogin()
            ]
        ]));
    } else {
        http_response_code(401);
        die(json_encode(['message' => 'Credenciais inválidas']));
    }
    } catch(Exception $e){
        die(json_encode(['Erro ao cadastrar usuario']));
    }
}

// Rota de Login
if (preg_match($regexLogin, $url) && $method == 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    $login = $data['login'] ?? '';
    $pass = $data['pass'] ?? '';

    $user = getUserByLoginAndPass($login, $pass);

    if ($user) {
        $token = generateJWT($user->getId());
        die(json_encode([
            'token' => $token,
            'user' => [
                'id' => $user->getId(),
                'name' => $user->getName(),
                'type' => $user->getType(),
                'login' => $user->getLogin()
            ]
        ]));
    } else {
        http_response_code(401);
        die(json_encode(['message' => 'Credenciais inválidas']));
    }
}

// Rota de Logout
if (preg_match($regexLogout, $url) && $method == 'POST') {
    $headers = getallheaders();
    $token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');

    if (logout($token)) {
        die(json_encode(['message' => 'Logout realizado com sucesso']));
    } else {
        http_response_code(500);
        die(json_encode(['message' => 'Erro ao fazer logout']));
    }
}

// Middleware de Autenticação
$headers = getallheaders();
$token = str_replace('Bearer ', '', $headers['Authorization'] ?? '');

if (!$token) {
    http_response_code(401);
    die(json_encode(['message' => 'Token não fornecido']));
}

$userId = verifyJWT($token);

if (!$userId) {
    http_response_code(401);
    die(json_encode(['message' => 'Token inválido ou expirado']));
}

// Rotas Protegidas
// Pegar todas as conversas de um usuario
if (preg_match($regexUserConversations, $url) && $method == 'GET') {
    try {
        $conversations = getAllConversations($userId);
        die(json_encode($conversations));
    } catch (Exception $e) {
        http_response_code(500);
        die(json_encode(['message' => 'Erro ao carregar conversas: ' . $e->getMessage()]));
    }
} 
// Pegar todas as mensagens de uma conversa
elseif (preg_match($regexConversation, $url, $matches) && $method == 'GET') {
    $conversationId = $matches[1];

    $conversation = getConversationById($conversationId);

    if (!$conversation || ($conversation->getUser1Id() != $userId && $conversation->getUser2Id() != $userId)) {
        http_response_code(403);
        die(json_encode(['message' => 'Permissão negada']));
    }
    
    try {
        $messages = getAllMessages($conversationId);
        die(json_encode($messages));
    } catch (Exception $e) {
        http_response_code(500);
        die(json_encode(['message' => 'Erro ao carregar mensagens: ' . $e->getMessage()]));
    }
} 
// Pegar a ultima mensagem de uma conversa
elseif(preg_match($regexLastMessageInConversation, $url, $matches) && $method == 'GET'){
    $id = $matches[1];

    try{
        $lastMessage = getLastMessageInConversation($id);
        die(json_encode(['message' => [
                'id' => $lastMessage->getId(),
                'message' => $lastMessage->getMessage(),
                'user_id' => $lastMessage->getUserId(),
                'conversation_id' => $lastMessage->getConversationId(),
                'created_at' => $lastMessage->getCreatedAt()
            ]]));
    } catch (Exception $e){
        http_response_code(500);
        die(json_encode(['Erro ao buscar ultima mensagem']));
    }
}
// Pegar a conversa de dois usuarios
elseif(preg_match($regexTwoUsersConversation, $url, $matches) && $method == 'GET'){
    try{
        $user2_id = $matches[1];
        $conversation = getTwoUsersConversation($userId, $user2_id);
        die(json_encode($conversation));
    } catch (Exception $e){
        http_response_code(500);
        die(json_encode(['Erro ao buscar conversa']));
    }
}
// Enviar mensagem
elseif (preg_match($regexSendMessage, $url) && $method == 'POST'){
    $content = file_get_contents('php://input');
    $data = json_decode($content, true);

    try{
        $message = new Message(null, $data['message'], $userId, $data['conversation_id'], date('Y-m-d H:i:s'));
        saveMessage($message);
        die(json_encode(['message' => $message->getMessage()]));
    } catch (Exception $e){
        http_response_code(500);
        die(json_encode(['Erro ao eviar menssagem']));
    }
} 
// Buscar todos os usuarios
elseif(preg_match($regexAllUsers, $url) && $method == 'GET'){
    try{
        $allUsers = getAllUsers();
        die(json_encode($allUsers));
    } catch (Exception $e){
        http_response_code(500);
        die(json_encode(['Não foi possível buscar todos os usuarios']));
    }
}
// Rota para buscar usuário por ID
elseif (preg_match($regexUserById, $url, $matches) && $method == 'GET') {
    $userId = $matches[1];

    try {
        $user = getUserById($userId);
        die($user);
    } catch (Exception $e) {
        http_response_code(500);
        die(json_encode(['error' => 'Erro ao buscar usuário']));
    }
}
// Detalhes da conversa
elseif (preg_match($regexConversationDetails, $url, $matches) && $method == 'GET') {
    $conversationId = $matches[1];

    try {
        $conversation = getConversationById($conversationId);
        
        if (!$conversation || ($conversation->getUser1Id() != $userId && $conversation->getUser2Id() != $userId)) {
            http_response_code(403);
            die(json_encode(['message' => 'Permissão negada']));
        }
        
        die(json_encode([
            'id' => $conversation->getId(),
            'user1_id' => $conversation->getUser1Id(),
            'user2_id' => $conversation->getUser2Id(),
            'created_at' => $conversation->getCreatedAt()
        ]));
    } catch (Exception $e) {
        http_response_code(500);
        die(json_encode(['message' => 'Erro ao carregar detalhes da conversa']));
    }
}
// Buscar usuario pelo login
elseif(preg_match($regexUserLogin, $url, $matches) && $method == 'GET'){
    $login = urldecode($matches[1]);

    try {
        $jsonUser = getUserByLogin($login);
        die($jsonUser);
    } catch (Exception $e){
        http_response_code(500);
        die(json_encode(['Erro ao consultar usuario']));
    }
} 
// Iniciar uma conversa
elseif(preg_match($regexBeginConversation, $url, $matches) && $method == 'POST'){
    $idUser2 = $matches[1];

    try{
        $conversation = new Conversation(null, $userId, $idUser2, date('Y-m-d H:i:s'));
        $conversation_id = beginConversation($conversation);
        http_response_code(201);
        die(json_encode(['conversation_id' => $conversation_id]));
    } catch (Exception $e){
        http_response_code(500);
        die(json_encode(['Erro ao iniciar conversa']));
    }
} 
// Pesquisar usuario
elseif(preg_match($regexSearchUser, $url, $matches) && $method == 'GET'){
    $search = $matches[1];

    try{
        $users = searchUser($search);
        die(json_encode($users));
    } catch (Exception $e){
        http_response_code(500);
        die(json_encode(['Erro ao buscar']));
    }
}
else {
    http_response_code(404);
    die(json_encode(['message' => 'Rota não encontrada']));
}