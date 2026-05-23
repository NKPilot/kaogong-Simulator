---
plan: 04
name: Question Bank Page
wave: 3
depends_on:
  - plan: 02
    file: backend/app/main.py
  - plan: 03
    file: frontend/src/store/questionBankStore.ts
files_modified:
  - frontend/src/pages/QuestionBank/index.tsx
  - frontend/src/pages/QuestionBank/components/QuestionTable.tsx
  - frontend/src/pages/QuestionBank/components/SelectionPanel.tsx
  - frontend/src/pages/QuestionBank/components/TypeTag.tsx
  - frontend/src/pages/QuestionBank/hooks/useQuestionSelection.ts
  - frontend/src/pages/QuestionBank/QuestionBankPage.tsx
autonomous: true
---

# Plan 04: Question Bank Page (题库页面)

Build the full question bank page that implements QB-01 (browse 16 questions) and QB-02 (select 3-4 questions). This includes an Ant Design Table with expandable rows showing question details, color-coded type tags, checkbox-based selection with 3-4 constraint enforcement, a selection panel with count badge and "开始面试" button, and proper loading/error states. All interactions follow the UI-SPEC design contract exactly.

## Requirements

| Req ID | Description | Verification |
|--------|-------------|-------------|
| QB-01 | User can browse 16 questions with title, type, year | Table renders 16 rows with correct columns |
| QB-02 | User can select 3-4 questions | Checkbox selection enforces min 3 / max 4; button state reflects selection |
| UI-SPEC | Visual/interaction contract compliance | Colors, spacing, copywriting, component mappings match UI-SPEC |

## Threat Model

```
<threat_model>
  <assets>
    - Question data displayed in browser (must render correctly, no XSS from question text)
    - User selection state (client-side only, no persistence needed)
  </assets>
  <entry_points>
    - Question data fetched from backend API (GET /api/questions) — consumed as JSON
    - Checkbox onClick — user input for selection (client-side only, does not hit backend)
    - "开始面试" button onClick — triggers navigation (client-side only)
  </entry_points>
  <threats>
    - T1 (MEDIUM): XSS via question text — if question_text or title contains malicious HTML/script
    - T2 (LOW): Selection state lost on page refresh — expected client-only behavior
    - T3 (LOW): Race condition if loadQuestions called multiple times simultaneously
  </threats>
  <mitigations>
    - M1 (T1): Ant Design Table and Typography.Paragraph escape HTML by default in React JSX; never use dangerouslySetInnerHTML on question text
    - M2 (T2): Accepted as intended behavior — Phase 1 has no persistence requirement; resetSelection available for cleanup
    - M3 (T3): Zustand store's loadQuestions sets loading=true first; concurrent calls check loading state before re-fetching
  </mitigations>
  <verification>
    1. Table renders 16 rows with checkbox, title, type (Tag), year columns
    2. Clicking a row expands detail showing full question text
    3. Checkbox selection: 0-2 shows warning, 3 enables button, 4 disables remaining checkboxes
    4. Selected count badge updates in real-time
    5. "开始面试" navigates to /exam-room when enabled
  </verification>
</threat_model>
```

## Tasks

### Task 04.1: Create TypeTag component

