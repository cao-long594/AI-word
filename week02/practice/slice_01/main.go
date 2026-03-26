package main

import "fmt"

func main() {
	slice := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
	s1 := slice[2:7]
	s1 = append(s1, 11, 12, 13)
	s1 = append(s1[:4], s1[5:]...)
	for index := range s1 {
		s1[index] *= 2
	}

	fmt.Println(s1)

}
