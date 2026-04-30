package model

import "time"

type User struct {
	ID           uint      `gorm:"primaryKey"`
	Username     string    `gorm:"size:64;not null;uniqueIndex"`
	PasswordHash string    `gorm:"size:255;not null"`
	Nickname     string    `gorm:"size:64;not null"`
	AvatarURL    *string   `gorm:"size:255"`
	CreatedAt    time.Time `gorm:"not null"`
	UpdatedAt    time.Time `gorm:"not null"`
}

type Topic struct {
	ID          uint      `gorm:"primaryKey"`
	Name        string    `gorm:"size:64;not null;uniqueIndex"`
	Description string    `gorm:"size:255;not null"`
	CreatedBy   uint      `gorm:"not null;index"`
	Creator     User      `gorm:"foreignKey:CreatedBy"`
	CreatedAt   time.Time `gorm:"not null"`
	UpdatedAt   time.Time `gorm:"not null"`
}

type Post struct {
	ID              uint      `gorm:"primaryKey"`
	TopicID         uint      `gorm:"not null;index"`
	Topic           Topic     `gorm:"foreignKey:TopicID"`
	AuthorID        uint      `gorm:"not null;index"`
	Author          User      `gorm:"foreignKey:AuthorID"`
	Title           string    `gorm:"size:200;not null"`
	ContentMarkdown string    `gorm:"type:text;not null"`
	CommentCount    int64     `gorm:"not null;default:0"`
	CreatedAt       time.Time `gorm:"not null"`
	UpdatedAt       time.Time `gorm:"not null"`
}

type Comment struct {
	ID        uint      `gorm:"primaryKey"`
	PostID    uint      `gorm:"not null;index"`
	Post      Post      `gorm:"foreignKey:PostID"`
	AuthorID  uint      `gorm:"not null;index"`
	Author    User      `gorm:"foreignKey:AuthorID"`
	ParentID  *uint     `gorm:"index"`
	Content   string    `gorm:"type:text;not null"`
	CreatedAt time.Time `gorm:"not null"`
	UpdatedAt time.Time `gorm:"not null"`
}
