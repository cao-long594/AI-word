package main

import (
	"fmt"
	"io"
	"math"
	"os"
	"regexp"
	"sort"
	"strings"
	"time"

	"github.com/mattn/go-runewidth"
)

// ANSI 颜色定义。
const (
	colorReset  = "\033[0m"
	colorBold   = "\033[1m"
	colorRed    = "\033[31m"
	colorGreen  = "\033[32m"
	colorYellow = "\033[33m"
	colorCyan   = "\033[36m"
	colorGray   = "\033[90m"
)

type textAlign int

const (
	alignLeft textAlign = iota
	alignRight
	alignCenter
)

type columnSpec struct {
	title string
	width int
	align textAlign
}

type reportSummary struct {
	total       int
	success     int
	fail        int
	successRate float64

	min    float64
	p50    float64
	p90    float64
	p99    float64
	max    float64
	avg    float64
	stddev float64

	durations []float64
	slowest   []Result
	failed    []Result
}

var (
	ansiRegexp = regexp.MustCompile(`\x1b\[[0-9;?]*[ -/]*[@-~]`)
	widthCond  = runewidth.NewCondition()
)

func init() {
	widthCond.EastAsianWidth = true
}

// colored 返回带 ANSI 颜色编码的字符串
// 参数：
//   s: 原始字符串
//   color: 颜色编码（如 colorRed, colorGreen 等）
// 返回值：添加了颜色编码的字符串
func colored(s, color string) string {
	return color + s + colorReset
}

// bold 返回加粗的字符串
// 参数：
//   s: 原始字符串
// 返回值：加粗格式的字符串
func bold(s string) string {
	return colorBold + s + colorReset
}

// stripANSI 移除字符串中的 ANSI 转义序列
// 参数：
//   s: 可能包含 ANSI 转义序列的字符串
// 返回值：移除 ANSI 转义序列后的纯文本
func stripANSI(s string) string {
	return ansiRegexp.ReplaceAllString(s, "")
}

// displayWidth 计算字符串的显示宽度（考虑中文字符）
// 参数：
//   s: 输入字符串
// 返回值：字符串在终端中的显示宽度
func displayWidth(s string) int {
	return widthCond.StringWidth(stripANSI(s))
}

// fitWidth 将字符串裁剪到指定宽度，超出部分用省略号代替
// 参数：
//   s: 输入字符串
//   width: 目标宽度
// 返回值：适配宽度后的字符串
func fitWidth(s string, width int) string {
	s = stripANSI(s)
	if width <= 0 {
		return ""
	}
	if displayWidth(s) <= width {
		return s
	}
	if width <= 3 {
		return widthCond.Truncate(s, width, "")
	}
	return widthCond.Truncate(s, width, "...")
}

// pad 对字符串进行填充以达到指定宽度
// 参数：
//   s: 输入字符串
//   width: 目标宽度
//   align: 对齐方式（左对齐、右对齐或居中）
// 返回值：填充后的字符串
func pad(s string, width int, align textAlign) string {
	w := displayWidth(s)
	if w >= width {
		return s
	}

	spaces := strings.Repeat(" ", width-w)

	switch align {
	case alignRight:
		return spaces + s
	case alignCenter:
		left := (width - w) / 2
		right := width - w - left
		return strings.Repeat(" ", left) + s + strings.Repeat(" ", right)
	default:
		return s + spaces
	}
}

// renderCell 渲染表格单元格内容
// 参数：
//   text: 单元格文本
//   spec: 列规格定义
//   useColor: 是否使用颜色
//   color: 颜色编码
// 返回值：渲染后的单元格字符串
func renderCell(text string, spec columnSpec, useColor bool, color string) string {
	out := pad(fitWidth(text, spec.width), spec.width, spec.align)
	if useColor && color != "" {
		return colored(out, color)
	}
	return out
}

// statusText 根据探测成功与否返回状态文本和颜色
// 参数：
//   success: 探测是否成功
// 返回值：状态文本和对应的颜色编码
func statusText(success bool) (string, string) {
	if success {
		return "✅ OK", colorGreen
	}
	return "❌ FAIL", colorRed
}

