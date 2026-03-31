package main

import (
	"net"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

// TestLoadConfig_Success 验证合法配置文件可以被正确加载。
// 测试场景：创建一个包含两个目标的合法 JSON 配置文件
// 预期结果：成功加载配置，目标数量为 2，第一个目标名称和重试次数正确
func TestLoadConfig_Success(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "config.json")

	content := `{
		"targets": [
			{
				"name": "test-http",
				"address": "http://example.com",
				"protocol": "http",
				"expect": "200",
				"retry_count": 2
			},
			{
				"name": "test-tcp",
				"address": "127.0.0.1:80",
				"protocol": "tcp",
				"expect": "connected"
			}
		]
	}`

	if err := os.WriteFile(path, []byte(content), 0644); err != nil {
		t.Fatalf("write temp config failed: %v", err)
	}

	cfg, err := LoadConfig(path)
	if err != nil {
		t.Fatalf("LoadConfig returned error: %v", err)
	}
	if cfg == nil {
		t.Fatal("LoadConfig returned nil config")
	}

	if len(cfg.Targets) != 2 {
		t.Fatalf("expected 2 targets, got %d", len(cfg.Targets))
	}

	if cfg.Targets[0].Name != "test-http" {
		t.Fatalf("unexpected first target name: %s", cfg.Targets[0].Name)
	}
	if cfg.Targets[0].RetryCount != 2 {
		t.Fatalf("unexpected retry_count: %d", cfg.Targets[0].RetryCount)
	}
}

// TestLoadConfig_InvalidJSON 验证非法 JSON 会返回错误。
// 测试场景：创建一个格式错误的 JSON 文件
// 预期结果：LoadConfig 返回错误
func TestLoadConfig_InvalidJSON(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "bad.json")

	if err := os.WriteFile(path, []byte(`{"targets":[`), 0644); err != nil {
		t.Fatalf("write bad json failed: %v", err)
	}

	_, err := LoadConfig(path)
	if err == nil {
		t.Fatal("expected error for invalid json, got nil")
	}
}

// TestProbeHTTP_Expect200_Success 验证期望 200 时的成功场景。
// 测试场景：创建返回 200 状态码的 HTTP 测试服务器
// 预期结果：探测成功，状态码为 200
func TestProbeHTTP_Expect200_Success(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}))
	defer s.Close()

	target := Target{
		Name:     "http-200",
		Address:  s.URL,
		Protocol: "http",
		Expect:   "200",
	}

	res := probeHTTP(target, 2*time.Second, time.Now())

	if !res.Success {
		t.Fatalf("expected success, got failure: %+v", res)
	}
	if res.StatusCode != 200 {
		t.Fatalf("expected status 200, got %d", res.StatusCode)
	}
}

// TestProbeHTTP_Contains_Success 验证响应体包含指定内容时返回成功。
// 测试场景：创建响应体包含"Go"字符串的 HTTP 测试服务器
// 预期结果：探测成功，响应体包含"Go"
func TestProbeHTTP_Contains_Success(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("hello Go probe"))
	}))
	defer s.Close()

	target := Target{
		Name:     "http-contains",
		Address:  s.URL,
		Protocol: "http",
		Expect:   "contains:Go",
	}

	res := probeHTTP(target, 2*time.Second, time.Now())

	if !res.Success {
		t.Fatalf("expected success, got failure: %+v", res)
	}
	if !strings.Contains(res.Body, "Go") {
		t.Fatalf("expected body to contain Go, got body=%q", res.Body)
	}
}

// TestProbeHTTP_Contains_Fail 验证响应体不包含指定内容时返回失败。
// 测试场景：创建响应体不包含"Go"字符串的 HTTP 测试服务器
// 预期结果：探测失败，错误信息提示未包含指定内容
func TestProbeHTTP_Contains_Fail(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("hello world"))
	}))
	defer s.Close()

	target := Target{
		Name:     "http-contains-fail",
		Address:  s.URL,
		Protocol: "http",
		Expect:   "contains:Go",
	}

	res := probeHTTP(target, 2*time.Second, time.Now())

	if res.Success {
		t.Fatalf("expected failure, got success: %+v", res)
	}
	if !strings.Contains(res.Error, `body does not contain "Go"`) {
		t.Fatalf("unexpected error: %q", res.Error)
	}
}

