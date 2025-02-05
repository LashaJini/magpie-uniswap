package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"

	"github.com/joho/godotenv"
)

const DEFAULT_DB_IMAGE = "postgres:17.2"

type Config struct {
	PROJECT_ROOT string

	/**
	* storage
	 */
	DB_USER        string
	DB_PASS        string
	DB_NAME        string
	DB_HOST        string
	DB_SSLMODE     string
	DB_PORT        int
	DB_IMAGE       string
	MIGRATIONS_DIR string
}

func NewConfig() (*Config, error) {
	cwd, _ := os.Getwd()
	projectRoot := withDefault("PROJECT_ROOT", cwd)

	env := withDefault("ENV", "prod")
	envFile := filepath.Join(projectRoot, fmt.Sprintf(".env.%s", env))
	if err := godotenv.Load(envFile); err != nil {
		return nil, fmt.Errorf("unable to load: %w", err)
	}

	dbPort, err := strconv.Atoi(os.Getenv("DB_PORT"))
	if err != nil {
		return nil, fmt.Errorf("DB_PORT is not an integer: %w", err)
	}

	return &Config{
		PROJECT_ROOT:   projectRoot,
		DB_USER:        required("DB_USER"),
		DB_PASS:        required("DB_PASS"),
		DB_NAME:        required("DB_NAME"),
		DB_HOST:        withDefault("DB_HOST", "localhost"),
		DB_SSLMODE:     withDefault("DB_SSLMODE", "disable"),
		DB_PORT:        dbPort,
		DB_IMAGE:       withDefault("DB_IMAGE", DEFAULT_DB_IMAGE),
		MIGRATIONS_DIR: withDefault("MIGRATIONS_DIR", "migrations"),
	}, nil
}

// required returns a value from the environment or exits with an error.
func required(key string) string {
	value := os.Getenv(key)
	if value == "" {
		log.Fatalf("%s not set", key)
	}
	return value
}

func withDefault(key, defaultValue string) string {
	// withDefault returns a value from the environment or uses a default value.
	value := os.Getenv(key)
	if value == "" {
		value = defaultValue
		log.Printf("%s not set. Using default '%s'", key, defaultValue)
	}

	return value
}
