---
plan: 03
name: Frontend React+Vite Scaffold
wave: 2
depends_on:
  - plan: 01
    file: backend/data/questions.json
files_modified:
  - frontend/package.json
  - frontend/vite.config.ts
  - frontend/tsconfig.json
  - frontend/tsconfig.app.json
  - frontend/tsconfig.node.json
  - frontend/index.html
  - frontend/src/main.tsx
  - frontend/src/App.tsx
  - frontend/src/vite-env.d.ts
  - frontend/src/router.tsx
  - frontend/src/store/questionBankStore.ts
  - frontend/src/types/question.ts
  - frontend/src/api/client.ts
  - frontend/src/layouts/AppLayout.tsx
  - frontend/src/pages/QuestionBank/index.tsx
  - frontend/src/pages/ExamRoom/index.tsx
autonomous: true
---

# Plan 03: Frontend React+Vite Scaffold (前端骨架搭建)

Scaffold the frontend project using Vite + React + TypeScript. Install and configure Ant Design with the crimson red theme (`#BE1E2D`), set up React Router v6 with routes for the question bank (`/`) and exam room placeholder (`/exam-room`), create the Zustand store skeleton, and build the app shell with the branded header. Copy the extracted questions JSON into the frontend's data directory as a local reference copy.

## Requirements

| Req ID | Description | Verification |
|--------|-------------|-------------|
| QB-01 | Frontend scaffold ready to render question list | Vite dev server starts, Ant Design renders, routes work |

## Threat Model

```
<threat_model>
  <assets>
    - None in Phase 1 scaffold — no user data, no credentials, no API keys
    - Source code integrity (only modified during development)
  </assets>
  <entry_points>
    - Vite dev server (localhost:5173) — local development only, no production exposure
    - NPM dependencies — supply chain risk from package install
  </entry_points>
  <threats>
    - T1 (LOW): Compromised npm package in dependency tree (antd, react-router-dom, zustand)
    - T2 (LOW): Vite dev server accidentally exposed to network (binds to localhost by default)
  </mitigations>
  - M1 (T1): npm audit at project creation; pinned versions in package.json — no ranges (^) for critical deps
  - M2 (T2): Vite config explicitly sets server.host to 'localhost' (not '0.0.0.0')
  </mitigations>
  <verification>
    1. npm run dev starts without errors on localhost:5173
    2. Browser shows header with "江苏公务员面试模拟器" in crimson red (#BE1E2D)
    3. Browser shows question bank placeholder content (or question list if questions loaded)
    4. Navigating to /exam-room shows placeholder page
  </verification>
</threat_model>
```

## Tasks

### Task 03.1: Scaffold Vite React TypeScript project

<task id="03.1" status="pending">
  <title>Scaffold Vite React TypeScript project</title>
  <description>
    Create the frontend directory with a Vite + React + TypeScript project using the official Vite scaffolding template. Then install all required dependencies including Ant Design, React Router, and Zustand.
  </description>
  <read_first>
    - .planning/phases/01-foundation-question-bank/01-CONTEXT.md: D-01 (React), D-02 (Vite SPA), D-03 (Ant Design), D-04 (React Router), D-05 (Zustand), D-06 (frontend/ directory)
  </read_first>
  <action>
    1. From project root, scaffold with Vite:
       ```bash
       cd /home/atis/HE/interview-simulator
       npm create vite@latest frontend -- --template react-ts
       ```
       (If prompted, this should auto-confirm since -- is used)

    2. Install base dependencies (NOT devDependencies):
       ```bash
       cd frontend
       npm install antd@5 @ant-design/icons react-router-dom@6 zustand@4
       ```

    3. Verify the project structure:
       ```
       frontend/
         index.html
         package.json
         tsconfig.json
         tsconfig.app.json
         tsconfig.node.json
         vite.config.ts
         src/
           main.tsx
           App.tsx
           App.css
           ...
       ```
  </action>
  <acceptance_criteria>
    1. `ls frontend/` shows: index.html, package.json, tsconfig.json, vite.config.ts, src/
    2. `cd frontend && npm ls antd` shows antd v5 installed
    3. `cd frontend && npm ls react-router-dom` shows react-router-dom v6 installed
    4. `cd frontend && npm ls zustand` shows zustand v4 installed
    5. `cd frontend && npm run dev` starts without errors
    6. Vite config has server.host set to 'localhost' (not 0.0.0.0)
  </acceptance_criteria>
