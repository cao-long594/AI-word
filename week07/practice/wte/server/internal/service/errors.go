package service

import (
	"errors"
	"fmt"
	"strings"
)

type AppError struct {
	Code       string
	Message    string
	HTTPStatus int
	Err        error
}

func (e *AppError) Error() string {
	if e.Err == nil {
		return e.Message
	}
	return fmt.Sprintf("%s: %v", e.Message, e.Err)
}

func (e *AppError) Unwrap() error {
	return e.Err
}

func NewBadRequest(code, message string) *AppError {
	return &AppError{Code: code, Message: message, HTTPStatus: 400}
}

func NewUnauthorized(message string) *AppError {
	return &AppError{Code: "unauthorized", Message: message, HTTPStatus: 401}
}

func NewNotFound(code, message string) *AppError {
	return &AppError{Code: code, Message: message, HTTPStatus: 404}
}

func NewConflict(code, message string) *AppError {
	return &AppError{Code: code, Message: message, HTTPStatus: 409}
}

func NewInternal(err error) *AppError {
	return &AppError{Code: "internal_error", Message: "internal server error", HTTPStatus: 500, Err: err}
}

func IsUniqueConstraintError(err error) bool {
	if err == nil {
		return false
	}
	return strings.Contains(strings.ToLower(err.Error()), "unique constraint failed")
}

func AsAppError(err error) *AppError {
	if err == nil {
		return nil
	}
	var appErr *AppError
	if errors.As(err, &appErr) {
		return appErr
	}
	return NewInternal(err)
}