// protocolText 返回协议名称的大写形式
// 参数：
//   p: 协议名称（http, https, tcp 等）
// 返回值：大写形式的协议名称
func protocolText(p string) string {
	p = strings.ToUpper(strings.TrimSpace(p))
	if p == "" {
		return "HTTP"
	}
	return p
}

// durationColor 根据响应时间与 P50/P90 的比较返回对应的颜色
// 参数：
//   ms: 实际响应时间（毫秒）
//   p50: P50 响应时间
//   p90: P90 响应时间
// 返回值：对应的颜色编码
func durationColor(ms, p50, p90 float64) string {
	if ms >= p90 {
		return colorRed
	}
	if ms >= p50 {
		return colorYellow
	}
	return colorGreen
}

// resultText 根据探测结果返回详细的描述文本和颜色
// 参数：
//   r: 探测结果对象
// 返回值：描述文本和对应的颜色编码
func resultText(r Result) (string, string) {
	expect := strings.ToLower(strings.TrimSpace(r.Target.Expect))
	proto := strings.ToLower(strings.TrimSpace(r.Target.Protocol))

	if !r.Success {
		if strings.Contains(strings.ToLower(r.Error), "timeout") {
			return "timeout", colorRed
		}
		return r.Error, colorRed
	}

	switch {
	case proto == "tcp":
		return "Connected", ""
	case expect == "fail":
		return "Fail", ""
	case strings.HasPrefix(expect, "contains:"):
		keyword := r.Target.Expect[len("contains:"):]
		return fmt.Sprintf("Contains %q", keyword), ""
	case r.StatusCode == 200:
		return "200 OK", ""
	case expect == "timeout":
		return "timeout", ""
	default:
		return "OK", ""
	}
}

// buildSummary 构建报告摘要信息，包括统计数据和分布信息
// 参数：
//   results: 所有探测结果的切片
// 返回值：包含统计摘要的结构体
func buildSummary(results []Result) reportSummary {
	s := reportSummary{
		total:     len(results),
		durations: make([]float64, 0, len(results)),
		slowest:   make([]Result, len(results)),
	}

	copy(s.slowest, results)

	for _, r := range results {
		if r.Success {
			s.success++
		} else {
			s.fail++
			s.failed = append(s.failed, r)
		}
		s.durations = append(s.durations, float64(r.Duration.Milliseconds()))
	}

	if s.total == 0 {
		return s
	}

	s.successRate = float64(s.success) / float64(s.total) * 100

	sort.Float64s(s.durations)
	sort.Slice(s.slowest, func(i, j int) bool {
		return s.slowest[i].Duration > s.slowest[j].Duration
	})

	s.min = s.durations[0]
	s.max = s.durations[len(s.durations)-1]
	s.avg = mean(s.durations)
	s.p50 = percentile(s.durations, 50)
	s.p90 = percentile(s.durations, 90)
	s.p99 = percentile(s.durations, 99)
	s.stddev = stdDev(s.durations, s.avg)

	return s
}

// GenerateReport 输出终端报表，并将无颜色版本写入日志文件。
func GenerateReport(results []Result, elapsed time.Duration) {
	timestamp := time.Now().Format("20060102150405")
	filename := fmt.Sprintf("monitor-log-%s.log", timestamp)

	f, err := os.Create(filename)
	if err != nil {
		fmt.Fprintf(os.Stderr, "failed to create log file: %v\n", err)
	}

	printReport(os.Stdout, results, elapsed, true)

	if f != nil {
		defer f.Close()
		printReport(f, results, elapsed, false)
		fmt.Printf("\n%s 报表已写入 → %s\n",
			colored("📁", colorCyan),
			colored(filename, colorCyan),
		)
	}
}

