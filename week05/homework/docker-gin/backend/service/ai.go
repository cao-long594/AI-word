package service

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"

	"backend/config"
	"backend/model"
)

type AIService struct {
	Config config.Config
}

type chatMessage struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatReq struct {
	Model    string        `json:"model"`
	Messages []chatMessage `json:"messages"`
	Stream   bool          `json:"stream"`
}

type chatResp struct {
	Choices []struct {
		Message struct {
			Content string `json:"content"`
		} `json:"message"`
	} `json:"choices"`
}

func (s *AIService) QueryWord(word string, provider string) (*model.AIWordResult, error) {
	apiKey, baseURL, modelName, err := s.getProviderConfig(provider)
	if err != nil {
		return nil, err
	}

	if apiKey == "" {
		return nil, errors.New("AI API key is empty")
	}

	prompt := fmt.Sprintf(`
你是一个英语单词助手。请解释单词：%s。

要求：
1. 返回中文释义
2. 返回 3 条英文例句
3. 只能返回 JSON，不要 Markdown，不要代码块

JSON 格式如下：
{
  "word": "%s",
  "meaning": "中文释义",
  "examples": ["例句1", "例句2", "例句3"]
}
`, word, word)

	reqBody := chatReq{
		Model:  modelName,
		Stream: false,
		Messages: []chatMessage{
			{
				Role:    "system",
				Content: "你是一个专业英语学习助手，只输出 JSON。",
			},
			{
				Role:    "user",
				Content: prompt,
			},
		},
	}

	bodyBytes, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	httpReq, err := http.NewRequest("POST", baseURL, bytes.NewBuffer(bodyBytes))
	if err != nil {
		return nil, err
	}

	httpReq.Header.Set("Content-Type", "application/json")
	httpReq.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{
		Timeout: 30 * time.Second,
	}

	httpResp, err := client.Do(httpReq)
	if err != nil {
		return nil, err
	}
	defer httpResp.Body.Close()

	respBytes, err := io.ReadAll(httpResp.Body)
	if err != nil {
		return nil, err
	}

	if httpResp.StatusCode < 200 || httpResp.StatusCode >= 300 {
		return nil, fmt.Errorf("AI request failed, status=%d, body=%s", httpResp.StatusCode, string(respBytes))
	}

	var aiResp chatResp
	if err := json.Unmarshal(respBytes, &aiResp); err != nil {
		return nil, err
	}

	if len(aiResp.Choices) == 0 {
		return nil, errors.New("AI response choices is empty")
	}

	content := aiResp.Choices[0].Message.Content
	content = extractJSON(content)

	var result model.AIWordResult
	if err := json.Unmarshal([]byte(content), &result); err != nil {
		return nil, fmt.Errorf("parse AI JSON failed: %w, content=%s", err, content)
	}

	if result.Word == "" {
		result.Word = word
	}

	return &result, nil
}

func (s *AIService) getProviderConfig(provider string) (apiKey, baseURL, modelName string, err error) {
	switch strings.ToLower(provider) {
	case "deepseek":
		return s.Config.DeepSeekAPIKey, s.Config.DeepSeekBaseURL, s.Config.DeepSeekModel, nil
	case "qwen":
		return s.Config.QwenAPIKey, s.Config.QwenBaseURL, s.Config.QwenModel, nil
	default:
		return "", "", "", errors.New("unsupported ai_provider, only support deepseek or qwen")
	}
}

func extractJSON(content string) string {
	content = strings.TrimSpace(content)

	start := strings.Index(content, "{")
	end := strings.LastIndex(content, "}")

	if start >= 0 && end >= start {
		return content[start : end+1]
	}

	return content
}