// TestProbeHTTP_ExpectFail_NetworkErrorShouldPass 验证期望失败且请求失败时判定为成功。
// 测试场景：expect="fail"，目标地址为不可连接的端口
// 预期结果：探测成功（因为期望失败且实际失败），错误信息为空
func TestProbeHTTP_ExpectFail_NetworkErrorShouldPass(t *testing.T) {
	target := Target{
		Name:     "http-fail",
		Address:  "http://127.0.0.1:1",
		Protocol: "http",
		Expect:   "fail",
	}

	res := probeHTTP(target, 1*time.Second, time.Now())

	if !res.Success {
		t.Fatalf("expected success when expect=fail and request fails, got: %+v", res)
	}
	if res.Error != "" {
		t.Fatalf("expected empty error when expect=fail matched, got: %q", res.Error)
	}
}

// TestProbeHTTP_ExpectFail_ButGotResponse 验证期望失败但收到响应时判定为失败。
// 测试场景：expect="fail"，但目标返回正常响应
// 预期结果：探测失败，错误信息提示期望失败但收到了响应
func TestProbeHTTP_ExpectFail_ButGotResponse(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}))
	defer s.Close()

	target := Target{
		Name:     "http-fail-response",
		Address:  s.URL,
		Protocol: "http",
		Expect:   "fail",
	}

	res := probeHTTP(target, 2*time.Second, time.Now())

	if res.Success {
		t.Fatalf("expected failure, got success: %+v", res)
	}
	if !strings.Contains(res.Error, "expected failure but got response") {
		t.Fatalf("unexpected error: %q", res.Error)
	}
}

// TestProbeHTTP_ExpectTimeout_ActualTimeout 验证实际超时且期望超时时判定为成功。
// 测试场景：expect="timeout"，服务器响应时间超过设置的超时时间
// 预期结果：探测成功，错误信息为"timeout"
func TestProbeHTTP_ExpectTimeout_ActualTimeout(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(150 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("slow"))
	}))
	defer s.Close()

	target := Target{
		Name:     "http-timeout",
		Address:  s.URL,
		Protocol: "http",
		Expect:   "timeout",
	}

	res := probeHTTP(target, 50*time.Millisecond, time.Now())

	if !res.Success {
		t.Fatalf("expected success for timeout match, got: %+v", res)
	}
	if res.Error != "timeout" {
		t.Fatalf("expected timeout error, got: %q", res.Error)
	}
}

// TestProbeHTTP_ExpectTimeout_ButGot200AlsoPasses 验证当前实现下 expect=timeout 且返回 200 也判定成功。
// 测试场景：expect="timeout"，但服务器快速返回 200 状态码
// 预期结果：探测成功，状态码为 200
func TestProbeHTTP_ExpectTimeout_ButGot200AlsoPasses(t *testing.T) {
	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("fast"))
	}))
	defer s.Close()

	target := Target{
		Name:     "http-timeout-200",
		Address:  s.URL,
		Protocol: "http",
		Expect:   "timeout",
	}

	res := probeHTTP(target, 1*time.Second, time.Now())

	if !res.Success {
		t.Fatalf("expected success by current implementation, got: %+v", res)
	}
	if res.StatusCode != 200 {
		t.Fatalf("expected status 200, got %d", res.StatusCode)
	}
}

// TestProbeTCP_Connected_Success 验证 TCP 连接成功时返回成功。
// 测试场景：expect="connected"，监听一个本地端口并接受连接
// 预期结果：探测成功
func TestProbeTCP_Connected_Success(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen tcp failed: %v", err)
	}
	defer ln.Close()

	go func() {
		conn, err := ln.Accept()
		if err == nil {
			_ = conn.Close()
		}
	}()

	target := Target{
		Name:     "tcp-connected",
		Address:  ln.Addr().String(),
		Protocol: "tcp",
		Expect:   "connected",
	}

	res := probeTCP(target, 1*time.Second, time.Now())

	if !res.Success {
		t.Fatalf("expected success, got: %+v", res)
	}
}

// TestProbeTCP_ExpectFail_WhenPortClosed 验证期望失败且端口关闭时判定为成功。
// 测试场景：expect="fail"，目标为不可达的端口
// 预期结果：探测成功（因为期望失败且实际失败），错误信息为空
func TestProbeTCP_ExpectFail_WhenPortClosed(t *testing.T) {
	target := Target{
		Name:     "tcp-fail",
		Address:  "127.0.0.1:1",
		Protocol: "tcp",
		Expect:   "fail",
	}

	res := probeTCP(target, 200*time.Millisecond, time.Now())

	if !res.Success {
		t.Fatalf("expected success when expect=fail and dial fails, got: %+v", res)
	}
	if res.Error != "" {
		t.Fatalf("expected empty error, got: %q", res.Error)
	}
}

