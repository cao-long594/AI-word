// Package main 是一个用于并发探测服务状态并生成健康报告的命令行程序。
package main

import (
	"flag"
	"fmt"
	"os"
	"time"
)

// main 解析命令行参数，执行探测任务并生成报告
func main() {
	configPath := flag.String("config", "config.json", "配置文件路径")
	timeoutSec := flag.Int("timeout", 3, "单次探测超时时间（秒）")
	verbose := flag.Bool("v", false, "开启详细模式，实时打印每个目标探测状态")
	flag.Parse()

	cfg, err := LoadConfig(*configPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "❌ 加载配置文件失败: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("🚀 开始探测 %d 个目标，超时: %ds\n\n", len(cfg.Targets), *timeoutSec)

	timeout := time.Duration(*timeoutSec) * time.Second
	start := time.Now()
	results := ProbeAll(cfg.Targets, timeout, *verbose)
	elapsed := time.Since(start)

	fmt.Println()
	GenerateReport(results, elapsed)
}
