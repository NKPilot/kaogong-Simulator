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
