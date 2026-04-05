package main

import (
	"encoding/json"
	"fmt"
)

// Person 表示一个用户
type Person struct {
	Name  string
	Age   int
	Email string
}

// NewPerson 根据姓名、年龄和邮箱构造一个 Person 实例
// 参数：
//
//	name: 姓名
//	age: 年龄
//	email: 电子邮箱地址
//
// 返回值：初始化完成的 Person 结构体
func NewPerson(name string, age int, email string) Person {
	return Person{
		Name:  name,
		Age:   age,
		Email: email,
	}
}

// PrintPerson 打印 Person 的可读信息及其 JSON 字符串表示
// 参数：
//
//	p: 待打印的 Person 实例
func PrintPerson(p Person) {
	fmt.Printf("Name：%s,Age：%d,Email：%s\n", p.Name, p.Age, p.Email)
	data, err := json.Marshal(p)
	if err != nil {
		fmt.Printf("JSON 编码失败: %v\n", err)
		return
	}
	fmt.Println(string(data))
}

func main() {
	p := NewPerson("张三", 28, "zhangsan@example.com")
	PrintPerson(p)
}