<task id="04.1" status="pending">
  <title>Create TypeTag component</title>
  <description>
    Build a reusable Tag component that color-codes question types according to the UI-SPEC color mapping: A (geekblue), B (green), C (orange), 结构化小组 (red/accent).
  </description>
  <read_first>
    - .planning/phases/01-foundation-question-bank/01-UI-SPEC.md: Section 5 (Question Type Tags) with exact color mapping
    - frontend/src/types/question.ts: Question interface (type field)
  </read_first>
  <action>
    Create frontend/src/pages/QuestionBank/components/TypeTag.tsx:

    ```tsx
    import { Tag } from 'antd';

    const TYPE_CONFIG: Record<string, { color: string; label: string }> = {
      A: { color: 'geekblue', label: 'A类' },
      B: { color: 'green', label: 'B类' },
      C: { color: 'orange', label: 'C类' },
      '结构化小组': { color: 'red', label: '结构化小组' },
    };

    interface TypeTagProps {
      type: string;
    }

    export default function TypeTag({ type }: TypeTagProps) {
      const config = TYPE_CONFIG[type] ?? { color: 'default', label: type };
      return <Tag color={config.color}>{config.label}</Tag>;
    }
    ```

    The label adds the Chinese "类" suffix for display (the data stores short form like "A").
  </action>
  <acceptance_criteria>
    1. frontend/src/pages/QuestionBank/components/TypeTag.tsx exists
    2. TYPE_CONFIG maps "A" -> color geekblue, label "A类"
    3. TYPE_CONFIG maps "B" -> color green, label "B类"
    4. TYPE_CONFIG maps "C" -> color orange, label "C类"
    5. TYPE_CONFIG maps "结构化小组" -> color red, label "结构化小组"
    6. Unknown types fall back to color "default"
    7. `cd frontend && npm run build` compiles without errors
  </acceptance_criteria>
</task>

### Task 04.2: Create QuestionTable component

<task id="04.2" status="pending">
  <title>Create QuestionTable component</title>
  <description>
    Build the main Ant Design Table that displays all 16 questions with: a checkbox column for selection, title column (paper name + question number), type column (color-coded Tag), and year column. Rows are expandable — clicking a row body toggles an expandable section that shows the full question text with metadata. The table uses no pagination (16 items fits on one page).
  </description>
  <read_first>
    - .planning/phases/01-foundation-question-bank/01-UI-SPEC.md: Section 2 (Question Bank Page layout), Section 4 (Table Configuration with all column/expandable/pagination/size props), Section 3 (Selection Flow States — checkbox behavior), Interaction Behavior Contract (Row Click vs Checkbox Click)
    - frontend/src/types/question.ts: Question interface
    - frontend/src/store/questionBankStore.ts: toggleSelect, isSelected, isMaxReached
    - frontend/src/pages/QuestionBank/components/TypeTag.tsx: TypeTag component to render
  </read_first>
  <action>
    Create frontend/src/pages/QuestionBank/components/QuestionTable.tsx:

    1. Import useQuestionBankStore for selection state and actions
    2. Import Question type
    3. Import TypeTag
    4. Import Table, Checkbox, Typography, Tooltip from antd
    5. Import message from antd

    6. Define columns:
    ```
    Column 1 — Checkbox selection:
      - title: '' (empty, no header)
      - dataIndex: none (custom render)
      - width: 48px
      - render: (_, record) => <Checkbox
          checked={isSelected(record.id)}
          onChange={() => handleCheckboxClick(record)}
          disabled={isMaxReached() && !isSelected(record.id)}
          aria-label={`选择${record.title}`}
        />
      - If disabled due to max reached, wrap Checkbox in Tooltip with title="每轮面试最多选择 4 道题"

    Column 2 — Title ("题目"):
      - dataIndex: 'title'
      - ellipsis: false (titles are short enough)
      - render: (text) => <Typography.Text strong>{text}</Typography.Text>

    Column 3 — Type ("类型"):
      - dataIndex: 'type'
      - width: 120px
      - render: (type) => <TypeTag type={type} />

    Column 4 — Year ("年份"):
      - dataIndex: 'year'
      - width: 80px
    ```

    7. Define handleCheckboxClick(record):
    ```
    function handleCheckboxClick(record: Question) {
      if (isSelected(record.id)) {
        toggleSelect(record.id);
      } else if (selectedIds.length >= 4) {
        message.warning('每轮面试最多选择 4 道题');
      } else {
        toggleSelect(record.id);
      }
    }
    ```

    8. Table props:
    ```tsx
    <Table
      columns={columns}
      dataSource={questions}
      rowKey="id"
      pagination={false}
      size="middle"
      showHeader={true}
      expandable={{
        expandedRowRender: (record) => (
          <div style={{ padding: '8px 0 8px 48px' }}>
            <Typography.Text strong style={{ fontSize: 13, color: '#8C8C8C' }}>
              题目全文
            </Typography.Text>
            <Typography.Paragraph
              style={{ marginTop: 8, marginBottom: 8, fontSize: 14, lineHeight: 1.8, whiteSpace: 'pre-wrap' }}
            >
              {record.fullText}
            </Typography.Paragraph>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {record.type === 'A' ? 'A类' : record.type === 'B' ? 'B类' : record.type === 'C' ? 'C类' : record.type} | {record.year} | 来源：{record.source}
            </Typography.Text>
          </div>
        ),
        rowExpandable: () => true,
      }}
    />
    ```

    9. Important: Use `rowKey="id"` so React tracks rows by their unique ID

    10. The component receives no props — it reads directly from the Zustand store.
  </action>
  <acceptance_criteria>
    1. frontend/src/pages/QuestionBank/components/QuestionTable.tsx exists
    2. Table has 4 columns: checkbox, title ("题目"), type ("类型"), year ("年份")
    3. Checkbox column: renders Checkbox, disabled state when isMaxReached and not selected, tooltip on disabled
    4. Type column: renders TypeTag component
    5. Clicking row body (not checkbox) toggles expandable section
    6. Expandable section shows "题目全文" label, question fullText with pre-wrap, and metadata line (type | year | 来源：source)
    7. pagination=false, size="middle", rowKey="id", showHeader=true
    8. Table reads questions from Zustand store (useQuestionBankStore)
    9. `cd frontend && npm run build` compiles without errors
  </acceptance_criteria>
