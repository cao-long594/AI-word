package config

import "os"

type Config struct {
	Port      string
	DBPath    string
	JWTSecret string
	AppEnv    string
}

func Load() Config {
	return Config{
		Port:      getEnv("PORT", "8080"),
		DBPath:    getEnv("DB_PATH", "./data/wte.db"),
		JWTSecret: getEnv("JWT_SECRET", "change-me"),
		AppEnv:    getEnv("APP_ENV", "development"),
	}
}

func getEnv(key, fallback string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return fallback
}
