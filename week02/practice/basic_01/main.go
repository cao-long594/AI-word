package main

import "fmt"

func Len(s string) int {
	runes := []rune(s)
	return len(runes)
}

func Huiwen(x int) bool {
	if x < 0 {
		return false
	}

	original := x
	reversed := 0
	for x != 0 {
		reversed = reversed*10 + x%10
		x /= 10
	}
	return original == reversed

}

func main() {
	// 定义并打印小明的信息
	var (
		name   = "小明"
		age    = 23
		gender = true
	)

	fmt.Printf("姓名：%v\n", name)
	fmt.Printf("年龄：%v\n", age)
	if gender {
		fmt.Println("性别: 男")
	} else {
		fmt.Println("性别: 女")
	}
	// 调用 Len 函数
	str := "你好 Go"
	fmt.Printf("字符串：%v\n", str)
	fmt.Printf("字符串长度：%v\n", Len(str))

	// 调用 Huiwen 函数
	fmt.Printf("121 是回文：%v\n", Huiwen(121))
	fmt.Printf("123 是回文：%v\n", Huiwen(123))
	fmt.Printf("1221 是回文：%v\n", Huiwen(1221))
}
