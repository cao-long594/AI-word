import { ConfigProvider } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import AppRouter from './router';

export default function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#4a90e2',
          colorInfo: '#4a90e2',
          colorSuccess: '#52c41a',
          colorWarning: '#faad14',
          colorError: '#ff4d4f',
          colorText: '#1f1f1f',
          colorTextSecondary: '#8f96a3',
          colorBorder: '#2b2b2b',
          colorBgLayout: '#ffffff',
          colorBgContainer: '#ffffff',
          fontFamily:
            '"Microsoft YaHei", "PingFang SC", "Noto Sans SC", "Segoe UI", sans-serif',
          borderRadius: 6,
          controlHeight: 36,
          lineWidth: 2,
        },
        components: {
          Button: {
            primaryShadow: 'none',
            defaultShadow: 'none',
            controlHeight: 36,
          },
          Card: {
            headerFontSize: 20,
            headerFontSizeSM: 18,
          },
          Modal: {
            titleFontSize: 18,
          },
          Table: {
            headerBg: '#ffffff',
            borderColor: '#d7d7d7',
            rowHoverBg: '#f5faff',
          },
          Input: {
            lineWidth: 2,
            colorBorder: '#b8b8b8',
            borderRadius: 6,
          },
          Select: {
            lineWidth: 2,
            colorBorder: '#b8b8b8',
            borderRadius: 6,
          },
          InputNumber: {
            lineWidth: 2,
            colorBorder: '#b8b8b8',
            borderRadius: 6,
          },
        },
      }}
    >
      <AppRouter />
    </ConfigProvider>
  );
}
