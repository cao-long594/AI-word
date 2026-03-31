package main

import (
	"encoding/json"
	"os"
)

// Target 表示一个待探测的服务目标
type Target struct {
	Name       string `json:"name"`
	Address    string `json:"address"`
	Protocol   string `json:"protocol"`
	Expect     string `json:"expect"`
	RetryCount int    `json:"retry_count"`
}

// Config 表示监控程序的配置内容
type Config struct {
	Targets []Target `json:"targets"`
}

// LoadConfig 从指定路径读取并解析配置文件
// 参数：
//   path: 配置文件的路径
// 返回值：
//   *Config: 解析后的配置对象指针
//   error: 加载或解析过程中的错误信息
func LoadConfig(path string) (*Config, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, err
	}
	defer f.Close()

	var cfg Config
	if err := json.NewDecoder(f).Decode(&cfg); err != nil {
		return nil, err
	}
	return &cfg, nil
}
