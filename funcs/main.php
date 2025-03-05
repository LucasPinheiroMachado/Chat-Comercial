<?php

require_once __DIR__ . '/../db/conn.php';
require_once __DIR__ . '/../model/User.php';
require_once __DIR__ . '/../model/Conversation.php';
require_once __DIR__ . '/../model/Message.php';
require_once __DIR__ . '/chatRules.php';
require_once __DIR__ . '/../vendor/autoload.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Chave secreta para JWT (substitua por uma chave segura)
define('JWT_SECRET', 'sua_chave_secreta');

function createUser($user) {
    global $pdo;
    $hashedPassword = password_hash($user->getPass(), PASSWORD_DEFAULT);
    try {
        $sql = 'INSERT INTO chat_user (name, type, created_at, login, pass) VALUES (:name, :type, :created_at, :login, :pass)';
        $stmt = $pdo->prepare($sql);

        $loginNotExists = verifyIfLoginExists($user);

        if(!$loginNotExists){
            http_response_code(409);
            die(json_encode(['Esse nome de usuario já existe']));
        }

        $stmt->bindValue(':name', $user->getName(), PDO::PARAM_STR);
        $stmt->bindValue(':type', $user->getType(), PDO::PARAM_STR);
        $stmt->bindValue(':created_at', $user->getCreatedAt(), PDO::PARAM_STR);
        $stmt->bindValue(':login', $user->getLogin(), PDO::PARAM_STR);
        $stmt->bindValue(':pass', $hashedPassword, PDO::PARAM_STR);

        $stmt->execute();

        return true;
    } catch (PDOException $e) {
        return false;
    }
}

// Função para autenticar um usuário
function getUserByLoginAndPass($login, $pass) {
    global $pdo;

    try {
        $sql = 'SELECT * FROM chat_user WHERE login = :login';
        $stmt = $pdo->prepare($sql);

        $stmt->bindValue(':login', $login, PDO::PARAM_STR);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row && password_verify($pass, $row['pass'])) {
            return new User(
                $row['id'],
                $row['name'],
                $row['type'],
                $row['created_at'],
                $row['login'],
                $row['pass']
            );
        }
        return null;
    } catch (PDOException $e) {
        error_log("Erro ao buscar usuário: " . $e->getMessage());
        return null;
    }
}

function getUserByLogin($login) {
    global $pdo;

    try {
        $sql = 'SELECT * FROM chat_user WHERE login = :login';
        $stmt = $pdo->prepare($sql);

        $stmt->bindValue(':login', trim($login), PDO::PARAM_STR);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return json_encode(['error' => 'Usuário não encontrado']);
        }
        return json_encode([
            'id' => $row['id'],
            'name' => $row['name'],
            'type' => $row['type'],
            'created_at' => $row['created_at'],
            'login' => trim($row['login'])
        ]);
    } catch (PDOException $e) {
        error_log("Erro ao buscar usuário: " . $e->getMessage());
        return json_encode(['error' => 'Erro ao buscar usuário']);
    }
}

function getAllUsers(){
    global $pdo;
    try{
        $sql = 'SELECT * FROM chat_user';
        $stmt = $pdo->prepare($sql);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        if (!$rows) {
            return json_encode(['error' => 'Usuários não encontrados']);
        }
        $allUsers = [];
        foreach($rows as $row){
            $user = new User(
                        $row['id'],
                        $row['name'],
                        $row['type'],
                        $row['created_at'],
                        $row['login'],
                        null);
            $allUsers[] = [
                "id" => $user->getId(),
                "name" => $user->getName(),
                "type" => $user->getType(),
                "created_at" => $user->getCreatedAt(),
                "login" => $user->getLogin()
            ];
        }
        return $allUsers;
    } catch (PDOException $e){
        http_response_code(500);
        die(json_encode(['Não foi possível buscar todos os usuarios']));
    }
}

function getUserById($userId) {
    global $pdo;

    try {
        $sql = 'SELECT * FROM chat_user WHERE id = :id';
        $stmt = $pdo->prepare($sql);

        $stmt->bindValue(':id', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return json_encode(['error' => 'Usuário não encontrado']);
        }

        return json_encode([
            'id' => $row['id'],
            'name' => $row['name'],
            'type' => $row['type'],
            'created_at' => $row['created_at'],
            'login' => trim($row['login'])
        ]);
    } catch (PDOException $e) {
        error_log("Erro ao buscar usuário: " . $e->getMessage());
        return json_encode(['error' => 'Erro ao buscar usuário']);
    }
}

