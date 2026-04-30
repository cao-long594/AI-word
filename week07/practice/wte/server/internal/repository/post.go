package repository

import (
	"strings"

	"gorm.io/gorm"

	"wte/server/internal/model"
)

type PostRepository struct {
	db *gorm.DB
}

func NewPostRepository(db *gorm.DB) *PostRepository {
	return &PostRepository{db: db}
}

func (r *PostRepository) Create(post *model.Post) error {
	return r.db.Create(post).Error
}

func (r *PostRepository) GetByID(id uint) (*model.Post, error) {
	var post model.Post
	err := r.db.Preload("Author").Preload("Topic").First(&post, id).Error
	if err != nil {
		return nil, err
	}
	return &post, nil
}

func (r *PostRepository) ListByTopic(topicID uint, searchTerm string, limit, offset int) ([]model.Post, int64, error) {
	var posts []model.Post
	var total int64

	base := r.db.Model(&model.Post{}).Where("topic_id = ?", topicID)
	base = applyPostSearch(base, searchTerm)
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	query := r.db.Where("topic_id = ?", topicID)
	query = applyPostSearch(query, searchTerm)
	err := query.
		Preload("Author").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&posts).Error

	return posts, total, err
}

func (r *PostRepository) Search(searchTerm string, limit, offset int) ([]model.Post, int64, error) {
	var posts []model.Post
	var total int64

	base := applyPostSearch(r.db.Model(&model.Post{}), searchTerm)
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := applyPostSearch(r.db.Model(&model.Post{}), searchTerm).
		Preload("Author").
		Order("created_at DESC").
		Limit(limit).
		Offset(offset).
		Find(&posts).Error

	return posts, total, err
}

func (r *PostRepository) ListHot(limit int) ([]model.Post, error) {
	var posts []model.Post

	err := r.db.
		Preload("Author").
		Order("comment_count DESC").
		Order("created_at DESC").
		Limit(limit).
		Find(&posts).Error

	return posts, err
}

func (r *PostRepository) IncrementCommentCount(tx *gorm.DB, postID uint) error {
	return tx.Model(&model.Post{}).
		Where("id = ?", postID).
		UpdateColumn("comment_count", gorm.Expr("comment_count + 1")).Error
}

func applyPostSearch(db *gorm.DB, searchTerm string) *gorm.DB {
	searchTerm = strings.TrimSpace(searchTerm)
	if searchTerm == "" {
		return db
	}

	pattern := "%" + searchTerm + "%"
	return db.Where("title LIKE ? OR content_markdown LIKE ?", pattern, pattern)
}
