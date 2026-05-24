import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import QuestionBankPage from './pages/QuestionBank';
import ExamRoomPage from './pages/ExamRoom';
import QuestionInterviewPage from './pages/QuestionInterview';
import ScoringResultsPage from './pages/ScoringResults';
import TestRecordingPage from './pages/TestRecording';
import HistoryPage from './pages/History';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <QuestionBankPage /> },
      { path: 'exam-room', element: <ExamRoomPage /> },
      { path: 'exam-room/question', element: <QuestionInterviewPage /> },
      { path: 'results', element: <ScoringResultsPage /> },
      { path: 'test-recording', element: <TestRecordingPage /> },
      { path: 'history', element: <HistoryPage /> },
    ],
  },
]);
