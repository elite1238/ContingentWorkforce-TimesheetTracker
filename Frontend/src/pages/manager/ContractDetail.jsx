import { useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  getContract, getRequirements, getEligibleEmployees,
  getAssignmentsByRequirement, createAssignment, cancelAssignment,
  generateInvoice, getInvoicesByContract, approveInvoice,
  getSkills, createRequirement,
} from '../../api'
import { useFetch } from '../../hooks/useFetch'
import PageHeader from '../../components/PageHeader'
import Drawer from '../../components/Drawer'
import Btn from '../../components/Btn'
import StatusPill from '../../components/StatusPill'

const ERR = {
  padding: '10px 16px', background: '#ef444415', color: '#ef4444',
  borderLeft: '2px solid #ef4444', marginBottom: 16,
  fontFamily: 'monospace', fontSize: 12,
}
const LABEL = {
  display: 'block', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em',
  color: '#7a9ab0', fontFamily: 'ui-monospace, Consolas, monospace',
  marginBottom: 6, textTransform: 'uppercase',
}
const FIELD  = { marginBottom: 18 }
const SECTION = {
  marginBottom: 32, background: '#0d1b2a',
  border: '1px solid #1e3a4a', borderRadius: 3,
}
const SEC_HEAD = {
  padding: '12px 16px', borderBottom: '1px solid #1e3a4a',
  fontFamily: 'ui-monospace, Consolas, monospace',
  fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: '#7a9ab0',
  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
}