</task>

### Task 04.3: Create SelectionPanel component

<task id="04.3" status="pending">
  <title>Create SelectionPanel component</title>
  <description>
    Build the selection panel that sits below the question table. Shows: a selection count badge, selected question list, status alerts (warning when < 3, ready when >= 3), and the "开始面试" primary action button with navigation to /exam-room.
  </description>
  <read_first>
    - .planning/phases/01-foundation-question-bank/01-UI-SPEC.md: Section 2 (Selection Panel layout), Section 3 (Selection Flow States with 5 states: empty, partial, ready, full, overflow), Section 5 copywriting for all states, Navigation section (click navigates to /exam-room)
    - frontend/src/store/questionBankStore.ts: selectedIds, questions, canProceed, toggleSelect, resetSelection
    - frontend/src/types/question.ts: Question interface
  </read_first>
  <action>
    Create frontend/src/pages/QuestionBank/components/SelectionPanel.tsx:

    1. Import: useQuestionBankStore, useNavigate from react-router-dom, Button, Alert, Badge, Tag, Space, Typography, Divider from antd

    2. Component logic:
    ```tsx
    export default function SelectionPanel() {
      const { selectedIds, questions, canProceed } = useQuestionBankStore();
      const navigate = useNavigate();

      const selectedCount = selectedIds.length;
      const selectedQuestions = questions.filter(q => selectedIds.includes(q.id));

      function getStatusText(): string {
        if (selectedCount === 0) return '请至少选择 3 道题';
        if (selectedCount < 3) return `已选择 ${selectedCount}/4 题`;
        if (selectedCount === 3) return '已选择 3/4 题，可以开始面试';
        return '已选择 4/4 题';
      }

      function getAlertType(): 'warning' | 'success' | 'info' {
        if (selectedCount < 3) return 'warning';
        return 'success';
      }

      function handleStartInterview() {
        if (canProceed()) {
          navigate('/exam-room');
        }
      }

      return (
        <div
          style={{
            marginTop: 24,
            padding: 20,
            background: '#FFFFFF',
            borderRadius: 6,
            border: '1px solid #E8E8E8',
          }}
        >
          {/* Selection count + status */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Badge
                count={selectedCount}
                style={{
                  backgroundColor: selectedCount >= 3 ? '#BE1E2D' : '#D9D9D9',
                  color: selectedCount >= 3 ? '#FFFFFF' : '#8C8C8C',
                  fontSize: 14,
                  fontWeight: 600,
                }}
                overflowCount={4}
              />
              <Typography.Text
                style={{
                  fontSize: 14,
                  color: selectedCount >= 3 ? '#262626' : '#8C8C8C',
                }}
              >
                {getStatusText()}
              </Typography.Text>
            </div>
            <Button
              type="primary"
              size="large"
              disabled={!canProceed()}
              onClick={handleStartInterview}
              style={{ minWidth: 140 }}
            >
              开始面试
            </Button>
          </div>

          {/* Alert for < 3 selection */}
          {selectedCount < 3 && selectedCount > 0 && (
            <Alert
              message="请至少选择 3 道题"
              type="warning"
              showIcon
              style={{ marginBottom: 0 }}
            />
          )}

          {/* Selected question chips */}
          {selectedQuestions.length > 0 && (
            <div style={{ marginTop: 12 }}>
              <Space size={[8, 8]} wrap>
                {selectedQuestions.map(q => (
                  <Tag
                    key={q.id}
                    closable
                    onClose={() => useQuestionBankStore.getState().toggleSelect(q.id)}
                    style={{ fontSize: 13, padding: '2px 8px' }}
                  >
                    {q.title}
                  </Tag>
                ))}
              </Space>
            </div>
          )}
        </div>
      );
    }
    ```

    3. Note: The "closable" Tag allows users to remove a question from selection by clicking the X on the tag.
  </action>
  <acceptance_criteria>
    1. frontend/src/pages/QuestionBank/components/SelectionPanel.tsx exists
    2. Shows Badge with selectedCount (overflowCount=4)
    3. Badge bg color: #BE1E2D when >=3, #D9D9D9 when <3
    4. Status text matches copywriting contract for all 4 states (0, 1-2, 3, 4)
    5. "开始面试" button is disabled when canProceed() is false
    6. "开始面试" button navigates to /exam-room via useNavigate when clicked and enabled
    7. Selected questions appear as closable Tags below the count bar
    8. Closing a tag calls toggleSelect to remove from selection
    9. Warning Alert shown only when 1 <= selectedCount < 3
    10. `cd frontend && npm run build` compiles without errors
  </acceptance_criteria>
