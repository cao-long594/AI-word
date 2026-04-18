import React, { useEffect, useState } from 'react'

export default function App() {
  const [todos, setTodos] = useState([])
  const [title, setTitle] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchTodos = async () => {
    try {
      setError('')
      const res = await fetch('/api/todos')
      if (!res.ok) {
        throw new Error('fetch todos failed')
      }
      const data = await res.json()
      setTodos(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('fetch todos failed:', err)
      setError('Failed to load todos')
    }
  }

  useEffect(() => {
    fetchTodos()
  }, [])

  const handleAddTodo = async () => {
    const value = title.trim()
    if (!value) {
      return
    }

    try {
      setLoading(true)
      setError('')
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ title: value }),
      })
      if (!res.ok) {
        throw new Error('add todo failed')
      }
      setTitle('')
      await fetchTodos()
    } catch (err) {
      console.error('add todo failed:', err)
      setError('Failed to add todo')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleTodo = async (id) => {
    try {
      setError('')
      const res = await fetch(`/api/todos/${id}/toggle`, {
        method: 'PUT',
      })
      if (!res.ok) {
        throw new Error('toggle todo failed')
      }
      await fetchTodos()
    } catch (err) {
      console.error('toggle todo failed:', err)
      setError('Failed to update todo')
    }
  }

  return (
    <div
      style={{
        maxWidth: '720px',
        margin: '40px auto',
        fontFamily: 'Arial, sans-serif',
        padding: '24px',
      }}
    >
      <h1>Todo List</h1>
      <p>React + Nginx + Go + SQLite</p>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
        <input
          type="text"
          placeholder="Enter a todo item"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          style={{
            flex: 1,
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '6px',
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleAddTodo()
            }
          }}
        />
        <button
          onClick={handleAddTodo}
          disabled={loading}
          style={{
            padding: '10px 16px',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
          }}
        >
          {loading ? 'Adding...' : 'Add'}
        </button>
      </div>

      {error ? <p style={{ color: 'red' }}>{error}</p> : null}

      <ul style={{ listStyle: 'none', padding: 0 }}>
        {todos.map((todo) => (
          <li
            key={todo.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px',
              border: '1px solid #e5e5e5',
              borderRadius: '8px',
              marginBottom: '10px',
            }}
          >
            <input
              type="checkbox"
              checked={todo.done}
              onChange={() => handleToggleTodo(todo.id)}
            />
            <span
              style={{
                textDecoration: todo.done ? 'line-through' : 'none',
                color: todo.done ? '#999' : '#222',
              }}
            >
              {todo.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
