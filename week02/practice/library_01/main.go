package main

import (
	"flag"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strconv"
	"strings"
)

// Operation 定义文件操作的接口
type Operation interface {
	Execute(input string) (string, error)
}

// CountOperation - 统计字符数、单词数、行数
type CountOperation struct{}

func (c *CountOperation) Execute(input string) (string, error) {
	charCount := len(input)
	lineCount := 0
	wordCount := 0

	for _, char := range input {
		if char == '\n' {
			lineCount++
		}
	}
	lineCount++

	inWord := false
	for _, char := range input {
		if char == ' ' || char == '\n' || char == '\t' {
			inWord = false
		} else if !inWord {
			wordCount++
			inWord = true
		}
	}

	return fmt.Sprintf("字符数: %d, 单词数: %d, 行数: %d", charCount, wordCount, lineCount), nil
}

// ConvertOperation - 数字转二进制
type ConvertOperation struct{}

func (c *ConvertOperation) Execute(input string) (string, error) {
	lines := strings.Split(strings.TrimSpace(input), "\n")
	var results []string

	for _, line := range lines {
		line = strings.TrimSpace(line)
		if line == "" {
			continue
		}

		// 尝试转换为整数
		num, err := strconv.ParseInt(line, 10, 64)
		if err != nil {
			// 如果不是整数，返回原文本
			results = append(results, fmt.Sprintf("%s (非整数)", line))
			continue
		}

		// 将数字转换为二进制
		binary := strconv.FormatInt(num, 2)
		results = append(results, fmt.Sprintf("%d -> %s", num, binary))
	}

	return strings.Join(results, "\n"), nil
}

// UpperOperation - 转换为大写
type UpperOperation struct{}

func (u *UpperOperation) Execute(input string) (string, error) {
	result := ""
	for _, char := range input {
		if char >= 'a' && char <= 'z' {
			result += string(char - 32)
		} else {
			result += string(char)
		}
	}
	return result, nil
}

// ============ 工厂函数 ============
func getOperation(opType string) (Operation, error) {
	switch opType {
	case "count":
		return &CountOperation{}, nil
	case "convert":
		return &ConvertOperation{}, nil
	case "upper":
		return &UpperOperation{}, nil
	default:
		return nil, fmt.Errorf("未知的操作类型: %s\n支持的操作: count, convert, upper", opType)
	}
}

// writeOutputFile 将内容写入文件，自动创建必要的目录
// 支持相对路径：./output/result.txt
// 支持 Windows 路径：C:\output\result.txt 或 C:/output/result.txt
func writeOutputFile(outputPath string, content string) error {
	// 获取文件所在的目录
	dir := filepath.Dir(outputPath)

	// 如果目录不是当前目录，则创建它
	if dir != "" && dir != "." {
		// 使用 os.MkdirAll 递归创建目录
		// 如果目录已存在，不会报错
		err := os.MkdirAll(dir, 0755)
		if err != nil {
			return fmt.Errorf("创建目录失败 '%s': %v", dir, err)
		}
	}

	// 写入文件内容
	// 0644 表示文件权限：所有者可读写，其他用户可读
	err := os.WriteFile(outputPath, []byte(content), 0644)
	if err != nil {
		return fmt.Errorf("写入文件失败: %v", err)
	}

	return nil
}

func main() {
	file := flag.String("file", "input.txt", "输入文件路径 (必需)")
	operation := flag.String("operation", "", "操作类型 (必需)")
	output := flag.String("output", "output.txt", "输出文件路径 (可选)")

	flag.Parse()

	if *file == "" || *operation == "" {
		fmt.Println("使用方法: go run main.go -file <文件路径> -operation <操作类型> [-output <输出文件路径>]")
		fmt.Println("\n支持的操作类型:")
		fmt.Println("  count   - 统计字符数、单词数、行数")
		fmt.Println("  convert - 将数字转换为二进制 (如: 10 -> 1010)")
		fmt.Println("  upper   - 转换为大写")
		os.Exit(1)
	}

	input, err := os.ReadFile(*file)
	if err != nil {
		log.Fatalf("读取文件失败: %v", err)
	}

	op, err := getOperation(*operation)
	if err != nil {
		log.Fatalf("操作类型错误: %v", err)
	}

	result, err := op.Execute(string(input))
	if err != nil {
		log.Fatalf("执行操作失败: %v", err)
	}

	// 将结果写入文件
	err = writeOutputFile(*output, result)
	if err != nil {
		log.Fatalf("写入输出文件失败: %v", err)
	}
	fmt.Printf("✓ 操作成功！结果已写入到: %s\n", *output)
}