function generateJWT($userId) {
    $issuedAt = time();
    // $expirationTime = $issuedAt + 3600; // Descomentar para dar tempo de duração ao token, recomendado em produção

    $payload = [
        'iat' => $issuedAt,
        // 'exp' => $expirationTime,
        'sub' => $userId
    ];

    return JWT::encode($payload, JWT_SECRET, 'HS256');
}

function verifyJWT($token) {
    try {
        $decoded = JWT::decode($token, new Key(JWT_SECRET, 'HS256'));
        return $decoded->sub; // Retorna o ID do usuário
    } catch (Exception $e) {
        return null;
    }
}

function logout($token) {
    return true;
}

function beginConversation($conversation) {
    global $pdo;

    $pdo->beginTransaction();

    try {
        $sqlCheckAdmin = 'SELECT type FROM chat_user WHERE id IN (:user1_id, :user2_id)';
        $stmtCheckAdmin = $pdo->prepare($sqlCheckAdmin);
        $stmtCheckAdmin->bindValue(':user1_id', $conversation->getUser1Id(), PDO::PARAM_INT);
        $stmtCheckAdmin->bindValue(':user2_id', $conversation->getUser2Id(), PDO::PARAM_INT);
        $stmtCheckAdmin->execute();

        $users = $stmtCheckAdmin->fetchAll(PDO::FETCH_ASSOC);

        $hasAdmin = false;
        foreach ($users as $user) {
            if ($user['type'] === 'admin') {
                $hasAdmin = true;
            }
        }

        if (!$hasAdmin) {
            $pdo->rollBack();
            return false;
        }

        $sqlInsertConversation = 'INSERT INTO chat_conversation (user1_id, user2_id, created_at) VALUES (:user1_id, :user2_id, :created_at)';
        $stmtInsertConversation = $pdo->prepare($sqlInsertConversation);
        $stmtInsertConversation->bindValue(':user1_id', $conversation->getUser1Id(), PDO::PARAM_INT);
        $stmtInsertConversation->bindValue(':user2_id', $conversation->getUser2Id(), PDO::PARAM_INT);
        $stmtInsertConversation->bindValue(':created_at', $conversation->getCreatedAt(), PDO::PARAM_STR);
        $stmtInsertConversation->execute();

        $conversation_id = $pdo->lastInsertId();
        
        $pdo->commit();

        return $conversation_id;
    } catch (PDOException $e) {
        $pdo->rollBack();
        return false;
    }
}

function getAllConversations($userId) {
    global $pdo;

    try {
        $sql = 'SELECT * FROM chat_conversation WHERE user1_id = :userId OR user2_id = :userId ORDER BY created_at ASC';
        $stmt = $pdo->prepare($sql);

        $stmt->bindValue(':userId', $userId, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $conversations = [];
        foreach ($rows as $row) {
            $conversation = new Conversation(
                $row['id'],
                $row['user1_id'],
                $row['user2_id'],
                $row['created_at']
            );
            $conversations[] = [
                'id' => $conversation->getId(),
                'user1_id' => $conversation->getUser1Id(),
                'user2_id' => $conversation->getUser2Id(),
                'created_at' => $conversation->getCreatedAt()
            ];            
        }

        return $conversations;
    } catch (PDOException $e) {
        error_log("Erro ao buscar conversas: " . $e->getMessage());
        return null;
    }
}

function getConversationById($conversationId) {
    global $pdo;
    try {
        $sql = 'SELECT * FROM chat_conversation WHERE id = :id';
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':id', $conversationId, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        return new Conversation($row['id'], $row['user1_id'], $row['user2_id'], $row['created_at']);
    } catch (PDOException $e) {
        return null;
    }
}

function getTwoUsersConversation($user1_id, $user2_id){
    global $pdo;
    try{
        $sql = 'SELECT * FROM chat_conversation WHERE (user1_id = :user1_id AND user2_id = :user2_id) OR (user1_id = :user2_id AND user2_id = :user1_id)';
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':user1_id', $user1_id, PDO::PARAM_INT);
        $stmt->bindValue(':user2_id', $user2_id, PDO::PARAM_INT);
        $stmt->execute();
        $row = $stmt->fetch(PDO::FETCH_ASSOC);
        if(!$row){
            http_response_code(404);
            die(json_encode(['Não há conersas entre esses usuarios']));
        }
        $conversation = new Conversation($row['id'], $row['user1_id'], $row['user2_id'], $row['created_at']);
        $twoUsersConversation = ['id' => $conversation->getId(),
                'user1_id' => $conversation->getUser1Id(),
                'user2_id' => $conversation->getUser2Id(),
                'created_at' => $conversation->getCreatedAt()];
        return $twoUsersConversation;
    } catch (PDOException $e) {
        return null;
    }
}

