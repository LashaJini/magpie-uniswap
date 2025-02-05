package main

import (
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/golang-migrate/migrate/v4"
	"github.com/golang-migrate/migrate/v4/source"
	"github.com/spf13/cobra"

	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

var migrateCmd = &cobra.Command{
	Use:   "migrate",
	Short: "Migrate database structures.",
	Long:  "Migrate database structures. Create new tables, columns, indexes and so on.",
	Run:   migrateHandler,
}

var (
	MIGRATE_UP      int
	MIGRATE_DOWN    int
	MIGRATE_VERSION bool
	MIGRATE_FORCE   int
	MIGRATE_CREATE  string
)

const (
	MigrateUpDefault     = 1
	MigrateDownDefault   = 1
	MigrateForceDefault  = 1
	MigrateDirectionUp   = "up"
	MigrateDirectionDown = "down"
)

func init() {
	rootCmd.AddCommand(migrateCmd)

	migrateCmd.PersistentFlags().IntVarP(&MIGRATE_UP, "up", "u", MigrateUpDefault, "migrate up by <n>. Setting to 0 migrates all")
	migrateCmd.PersistentFlags().IntVarP(&MIGRATE_DOWN, "down", "d", MigrateDownDefault, "migrate down by <n>. Setting to 0 migrates all")
	migrateCmd.Flags().BoolVarP(&MIGRATE_VERSION, "version", "v", false, "last migration version")
	migrateCmd.PersistentFlags().IntVarP(&MIGRATE_FORCE, "force", "f", MigrateForceDefault, "set migration version. Don't run migrations")
	migrateCmd.Flags().StringVarP(&MIGRATE_CREATE, "create", "c", "", "create migration")

	migrateCmd.MarkFlagsOneRequired("up", "down", "version", "force", "create")
	migrateCmd.MarkFlagsMutuallyExclusive("up", "down", "version", "force", "create")
}

func migrateHandler(cmd *cobra.Command, args []string) {
	cfg, err := NewConfig()
	if err != nil {
		log.Fatal(err)
	}

	databaseUrl := DatabaseURL(cfg)
	m, err := migrate.New("file://"+cfg.MIGRATIONS_DIR, databaseUrl)
	if err != nil {
		log.Fatalf("error creating migrate instance: %v", err)
	}

	if MIGRATE_VERSION {
		handleVersion(m)
		return
	}

	if cmd.Flags().Changed("force") {
		if err := m.Force(MIGRATE_FORCE); err != nil {
			log.Fatal(fmt.Errorf("force migration error: %w", err))
		}

		return
	}

	if cmd.Flags().Changed("create") {
		if err := createMigrationFiles(cfg, MIGRATE_CREATE); err != nil {
			log.Fatal(fmt.Errorf("migration file creation error: %w", err))
		}
		return
	}

	// up or down migrations
	conn, err := NewDatabaseConnection(databaseUrl)
	if err != nil {
		log.Fatalf("error connecting to database: %v", err)
	}
	defer conn.Close()

	var steps int
	var inMemorySource *InMemorySource
	if cmd.Flags().Changed("down") {
		var totalDowns int
		inMemorySource, totalDowns = Down(cfg)

		steps = -MIGRATE_DOWN
		if steps == 0 {
			steps = -totalDowns
		}
	} else {
		var totalUps int
		inMemorySource, totalUps = Up(cfg)

		steps = MIGRATE_UP
		if steps == 0 {
			steps = totalUps
		}
	}

	if err := commitMigration(databaseUrl, inMemorySource, steps); err != nil {
		log.Fatal("error committing migration", err)
	}
}

func Down(cfg *Config) (*InMemorySource, int) {
	inMemorySource, down := walk(cfg, source.Down)

	fmt.Printf("total 'down' migrations found: %d\n", down)

	return inMemorySource, down
}

func Up(cfg *Config) (*InMemorySource, int) {
	inMemorySource, ups := walk(cfg, source.Up)

	fmt.Printf("total 'up' migrations found: %d\n", ups)

	return inMemorySource, ups
}

func walk(cfg *Config, direction source.Direction) (*InMemorySource, int) {
	inMemorySource := NewInMemorySource()

	steps := 0
	ext := fmt.Sprintf(".%s.sql", direction)
	err := filepath.Walk(cfg.MIGRATIONS_DIR, func(path string, info os.FileInfo, err error) error {
		if !info.IsDir() && strings.HasSuffix(path, ext) {

			f, err := os.ReadFile(path)
			if err != nil {
				log.Fatal("error reading file", err)
			}

			migration := &source.Migration{
				Version:    migrationIDFromFile(path),
				Direction:  direction,
				Raw:        string(f),
				Identifier: path,
			}
			inMemorySource.Migrations.Append(migration)

			// count total files ending with *.<direction>.sql in <directions-dir>
			// for example, ls -l migrations | grep ".up.sql" | wc -l
			steps++
		}
		return nil
	})
	if err != nil {
		log.Fatal("error walking dir", err)
	}

	return inMemorySource, steps
}

func migrationIDFromFile(path string) uint {
	fileName := filepath.Base(path)
	timestamp := strings.Split(fileName, "_")[0]
	migrationID, err := strconv.Atoi(timestamp)
	if err != nil {
		log.Fatal("error parsing migration id", err)
	}

	return uint(migrationID)
}

func commitMigration(databaseUrl string, inMemorySource *InMemorySource, steps int) error {
	mm, err := migrate.NewWithSourceInstance("in-memory", inMemorySource, databaseUrl)
	if err != nil {
		log.Fatal("could not create migration instance", err)
	}

	return migrationSteps(mm, steps)
}

func migrationSteps(m *migrate.Migrate, steps int) error {
	err := m.Steps(steps)
	if err == migrate.ErrNoChange {
		fmt.Printf("no migrations applied. %s\n", err)
		return nil
	}

	if err != nil {
		log.Fatalf("migration steps failed: %v\n", err)
	}

	return nil
}

func handleVersion(m *migrate.Migrate) {
	version, dirty, err := m.Version()
	if err != nil {
		log.Fatalf("error fetching version: %v; version: %d; dirty: %t", err, version, dirty)
	}
	fmt.Printf("Current version: %d, Dirty: %t\n", version, dirty)
}

func createMigrationFiles(cfg *Config, name string) error {
	timestamp := time.Now().Format("20060102150405")
	filename := fmt.Sprintf("%s_%s", timestamp, name)
	upFilePath := filepath.Join(cfg.MIGRATIONS_DIR, fmt.Sprintf("%s.%s.sql", filename, source.Up))
	downFilePath := filepath.Join(cfg.MIGRATIONS_DIR, fmt.Sprintf("%s.%s.sql", filename, source.Down))

	upFile, err := os.Create(upFilePath)
	if err != nil {
		return fmt.Errorf("error creating up file: %w", err)
	}
	defer upFile.Close()

	downFile, err := os.Create(downFilePath)
	if err != nil {
		// potential dir removal too
		_ = os.RemoveAll(upFilePath)
		return fmt.Errorf("error creating down file: %w", err)
	}
	defer downFile.Close()

	return nil
}
