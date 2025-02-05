package main

import (
	"bytes"
	"io"
	"os"

	"github.com/golang-migrate/migrate/v4/source"
)

type InMemorySource struct {
	Migrations *source.Migrations
}

func (s *InMemorySource) Open(url string) (source.Driver, error) {
	return s, nil
}

func (s *InMemorySource) Close() error {
	return nil
}

func (s *InMemorySource) First() (uint, error) {
	v, ok := s.Migrations.First()
	if !ok {
		return 0, &os.PathError{Op: "first", Path: "", Err: os.ErrNotExist}
	}
	return v, nil
}

func (s *InMemorySource) Prev(version uint) (uint, error) {
	v, ok := s.Migrations.Prev(version)
	if !ok {
		return 0, &os.PathError{Op: "prev", Path: "", Err: os.ErrNotExist}
	}
	return v, nil
}

func (s *InMemorySource) Next(version uint) (uint, error) {
	v, ok := s.Migrations.Next(version)
	if !ok {
		return 0, &os.PathError{Op: "next", Path: "", Err: os.ErrNotExist}
	}
	return v, nil
}

func (s *InMemorySource) ReadUp(version uint) (io.ReadCloser, string, error) {
	if m, ok := s.Migrations.Up(version); ok {
		return io.NopCloser(bytes.NewReader([]byte(m.Raw))), m.Identifier, nil
	}
	return nil, "", &os.PathError{Op: "readUp", Path: "", Err: os.ErrNotExist}
}

func (s *InMemorySource) ReadDown(version uint) (io.ReadCloser, string, error) {
	if m, ok := s.Migrations.Down(version); ok {
		return io.NopCloser(bytes.NewReader([]byte(m.Raw))), m.Identifier, nil
	}
	return nil, "", &os.PathError{Op: "readDown", Path: "", Err: os.ErrNotExist}
}

func NewInMemorySource() *InMemorySource {
	return &InMemorySource{
		Migrations: source.NewMigrations(),
	}
}
