package main

import (
	"context"
	"log"

	"github.com/spf13/cobra"
)

var rootCmd = &cobra.Command{
	Use:   "magpie-uniswap",
	Short: "Magpie Uniswap <short description>",
	Long:  "Magpie Uniswap <long description>",
	Run:   func(cmd *cobra.Command, args []string) {},
}

func Execute(ctx context.Context) error {
	return rootCmd.ExecuteContext(ctx)
}

func main() {
	if err := Execute(context.Background()); err != nil {
		log.Fatal(err)
	}
}