</task>

### Task 03.2: Set up Ant Design ConfigProvider with theme

<task id="03.2" status="pending">
  <title>Set up Ant Design ConfigProvider with theme</title>
  <description>
    Configure Ant Design's ConfigProvider with the crimson red color theme defined in the UI-SPEC. This ensures all Ant Design components throughout the app use the correct branding colors.
  </description>
  <read_first>
    - .planning/phases/01-foundation-question-bank/01-UI-SPEC.md: Theme section with all token overrides (colorPrimary: '#BE1E2D', colorBgLayout: '#F5F5F5', Layout/Table/Button/Tag/Badge/Checkbox component overrides)
    - frontend/src/main.tsx: current file to modify
  </read_first>
  <action>
    Modify frontend/src/main.tsx to:

    1. Import ConfigProvider from 'antd'
    2. Import zhCN locale from 'antd/locale/zh_CN' (for Chinese locale support)
    3. Import dayjs locale: import 'dayjs/locale/zh-cn'
    4. Wrap the App component with ConfigProvider using the theme object from the UI-SPEC:

    ```tsx
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
          Tag: { fontSize: 12, lineHeight: '20px' },
          Badge: { fontSize: 12 },
          Checkbox: { controlInteractiveSize: 18 },
        },
      }}
    >
      <App />
    </ConfigProvider>
    ```

    Remove the default Vite CSS import (index.css) from main.tsx since Ant Design handles styling.
  </action>
  <acceptance_criteria>
    1. main.tsx imports ConfigProvider from 'antd'
    2. main.tsx imports zhCN from 'antd/locale/zh_CN'
    3. App component is wrapped in ConfigProvider with the theme object
    4. colorPrimary is '#BE1E2D'
    5. Layout component overrides include headerBg: '#BE1E2D'
    6. `cd frontend && npm run build` succeeds without TypeScript errors
  </acceptance_criteria>
</task>

### Task 03.3: Create type definitions and API client module

<task id="03.3" status="pending">
  <title>Create type definitions and API client module</title>
  <description>
    Define TypeScript interfaces for the Question data model and create a lightweight API client module for fetching data from the backend.
  </description>
  <read_first>
    - backend/data/questions.json: actual field names and types in the source data
    - .planning/phases/01-foundation-question-bank/01-UI-SPEC.md: Question interface definition (id, title, fullText, type, year, source, scorePoints)
    - .planning/phases/01-foundation-question-bank/01-CONTEXT.md: D-10 (data in frontend) reconciled with SC#4 (frontend fetches from API)
  </read_first>
  <action>
    1. Create frontend/src/types/question.ts:
    ```typescript
    export interface Question {
      id: string;
      title: string;
      fullText: string;
      type: 'A' | 'B' | 'C' | '结构化小组';
      year: number;
      source: string;
      scorePoints?: string;
    }
    ```

    2. Create frontend/src/api/client.ts:
    ```typescript
    const API_BASE_URL = 'http://localhost:8000';

    export async function fetchQuestions(): Promise<Response> {
      return fetch(`${API_BASE_URL}/api/questions`);
    }

    export async function fetchQuestion(id: string): Promise<Response> {
      return fetch(`${API_BASE_URL}/api/questions/${encodeURIComponent(id)}`);
    }

    export async function healthCheck(): Promise<Response> {
      return fetch(`${API_BASE_URL}/api/health`);
    }
    ```

    3. Create frontend/src/api/questionsApi.ts (higher-level API with error handling):
    ```typescript
    import type { Question } from '../types/question';
    import { fetchQuestions } from './client';

    export async function loadQuestions(): Promise<Question[]> {
      const response = await fetchQuestions();
      if (!response.ok) {
        throw new Error(`Failed to load questions: ${response.status} ${response.statusText}`);
      }
      return response.json() as Promise<Question[]>;
    }
    ```
  </action>
  <acceptance_criteria>
    1. frontend/src/types/question.ts exists with Question interface having all 7 fields
    2. frontend/src/api/client.ts exists with fetchQuestions(), fetchQuestion(), healthCheck() functions
    3. frontend/src/api/questionsApi.ts exists with loadQuestions() that handles errors
    4. `cd frontend && npm run build` compiles without TypeScript errors
  </acceptance_criteria>
