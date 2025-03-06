CREATE DATABASE chat_system;

USE chat_system;

CREATE TABLE chat_user (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    type ENUM('admin', 'standard') NOT NULL DEFAULT 'standard',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    login VARCHAR(50) NOT NULL,
    pass VARCHAR(255)
);

CREATE TABLE chat_conversation (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user1_id INT NOT NULL,
    user2_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user1_id) REFERENCES chat_user(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES chat_user(id) ON DELETE CASCADE
);

CREATE TABLE chat_message (
    id INT AUTO_INCREMENT PRIMARY KEY,
    message VARCHAR(1000) NOT NULL,
    user_id INT NOT NULL,
    conversation_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES chat_user(id) ON DELETE CASCADE,
    FOREIGN KEY (conversation_id) REFERENCES chat_conversation(id) ON DELETE CASCADE
);
