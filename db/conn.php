<?php
try {
    $host = 'localhost';
    $dbname = 'chat_system';
    $username = 'root';
    $password = '';

    $pdo = new PDO("mysql:host=$host;dbname=$dbname;charset=utf8", 
    $username, 
    $password, 
    [PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION]);
} catch (PDOException $e) {
    die("Erro na conexão: " . $e->getMessage());
}
