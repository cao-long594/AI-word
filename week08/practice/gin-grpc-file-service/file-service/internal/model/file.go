package model

type File struct {
	ID           int64
	OriginalName string
	StoredName   string
	Size         int64
	MimeType     string
	Path         string
}