</task>

### Task 04.4: Create useQuestionSelection hook

<task id="04.4" status="pending">
  <title>Create useQuestionSelection hook</title>
  <description>
    Create a custom hook that encapsulates selection logic for cleaner component code. This hook wraps Zustand store access and provides UI-specific helpers.
  </description>
  <read_first>
    - frontend/src/store/questionBankStore.ts: the store API
    - frontend/src/types/question.ts: Question type
  </read_first>
  <action>
    Create frontend/src/pages/QuestionBank/hooks/useQuestionSelection.ts:

    ```ts
    import { useCallback } from 'react';
    import { useQuestionBankStore } from '../../../store/questionBankStore';
    import type { Question } from '../../../types/question';

    export function useQuestionSelection() {
      const {
        selectedIds,
        questions,
        toggleSelect,
        isSelected,
        isMaxReached,
        canProceed,
        resetSelection,
      } = useQuestionBankStore();

      const selectedQuestions = questions.filter(q => selectedIds.includes(q.id));
      const selectedCount = selectedIds.length;

      const handleToggleSelect = useCallback((question: Question) => {
        toggleSelect(question.id);
      }, [toggleSelect]);

      const isCheckboxDisabled = useCallback((question: Question) => {
        return isMaxReached() && !isSelected(question.id);
      }, [isMaxReached, isSelected]);

      return {
        selectedIds,
        selectedQuestions,
        selectedCount,
        isSelected,
        isMaxReached,
        canProceed,
        handleToggleSelect,
        isCheckboxDisabled,
        resetSelection,
      };
    }
    ```
  </action>
  <acceptance_criteria>
    1. frontend/src/pages/QuestionBank/hooks/useQuestionSelection.ts exists
    2. Returns: selectedIds, selectedQuestions, selectedCount, isSelected, isMaxReached, canProceed, handleToggleSelect, isCheckboxDisabled, resetSelection
    3. isCheckboxDisabled returns true when max reached and item not selected
    4. handleToggleSelect calls toggleSelect with question.id
    5. `cd frontend && npm run build` compiles without errors
  </acceptance_criteria>
