import { createBrowserRouter } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import QuestionBankPage from './pages/QuestionBank';
import ExamRoomPage from './pages/ExamRoom';
import QuestionInterviewPage from './pages/QuestionInterview';
import TestRecordingPage from './pages/TestRecording';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <QuestionBankPage /> },
      { path: 'exam-room', element: <ExamRoomPage /> },
      { path: 'exam-room/question', element: <QuestionInterviewPage /> },
      { path: 'test-recording', element: <TestRecordingPage /> },
    ],
  },
]);