export default function ContractDetail() {
  const { id } = useParams()

  const contract     = useFetch(() => getContract(id), [id])
  const requirements = useFetch(() => getRequirements(id), [id])
  const invoices     = useFetch(() => getInvoicesByContract(id), [id])
  const skills       = useFetch(getSkills, [])

  // Add requirement drawer state
  const EMPTY_REQ = { skillId: '', requiredEmployeeCount: 1, hourlyRate: '', expectedHoursPerDay: '', startDate: '', endDate: '' }
  const [reqDrawer, setReqDrawer]   = useState(false)
  const [reqForm, setReqForm]       = useState(EMPTY_REQ)
  const [reqError, setReqError]     = useState(null)
  const [reqSaving, setReqSaving]   = useState(false)

  // Assign drawer state
  const [assignReq, setAssignReq]         = useState(null)
  const [eligibles, setEligibles]         = useState([])
  const [eligLoading, setEligLoading]     = useState(false)
  const [assignForm, setAssignForm]       = useState({ employeeId: '', plannedStartTime: '', plannedEndTime: '' })
  const [assignError, setAssignError]     = useState(null)
  const [assigning, setAssigning]         = useState(false)

  // Invoice drawer
  const [invDrawer, setInvDrawer]         = useState(false)
  const [invForm, setInvForm]             = useState({ periodStart: '', periodEnd: '' })
  const [invError, setInvError]           = useState(null)
  const [invSaving, setInvSaving]         = useState(false)

  const [actionError, setActionError]     = useState(null)

  const c    = contract.data
  const reqs = requirements.data ?? []
  const invList = invoices.data ?? []

  async function handleAddRequirement(e) {
    e.preventDefault()
    setReqSaving(true)
    setReqError(null)
    try {
      await createRequirement(id, {
        skillId: reqForm.skillId,
        requiredEmployeeCount: parseInt(reqForm.requiredEmployeeCount, 10),
        hourlyRate: parseFloat(reqForm.hourlyRate),
        expectedHoursPerDay: parseFloat(reqForm.expectedHoursPerDay),
        startDate: reqForm.startDate,
        endDate: reqForm.endDate,
      })
      setReqDrawer(false)
      requirements.reload()
    } catch (err) {
      setReqError(err?.response?.data?.message ?? err?.message ?? 'Failed to add requirement')
    } finally {
      setReqSaving(false)
    }
  }

  async function openAssignDrawer(req) {
    setAssignReq(req)
    setAssignForm({ employeeId: '', plannedStartTime: '', plannedEndTime: '' })
    setAssignError(null)
    setEligLoading(true)
    setEligibles([])
    try {
      const list = await getEligibleEmployees(req.id, req.startDate, req.endDate)
      setEligibles(Array.isArray(list) ? list : [])
    } catch {
      setEligibles([])
    } finally {
      setEligLoading(false)
    }
  }

  async function handleAssign(e) {
    e.preventDefault()
    if (!assignForm.employeeId) { setAssignError('Select an employee'); return }
    setAssigning(true)
    setAssignError(null)
    try {
      await createAssignment({
        employeeId:        assignForm.employeeId,
        requirementId:     assignReq.id,
        startDate:         assignReq.startDate,
        endDate:           assignReq.endDate,
        plannedStartTime:  assignForm.plannedStartTime ? assignForm.plannedStartTime + ':00' : undefined,
        plannedEndTime:    assignForm.plannedEndTime   ? assignForm.plannedEndTime   + ':00' : undefined,
      })
      setAssignReq(null)
      requirements.reload()
    } catch (err) {
      setAssignError(err?.response?.data?.message ?? err?.message ?? 'Assignment failed')
    } finally {
      setAssigning(false)
    }
  }

  async function handleCancelAssignment(asgId) {
    setActionError(null)
    try {
      await cancelAssignment(asgId)
      requirements.reload()
    } catch (err) {
      setActionError(err?.response?.data?.message ?? err?.message ?? 'Cancel failed')
    }
  }

  async function handleInvoice(e) {
    e.preventDefault()
    setInvSaving(true)
    setInvError(null)
    try {
      await generateInvoice({ contractId: id, periodStart: invForm.periodStart, periodEnd: invForm.periodEnd })
      setInvDrawer(false)
      invoices.reload()
    } catch (err) {
      setInvError(err?.response?.data?.message ?? err?.message ?? 'Invoice generation failed')
    } finally {
      setInvSaving(false)
    }
  }

  async function handleApproveInvoice(invId) {
    try {
      await approveInvoice(invId)
      invoices.reload()
    } catch (err) {
      setActionError(err?.response?.data?.message ?? err?.message ?? 'Approve failed')
    }
  }

  if (contract.loading) {
    return <div style={{ padding: 40, color: '#7a9ab0', fontFamily: 'monospace' }}>Loading...</div>
  }
  if (contract.error) {
    return <div style={{ padding: 40 }}><div style={ERR}>ERROR: {contract.error}</div></div>
  }

  return (
    <div>
      <PageHeader title={c?.title ?? 'Contract'} subtitle={`ID: ${id}`} />
      <div style={{ padding: '24px 32px' }}>
        {actionError && <div style={ERR}>ERROR: {actionError}</div>}

        {/* Contract info card */}
        <div style={{ ...SECTION, marginBottom: 28, padding: '16px 20px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            ['Client',       c?.companyName ?? c?.companyId ?? '—'],
            ['Billing Type', c?.billingType],
            ['Start Date',   c?.startDate],
            ['End Date',     c?.endDate],
          ].map(([lbl, val]) => (
            <div key={lbl}>
              <div style={{ ...LABEL, marginBottom: 4 }}>{lbl}</div>
              <div style={{ fontFamily: 'ui-monospace, Consolas, monospace', fontSize: 13, color: '#f0f2f5' }}>
                {val ?? '—'}
              </div>
            </div>
          ))}
        </div>

        {/* Requirements */}
        <div style={SECTION}>
          <div style={SEC_HEAD}>
            <span>REQUIREMENTS</span>
            <Btn small onClick={() => { setReqForm(EMPTY_REQ); setReqError(null); setReqDrawer(true) }}>
              + ADD REQUIREMENT
            </Btn>
          </div>
          {requirements.loading ? (
            <div style={{ padding: 16, color: '#7a9ab0', fontFamily: 'monospace', fontSize: 12 }}>Loading...</div>
          ) : reqs.length === 0 ? (
            <div style={{ padding: 16, color: '#7a9ab0', fontFamily: 'monospace', fontSize: 12 }}>No requirements defined</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Skill</th>
                  <th>Required</th>
                  <th>Fulfilled</th>
                  <th>Remaining</th>
                  <th>Hourly Rate</th>
                  <th>Start</th>
                  <th>End</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reqs.map(req => (
                  <RequirementRow
                    key={req.id}
                    req={req}
                    onAssign={() => openAssignDrawer(req)}
                    onCancel={handleCancelAssignment}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Invoices */}
        <div style={SECTION}>
          <div style={SEC_HEAD}>
            <span>INVOICES</span>
            <Btn small onClick={() => { setInvForm({ periodStart: '', periodEnd: '' }); setInvError(null); setInvDrawer(true) }}>
              + GENERATE INVOICE
            </Btn>
          </div>
          {invoices.loading ? (
            <div style={{ padding: 16, color: '#7a9ab0', fontFamily: 'monospace', fontSize: 12 }}>Loading...</div>
          ) : invList.length === 0 ? (
            <div style={{ padding: 16, color: '#7a9ab0', fontFamily: 'monospace', fontSize: 12 }}>No invoices yet</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Period Start</th>
                  <th>Period End</th>
                  <th>Status</th>
                  <th>Total Amount</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {invList.map(inv => (
                  <tr key={inv.id}>
                    <td>{inv.periodStart}</td>
                    <td>{inv.periodEnd}</td>
                    <td><StatusPill value={inv.status} /></td>
                    <td style={{ color: '#ff6b00' }}>{inv.totalAmount != null ? `$${inv.totalAmount.toFixed(2)}` : '—'}</td>
                    <td>
                      {inv.status === 'PENDING_APPROVAL' && (
                        <Btn small variant="approve" onClick={() => handleApproveInvoice(inv.id)}>APPROVE</Btn>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Assign Employee Drawer */}
      <Drawer open={!!assignReq} onClose={() => setAssignReq(null)} title="ASSIGN EMPLOYEE" width={540}>
        {assignError && <div style={ERR}>ERROR: {assignError}</div>}
        <div style={{ marginBottom: 16, color: '#7a9ab0', fontFamily: 'monospace', fontSize: 11 }}>
          Requirement: {assignReq?.skillName ?? assignReq?.id}
        </div>
        {eligLoading ? (
          <div style={{ color: '#7a9ab0', fontFamily: 'monospace', fontSize: 12, marginBottom: 16 }}>Loading eligible employees...</div>
        ) : eligibles.length === 0 ? (
          <div style={{ color: '#7a9ab0', fontFamily: 'monospace', fontSize: 12, marginBottom: 16 }}>No eligible employees found</div>
        ) : (
          <div style={{ marginBottom: 20 }}>
            <div style={{ ...LABEL, marginBottom: 8 }}>Eligible Employees</div>
            <table style={{ marginBottom: 0 }}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Skills</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {eligibles.map(emp => (
                  <tr
                    key={emp.id}
                    style={{ cursor: 'pointer', background: assignForm.employeeId === emp.id ? '#ff6b0010' : '' }}
                    onClick={() => setAssignForm(f => ({ ...f, employeeId: emp.id }))}
                  >
                    <td style={{ color: assignForm.employeeId === emp.id ? '#ff6b00' : '#f0f2f5' }}>
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td style={{ color: '#7a9ab0', fontSize: 11 }}>
                      {(emp.skills ?? []).map(s => s.skillName ?? s.name).join(', ') || '—'}
                    </td>
                    <td>
                      {assignForm.employeeId === emp.id && (
                        <span style={{ color: '#ff6b00', fontSize: 10, fontFamily: 'monospace' }}>SELECTED</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <form onSubmit={handleAssign}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div>
              <label style={LABEL}>Planned Start Time</label>
              <input type="time" value={assignForm.plannedStartTime}
                onChange={e => setAssignForm(f => ({ ...f, plannedStartTime: e.target.value }))} />
            </div>
            <div>
              <label style={LABEL}>Planned End Time</label>
              <input type="time" value={assignForm.plannedEndTime}
                onChange={e => setAssignForm(f => ({ ...f, plannedEndTime: e.target.value }))} />
            </div>
          </div>
          <Btn type="submit" disabled={assigning || !assignForm.employeeId}>
            {assigning ? 'ASSIGNING...' : 'CONFIRM ASSIGNMENT'}
          </Btn>
        </form>
      </Drawer>

      {/* Add Requirement Drawer */}
      <Drawer open={reqDrawer} onClose={() => setReqDrawer(false)} title="ADD REQUIREMENT" width={480}>
        {reqError && <div style={ERR}>ERROR: {reqError}</div>}
        <form onSubmit={handleAddRequirement}>
          <div style={FIELD}>
            <label style={LABEL}>Skill</label>
            <select value={reqForm.skillId} onChange={e => setReqForm(f => ({ ...f, skillId: e.target.value }))} required>
              <option value="">— Select skill —</option>
              {(skills.data ?? []).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <div style={FIELD}>
            <label style={LABEL}>Required Employee Count</label>
            <input type="number" min="1" value={reqForm.requiredEmployeeCount}
              onChange={e => setReqForm(f => ({ ...f, requiredEmployeeCount: e.target.value }))} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div>
              <label style={LABEL}>Hourly Rate ($)</label>
              <input type="number" min="0.01" step="0.01" value={reqForm.hourlyRate}
                onChange={e => setReqForm(f => ({ ...f, hourlyRate: e.target.value }))} required />
            </div>
            <div>
              <label style={LABEL}>Hours / Day</label>
              <input type="number" min="0.5" step="0.5" value={reqForm.expectedHoursPerDay}
                onChange={e => setReqForm(f => ({ ...f, expectedHoursPerDay: e.target.value }))} required />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
            <div>
              <label style={LABEL}>Start Date</label>
              <input type="date" value={reqForm.startDate}
                onChange={e => setReqForm(f => ({ ...f, startDate: e.target.value }))} required />
            </div>
            <div>
              <label style={LABEL}>End Date</label>
              <input type="date" value={reqForm.endDate}
                onChange={e => setReqForm(f => ({ ...f, endDate: e.target.value }))} required />
            </div>
          </div>
          <Btn type="submit" disabled={reqSaving}>
            {reqSaving ? 'SAVING...' : 'ADD REQUIREMENT'}
          </Btn>
        </form>
      </Drawer>

      {/* Generate Invoice Drawer */}
      <Drawer open={invDrawer} onClose={() => setInvDrawer(false)} title="GENERATE INVOICE">
        {invError && <div style={ERR}>ERROR: {invError}</div>}
        <form onSubmit={handleInvoice}>
          <div style={FIELD}>
            <label style={LABEL}>Period Start</label>
            <input type="date" value={invForm.periodStart}
              onChange={e => setInvForm(f => ({ ...f, periodStart: e.target.value }))} required />
          </div>
          <div style={FIELD}>
            <label style={LABEL}>Period End</label>
            <input type="date" value={invForm.periodEnd}
              onChange={e => setInvForm(f => ({ ...f, periodEnd: e.target.value }))} required />
          </div>
          <Btn type="submit" disabled={invSaving}>
            {invSaving ? 'GENERATING...' : 'GENERATE INVOICE'}
          </Btn>
        </form>
      </Drawer>
    </div>
  )
}

function RequirementRow({ req, onAssign, onCancel }) {
  const assignments = useFetch(() => getAssignmentsByRequirement(req.id), [req.id])
  const asgList = assignments.data ?? []
  const [expanded, setExpanded] = useState(false)

  return (
    <>
      <tr>
        <td style={{ color: '#f0f2f5' }}>{req.skillName ?? req.skill?.name ?? '—'}</td>
        <td>{req.requiredCount ?? 1}</td>
        <td style={{ color: '#00c851' }}>{asgList.filter(a => a.status !== 'CANCELLED').length}</td>
        <td style={{ color: '#ff6b00' }}>
          {Math.max(0, (req.requiredCount ?? 1) - asgList.filter(a => a.status !== 'CANCELLED').length)}
        </td>
        <td>{req.hourlyRate != null ? `$${req.hourlyRate}` : '—'}</td>
        <td>{req.startDate}</td>
        <td>{req.endDate}</td>
        <td style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <Btn small onClick={onAssign}>ASSIGN</Btn>
          <Btn small variant="ghost" onClick={() => setExpanded(x => !x)}>
            {expanded ? 'HIDE' : 'ASSIGNMENTS'}
          </Btn>
        </td>
      </tr>
      {expanded && asgList.map(a => (
        <tr key={a.id} style={{ background: '#08131c' }}>
          <td colSpan={6} style={{ paddingLeft: 32, color: '#7a9ab0', fontSize: 11 }}>
            {a.employeeName ?? a.employeeId} · {a.startDate} → {a.endDate}
          </td>
          <td><StatusPill value={a.status} /></td>
          <td>
            {a.status !== 'CANCELLED' && (
              <Btn small variant="danger" onClick={() => onCancel(a.id)}>CANCEL</Btn>
            )}
          </td>
        </tr>
      ))}
    </>
  )
}
