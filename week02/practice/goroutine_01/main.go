package main

import (
	"fmt"
	"sync"
)

// sumOfSquares 计算整数切片中每个元素的平方和，并将结果发送到通道
func sumOfSquares(part []int, result chan int, wg *sync.WaitGroup) {
	defer wg.Done()
	sum := 0
	for _, v := range part {
		sum += v * v
	}
	result <- sum
}

// ParallelSumOfSquares 并行计算切片中所有元素的平方和
// 参数：
//
//	slice: 输入的整数切片
//	numGoroutine: 并发协程数量
//
// 返回值：
//
//	totalSum: 平方和的总和
func ParallelSumOfSquares(slice []int, numGoroutine int) int {
	sliceLen := len(slice)
	partSize := sliceLen / numGoroutine
	resultChan := make(chan int, numGoroutine)
	var wg sync.WaitGroup

	// 启动所有工作协程
	for i := 0; i < numGoroutine; i++ {
		start := i * partSize
		end := start + partSize
		if i == numGoroutine-1 {
			end = sliceLen
		}

		part := slice[start:end]
		wg.Add(1)
		go sumOfSquares(part, resultChan, &wg)
	}

	// 监听 WaitGroup 完成，然后关闭通道
	go func() {
		wg.Wait()
		close(resultChan)
	}()

	// 收集所有结果
	totalSum := 0
	for sum := range resultChan {
		totalSum += sum
	}

	return totalSum
}

func main() {
	sliceLen := 1000
	slice := make([]int, sliceLen)
	for i := 0; i < sliceLen; i++ {
		slice[i] = i + 1
	}

	numGoroutine := 10
	totalSum := ParallelSumOfSquares(slice, numGoroutine)

	fmt.Printf("平方和: %d\n", totalSum)
}
