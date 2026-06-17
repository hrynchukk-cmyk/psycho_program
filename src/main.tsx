import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createHashRouter, Navigate, RouterProvider } from 'react-router-dom'
import './index.css'
import { StoreProvider, useStore } from './data/store'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import ClientsPage from './pages/ClientsPage'
import ClientDetailPage from './pages/ClientDetailPage'
import GroupsPage from './pages/GroupsPage'
import GroupDetailPage from './pages/GroupDetailPage'
import ActivitiesPage from './pages/ActivitiesPage'
import ActivityBuilderPage from './pages/ActivityBuilderPage'
import ActivityReviewPage from './pages/ActivityReviewPage'
import ProgramsPage from './pages/ProgramsPage'
import ProgramBuilderPage from './pages/ProgramBuilderPage'
import ResourcesPage from './pages/ResourcesPage'
import TasksPage from './pages/TasksPage'
import NotesPage from './pages/NotesPage'
import JournalPage from './pages/JournalPage'

const router = createHashRouter([
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Navigate to="/dashboard" replace /> },
      { path: '/dashboard', element: <DashboardPage /> },
      { path: '/clients', element: <ClientsPage /> },
      { path: '/clients/:id', element: <ClientDetailPage /> },
      { path: '/groups', element: <GroupsPage /> },
      { path: '/groups/:id', element: <GroupDetailPage /> },
      { path: '/activities', element: <ActivitiesPage /> },
      { path: '/activities/:id', element: <ActivityBuilderPage /> },
      { path: '/review/:deliveryId', element: <ActivityReviewPage /> },
      { path: '/programs', element: <ProgramsPage /> },
      { path: '/programs/:id', element: <ProgramBuilderPage /> },
      { path: '/resources', element: <ResourcesPage /> },
      { path: '/tasks', element: <TasksPage /> },
      { path: '/notes', element: <NotesPage /> },
      { path: '/journal', element: <JournalPage /> },
    ],
  },
])

function App() {
  const { ready, authenticated } = useStore()
  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 text-sm text-gray-500">
        Завантаження…
      </div>
    )
  }
  if (!authenticated) return <LoginPage />
  return <RouterProvider router={router} />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <StoreProvider>
      <App />
    </StoreProvider>
  </StrictMode>,
)
