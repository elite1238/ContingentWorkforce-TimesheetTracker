import api from './client'

// Auth
export const login = (username, password) =>
  api.post('/auth/login', { username, password })

// Skills
export const getSkills = () => api.get('/skills')
export const createSkill = (data) => api.post('/skills', data)

// Employees
export const getEmployees = () => api.get('/employees')
export const getEmployee = (id) => api.get(`/employees/${id}`)
export const createEmployee = (data) => api.post('/employees', data)
export const updateEmployee = (id, data) => api.put(`/employees/${id}`, data)
export const deactivateEmployee = (id) => api.delete(`/employees/${id}`)
export const getEmployeeSkills = (id) => api.get(`/employees/${id}/skills`)
export const assignSkill = (id, data) => api.post(`/employees/${id}/skills`, data)
export const removeSkill = (empId, skillId) => api.delete(`/employees/${empId}/skills/${skillId}`)
export const getAvailability = (id) => api.get(`/employees/${id}/availability`)
export const setAvailability = (id, data) => api.put(`/employees/${id}/availability`, data)

// Companies
export const getCompanies = () => api.get('/companies')
export const createCompany = (data) => api.post('/companies', data)
export const updateCompany = (id, data) => api.put(`/companies/${id}`, data)

// Contracts
export const getContracts = () => api.get('/contracts')
export const getContract = (id) => api.get(`/contracts/${id}`)
export const createContract = (data) => api.post('/contracts', data)
export const getRequirements = (contractId) => api.get(`/contracts/${contractId}/requirements`)
export const createRequirement = (contractId, data) => api.post(`/contracts/${contractId}/requirements`, data)
export const getRequirement = (reqId) => api.get(`/requirements/${reqId}`)

// Assignments
export const getEligibleEmployees = (reqId, startDate, endDate) =>
  api.get(`/requirements/${reqId}/eligible-employees`, { params: { startDate, endDate } })
export const getAssignmentsByRequirement = (reqId) =>
  api.get(`/requirements/${reqId}/assignments`)
export const createAssignment = (data) => api.post('/assignments', data)
export const cancelAssignment = (id) => api.delete(`/assignments/${id}`)
export const getMyAssignments = (employeeId) =>
  api.get('/assignments/mine', { params: { employeeId } })

// Work Logs
export const submitWorklog = (data) => api.post('/worklogs', data)
export const approveWorklog = (id, data) => api.put(`/worklogs/${id}/approve`, data)
export const getPendingWorklogs = (from, to) =>
  api.get('/worklogs', { params: { from, to } })
export const getMyWorklogs = (employeeId) =>
  api.get('/worklogs/mine', { params: { employeeId } })

// Invoices
export const generateInvoice = (data) => api.post('/invoices', data)
export const approveInvoice = (id) => api.put(`/invoices/${id}/approve`)
export const getInvoicesByContract = (contractId) =>
  api.get(`/contracts/${contractId}/invoices`)
export const getInvoice = (id) => api.get(`/invoices/${id}`)