// printReport 执行实际的报告打印逻辑
// 参数：
//   w: 输出写入器（可以是 stdout 或文件）
//   results: 所有探测结果
//   elapsed: 总执行耗时
//   useColor: 是否使用 ANSI 颜色
func printReport(w io.Writer, results []Result, elapsed time.Duration, useColor bool) {
	colorize := func(s, color string) string {
		if useColor && color != "" {
			return colored(s, color)
		}
		return s
	}
	emphasize := func(s string) string {
		if useColor {
			return bold(s)
		}
		return s
	}

	sum := buildSummary(results)
	if sum.total == 0 {
		fmt.Fprintln(w, "no results")
		return
	}

	const reportWidth = 88
	sep := strings.Repeat("─", reportWidth)
	thickSep := strings.Repeat("━", reportWidth)

	fmt.Fprintln(w)
	fmt.Fprintln(w, emphasize(colorize(thickSep, colorCyan)))
	fmt.Fprintf(w, emphasize(colorize("  %-84s\n", colorCyan)), "服务健康探测报告  Service Health Probe Report")
	fmt.Fprintf(w, colorize("  生成时间: %-30s  总执行耗时: %v\n", colorGray),
		time.Now().Format("2006-01-02 15:04:05"),
		elapsed.Round(time.Millisecond),
	)
	fmt.Fprintln(w, emphasize(colorize(thickSep, colorCyan)))

	fmt.Fprintln(w)
	fmt.Fprintln(w, emphasize("§ 1  概览"))
	fmt.Fprintln(w, colorize(sep, colorGray))

	rateColor := colorGreen
	if sum.successRate < 80 {
		rateColor = colorRed
	} else if sum.successRate < 95 {
		rateColor = colorYellow
	}

	fmt.Fprintf(w, "  探测目标总数   %s\n", emphasize(fmt.Sprintf("%d", sum.total)))
	fmt.Fprintf(w, "  成功           %s  (%s)\n",
		colorize(fmt.Sprintf("%d", sum.success), colorGreen),
		colorize(fmt.Sprintf("%.1f%%", sum.successRate), rateColor),
	)
	fmt.Fprintf(w, "  失败           %s  (%.1f%%)\n",
		colorize(fmt.Sprintf("%d", sum.fail), colorRed),
		100-sum.successRate,
	)
	fmt.Fprintf(w, "  成功率  %s %s\n",
		renderBar(sum.successRate, 40, useColor),
		colorize(fmt.Sprintf("%.1f%%", sum.successRate), rateColor),
	)

	fmt.Fprintln(w)
	fmt.Fprintln(w, emphasize("§ 2  响应时间分布"))
	fmt.Fprintln(w, colorize(sep, colorGray))

	printStatLine(w, "Min", sum.min)
	printStatLine(w, "P50", sum.p50)
	printStatLine(w, "P90", sum.p90)
	printStatLine(w, "P99", sum.p99)
	printStatLine(w, "Max", sum.max)
	printStatLine(w, "Avg", sum.avg)
	printStatLine(w, "StdDev", sum.stddev)

	fmt.Fprintln(w)
	printHistogram(w, sum.durations, 5, useColor)

	fmt.Fprintln(w)
	fmt.Fprintln(w, emphasize("§ 3  响应最慢 Top 5"))
	fmt.Fprintln(w, colorize(sep, colorGray))

	topN := 5
	if len(sum.slowest) < topN {
		topN = len(sum.slowest)
	}

	const (
		topIndexWidth    = 2
		topStateWidth    = 8
		topNameWidth     = 24
		topBarInnerWidth = 20
		topTimeWidth     = 7
	)

	for i := 0; i < topN; i++ {
		r := sum.slowest[i]

		status, statusColor := statusText(r.Success)
		indexCol := pad(fmt.Sprintf("%d.", i+1), topIndexWidth, alignRight)
		stateCol := pad(status, topStateWidth, alignLeft)
		nameCol := pad(fitWidth(r.Target.Name, topNameWidth), topNameWidth, alignLeft)

		bar := renderDurationBarPlain(r.Duration.Milliseconds(), int64(sum.max), topBarInnerWidth)
		barColor := colorGreen
		if sum.max > 0 {
			ratio := float64(r.Duration.Milliseconds()) / sum.max
			if ratio > 0.8 {
				barColor = colorRed
			} else if ratio > 0.5 {
				barColor = colorYellow
			}
		}

		timeCol := pad(fmt.Sprintf("%d ms", r.Duration.Milliseconds()), topTimeWidth, alignRight)

		fmt.Fprintf(w, "  %s %s %s %s %s\n",
			indexCol,
			colorize(stateCol, statusColor),
			nameCol,
			colorize(bar, barColor),
			colorize(timeCol, colorYellow),
		)
	}

	fmt.Fprintln(w)
	fmt.Fprintln(w, emphasize("§ 4  全部探测明细"))
	fmt.Fprintln(w, colorize(sep, colorGray))

	columns := []columnSpec{
		{title: "状态", width: 10, align: alignLeft},
		{title: "名称", width: 16, align: alignLeft},
		{title: "协议", width: 8, align: alignLeft},
		{title: "耗时(ms)", width: 8, align: alignLeft},
		{title: "Code", width: 8, align: alignLeft},
		{title: "结果", width: 34, align: alignLeft},
	}

	fmt.Fprintf(w, "  %s%s %s%s  %s %s\n",
		renderCell(columns[0].title, columns[0], false, ""),
		renderCell(columns[1].title, columns[1], false, ""),
		renderCell(columns[2].title, columns[2], false, ""),
		renderCell(columns[3].title, columns[3], false, ""),
		renderCell(columns[4].title, columns[4], false, ""),
		renderCell(columns[5].title, columns[5], false, ""),
	)
	fmt.Fprintln(w, colorize("  "+strings.Repeat("·", 84), colorGray))

	for _, r := range results {
		status, statusColor := statusText(r.Success)
		statusCol := renderCell(status, columns[0], useColor, statusColor)
		nameCol := renderCell(r.Target.Name, columns[1], false, "")
		protoCol := renderCell(protocolText(r.Target.Protocol), columns[2], false, "")

		ms := float64(r.Duration.Milliseconds())
		durCol := renderCell(fmt.Sprintf("%d", r.Duration.Milliseconds()), columns[3], useColor, durationColor(ms, sum.p50, sum.p90))

		code := "-"
		if r.StatusCode > 0 {
			code = fmt.Sprintf("%d", r.StatusCode)
		}
		codeCol := renderCell(code, columns[4], false, "")

		result, resultColor := resultText(r)
		resultCol := renderCell(result, columns[5], useColor, resultColor)

		fmt.Fprintf(w, "  %s %s %s %s %s %s\n",
			statusCol,
			nameCol,
			protoCol,
			durCol,
			codeCol,
			resultCol,
		)
	}

	if len(sum.failed) > 0 {
		fmt.Fprintln(w)
		fmt.Fprintln(w, emphasize(colorize("§ 5  失败详情", colorRed)))
		fmt.Fprintln(w, colorize(sep, colorGray))

		for _, r := range sum.failed {
			name := pad(fitWidth(r.Target.Name, 28), 28, alignLeft)
			fmt.Fprintf(w, "  %s  → %s\n",
				colorize(name, colorRed),
				r.Error,
			)
		}
	}

	fmt.Fprintln(w)
	fmt.Fprintln(w, colorize(thickSep, colorCyan))
}

