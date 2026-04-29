import { LockOutlined, UserOutlined } from '@ant-design/icons';
import { Button, Form, Input, message } from 'antd';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginApi } from '../api/auth';
import { setToken, setUser } from '../utils/auth';

export default function Login() {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleFinish(values: { username: string; password: string }) {
    setLoading(true);
    try {
      const result = await loginApi(values);
      setToken(result.token);
      setUser(result.user);
      message.success('登录成功');
      navigate('/dashboard', { replace: true });
    } catch (error) {
      message.error(error instanceof Error ? error.message : '登录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-avatar" aria-hidden="true">
          <UserOutlined />
        </div>
        <h1 id="login-title" className="login-title">
          在线学习管理平台
        </h1>

        <Form
          className="login-form"
          layout="vertical"
          onFinish={handleFinish}
          initialValues={{ username: 'admin', password: 'admin123' }}
        >
          <Form.Item
            name="username"
            label="用户名"
            rules={[{ required: true, message: '请输入用户名' }]}
          >
            <Input
              name="username"
              autoComplete="username"
              spellCheck={false}
              prefix={<UserOutlined aria-hidden="true" />}
              placeholder="请输入用户名…"
            />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[{ required: true, message: '请输入密码' }]}
          >
            <Input.Password
              name="password"
              autoComplete="current-password"
              prefix={<LockOutlined aria-hidden="true" />}
              placeholder="请输入密码…"
            />
          </Form.Item>
          <Button className="login-submit" type="primary" htmlType="submit" block loading={loading}>
            登录
          </Button>
        </Form>
        <div className="login-tip">测试账号：admin / admin123</div>
      </section>
    </main>
  );
}
