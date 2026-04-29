import { useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LogoutOutlined, MenuOutlined, UserOutlined } from '@ant-design/icons';
import { Avatar, Button, Dropdown, Layout, Menu, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { clearAuth, getUser } from '../utils/auth';

const { Header, Sider, Content } = Layout;

const menuItems: MenuProps['items'] = [
  { key: '/dashboard', icon: <span aria-hidden="true">📊</span>, label: '工作台' },
  { key: '/courses', icon: <span aria-hidden="true">📚</span>, label: '课程管理' },
  { key: '/students', icon: <span aria-hidden="true">👥</span>, label: '学生管理' },
  { key: '/summary', icon: <span aria-hidden="true">📝</span>, label: '学习总结' },
];

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = getUser();

  const selectedKeys = useMemo(() => {
    const matched = menuItems?.find((item) => item?.key === location.pathname);
    return [String(matched?.key || '/dashboard')];
  }, [location.pathname]);

  const userMenu: MenuProps['items'] = [
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      onClick: () => {
        clearAuth();
        navigate('/login', { replace: true });
      },
    },
  ];

  return (
    <Layout className="sketch-shell min-h-full">
      <Sider
        width={226}
        theme="light"
        className="sketch-sider"
      >
        <div className="sketch-logo">
          <span aria-hidden="true" className="sketch-logo-icon">
            🎓
          </span>
          <span>学习管理平台</span>
        </div>
        <Menu
          className="sketch-menu"
          mode="inline"
          selectedKeys={selectedKeys}
          items={menuItems}
          onClick={({ key }) => navigate(key)}
        />
      </Sider>
      <Layout>
        <Header className="sketch-header">
          <span className="sketch-header-static-icon" aria-hidden="true">
            <MenuOutlined />
          </span>
          <Dropdown menu={{ items: userMenu }} placement="bottomRight">
            <Button type="text" className="sketch-user-button">
              <Avatar size="small" className="sketch-avatar" icon={<UserOutlined />} />
              <Typography.Text>{user?.name || '管理员'}</Typography.Text>
              <span aria-hidden="true">▼</span>
            </Button>
          </Dropdown>
        </Header>
        <Content className="sketch-content">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