// TestProbeTCP_ExpectFail_ButConnected 验证期望失败但连接成功时判定为失败。
// 测试场景：expect="fail"，但 TCP 连接成功建立
// 预期结果：探测失败，错误信息提示期望失败但建立了连接
func TestProbeTCP_ExpectFail_ButConnected(t *testing.T) {
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen tcp failed: %v", err)
	}
	defer ln.Close()

	go func() {
		conn, err := ln.Accept()
		if err == nil {
			_ = conn.Close()
		}
	}()

	target := Target{
		Name:     "tcp-fail-but-connected",
		Address:  ln.Addr().String(),
		Protocol: "tcp",
		Expect:   "fail",
	}

	res := probeTCP(target, 1*time.Second, time.Now())

	if res.Success {
		t.Fatalf("expected failure, got success: %+v", res)
	}
	if !strings.Contains(res.Error, "expected failure but got connection") {
		t.Fatalf("unexpected error: %q", res.Error)
	}
}

// TestProbe_UnsupportedProtocol 验证不支持的协议会返回失败。
// 测试场景：protocol="udp"（不支持的协议）
// 预期结果：探测失败，错误信息提示不支持的协议
func TestProbe_UnsupportedProtocol(t *testing.T) {
	target := Target{
		Name:     "bad-protocol",
		Address:  "example",
		Protocol: "udp",
		Expect:   "",
	}

	res := probe(target, 1*time.Second)

	if res.Success {
		t.Fatalf("expected failure for unsupported protocol, got success: %+v", res)
	}
	if !strings.Contains(res.Error, "unsupported protocol") {
		t.Fatalf("unexpected error: %q", res.Error)
	}
}

// TestProbeAll_ReturnsAllResults 验证并发探测会返回所有目标的结果。
// 测试场景：同时探测 HTTP 和 TCP 两个目标
// 预期结果：返回 2 个结果，且都探测成功
func TestProbeAll_ReturnsAllResults(t *testing.T) {
	httpSrv := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}))
	defer httpSrv.Close()

	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("listen tcp failed: %v", err)
	}
	defer ln.Close()

	go func() {
		for {
			conn, err := ln.Accept()
			if err != nil {
				return
			}
			_ = conn.Close()
		}
	}()

	targets := []Target{
		{
			Name:     "http-ok",
			Address:  httpSrv.URL,
			Protocol: "http",
			Expect:   "200",
		},
		{
			Name:     "tcp-ok",
			Address:  ln.Addr().String(),
			Protocol: "tcp",
			Expect:   "connected",
		},
	}

	results := ProbeAll(targets, 1*time.Second, false)

	if len(results) != len(targets) {
		t.Fatalf("expected %d results, got %d", len(targets), len(results))
	}

	got := map[string]Result{}
	for _, r := range results {
		got[r.Target.Name] = r
	}

	if !got["http-ok"].Success {
		t.Fatalf("http-ok should succeed, got: %+v", got["http-ok"])
	}
	if !got["tcp-ok"].Success {
		t.Fatalf("tcp-ok should succeed, got: %+v", got["tcp-ok"])
	}
}

// TestProbeAll_RetryEventuallySucceeds 验证失败重试后最终成功的场景。
// 测试场景：前 2 次请求返回 500 错误，第 3 次返回 200
// 预期结果：重试后最终成功，总尝试次数为 3 次
func TestProbeAll_RetryEventuallySucceeds(t *testing.T) {
	var attempts int

	s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		attempts++
		if attempts < 3 {
			w.WriteHeader(http.StatusInternalServerError)
			_, _ = w.Write([]byte("retry"))
			return
		}
		w.WriteHeader(http.StatusOK)
		_, _ = w.Write([]byte("ok"))
	}))
	defer s.Close()

	targets := []Target{
		{
			Name:       "retry-http",
			Address:    s.URL,
			Protocol:   "http",
			Expect:     "200",
			RetryCount: 2,
		},
	}

	results := ProbeAll(targets, 1*time.Second, false)
	if len(results) != 1 {
		t.Fatalf("expected 1 result, got %d", len(results))
	}

	if !results[0].Success {
		t.Fatalf("expected retry to succeed eventually, got: %+v", results[0])
	}
	if attempts != 3 {
		t.Fatalf("expected 3 attempts, got %d", attempts)
	}
}
