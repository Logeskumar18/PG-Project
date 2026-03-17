import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter States
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchLogs = async (isAutoRefresh = false) => {
      if (!isAutoRefresh) setLoading(true);
      try {
        // Replace with your API endpoint
        const response = await axios.get('/api/activity-logs', {
          params: {
            page,
            action: actionFilter,
            role: roleFilter,
            startDate,
            endDate,
          },
        });
        setLogs(Array.isArray(response.data.logs) ? response.data.logs : []);
        setTotalPages(response.data.totalPages);
        setError(null);
      } catch (err) {
        setError('Failed to fetch activity logs.');
      } finally {
        if (!isAutoRefresh) setLoading(false);
      }
    };

    fetchLogs();

    // Auto-refresh every 30 seconds
    const intervalId = setInterval(() => {
      fetchLogs(true);
    }, 30000);

    return () => clearInterval(intervalId);
  }, [page, actionFilter, roleFilter, startDate, endDate]);

  return (
    <div>
      <h3>Activity Log</h3>
      {/* Filters */}
      <div style={{ marginBottom: '1rem' }}>
        <input
          type="text"
          placeholder="Action filter"
          value={actionFilter}
          onChange={e => setActionFilter(e.target.value)}
          style={{ marginRight: '0.5rem' }}
        />
        <input
          type="text"
          placeholder="Role filter"
          value={roleFilter}
          onChange={e => setRoleFilter(e.target.value)}
          style={{ marginRight: '0.5rem' }}
        />
        <input
          type="date"
          value={startDate}
          onChange={e => setStartDate(e.target.value)}
          style={{ marginRight: '0.5rem' }}
        />
        <input
          type="date"
          value={endDate}
          onChange={e => setEndDate(e.target.value)}
        />
      </div>
      {/* Log Table */}
      {loading ? (
        <div>Loading...</div>
      ) : error ? (
        <div style={{ color: 'red' }}>{error}</div>
      ) : (
        <table className="table table-bordered">
          <thead>
            <tr>
              <th>Date</th>
              <th>User</th>
              <th>Role</th>
              <th>Action</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {Array.isArray(logs) && logs.map((log, idx) => (
              <tr key={log._id || log.id || idx}>
                <td>{log.date ? new Date(log.date).toLocaleString() : ''}</td>
                <td>{log.user || ''}</td>
                <td>{log.role || ''}</td>
                <td>{log.action || ''}</td>
                <td>{log.description || ''}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {/* Pagination */}
      <div style={{ marginTop: '1rem' }}>
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
          Previous
        </button>
        <span style={{ margin: '0 1rem' }}>Page {page} of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
          Next
        </button>
      </div>
    </div>
  );
};

export default ActivityLog;
