package main

import (
	"math"
	"strings"
	"testing"
)

// almostEqual 判断两个浮点数之差是否在精度阈值内
// 参数：
//   - a: 第一个浮点数
//   - b: 第二个浮点数
//
// 返回值：若两者差值小于 1e-9 则返回 true，否则返回 false
func almostEqual(a, b float64) bool {
	return math.Abs(a-b) < 1e-9
}

// TestCalculateTotalCharge 验证 calculateTotalCharge 在各阶梯与高峰/低谷时段组合下的计算正确性
func TestCalculateTotalCharge(t *testing.T) {
	tests := []struct {
		name  string
		usage float64
		hour  int
		want  float64
	}{
		// 高峰时段（系数 1.1）
		{"第一档-高峰", 100, 14, 55.0},    // 100*0.5 * 1.1
		{"第一档边界-高峰", 200, 14, 110.0}, // 200*0.5 * 1.1
		{"第二档-高峰", 300, 14, 198.0},   // (100 + 100*0.8) * 1.1
		{"第二档边界-高峰", 400, 14, 286.0}, // (100 + 160) * 1.1
		{"第三档-高峰", 500, 14, 418.0},   // (100 + 160 + 100*1.2) * 1.1

		// 低谷时段（系数 0.8）
		{"第一档-低谷", 100, 3, 40.0},  // 100*0.5 * 0.8
		{"第三档-低谷", 500, 3, 304.0}, // (100 + 160 + 100*1.2) * 0.8

		// 时段边界
		{"高峰起始边界", 200, 8, 80.0},   // hour=8 属于低谷
		{"低谷起始边界", 200, 22, 110.0}, // hour=22 属于高峰
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := calculateTotalCharge(tt.usage, tt.hour)
			if !almostEqual(got, tt.want) {
				t.Errorf("calculateTotalCharge(%.1f, %d) = %v, want %v",
					tt.usage, tt.hour, got, tt.want)
			}
		})
	}
}

// TestValidateInputs 验证 validateInputs 对非法用电量、非法时段及合法输入的处理是否符合预期
// 测试覆盖负数用电量、超出范围的时段以及合法输入三种情况
func TestValidateInputs(t *testing.T) {
	tests := []struct {
		usage   float64 // 用电量（单位：度）
		hour    int     // 用电时段（0-23）
		wantErr bool    // 是否期望返回错误
		msg     string  // 期望错误消息包含的内容
	}{
		{-10, 10, true, "用电量不能为负数"},         // 负数用电量
		{100, 25, true, "必须在 0 到 23 之间"},      // 超出范围的时段
		{100, 10, false, ""},                       // 合法输入
	}

	for _, tt := range tests {
		err := validateInputs(tt.usage, tt.hour)
		if (err != nil) != tt.wantErr {
			t.Errorf("validateInputs(%v, %d) error = %v, wantErr %v", tt.usage, tt.hour, err, tt.wantErr)
		}
		if err != nil && !strings.Contains(err.Error(), tt.msg) {
			t.Errorf("error message %q does not contain %q", err.Error(), tt.msg)
		}
	}
}