function getLastMessageInConversation($conversationId){
    global $pdo;

    try{
        $sql = 'SELECT * 
                FROM chat_message 
                WHERE conversation_id = :conversation_id 
                ORDER BY created_at DESC 
                LIMIT 1';
        $stmt = $pdo->prepare($sql);
        $stmt->bindParam(':conversation_id', $conversationId, PDO::PARAM_INT);
        $stmt->execute();
        
        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if (!$row) {
            return null;
        }

        $message = new Message($row['id'],
                               $row['message'],
                               $row['user_id'],
                               $row['conversation_id'],
                               $row['created_at']
                               );
        return $message;
    } catch(PDOException $e){
        http_response_code(500);
        die(json_encode(['Erro ao buscar ultima mensagem da conversa']));
    }
}

function saveMessage($message) {
    global $pdo;

    try {
        $sql = 'INSERT INTO chat_message (message, user_id, conversation_id, created_at) VALUES (:message, :user_id, :conversation_id, :created_at)';
        $stmt = $pdo->prepare($sql);

        $stmt->bindValue(':message', $message->getMessage(), PDO::PARAM_STR);
        $stmt->bindValue(':user_id', $message->getUserId(), PDO::PARAM_INT);
        $stmt->bindValue(':conversation_id', $message->getConversationId(), PDO::PARAM_INT);
        $stmt->bindValue(':created_at', $message->getCreatedAt(), PDO::PARAM_STR);

        $stmt->execute();

        return $pdo->lastInsertId();
    } catch (PDOException $e) {
        return null;
    }
}

function getAllMessages($conversation_id) {
    global $pdo;

    try {
        $sql = 'SELECT * FROM chat_message WHERE conversation_id = :conversation_id ORDER BY created_at ASC';
        $stmt = $pdo->prepare($sql);

        $stmt->bindValue(':conversation_id', $conversation_id, PDO::PARAM_INT);
        $stmt->execute();

        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

        $messages = [];
        foreach ($rows as $row) {
            $message = new Message(
                $row['id'],
                $row['message'],
                $row['user_id'],
                $row['conversation_id'],
                $row['created_at']
            );
            $messages[] = [
                'id' => $message->getId(),
                'message' => $message->getMessage(),
                'user_id' => $message->getUserId(),
                'conversation' => $message->getConversationId(),
                'created_at' => $message->getCreatedAt()
            ];  
        }

        return $messages;
    } catch (PDOException $e) {
        return null;
    }
}

function getOneMessage($message_id) {
    global $pdo;

    try {
        $sql = 'SELECT * FROM chat_message WHERE id = :message_id';
        $stmt = $pdo->prepare($sql);

        $stmt->bindValue(':message_id', $message_id, PDO::PARAM_INT);
        $stmt->execute();

        $row = $stmt->fetch(PDO::FETCH_ASSOC);

        if ($row) {
            return new Message(
                $row['id'],
                $row['message'],
                $row['user_id'],
                $row['conversation_id'],
                $row['created_at']
            );
        } else {
            return null;
        }
    } catch (PDOException $e) {
        return null;
    }
}

function searchUser($search){
    global $pdo;

    try {
        $sql = 'SELECT * FROM chat_user
        WHERE name LIKE CONCAT("%", :search, "%") 
        OR login LIKE CONCAT("%", :search, "%")';
        $stmt = $pdo->prepare($sql);
        $stmt->bindValue(':search', $search, PDO::PARAM_STR);
        $stmt->execute();
        
        $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);
        $users = [];
        foreach($rows as $row){
            $user = new User(
                $row['id'], 
                $row['name'], 
                $row['type'], 
                $row['created_at'], 
                $row['login'], 
                null
            );
            $users[] = [
                "id" => $user->getId(),
                "name" => $user->getName(),
                "type" => $user->getType(),
                "created_at" => $user->getCreatedAt(),
                "login" => $user->getLogin()
            ];
        }
        return $users;
    } catch (PDOException $e) {
        error_log("Erro na busca: " . $e->getMessage());
        return [];
    }
}