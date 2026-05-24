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
          colorBgLayout: '#F3EFE8',
          colorBgContainer: '#FDFCFA',
          colorBorder: '#E8E4DC',
          colorBorderSecondary: '#F0ECE4',
          borderRadius: 8,
          borderRadiusSM: 6,
          fontSize: 14,
          fontSizeLG: 15,
          fontSizeHeading1: 24,
          fontSizeHeading2: 20,
          fontSizeHeading3: 18,
          controlHeight: 36,
          controlHeightLG: 42,
          colorLink: '#BE1E2D',
          colorWarning: '#D48806',
          colorError: '#BE1E2D',
          colorSuccess: '#389E0D',
          colorText: '#1A1A1A',
          colorTextSecondary: '#5C5C5C',
          colorTextTertiary: '#999',
          lineHeight: 1.6,
          fontFamily: '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", system-ui, sans-serif',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.03)',
          boxShadowSecondary: '0 1px 2px rgba(0,0,0,0.04), 0 1px 4px rgba(0,0,0,0.03)',
        },
        components: {
          Layout: {
            headerBg: '#BE1E2D',
            headerHeight: 48,
            headerPadding: '0 32px',
            bodyBg: '#F3EFE8',
            siderBg: '#FDFCFA',
          },
          Table: {
            headerBg: '#F4F1EA',
            headerColor: '#1A1A1A',
            headerSplitColor: '#E8E4DC',
            rowHoverBg: '#FAFAFA',
            borderColor: '#E8E4DC',
            cellPaddingBlock: 10,
            cellPaddingInline: 16,
            borderRadius: 8,
          },
          Button: {
            primaryColor: '#FFFFFF',
            defaultBorderColor: '#D9D3C8',
            defaultColor: '#1A1A1A',
            controlHeight: 36,
            controlHeightLG: 42,
            fontWeight: 500,
            borderRadius: 6,
          },
          Card: {
            paddingLG: 24,
            borderRadius: 8,
          },
          Tag: { fontSize: 12, lineHeight: 20 },
          Badge: { fontSize: 12 },
          Checkbox: { controlInteractiveSize: 20, borderRadiusSM: 6 },
          Modal: {
            titleFontSize: 16,
            borderRadius: 10,
          },
          Slider: {
            trackBg: '#BE1E2D',
            trackHoverBg: '#D43845',
            handleColor: '#BE1E2D',
            handleActiveColor: '#BE1E2D',
            dotActiveBorderColor: '#BE1E2D',
          },
          Collapse: {
            headerBg: 'transparent',
            contentBg: 'transparent',
            contentPadding: '0 0 12px 0',
          },
          Typography: {
            titleMarginBottom: 0,
          },
        },
      }}
    >
      <App />
    </ConfigProvider>
  </StrictMode>,
)
