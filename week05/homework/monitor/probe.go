package main

import (
	"context"
	"fmt"
	"io"
	"net"
	"net/http"
	"strings"
	"sync"
	"time"
)

// Result 表示一次目标探测的结果
type Result struct {
	Target     Target
	Success    bool
	StatusCode int
	Body       string
	Duration   time.Duration
	Error      string
}

// ProbeAll 并发探测所有目标，并返回所有探测结果
// 参数：
//
//	targets: 待探测的目标列表
//	timeout: 每次探测的超时时间
//	verbose: 是否打印详细日志
//
// 返回值：包含所有目标探测结果的切片
func ProbeAll(targets []Target, timeout time.Duration, verbose bool) []Result {
	var (
		mu      sync.Mutex
		wg      sync.WaitGroup
		results []Result
	)

	for _, t := range targets {
		wg.Add(1)
		go func(target Target) {
			defer wg.Done()

			//人为加入
			time.Sleep(1 * time.Second)

			var res Result
			for attempt := 0; attempt <= target.RetryCount; attempt++ {
				res = probe(target, timeout)
				if res.Success {
					break
				}
				if attempt < target.RetryCount && verbose {
					fmt.Printf("[RETRY] %s (attempt %d/%d)\n",
						target.Name, attempt+1, target.RetryCount)
				}
			}

			mu.Lock()
			results = append(results, res)
			mu.Unlock()

			if verbose {
				status := "✅ OK"
				if !res.Success {
					status = "❌ FAIL"
				}
				fmt.Printf("[%s] %-30s  %s  %v\n",
					status, target.Name, target.Address,
					res.Duration.Round(time.Millisecond))
			}
		}(t)
	}

	wg.Wait()
	return results
}

// probe 对单个目标执行一次探测
// 参数：
//
//	t: 待探测的目标
//	timeout: 探测超时时间
//
// 返回值：该目标的探测结果
func probe(t Target, timeout time.Duration) Result {
	start := time.Now()
	res := Result{Target: t}

	switch strings.ToLower(t.Protocol) {
	case "http", "https", "":
		res = probeHTTP(t, timeout, start)
	case "tcp":
		res = probeTCP(t, timeout, start)
	default:
		res.Error = "unsupported protocol: " + t.Protocol
	}

	return res
}

// probeHTTP 执行 HTTP 或 HTTPS 探测，并根据期望条件判断结果
// 参数：
//
//	t: 待探测的 HTTP/HTTPS 目标
//	timeout: 请求超时时间
//	start: 探测开始时间
//
// 返回值：包含 HTTP 响应状态的探测结果
func probeHTTP(t Target, timeout time.Duration, start time.Time) Result {
	res := Result{Target: t}
	expect := strings.ToLower(t.Expect)

	ctx, cancel := context.WithTimeout(context.Background(), timeout)
	defer cancel()

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, t.Address, nil)
	if err != nil {
		res.Duration = time.Since(start)
		res.Error = err.Error()

		return res
	}

	//设置请求头，伪装成浏览器请求，防止网易拦截
	req.Header.Set("User-Agent", "Mozilla/5.0")

	client := &http.Client{}
	resp, err := client.Do(req)
	res.Duration = time.Since(start)

	if err != nil {
		if ctx.Err() == context.DeadlineExceeded ||
			strings.Contains(err.Error(), "deadline") ||
			strings.Contains(err.Error(), "timeout") {
			res.Error = "timeout"
			if expect == "timeout" {
				res.Success = true
			}
		} else {
			res.Error = err.Error()
			if expect == "fail" {
				res.Success = true
				res.Error = ""
			}
		}
		return res
	}
	defer resp.Body.Close()

	res.StatusCode = resp.StatusCode

	switch {
	case expect == "200":
		res.Success = resp.StatusCode == 200

	case expect == "timeout":
		if resp.StatusCode == 200 {
			res.Success = true
		} else {
			res.Success = false
			res.Error = "expected timeout or 200, but got status: " + fmt.Sprint(resp.StatusCode)
		}

	case strings.HasPrefix(expect, "contains:"):
		bodyBytes, err := io.ReadAll(resp.Body)
		if err != nil {
			res.Error = fmt.Sprintf("failed to read response body: %v", err)
			return res
		}
		res.Body = string(bodyBytes)
		keyword := t.Expect[len("contains:"):]
		res.Success = strings.Contains(res.Body, keyword)
		if !res.Success {
			res.Error = fmt.Sprintf("body does not contain %q", keyword)
		}

	case expect == "fail":
		res.Success = false
		res.Error = "expected failure but got response"

	default:
		res.Success = true
	}

	return res
}

// probeTCP 执行 TCP 探测，并根据期望条件判断结果
// 参数：
//
//	t: 待探测的 TCP 目标
//	timeout: 连接超时时间
//	start: 探测开始时间
func probeTCP(t Target, timeout time.Duration, start time.Time) Result {
	res := Result{Target: t}

	conn, err := net.DialTimeout("tcp", t.Address, timeout)
	res.Duration = time.Since(start)

	if err != nil {
		res.Error = err.Error()
		return res
	}

	conn.Close()

	res.Success = true
	return res
}