// printStatLine 打印统计信息行
// 参数：
//   w: 输出写入器
//   label: 统计项标签
//   value: 统计值（毫秒）
func printStatLine(w io.Writer, label string, value float64) {
	const (
		labelWidth = 12
		valueWidth = 10
	)
	fmt.Fprintf(w, "  %s  %s ms\n",
		pad(label, labelWidth, alignLeft),
		pad(formatMs(value), valueWidth, alignRight),
	)
}

// renderBar 渲染成功率进度条
// 参数：
//   pct: 百分比值（0-100）
//   width: 进度条宽度
//   useColor: 是否使用颜色
// 返回值：进度条字符串
func renderBar(pct float64, width int, useColor bool) string {
	filled := int(math.Round(pct / 100 * float64(width)))
	if filled > width {
		filled = width
	}
	bar := "[" + strings.Repeat("█", filled) + strings.Repeat("░", width-filled) + "]"

	if !useColor {
		return bar
	}

	col := colorGreen
	if pct < 80 {
		col = colorRed
	} else if pct < 95 {
		col = colorYellow
	}
	return colored(bar, col)
}

// renderDurationBarPlain 渲染无颜色的响应时间进度条
// 参数：
//   val: 实际值
//   max: 最大值（用于计算比例）
//   innerWidth: 进度条内部宽度
// 返回值：进度条字符串
func renderDurationBarPlain(val, max int64, innerWidth int) string {
	if innerWidth < 1 {
		innerWidth = 1
	}
	if max <= 0 {
		max = 1
	}

	filled := int(math.Round(float64(val) / float64(max) * float64(innerWidth)))
	if filled < 0 {
		filled = 0
	}
	if filled > innerWidth {
		filled = innerWidth
	}

	return "[" + strings.Repeat("▓", filled) + strings.Repeat("░", innerWidth-filled) + "]"
}

