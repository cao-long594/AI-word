package service

import (
	"strings"

	"gorm.io/gorm"

	"wte/server/internal/model"
	"wte/server/internal/repository"
)

type CommentNode struct {
	Comment model.Comment
	Replies []CommentNode
}

type CommentService struct {
	db       *gorm.DB
	comments *repository.CommentRepository
	posts    *repository.PostRepository
}

func NewCommentService(db *gorm.DB, comments *repository.CommentRepository, posts *repository.PostRepository) *CommentService {
	return &CommentService{
		db:       db,
		comments: comments,
		posts:    posts,
	}
}

func (s *CommentService) Create(postID, authorID uint, parentID *uint, content string) (*model.Comment, error) {
	content = strings.TrimSpace(content)
	if content == "" {
		return nil, NewBadRequest("invalid_input", "content is required")
	}

	if _, err := s.posts.GetByID(postID); err != nil {
		if repository.IsNotFound(err) {
			return nil, NewNotFound("post_not_found", "post not found")
		}
		return nil, NewInternal(err)
	}

	if parentID != nil {
		parent, err := s.comments.GetByID(*parentID)
		if err != nil {
			if repository.IsNotFound(err) {
				return nil, NewNotFound("parent_comment_not_found", "parent comment not found")
			}
			return nil, NewInternal(err)
		}
		if parent.PostID != postID {
			return nil, NewBadRequest("invalid_parent_comment", "parent comment does not belong to the same post")
		}
	}

	comment := &model.Comment{
		PostID:   postID,
		AuthorID: authorID,
		ParentID: parentID,
		Content:  content,
	}

	err := s.db.Transaction(func(tx *gorm.DB) error {
		if err := s.comments.Create(tx, comment); err != nil {
			return err
		}
		if err := s.posts.IncrementCommentCount(tx, postID); err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return nil, NewInternal(err)
	}

	created, err := s.comments.GetByID(comment.ID)
	if err != nil {
		return nil, NewInternal(err)
	}
	return created, nil
}

func (s *CommentService) ListByPost(postID uint, page, pageSize int) ([]CommentNode, int64, error) {
	if _, err := s.posts.GetByID(postID); err != nil {
		if repository.IsNotFound(err) {
			return nil, 0, NewNotFound("post_not_found", "post not found")
		}
		return nil, 0, NewInternal(err)
	}

	topLevel, total, err := s.comments.ListTopLevelByPost(postID, pageSize, offset(page, pageSize))
	if err != nil {
		return nil, 0, NewInternal(err)
	}

	allComments, err := s.comments.ListByPost(postID)
	if err != nil {
		return nil, 0, NewInternal(err)
	}

	childrenMap := make(map[uint][]model.Comment)
	for _, comment := range allComments {
		if comment.ParentID != nil {
			childrenMap[*comment.ParentID] = append(childrenMap[*comment.ParentID], comment)
		}
	}

	nodes := make([]CommentNode, 0, len(topLevel))
	for _, comment := range topLevel {
		nodes = append(nodes, buildCommentNode(comment, childrenMap))
	}

	return nodes, total, nil
}

func buildCommentNode(comment model.Comment, childrenMap map[uint][]model.Comment) CommentNode {
	children := childrenMap[comment.ID]
	replies := make([]CommentNode, 0, len(children))
	for _, child := range children {
		replies = append(replies, buildCommentNode(child, childrenMap))
	}

	return CommentNode{
		Comment: comment,
		Replies: replies,
	}
}
