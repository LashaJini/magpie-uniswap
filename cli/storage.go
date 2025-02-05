package main

import (
	"context"
	"fmt"

	"github.com/jackc/pgx/v5/pgxpool"
)

// Connection is a concurrency-safe connection pool wrapper around pgxpool.Pool.
type Connection struct {
	*pgxpool.Pool
}

// NewDatabaseConnection initializes a new database connection pool.
func NewDatabaseConnection(databaseUrl string) (*Connection, error) {
	pool, err := pgxpool.New(context.Background(), databaseUrl)
	if err != nil {
		return nil, fmt.Errorf("unable to create connection: %w", err)
	}

	return &Connection{
		pool,
	}, nil
}

func DatabaseURL(cfg *Config) string {
	return fmt.Sprintf(
		"postgresql://%s:%s@%s:%d/%s?sslmode=%s",
		cfg.DB_USER,
		cfg.DB_PASS,
		cfg.DB_HOST,
		cfg.DB_PORT,
		cfg.DB_NAME,
		cfg.DB_SSLMODE,
	)
}

// Close closes the database connection pool.
func (c *Connection) Close() {
	c.Pool.Close()
}