</task>

### Task 03.4: Create Zustand question bank store

<task id="03.4" status="pending">
  <title>Create Zustand question bank store</title>
  <description>
    Create the Zustand store for managing question bank state: questions list, loading state, error state, and selection management. The store mirrors the interface from the UI-SPEC design contract.
  </description>
  <read_first>
    - frontend/src/types/question.ts: Question type (imported by store)
    - frontend/src/api/questionsApi.ts: loadQuestions API function (imported by store)
    - .planning/phases/01-foundation-question-bank/01-UI-SPEC.md: State shape section (QuestionBankStore interface with questions, loading, error, selectedIds, toggleSelect, isSelected, isMaxReached, canProceed, loadQuestions, resetSelection)
  </read_first>
  <action>
    Create frontend/src/store/questionBankStore.ts:

    ```typescript
    import { create } from 'zustand';
    import type { Question } from '../types/question';
    import { loadQuestions } from '../api/questionsApi';

    interface QuestionBankStore {
      // Data
      questions: Question[];
      loading: boolean;
      error: string | null;

      // Selection
      selectedIds: string[];
      toggleSelect: (id: string) => void;
      isSelected: (id: string) => boolean;

      // Computed (exposed as methods that compute on access)
      isMaxReached: () => boolean;
      canProceed: () => boolean;

      // Actions
      loadQuestions: () => Promise<void>;
      resetSelection: () => void;
    }

    export const useQuestionBankStore = create<QuestionBankStore>((set, get) => ({
      // Initial state
      questions: [],
      loading: false,
      error: null,
      selectedIds: [],

      // Selection actions
      toggleSelect: (id: string) => {
        const state = get();
        if (state.selectedIds.includes(id)) {
          // Remove selection
          set({ selectedIds: state.selectedIds.filter(sid => sid !== id) });
        } else {
          // Add selection (only if not at max)
          if (state.selectedIds.length >= 4) return;
          set({ selectedIds: [...state.selectedIds, id] });
        }
      },

      isSelected: (id: string) => {
        return get().selectedIds.includes(id);
      },

      isMaxReached: () => {
        return get().selectedIds.length >= 4;
      },

      canProceed: () => {
        return get().selectedIds.length >= 3;
      },

      // Data loading
      loadQuestions: async () => {
        set({ loading: true, error: null });
        try {
          const questions = await loadQuestions();
          set({ questions, loading: false });
        } catch (err) {
          set({
            error: err instanceof Error ? err.message : '加载失败，请刷新页面重试',
            loading: false,
          });
        }
      },

      resetSelection: () => {
        set({ selectedIds: [] });
      },
    }));
    ```
  </action>
  <acceptance_criteria>
    1. frontend/src/store/questionBankStore.ts exists
    2. Store has all state fields: questions, loading, error, selectedIds
    3. Store has all actions: toggleSelect, isSelected, isMaxReached, canProceed, loadQuestions, resetSelection
    4. toggleSelect enforces max 4 selection (no-ops when length >= 4)
    5. canProceed returns true only when selectedIds.length >= 3
    6. `cd frontend && npm run build` compiles without TypeScript errors
  </acceptance_criteria>
</task>

### Task 03.5: Create app shell with Layout and Header

