<?php

require_once __DIR__ . '/../model/User.php';
require_once __DIR__ . '/../db/conn.php';

function verifyPermition($user){
    if (!$user->getType() == 'admin'){
        return false;
    }
    return true;
}

function verifyIfLoginExists($user){
    global $pdo;
    try{
        $sql = 'SELECT * from chat_user';
        $stmt = $pdo->prepare($sql);
        $stmt->execute();

        $chat_users = $stmt->fetchAll(PDO::FETCH_ASSOC);

        foreach($chat_users as $chat_user){
            if($user->getLogin() == $chat_user['login']){
                return false;
            }
        }
        return true;
    } catch (PDOException $e){
        return false;
    }
}