</task>

### Task 04.5: Assemble the full QuestionBank page

<task id="04.5" status="pending">
  <title>Assemble the full QuestionBank page</title>
  <description>
    Replace the placeholder QuestionBank page with the fully assembled page combining QuestionTable, SelectionPanel, page title/subtitle, and proper data loading. This is the main output of Phase 1.
  </description>
  <read_first>
    - frontend/src/pages/QuestionBank/index.tsx: current placeholder to replace
    - frontend/src/pages/QuestionBank/components/QuestionTable.tsx: table component
    - frontend/src/pages/QuestionBank/components/SelectionPanel.tsx: selection panel
    - frontend/src/store/questionBankStore.ts: loadQuestions action
    - .planning/phases/01-foundation-question-bank/01-UI-SPEC.md: Section 2 layout, Section 3 selection flow, Copywriting section
  </read_first>
  <action>
    Replace frontend/src/pages/QuestionBank/index.tsx with the fully assembled page:

    ```tsx
    import { useEffect } from 'react';
    import { Typography, Spin, Alert, Button } from 'antd';
    import { useQuestionBankStore } from '../../store/questionBankStore';
    import QuestionTable from './components/QuestionTable';
    import SelectionPanel from './components/SelectionPanel';

    const { Title, Text } = Typography;

    export default function QuestionBankPage() {
      const { questions, loading, error, loadQuestions } = useQuestionBankStore();

      useEffect(() => {
        loadQuestions();
      }, [loadQuestions]);

      // Loading state
      if (loading && questions.length === 0) {
        return (
          <div style={{ textAlign: 'center', padding: 80 }}>
            <Spin size="large" />
            <p style={{ marginTop: 16, color: '#8C8C8C' }}>题目加载中...</p>
          </div>
        );
      }

      // Error state
      if (error && questions.length === 0) {
        return (
          <div style={{ padding: 40 }}>
            <Alert
              message="加载失败"
              description={error}
              type="error"
              showIcon
              action={
                <Button size="small" onClick={() => loadQuestions()}>
                  刷新
                </Button>
              }
            />
          </div>
        );
      }

      return (
        <div>
          {/* Page header */}
          <div style={{ marginBottom: 24 }}>
            <Title level={3} style={{ marginBottom: 4, fontSize: 24, fontWeight: 600 }}>
              题库
            </Title>
            <Text type="secondary" style={{ fontSize: 14 }}>
              请选择 3-4 道题组成本次模拟面试
            </Text>
          </div>

          {/* Empty state */}
          {questions.length === 0 ? (
            <Alert
              message="暂无可用题目"
              type="warning"
              showIcon
            />
          ) : (
            <>
              {/* Question table */}
              <QuestionTable />

              {/* Selection panel */}
              <SelectionPanel />
            </>
          )}
        </div>
      );
    }
    ```
  </action>
  <acceptance_criteria>
    1. Page shows "题库" as Title level 3 (24px, 600 weight)
    2. Page shows "请选择 3-4 道题组成本次模拟面试" as secondary Text (14px)
    3. Table renders 16 questions with checkbox, title, type Tag, year columns
    4. Selection panel shows below table with badge, status text, and button
    5. Loading state (initial): centered Spin with "题目加载中..." text
    6. Error state (when no cached questions): Alert with "刷新" retry button
    7. Empty state: Alert "暂无可用题目"
    8. `cd frontend && npm run build` compiles without errors
  </acceptance_criteria>
</task>

### Task 04.6: End-to-end verification

