package app

import (
	"bytes"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strconv"
	"testing"

	"wte/server/internal/config"
)

func TestBackendFlow(t *testing.T) {
	t.Parallel()

	tmp := t.TempDir()
	cfg := config.Config{
		Port:      "0",
		DBPath:    filepath.Join(tmp, "test.db"),
		JWTSecret: "test-secret",
		AppEnv:    "test",
	}

	bootstrap, err := Build(cfg)
	if err != nil {
		t.Fatalf("build app: %v", err)
	}
	sqlDB, err := bootstrap.DB.DB()
	if err != nil {
		t.Fatalf("gorm db handle: %v", err)
	}
	defer sqlDB.Close()

	router := bootstrap.Router

	registerPayload := map[string]any{
		"username": "alice",
		"password": "secret123",
		"nickname": "Alice",
	}
	register := performJSON(t, router, http.MethodPost, "/api/auth/register", "", registerPayload)
	if register.Code != http.StatusCreated {
		t.Fatalf("register status = %d body=%s", register.Code, register.Body.String())
	}

	var registerResp struct {
		Data struct {
			Token string `json:"token"`
			User  struct {
				ID uint `json:"id"`
			} `json:"user"`
		} `json:"data"`
	}
	decodeJSON(t, register.Body.Bytes(), &registerResp)
	token := registerResp.Data.Token
	if token == "" {
		t.Fatal("expected token from register")
	}

	duplicate := performJSON(t, router, http.MethodPost, "/api/auth/register", "", registerPayload)
	if duplicate.Code != http.StatusConflict {
		t.Fatalf("duplicate register status = %d body=%s", duplicate.Code, duplicate.Body.String())
	}

	wrongLogin := performJSON(t, router, http.MethodPost, "/api/auth/login", "", map[string]any{
		"username": "alice",
		"password": "wrong-password",
	})
	if wrongLogin.Code != http.StatusUnauthorized {
		t.Fatalf("wrong login status = %d body=%s", wrongLogin.Code, wrongLogin.Body.String())
	}

	me := performJSON(t, router, http.MethodGet, "/api/auth/me", token, nil)
	if me.Code != http.StatusOK {
		t.Fatalf("me status = %d body=%s", me.Code, me.Body.String())
	}

	unauthorizedTopic := performJSON(t, router, http.MethodPost, "/api/topics", "", map[string]any{
		"name":        "技术",
		"description": "讨论技术",
	})
	if unauthorizedTopic.Code != http.StatusUnauthorized {
		t.Fatalf("unauthorized topic status = %d body=%s", unauthorizedTopic.Code, unauthorizedTopic.Body.String())
	}

	createTopic := performJSON(t, router, http.MethodPost, "/api/topics", token, map[string]any{
		"name":        "技术",
		"description": "讨论技术",
	})
	if createTopic.Code != http.StatusCreated {
		t.Fatalf("create topic status = %d body=%s", createTopic.Code, createTopic.Body.String())
	}

	var topicResp struct {
		Data struct {
			ID uint `json:"id"`
		} `json:"data"`
	}
	decodeJSON(t, createTopic.Body.Bytes(), &topicResp)

	topicList := performJSON(t, router, http.MethodGet, "/api/topics", "", nil)
	if topicList.Code != http.StatusOK {
		t.Fatalf("topic list status = %d body=%s", topicList.Code, topicList.Body.String())
	}

	missingTopicPost := performJSON(t, router, http.MethodPost, "/api/topics/9999/posts", token, map[string]any{
		"title":            "first post",
		"content_markdown": "hello",
	})
	if missingTopicPost.Code != http.StatusNotFound {
		t.Fatalf("missing topic post status = %d body=%s", missingTopicPost.Code, missingTopicPost.Body.String())
	}

	createPost := performJSON(t, router, http.MethodPost, "/api/topics/"+itoa(topicResp.Data.ID)+"/posts", token, map[string]any{
		"title":            "first post",
		"content_markdown": "# hello",
	})
	if createPost.Code != http.StatusCreated {
		t.Fatalf("create post status = %d body=%s", createPost.Code, createPost.Body.String())
	}

	var postResp struct {
		Data struct {
			ID uint `json:"id"`
		} `json:"data"`
	}
	decodeJSON(t, createPost.Body.Bytes(), &postResp)

	posts := performJSON(t, router, http.MethodGet, "/api/topics/"+itoa(topicResp.Data.ID)+"/posts?page=1&page_size=10", "", nil)
	if posts.Code != http.StatusOK {
		t.Fatalf("list posts status = %d body=%s", posts.Code, posts.Body.String())
	}

	postDetail := performJSON(t, router, http.MethodGet, "/api/posts/"+itoa(postResp.Data.ID), "", nil)
	if postDetail.Code != http.StatusOK {
		t.Fatalf("post detail status = %d body=%s", postDetail.Code, postDetail.Body.String())
	}

	hotPostsBeforeComments := performJSON(t, router, http.MethodGet, "/api/posts/hot?limit=5", "", nil)
	if hotPostsBeforeComments.Code != http.StatusOK {
		t.Fatalf("hot posts before comments status = %d body=%s", hotPostsBeforeComments.Code, hotPostsBeforeComments.Body.String())
	}

	createComment := performJSON(t, router, http.MethodPost, "/api/posts/"+itoa(postResp.Data.ID)+"/comments", token, map[string]any{
		"content": "top-level comment",
	})
	if createComment.Code != http.StatusCreated {
		t.Fatalf("create comment status = %d body=%s", createComment.Code, createComment.Body.String())
	}

	var commentResp struct {
		Data struct {
			ID uint `json:"id"`
		} `json:"data"`
	}
	decodeJSON(t, createComment.Body.Bytes(), &commentResp)

	reply := performJSON(t, router, http.MethodPost, "/api/posts/"+itoa(postResp.Data.ID)+"/comments", token, map[string]any{
		"parent_id": commentResp.Data.ID,
		"content":   "reply comment",
	})
	if reply.Code != http.StatusCreated {
		t.Fatalf("reply status = %d body=%s", reply.Code, reply.Body.String())
	}

	createTopic2 := performJSON(t, router, http.MethodPost, "/api/topics", token, map[string]any{
		"name":        "电影",
		"description": "讨论电影",
	})
	if createTopic2.Code != http.StatusCreated {
		t.Fatalf("create topic2 status = %d body=%s", createTopic2.Code, createTopic2.Body.String())
	}
	var topicResp2 struct {
		Data struct {
			ID uint `json:"id"`
		} `json:"data"`
	}
	decodeJSON(t, createTopic2.Body.Bytes(), &topicResp2)

	createPost2 := performJSON(t, router, http.MethodPost, "/api/topics/"+itoa(topicResp2.Data.ID)+"/posts", token, map[string]any{
		"title":            "other post",
		"content_markdown": "body",
	})
	if createPost2.Code != http.StatusCreated {
		t.Fatalf("create post2 status = %d body=%s", createPost2.Code, createPost2.Body.String())
	}
	var postResp2 struct {
		Data struct {
			ID uint `json:"id"`
		} `json:"data"`
	}
	decodeJSON(t, createPost2.Body.Bytes(), &postResp2)

	invalidReply := performJSON(t, router, http.MethodPost, "/api/posts/"+itoa(postResp2.Data.ID)+"/comments", token, map[string]any{
		"parent_id": commentResp.Data.ID,
		"content":   "should fail",
	})
	if invalidReply.Code != http.StatusBadRequest {
		t.Fatalf("invalid reply status = %d body=%s", invalidReply.Code, invalidReply.Body.String())
	}

	comments := performJSON(t, router, http.MethodGet, "/api/posts/"+itoa(postResp.Data.ID)+"/comments?page=1&page_size=10", "", nil)
	if comments.Code != http.StatusOK {
		t.Fatalf("comment list status = %d body=%s", comments.Code, comments.Body.String())
	}

	var commentListResp struct {
		Data []struct {
			ID      uint `json:"id"`
			Replies []struct {
				ID uint `json:"id"`
			} `json:"replies"`
		} `json:"data"`
	}
	decodeJSON(t, comments.Body.Bytes(), &commentListResp)
	if len(commentListResp.Data) != 1 || len(commentListResp.Data[0].Replies) != 1 {
		t.Fatalf("unexpected comment tree: %s", comments.Body.String())
	}

	hotPosts := performJSON(t, router, http.MethodGet, "/api/posts/hot?limit=5", "", nil)
	if hotPosts.Code != http.StatusOK {
		t.Fatalf("hot posts status = %d body=%s", hotPosts.Code, hotPosts.Body.String())
	}

	var hotPostsResp struct {
		Data []struct {
			ID           uint  `json:"id"`
			CommentCount int64 `json:"comment_count"`
		} `json:"data"`
	}
	decodeJSON(t, hotPosts.Body.Bytes(), &hotPostsResp)
	if len(hotPostsResp.Data) == 0 || hotPostsResp.Data[0].ID != postResp.Data.ID || hotPostsResp.Data[0].CommentCount != 2 {
		t.Fatalf("unexpected hot posts response: %s", hotPosts.Body.String())
	}
}

func performJSON(t *testing.T, handler http.Handler, method, path, token string, body any) *httptest.ResponseRecorder {
	t.Helper()

	var payload []byte
	var err error
	if body != nil {
		payload, err = json.Marshal(body)
		if err != nil {
			t.Fatalf("marshal body: %v", err)
		}
	}

	req := httptest.NewRequest(method, path, bytes.NewReader(payload))
	if body != nil {
		req.Header.Set("Content-Type", "application/json")
	}
	if token != "" {
		req.Header.Set("Authorization", "Bearer "+token)
	}

	recorder := httptest.NewRecorder()
	handler.ServeHTTP(recorder, req)
	return recorder
}

func decodeJSON(t *testing.T, raw []byte, target any) {
	t.Helper()
	if err := json.Unmarshal(raw, target); err != nil {
		t.Fatalf("decode json: %v body=%s", err, string(raw))
	}
}

func itoa(v uint) string {
	return strconv.FormatUint(uint64(v), 10)
}
