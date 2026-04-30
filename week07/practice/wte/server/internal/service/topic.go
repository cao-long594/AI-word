package service

import (
	"strings"

	"wte/server/internal/model"
	"wte/server/internal/repository"
)

type TopicService struct {
	topics *repository.TopicRepository
}

func NewTopicService(topics *repository.TopicRepository) *TopicService {
	return &TopicService{topics: topics}
}

func (s *TopicService) Create(name, description string, creatorID uint) (*model.Topic, error) {
	name = strings.TrimSpace(name)
	description = strings.TrimSpace(description)

	if name == "" || description == "" {
		return nil, NewBadRequest("invalid_input", "name and description are required")
	}

	exists, err := s.topics.ExistsByName(name)
	if err != nil {
		return nil, NewInternal(err)
	}
	if exists {
		return nil, NewConflict("topic_name_taken", "topic name already exists")
	}

	topic := &model.Topic{
		Name:        name,
		Description: description,
		CreatedBy:   creatorID,
	}
	if err := s.topics.Create(topic); err != nil {
		if IsUniqueConstraintError(err) {
			return nil, NewConflict("topic_name_taken", "topic name already exists")
		}
		return nil, NewInternal(err)
	}

	created, err := s.topics.GetByID(topic.ID)
	if err != nil {
		return nil, NewInternal(err)
	}
	return created, nil
}

func (s *TopicService) List() ([]repository.TopicWithPostCount, error) {
	topics, err := s.topics.ListWithPostCount()
	if err != nil {
		return nil, NewInternal(err)
	}
	return topics, nil
}