<task id="04.6" status="pending">
  <title>End-to-end verification</title>
  <description>
    Run both backend and frontend simultaneously and verify the complete flow: backend serves questions, frontend fetches and displays them, and all selection interactions work correctly.
  </description>
  <read_first>
    - backend/app/main.py (needs to be running)
    - frontend/src/pages/QuestionBank/index.tsx (the final page)
  </read_first>
  <action>
    1. Start backend (Terminal 1):
       ```bash
       cd backend && uv run uvicorn app.main:app --host 127.0.0.1 --port 8000
       ```

    2. Start frontend (Terminal 2):
       ```bash
       cd frontend && npm run dev
       ```

    3. Open http://localhost:5173 in browser and verify:

       a. Initial load:
          - Header "江苏公务员面试模拟器" visible with crimson red background
          - Page title "题库" visible
          - Subtitle "请选择 3-4 道题组成本次模拟面试" visible
          - Table shows 16 rows with 4 columns
          - Checkboxes all unchecked initially
          - Selection panel shows "请至少选择 3 道题"
          - "开始面试" button is disabled

       b. Expand row:
          - Click row 1 (not checkbox) → expandable section opens below row
          - Shows "题目全文" label
          - Shows full question text with proper line breaks
          - Shows metadata: "{type} | {year} | 来源：江苏省考面试真题"

       c. Selection (partial):
          - Click checkbox on row 1 → checkbox checked
          - Selection panel shows "已选择 1/4 题" with warning Alert
          - Click checkbox on row 2 → count becomes 2
          - "开始面试" button still disabled

       d. Selection (ready):
          - Click checkbox on row 3 → count becomes 3
          - Alert disappears
          - "开始面试" button becomes enabled (primary red)
          - Badge count shows "3" with red background
          - Selection panel shows "已选择 3/4 题，可以开始面试"
          - Selected questions appear as closable Tags

       e. Selection (full):
          - Click checkbox on row 4 → count becomes 4
          - All unselected checkboxes become disabled with tooltip
          - Selection panel shows "已选择 4/4 题"

       f. Max prevented:
          - Try to click another unselected checkbox → nothing happens
          - message.warning "每轮面试最多选择 4 道题" shown

       g. Remove selection:
          - Click "x" on one selected Tag → count drops to 3
          - All checkboxes re-enabled
          - Badge updates accordingly

       h. Start interview:
          - With 3+ questions selected, click "开始面试"
          - Navigates to /exam-room
          - Shows "面试考场 (即将开放)" placeholder
  </action>
  <acceptance_criteria>
    1. Backend starts without errors on port 8000
    2. Frontend starts without errors on port 5173
    3. Browser shows full question bank with 16 questions
    4. Row expand works and shows full text + metadata
    5. Checkbox selection works: min 3, max 4 enforced
    6. Selection panel updates reactively (text, alert, badge, button)
    7. "开始面试" navigates to /exam-room when enabled
    8. No console errors in browser developer tools
    9. No TypeScript compilation errors
  </acceptance_criteria>
</task>

## Verification Criteria

1. Backend and frontend run simultaneously without errors
2. Page renders 16 questions in Ant Design Table with all 4 columns
3. Expandable rows show full question text and metadata
4. Checkbox selection enforces: min 3 (button disabled until 3), max 4 (remaining checkboxes disabled)
5. Selection panel shows correct copy and Badge for each state (0, 1-2, 3, 4)
6. "开始面试" navigates to /exam-room at 3-4 selections
7. Disabled checkboxes at max=4 show tooltip "每轮面试最多选择 4 道题"
8. Closing a selected tag removes the question from selection and re-enables checkboxes if below max
9. Colors match UI-SPEC: crimson red accents, proper Tag colors, correct text styles

## Must Haves

1. TABLE_WITH_16: Ant Design Table renders all 16 questions
2. EXPANDABLE_ROWS: Row click reveals full question text and metadata
3. SELECTION_CONSTRAINTS: Min 3, max 4 enforced with visual feedback
4. SELECTION_PANEL: Badge, status text, closable tags, and "开始面试" button
5. LOADING_STATE: Spinner shown during data fetch (when no cached data)
6. ERROR_STATE: Error alert shown with retry button when fetch fails
7. NAVIGATION: "开始面试" routes to /exam-room
8. API_INTEGRATION: Frontend fetches from backend API, not static JSON (SC#4 compliance)

## Wave Notes

Wave 3 — depends on both Plan 02 (backend API running) and Plan 03 (frontend scaffold complete). Must be executed after both Wave 2 plans are finished.
