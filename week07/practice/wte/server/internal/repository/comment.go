package repository

import (
	"gorm.io/gorm"

	"wte/server/internal/model"
)

type CommentRepository struct {
	db *gorm.DB
}

func NewCommentRepository(db *gorm.DB) *CommentRepository {
	return &CommentRepository{db: db}
}

func (r *CommentRepository) Create(tx *gorm.DB, comment *model.Comment) error {
	return tx.Create(comment).Error
}

func (r *CommentRepository) GetByID(id uint) (*model.Comment, error) {
	var comment model.Comment
	err := r.db.Preload("Author").First(&comment, id).Error
	if err != nil {
		return nil, err
	}
	return &comment, nil
}

func (r *CommentRepository) ListTopLevelByPost(postID uint, limit, offset int) ([]model.Comment, int64, error) {
	var comments []model.Comment
	var total int64

	base := r.db.Model(&model.Comment{}).Where("post_id = ? AND parent_id IS NULL", postID)
	if err := base.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	err := r.db.Where("post_id = ? AND parent_id IS NULL", postID).
		Preload("Author").
		Order("created_at ASC").
		Limit(limit).
		Offset(offset).
		Find(&comments).Error

	return comments, total, err
}

func (r *CommentRepository) ListRepliesByParentIDs(parentIDs []uint) ([]model.Comment, error) {
	if len(parentIDs) == 0 {
		return []model.Comment{}, nil
	}

	var comments []model.Comment
	err := r.db.Where("parent_id IN ?", parentIDs).
		Preload("Author").
		Order("created_at ASC").
		Find(&comments).Error

	return comments, err
}

func (r *CommentRepository) ListByPost(postID uint) ([]model.Comment, error) {
	var comments []model.Comment
	err := r.db.Where("post_id = ?", postID).
		Preload("Author").
		Order("created_at ASC").
		Find(&comments).Error

	return comments, err
}
