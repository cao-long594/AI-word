CREATE DATABASE IF NOT EXISTS wordbook DEFAULT CHARSET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE wordbook;

CREATE TABLE IF NOT EXISTS users (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS words (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    user_id BIGINT NOT NULL,
    word VARCHAR(100) NOT NULL,
    meaning TEXT NOT NULL,
    examples JSON NOT NULL,
    ai_provider VARCHAR(30) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL DEFAULT NULL,

    UNIQUE KEY uk_user_word (user_id, word),
    INDEX idx_user_created_at (user_id, created_at),
    INDEX idx_words_deleted_at (deleted_at),

    CONSTRAINT fk_words_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
