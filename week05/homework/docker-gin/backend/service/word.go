package service

import (
	"errors"
	"strings"

	"backend/database"
	"backend/model"

	"gorm.io/gorm"
)

var ErrWordNotFound = errors.New("word not found")

type QueryWordResult struct {
	Source string
	Saved  bool
	Word   any
}

type ListWordsResult struct {
	List     []model.Word
	Total    int64
	Page     int
	PageSize int
}

type WordService struct {
	AIService *AIService
}

func (s *WordService) FindWordByUser(userID int64, word string) (*model.Word, bool, error) {
	var item model.Word
	err := database.DB.Where("user_id = ? AND word = ?", userID, strings.ToLower(word)).First(&item).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, false, nil
	}
	if err != nil {
		return nil, false, err
	}

	return &item, true, nil
}

func (s *WordService) QueryWord(userID int64, word, aiProvider string) (*QueryWordResult, error) {
	dbWord, found, err := s.FindWordByUser(userID, word)
	if err != nil {
		return nil, err
	}

	if found {
		return &QueryWordResult{
			Source: "db",
			Saved:  true,
			Word:   dbWord,
		}, nil
	}

	aiResult, err := s.AIService.QueryWord(word, aiProvider)
	if err != nil {
		return nil, err
	}

	return &QueryWordResult{
		Source: "ai",
		Saved:  false,
		Word: map[string]any{
			"word":        aiResult.Word,
			"meaning":     aiResult.Meaning,
			"examples":    aiResult.Examples,
			"ai_provider": aiProvider,
		},
	}, nil
}

func (s *WordService) SaveWord(userID int64, word, meaning string, examples []string, aiProvider string) error {
	var item model.Word

	err := database.DB.Unscoped().
		Where("user_id = ? AND word = ?", userID, word).
		First(&item).Error

	if err == nil {
		item.Meaning = meaning
		item.Examples = model.StringSlice(examples)
		item.AIProvider = aiProvider
		item.DeletedAt = gorm.DeletedAt{}

		return database.DB.Unscoped().
			Model(&item).
			Updates(map[string]any{
				"meaning":     item.Meaning,
				"examples":    item.Examples,
				"ai_provider": item.AIProvider,
				"deleted_at":  nil,
			}).Error
	}

	if !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}

	item = model.Word{
		UserID:     userID,
		Word:       word,
		Meaning:    meaning,
		Examples:   model.StringSlice(examples),
		AIProvider: aiProvider,
	}

	return database.DB.Create(&item).Error
}


func (s *WordService) ListWords(userID int64, page, pageSize int) (*ListWordsResult, error) {
	offset := (page - 1) * pageSize

	var total int64
	if err := database.DB.Model(&model.Word{}).
		Where("user_id = ?", userID).
		Count(&total).Error; err != nil {
		return nil, err
	}

	list := make([]model.Word, 0)
	if err := database.DB.
		Where("user_id = ?", userID).
		Order("created_at DESC").
		Limit(pageSize).
		Offset(offset).
		Find(&list).Error; err != nil {
		return nil, err
	}

	return &ListWordsResult{
		List:     list,
		Total:    total,
		Page:     page,
		PageSize: pageSize,
	}, nil
}

func (s *WordService) DeleteWord(userID, id int64) error {
	result := database.DB.Where("id = ? AND user_id = ?", id, userID).Delete(&model.Word{})
	if result.Error != nil {
		return result.Error
	}

	if result.RowsAffected == 0 {
		return ErrWordNotFound
	}

	return nil
}
