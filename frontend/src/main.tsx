import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import 'dayjs/locale/zh-cn'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: '#BE1E2D',
          colorBgLayout: '#F5F5F5',
          colorBgContainer: '#FFFFFF',
          colorBorder: '#E8E8E8',
          borderRadius: 6,
          fontSize: 14,
          controlHeight: 36,
          colorLink: '#BE1E2D',
          colorWarning: '#FA8C16',
        },
        components: {
          Layout: {
            headerBg: '#BE1E2D',
            headerHeight: 64,
            headerPadding: '0 32px',
            bodyBg: '#F5F5F5',
          },
          Table: {
            headerBg: '#FAFAFA',
            headerColor: '#262626',
            rowHoverBg: '#FFF1F0',
            borderColor: '#E8E8E8',
          },
          Button: {
            primaryColor: '#FFFFFF',
            defaultBorderColor: '#D9D9D9',
            controlHeight: 40,
            fontWeight: 500,
          },
          Tag: { fontSize: 12, lineHeight: 20 },
          Badge: { fontSize: 12 },
          Checkbox: { controlInteractiveSize: 18 },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
