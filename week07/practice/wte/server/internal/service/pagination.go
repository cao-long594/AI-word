package service

func NormalizePage(page int) int {
	if page < 1 {
		return 1
	}
	return page
}

func NormalizePageSize(pageSize int) int {
	switch {
	case pageSize <= 0:
		return 10
	case pageSize > 100:
		return 100
	default:
		return pageSize
	}
}

func offset(page, pageSize int) int {
	page = NormalizePage(page)
	pageSize = NormalizePageSize(pageSize)
	return (page - 1) * pageSize
}
