package service

import (
	"strings"

	"wte/server/internal/model"
	"wte/server/internal/repository"
)

type PostService struct {
	posts  *repository.PostRepository
	topics *repository.TopicRepository
}

func NewPostService(posts *repository.PostRepository, topics *repository.TopicRepository) *PostService {
	return &PostService{posts: posts, topics: topics}
}

func (s *PostService) Create(topicID, authorID uint, title, contentMarkdown string) (*model.Post, error) {
	title = strings.TrimSpace(title)
	contentMarkdown = strings.TrimSpace(contentMarkdown)

	if title == "" || contentMarkdown == "" {
		return nil, NewBadRequest("invalid_input", "title and content_markdown are required")
	}

	if _, err := s.topics.GetByID(topicID); err != nil {
		if repository.IsNotFound(err) {
			return nil, NewNotFound("topic_not_found", "topic not found")
		}
		return nil, NewInternal(err)
	}

	post := &model.Post{
		TopicID:         topicID,
		AuthorID:        authorID,
		Title:           title,
		ContentMarkdown: contentMarkdown,
	}
	if err := s.posts.Create(post); err != nil {
		return nil, NewInternal(err)
	}

	created, err := s.posts.GetByID(post.ID)
	if err != nil {
		return nil, NewInternal(err)
	}
	return created, nil
}

func (s *PostService) ListByTopic(topicID uint, page, pageSize int) ([]model.Post, int64, error) {
	return s.ListByTopicWithSearch(topicID, "", page, pageSize)
}

func (s *PostService) ListByTopicWithSearch(topicID uint, searchTerm string, page, pageSize int) ([]model.Post, int64, error) {
	if _, err := s.topics.GetByID(topicID); err != nil {
		if repository.IsNotFound(err) {
			return nil, 0, NewNotFound("topic_not_found", "topic not found")
		}
		return nil, 0, NewInternal(err)
	}

	posts, total, err := s.posts.ListByTopic(topicID, searchTerm, pageSize, offset(page, pageSize))
	if err != nil {
		return nil, 0, NewInternal(err)
	}
	return posts, total, nil
}

func (s *PostService) Search(searchTerm string, page, pageSize int) ([]model.Post, int64, error) {
	searchTerm = strings.TrimSpace(searchTerm)
	if searchTerm == "" {
		return nil, 0, NewBadRequest("invalid_query", "search query is required")
	}

	posts, total, err := s.posts.Search(searchTerm, pageSize, offset(page, pageSize))
	if err != nil {
		return nil, 0, NewInternal(err)
	}
	return posts, total, nil
}

func (s *PostService) ListHot(limit int) ([]model.Post, error) {
	if limit <= 0 {
		limit = 5
	}
	if limit > 20 {
		limit = 20
	}

	posts, err := s.posts.ListHot(limit)
	if err != nil {
		return nil, NewInternal(err)
	}
	return posts, nil
}

func (s *PostService) GetByID(postID uint) (*model.Post, error) {
	post, err := s.posts.GetByID(postID)
	if err != nil {
		if repository.IsNotFound(err) {
			return nil, NewNotFound("post_not_found", "post not found")
		}
		return nil, NewInternal(err)
	}
	return post, nil
}