// printHistogram 打印响应时间直方图
// 参数：
//   w: 输出写入器
//   sorted: 已排序的响应时间切片
//   buckets: 分桶数量
//   useColor: 是否使用颜色
func printHistogram(w io.Writer, sorted []float64, buckets int, useColor bool) {
	if len(sorted) == 0 || buckets <= 0 {
		return
	}

	minV := sorted[0]
	maxV := sorted[len(sorted)-1]
	if minV == maxV {
		maxV = minV + 1
	}

	bucketW := (maxV - minV) / float64(buckets)
	counts := make([]int, buckets)

	for _, v := range sorted {
		idx := int((v - minV) / bucketW)
		if idx >= buckets {
			idx = buckets - 1
		}
		counts[idx]++
	}

	maxCount := 0
	for _, n := range counts {
		if n > maxCount {
			maxCount = n
		}
	}

	const barWidth = 28
	for i := 0; i < buckets; i++ {
		lo := minV + float64(i)*bucketW
		hi := lo + bucketW
		label := fmt.Sprintf("%6.0f ~%6.0f ms", lo, hi)

		filled := 0
		if maxCount > 0 {
			filled = int(float64(counts[i]) / float64(maxCount) * float64(barWidth))
		}

		bar := strings.Repeat("█", filled) + strings.Repeat("░", barWidth-filled)
		if useColor {
			bar = colored(bar, colorCyan)
		}

		fmt.Fprintf(w, "    %s  %s  %d\n", label, bar, counts[i])
	}
}

// mean 计算一组数值的平均值
// 参数：
//   vals: 数值切片
// 返回值：算术平均值
func mean(vals []float64) float64 {
	if len(vals) == 0 {
		return 0
	}
	sum := 0.0
	for _, v := range vals {
		sum += v
	}
	return sum / float64(len(vals))
}

// stdDev 计算一组数值的标准差
// 参数：
//   vals: 数值切片
//   avg: 平均值
// 返回值：标准差
func stdDev(vals []float64, avg float64) float64 {
	if len(vals) == 0 {
		return 0
	}
	sum := 0.0
	for _, v := range vals {
		diff := v - avg
		sum += diff * diff
	}
	return math.Sqrt(sum / float64(len(vals)))
}

// percentile 计算百分位数（基于已排序的数值切片）
// 参数：
//   sorted: 已排序的数值切片
//   p: 百分位（如 50 表示 P50）
// 返回值：对应百分位的数值
func percentile(sorted []float64, p float64) float64 {
	if len(sorted) == 0 {
		return 0
	}

	idx := p / 100 * float64(len(sorted)-1)
	lo := int(math.Floor(idx))
	hi := int(math.Ceil(idx))

	if lo == hi {
		return sorted[lo]
	}

	return sorted[lo]*(float64(hi)-idx) + sorted[hi]*(idx-float64(lo))
}

// formatMs 将毫秒数值格式化为字符串
// 参数：
//   ms: 毫秒数
// 返回值：格式化后的毫秒字符串（保留一位小数）
func formatMs(ms float64) string {
	return fmt.Sprintf("%.1f", ms)
}
