package config

import (
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	Port      string
	DBDSN     string
	JWTSecret string

	DeepSeekAPIKey  string
	DeepSeekBaseURL string
	DeepSeekModel   string

	QwenAPIKey  string
	QwenBaseURL string
	QwenModel   string
}

func Load() Config {
	_ = godotenv.Load()

	return Config{
		Port:      getEnv("PORT", "8080"),
		DBDSN:     getEnv("DB_DSN", "root:root123456@tcp(localhost:3306)/wordbook?charset=utf8mb4&parseTime=True&loc=Local"),
		JWTSecret: getEnv("JWT_SECRET", "wordbook-secret-key"),

		DeepSeekAPIKey:  getEnv("DEEPSEEK_API_KEY", ""),
		DeepSeekBaseURL: getEnv("DEEPSEEK_BASE_URL", "https://api.deepseek.com/v1/chat/completions"),
		DeepSeekModel:   getEnv("DEEPSEEK_MODEL", "deepseek-chat"),

		QwenAPIKey:  getEnv("QWEN_API_KEY", ""),
		QwenBaseURL: getEnv("QWEN_BASE_URL", "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions"),
		QwenModel:   getEnv("QWEN_MODEL", "qwen-plus"),
	}
}

func getEnv(key string, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}