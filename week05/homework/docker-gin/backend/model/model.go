package model

import (
	"database/sql/driver"
	"encoding/json"
	"fmt"
	"time"
	"gorm.io/gorm"
)

type StringSlice []string

func (s StringSlice) Value() (driver.Value, error) {
	if s == nil {
		return "[]", nil
	}

	data, err := json.Marshal(s)
	if err != nil {
		return nil, err
	}

	return string(data), nil
}

func (s *StringSlice) Scan(value any) error {
	if value == nil {
		*s = StringSlice{}
		return nil
	}

	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, s)
	case string:
		return json.Unmarshal([]byte(v), s)
	default:
		return fmt.Errorf("unsupported examples type: %T", value)
	}
}

type User struct {
	ID           int64     `json:"id" gorm:"primaryKey;autoIncrement"`
	Username     string    `json:"username" gorm:"size:64;not null;uniqueIndex"`
	PasswordHash string    `json:"-" gorm:"column:password_hash;size:255;not null"`
	CreatedAt    time.Time `json:"created_at" gorm:"column:created_at;autoCreateTime"`
	Words        []Word    `json:"-" gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE"`
}

func (User) TableName() string {
	return "users"
}


type Word struct {
	ID         int64          `json:"id" gorm:"primaryKey;autoIncrement"`
	UserID     int64          `json:"user_id" gorm:"column:user_id;not null;uniqueIndex:uk_user_word;index:idx_user_created_at"`
	Word       string         `json:"word" gorm:"size:100;not null;uniqueIndex:uk_user_word"`
	Meaning    string         `json:"meaning" gorm:"type:text;not null"`
	Examples   StringSlice    `json:"examples" gorm:"type:json;not null"`
	AIProvider string         `json:"ai_provider" gorm:"column:ai_provider;size:30;not null"`
	CreatedAt  time.Time      `json:"created_at" gorm:"column:created_at;autoCreateTime;index:idx_user_created_at"`
	UpdatedAt  time.Time      `json:"updated_at" gorm:"column:updated_at;autoUpdateTime"`
	DeletedAt  gorm.DeletedAt `json:"-" gorm:"column:deleted_at;index"`
}

func (Word) TableName() string {
	return "words"
}

type AIWordResult struct {
	Word     string   `json:"word"`
	Meaning  string   `json:"meaning"`
	Examples []string `json:"examples"`
}