<task id="03.5" status="pending">
  <title>Create app shell with Layout and Header</title>
  <description>
    Build the application shell using Ant Design's Layout, Layout.Header, and Layout.Content components. This creates the persistent crimson red header bar and white content area that wraps every page.
  </description>
  <read_first>
    - .planning/phases/01-foundation-question-bank/01-UI-SPEC.md: App Shell section (Layout.Header with #BE1E2D bg, title "江苏公务员面试模拟器", white text, sticky header, 32px content padding), Component Inventory section 1
    - frontend/src/App.tsx: current file to replace
    - frontend/src/router.tsx: router definition to create
  </read_first>
  <action>
    1. Create frontend/src/router.tsx:
    ```tsx
    import { createBrowserRouter } from 'react-router-dom';
    import AppLayout from './layouts/AppLayout';
    import QuestionBankPage from './pages/QuestionBank';
    import ExamRoomPage from './pages/ExamRoom';

    export const router = createBrowserRouter([
      {
        path: '/',
        element: <AppLayout />,
        children: [
          { index: true, element: <QuestionBankPage /> },
          { path: 'exam-room', element: <ExamRoomPage /> },
        ],
      },
    ]);
    ```

    2. Create frontend/src/layouts/AppLayout.tsx:
    ```tsx
    import { Layout, Typography } from 'antd';
    import { Outlet } from 'react-router-dom';

    const { Header, Content } = Layout;
    const { Title } = Typography;

    export default function AppLayout() {
      return (
        <Layout style={{ minHeight: '100vh' }}>
          <Header
            style={{
              display: 'flex',
              alignItems: 'center',
              position: 'sticky',
              top: 0,
              zIndex: 100,
            }}
          >
            <Title
              level={2}
              style={{
                color: '#FFFFFF',
                margin: 0,
                fontSize: 20,
                fontWeight: 700,
                letterSpacing: 1,
              }}
            >
              江苏公务员面试模拟器
            </Title>
          </Header>
          <Content style={{ padding: '32px', maxWidth: 960, margin: '0 auto', width: '100%' }}>
            <Outlet />
          </Content>
        </Layout>
      );
    }
    ```

    3. Replace frontend/src/App.tsx:
    ```tsx
    import { RouterProvider } from 'react-router-dom';
    import { router } from './router';

    export default function App() {
      return <RouterProvider router={router} />;
    }
    ```

    4. Remove frontend/src/App.css (or delete its content — Ant Design handles styling)
  </action>
  <acceptance_criteria>
    1. frontend/src/router.tsx exists with createBrowserRouter containing / and /exam-room routes
    2. frontend/src/layouts/AppLayout.tsx exists with Layout > Header + Content structure
    3. Header contains Title "江苏公务员面试模拟器" with color #FFFFFF
    4. App.tsx renders RouterProvider with the router
    5. `cd frontend && npm run build` compiles without errors
  </acceptance_criteria>
</task>

### Task 03.6: Create placeholder pages

<task id="03.6" status="pending">
  <title>Create placeholder pages</title>
  <description>
    Create placeholder components for both the Question Bank page and Exam Room page. The Question Bank page placeholder shows the store's data loading behavior. The Exam Room page shows a "coming soon" message (per Phase 1 constraint in UI-SPEC).
  </description>
  <read_first>
    - .planning/phases/01-foundation-question-bank/01-UI-SPEC.md: Section 2 (Question Bank Page layout), Navigation section (placeholder for /exam-room)
    - frontend/src/store/questionBankStore.ts: the store to use
  </read_first>
  <action>
    1. Create frontend/src/pages/QuestionBank/index.tsx:
    ```tsx
    import { useEffect } from 'react';
    import { Typography, Spin, Alert } from 'antd';
    import { useQuestionBankStore } from '../../store/questionBankStore';

    const { Title, Text } = Typography;

    export default function QuestionBankPage() {
      const { questions, loading, error, loadQuestions } = useQuestionBankStore();

      useEffect(() => {
        loadQuestions();
      }, [loadQuestions]);

      if (loading) {
        return (
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
            <p style={{ marginTop: 16 }}>题目加载中...</p>
          </div>
        );
      }

      if (error) {
        return (
          <Alert
            message="加载失败"
            description={error}
            type="error"
            showIcon
            action={
              <a onClick={() => loadQuestions()}>刷新</a>
            }
          />
        );
      }

      return (
        <div>
          <Title level={3} style={{ marginBottom: 4 }}>题库</Title>
          <Text type="secondary" style={{ fontSize: 14, marginBottom: 24, display: 'block' }}>
            请选择 3-4 道题组成本次模拟面试
          </Text>
          {questions.length === 0 ? (
            <Alert message="暂无可用题目" type="warning" />
          ) : (
            <p>已加载 {questions.length} 道题目</p>
          )}
        </div>
      );
    }
    ```

    2. Create frontend/src/pages/ExamRoom/index.tsx:
    ```tsx
    import { Typography } from 'antd';

    const { Title, Text } = Typography;

    export default function ExamRoomPage() {
      return (
        <div style={{ textAlign: 'center', padding: 64 }}>
          <Title level={3}>面试考场</Title>
          <Text type="secondary" style={{ fontSize: 16 }}>
            面试考场 (即将开放)
          </Text>
        </div>
      );
    }
    ```
  </action>
  <acceptance_criteria>
    1. frontend/src/pages/QuestionBank/index.tsx exists with loading, error, and loaded states
    2. frontend/src/pages/ExamRoom/index.tsx exists with "面试考场 (即将开放)" message
    3. QuestionBank page calls loadQuestions() on mount via useEffect
    4. Loading state shows Spin with "题目加载中..." text
    5. Error state shows Alert with "刷新" action button
    6. `cd frontend && npm run build` compiles without errors
  </acceptance_criteria>
</task>

### Task 03.7: Copy questions.json to frontend and verify dev server

<task id="03.7" status="pending">
  <title>Copy questions.json to frontend and verify dev server</title>
  <description>
    Copy the questions.json file from backend/data/ into frontend/public/ as a local reference copy. Then start the dev server and verify everything works end-to-end.
  </description>
  <read_first>
    - backend/data/questions.json: source file to copy
    - frontend/src/pages/QuestionBank/index.tsx: verify it fetches from API (not local JSON)
  </read_first>
  <action>
    1. Copy questions.json:
       ```bash
       cp backend/data/questions.json frontend/public/questions.json
       ```

    2. Start frontend dev server:
       ```bash
       cd frontend && npm run dev
       ```

    3. Verify in browser:
       - Opens at http://localhost:5173
       - Sees crimson red header "江苏公务员面试模拟器"
       - Sees page title "题库" with subtitle
       - If backend is running, sees "已加载 16 道题目"
       - If backend is not running, sees error Alert with "刷新" button
  </action>
  <acceptance_criteria>
    1. frontend/public/questions.json exists (copy of backend data)
    2. `cd frontend && npm run dev` starts on localhost:5173 without errors
    3. Browser loads page without console errors
    4. Header displays "江苏公务员面试模拟器" in white on crimson red
    5. Page displays "题库" title and subtitle
  </acceptance_criteria>
</task>

## Verification Criteria

1. `cd frontend && npm run build` succeeds with exit code 0
2. `cd frontend && npm run dev` starts on localhost:5173
3. Browser shows crimson red header with "江苏公务员面试模拟器"
4. "/" route shows question bank page (loading → loaded or error)
5. "/exam-room" route shows placeholder page with "面试考场 (即将开放)"
6. Ant Design components render correctly (Layout, Typography, Spin, Alert)
7. frontend/public/questions.json exists with 16 questions

## Must Haves

1. FRONTEND_DEV_SERVER: `npm run dev` in frontend/ starts on localhost:5173
2. ANT_THEME_CONFIGURED: ConfigProvider wraps the app with crimson red theme
3. ROUTER_SETUP: React Router with / (QuestionBank) and /exam-room (placeholder)
4. ZUSTAND_STORE: QuestionBankStore with questions, loading, error, selectedIds, and all actions
5. APP_SHELL: Layout with sticky crimson Header and padded Content area
6. PLACEHOLDER_PAGES: Both route pages exist with proper state handling

## Wave Notes

Wave 2 — depends on Plan 01 (for the data structure reference). Can run in parallel with Plan 02 (backend). Frontend placeholder pages will show loading/error states until backend is running.
