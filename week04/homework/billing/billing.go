package main

import (
	"errors"
	"fmt"
	"strconv"
	"time"
)

// 计费规则常量定义
const (
	// 版本信息
	ruleVersion = "v1.0.0" // 计费规则版本号

	// 阶梯电量上限（单位：度）
	firstTierLimit  = 200.0 // 第一档上限
	secondTierLimit = 400.0 // 第二档上限

	// 阶梯电价（单位：元/度）
	firstTierRate  = 0.5 // 第一档电价
	secondTierRate = 0.8 // 第二档电价
	thirdTierRate  = 1.2 // 第三档电价

	// 时段设置
	peakStartHour = 8   // 高峰时段起始小时
	peakEndHour   = 22  // 高峰时段结束小时
	peakFactor    = 1.1 // 高峰调节系数（上浮 10%）
	valleyFactor  = 0.8 // 低谷调节系数（下浮 20%）
)

// init 初始化计费系统，打印计费规则版本号和系统当前时间
func init() {
	fmt.Printf("计费规则版本号：%s\n", ruleVersion)
	fmt.Printf("系统初始化时间：%s\n", time.Now().Format("2006-01-02 15:04:05"))
}

// validateInputs 验证用电量和用电时段的合法性
// 参数：
//   - usage: 用电量（单位：度），必须为非负数
//   - hour: 用电时段（0-23），必须在有效范围内
//
// 返回值：
//   - error: 若输入非法则返回对应错误信息，否则返回 nil
func validateInputs(usage float64, hour int) error {
	if usage < 0 {
		return errors.New("用电量不能为负数")
	}
	if hour < 0 || hour > 23 {
		return errors.New("用电时段必须在 0 到 23 之间")
	}
	return nil
}

// calculateTotalCharge 根据阶梯电价和用电时段计算最终电费
// 先按阶梯规则计算基础电费，再乘以对应时段的调节系数得到最终金额
// 参数：
//   - usage: 用电量（单位：度）
//   - hour: 用电时段（0-23）
//
// 返回值：
//   - float64: 最终应付电费（单位：元）
func calculateTotalCharge(usage float64, hour int) float64 {
	// 计算阶梯基础电费
	var baseCharge float64
	if usage <= firstTierLimit {
		baseCharge = usage * firstTierRate
	} else if usage <= secondTierLimit {
		baseCharge = (firstTierLimit * firstTierRate) + (usage-firstTierLimit)*secondTierRate
	} else {
		baseCharge = (firstTierLimit * firstTierRate) +
			((secondTierLimit - firstTierLimit) * secondTierRate) +
			(usage-secondTierLimit)*thirdTierRate
	}

	// 乘以时段调节系数
	if hour > peakStartHour && hour <= peakEndHour {
		return baseCharge * peakFactor // 高峰时段
	}
	return baseCharge * valleyFactor // 低谷时段
}

// printBill 打印账单明细到标准输出
// 参数：
//   - usage: 用电量（单位：度）
//   - hour: 用电时段
//   - totalCharge: 最终应付电费（单位：元）
func printBill(usage float64, hour int, totalCharge float64) {
	fmt.Println("--- 账单明细 ---")
	fmt.Printf("当前用电：%.2f 度\n", usage)
	fmt.Printf("当前时段：%02d:00 点\n", hour)
	fmt.Printf("最终电费：%.2f 元\n", totalCharge)
}

// runBilling 运行计费系统主循环
// 持续接收用户输入，计算电费并打印账单，直到用户输入 exit 退出
func runBilling() {
	var usageInput string
	var hourInput string

	fmt.Println("\n=== 阶梯电价计费系统 ===")
	fmt.Println("请输入用电量和时段（格式：用电量 时段，例如：400 14）")
	fmt.Println("输入 'exit' 退出程序")
	fmt.Println("------------------------")

	for {
		fmt.Print("\n请输入用电量（度）：")
		_, err := fmt.Scan(&usageInput)
		if err != nil {
			fmt.Printf("错误：%v\n", err)
			continue
		}

		// 检查是否退出
		if usageInput == "exit" {
			fmt.Println("感谢使用，再见！")
			break
		}

		// 解析用电量
		usage, err := strconv.ParseFloat(usageInput, 64)
		if err != nil {
			fmt.Printf("错误：用电量必须是数字，输入：%s\n", usageInput)
			continue
		}

		// 输入用电时段
		fmt.Print("请输入用电时段（0-23 点）：")
		_, err = fmt.Scan(&hourInput)
		if err != nil {
			fmt.Printf("错误：%v\n", err)
			continue
		}

		// 检查时段是否退出
		if hourInput == "exit" {
			fmt.Println("感谢使用，再见！")
			break
		}

		// 解析时段
		hour, err := strconv.Atoi(hourInput)
		if err != nil {
			fmt.Printf("错误：时段必须是整数，输入：%s\n", hourInput)
			continue
		}

		// 验证输入合法性
		if err = validateInputs(usage, hour); err != nil {
			fmt.Printf("错误：%v\n", err)
			continue
		}

		// 计算最终电费并打印账单
		total := calculateTotalCharge(usage, hour)
		printBill(usage, hour, total)
	}
}

// main 程序入口，运行计费系统
func main() {
	runBilling()
}
