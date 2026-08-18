import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import { ProtectedRoute } from './auth/ProtectedRoute'
import Login from './pages/Login'
import Shell from './components/Shell'
import Dashboard from './pages/manager/Dashboard'
import Clients from './pages/manager/Clients'
import Contracts from './pages/manager/Contracts'
import ContractDetail from './pages/manager/ContractDetail'
import Employees from './pages/manager/Employees'
import Skills from './pages/manager/Skills'
import WorklogApproval from './pages/manager/WorklogApproval'
import Invoices from './pages/manager/Invoices'
import MyAssignments from './pages/employee/MyAssignments'
import MyWorklogs from './pages/employee/MyWorklogs'
import SubmitWorklog from './pages/employee/SubmitWorklog'
import MyAvailability from './pages/employee/MyAvailability'

function M({ children }) {
  return (
    <ProtectedRoute role="MANAGER">
      <Shell role="MANAGER">{children}</Shell>
    </ProtectedRoute>
  )
}

function E({ children }) {
  return (
    <ProtectedRoute role="EMPLOYEE">
      <Shell role="EMPLOYEE">{children}</Shell>
    </ProtectedRoute>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<M><Dashboard /></M>} />
          <Route path="/clients" element={<M><Clients /></M>} />
          <Route path="/contracts" element={<M><Contracts /></M>} />
          <Route path="/contracts/:id" element={<M><ContractDetail /></M>} />
          <Route path="/employees" element={<M><Employees /></M>} />
          <Route path="/skills" element={<M><Skills /></M>} />
          <Route path="/worklogs/pending" element={<M><WorklogApproval /></M>} />
          <Route path="/invoices" element={<M><Invoices /></M>} />
          <Route path="/my-assignments" element={<E><MyAssignments /></E>} />
          <Route path="/my-worklogs" element={<E><MyWorklogs /></E>} />
          <Route path="/my-worklogs/new" element={<E><SubmitWorklog /></E>} />
          <Route path="/my-availability" element={<E><MyAvailability /></E>} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}
