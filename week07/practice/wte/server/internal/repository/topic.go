package repository

import (
	"gorm.io/gorm"

	"wte/server/internal/model"
)

type TopicWithPostCount struct {
	model.Topic
	PostCount int64 `gorm:"column:post_count"`
}

type TopicRepository struct {
	db *gorm.DB
}

func NewTopicRepository(db *gorm.DB) *TopicRepository {
	return &TopicRepository{db: db}
}

func (r *TopicRepository) Create(topic *model.Topic) error {
	return r.db.Create(topic).Error
}

func (r *TopicRepository) GetByID(id uint) (*model.Topic, error) {
	var topic model.Topic
	err := r.db.Preload("Creator").First(&topic, id).Error
	if err != nil {
		return nil, err
	}
	return &topic, nil
}

func (r *TopicRepository) ExistsByName(name string) (bool, error) {
	var count int64
	if err := r.db.Model(&model.Topic{}).Where("name = ?", name).Count(&count).Error; err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *TopicRepository) ListWithPostCount() ([]TopicWithPostCount, error) {
	var topics []model.Topic
	if err := r.db.Preload("Creator").Order("created_at DESC").Find(&topics).Error; err != nil {
		return nil, err
	}

	type countRow struct {
		TopicID   uint
		PostCount int64
	}
	var counts []countRow
	if err := r.db.Model(&model.Post{}).
		Select("topic_id, COUNT(id) AS post_count").
		Group("topic_id").
		Scan(&counts).Error; err != nil {
		return nil, err
	}

	countMap := make(map[uint]int64, len(counts))
	for _, row := range counts {
		countMap[row.TopicID] = row.PostCount
	}

	result := make([]TopicWithPostCount, 0, len(topics))
	for _, topic := range topics {
		result = append(result, TopicWithPostCount{
			Topic:     topic,
			PostCount: countMap[topic.ID],
		})
	}

	return result, nil
}
