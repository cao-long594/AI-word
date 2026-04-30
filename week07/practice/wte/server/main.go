package main

import (
	"log"

	"wte/server/internal/app"
	"wte/server/internal/config"
)

func main() {
	cfg := config.Load()

	bootstrap, err := app.Build(cfg)
	if err != nil {
		log.Fatalf("bootstrap app: %v", err)
	}

	log.Printf("server listening on :%s", cfg.Port)
	if err := bootstrap.Router.Run(":" + cfg.Port); err != nil {
		log.Fatalf("run server: %v", err)
	}
}
