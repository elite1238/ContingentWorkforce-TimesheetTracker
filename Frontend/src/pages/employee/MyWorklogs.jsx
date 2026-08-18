import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../auth/AuthContext'
import { getMyWorklogs } from '../../api'
import { useFetch } from '../../hooks/useFetch'
import PageHeader from '../../components/PageHeader'
import Btn from '../../components/Btn'
import StatusPill from '../../components/StatusPill'

const ERR = {
  padding: '10px 16px', background: '#ef444415', color: '#ef4444',
  borderLeft: '2px solid #ef4444', marginBottom: 16,
  fontFamily: 'monospace', fontSize: 12,
}

function totalHours(segments) {
  if (!segments?.length) return '—'
  let mins = 0
  for (const s of segments) {
    const [sh, sm] = s.startTime.split(':').map(Number)
    const [eh, em] = s.endTime.split(':').map(Number)
    mins += (eh * 60 + em) - (sh * 60 + sm)
  }
  return (mins / 60).toFixed(2)
}

export default function MyWorklogs() {
  const { user } = useAuth()
  const navigate  = useNavigate()
  const empId     = user?.employeeId ?? null

  const { data, loading, error } = useFetch(
    () => empId ? getMyWorklogs(empId) : Promise.resolve([]),
    [empId],
  )

  const worklogs = data ?? []

  if (!empId) {
    return (
      <div>
        <PageHeader title="My Worklogs" subtitle="Submitted timesheets" />
        <div style={{ padding: '60px 32px', textAlign: 'center' }}>
          <div style={{ color: '#7a9ab0', fontFamily: 'monospace', fontSize: 13, marginBottom: 8 }}>
            Employee profile not linked to this account.
          </div>
          <div style={{ color: '#7a9ab0', fontFamily: 'monospace', fontSize: 11 }}>
            Contact your manager to have your employee record associated with your login.
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="My Worklogs"
        subtitle="Submitted timesheets"
        action={<Btn onClick={() => navigate('/my-worklogs/new')}>+ SUBMIT WORKLOG</Btn>}
      />
      <div style={{ padding: '24px 32px' }}>
        {error && <div style={ERR}>ERROR: {error}</div>}

        {loading ? (
          <div style={{ color: '#7a9ab0', fontFamily: 'monospace', fontSize: 12 }}>Loading...</div>
        ) : worklogs.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#7a9ab0', fontFamily: 'monospace', fontSize: 13 }}>
            <div style={{ marginBottom: 16 }}>No worklogs submitted yet</div>
            <Btn onClick={() => navigate('/my-worklogs/new')}>+ Submit first worklog</Btn>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Assignment</th>
                <th>Work Date</th>
                <th>Total Hours</th>
                <th>Status</th>
                <th>Submitted At</th>
                <th>Rejection Reason</th>
              </tr>
            </thead>
            <tbody>
              {worklogs.map(w => (
                <tr key={w.id}>
                  <td style={{ color: '#f0f2f5' }}>
                    {w.contractTitle ?? w.assignmentId ?? '—'}
                  </td>
                  <td>{w.workDate}</td>
                  <td style={{ color: '#ff6b00', fontWeight: 700 }}>
                    {w.totalHours != null ? `${w.totalHours}h` : totalHours(w.segments) !== '—' ? `${totalHours(w.segments)}h` : '—'}
                  </td>
                  <td><StatusPill value={w.status} /></td>
                  <td style={{ color: '#7a9ab0' }}>
                    {w.submittedAt ? new Date(w.submittedAt).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ color: '#ef4444', fontSize: 11 }}>
                    {w.rejectionReason ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
