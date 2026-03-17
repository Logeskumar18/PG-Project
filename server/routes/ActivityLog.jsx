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
        const params = new URLSearchParams({ page, limit: 20 });
        if (actionFilter) params.append('action', actionFilter);
        if (roleFilter) params.append('role', roleFilter);
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const response = await axios.get(`http://localhost:5001/api/activities?${params.toString()}`, {
          withCredentials: true
        });
        setLogs(response.data.data);
        setTotalPages(response.data.totalPages);
        setError(null);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch activity logs');
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

  const clearFilters = () => {
    setActionFilter('');
    setRoleFilter('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  if (loading && page === 1) return <div className="p-4 text-center">Loading audit logs...</div>;
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>;

  return (
    <div className="bg-white rounded-lg shadow p-6 max-w-7xl mx-auto mt-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">System Activity Log</h2>
      
      {/* Filters Section */}
      <div className="bg-gray-50 p-4 rounded-lg mb-6 flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
          <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border bg-white">
            <option value="">All Roles</option>
            <option value="Admin">Admin</option>
            <option value="HOD">HOD</option>
            <option value="Staff">Staff</option>
            <option value="Student">Student</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Action</label>
          <select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setPage(1); }} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border bg-white">
            <option value="">All Actions</option>
            <option value="CREATED">CREATED</option>
            <option value="UPDATED">UPDATED</option>
            <option value="DELETED">DELETED</option>
            <option value="LOGIN">LOGIN</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
          <input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm p-2 border" />
        </div>
        <div className="ml-auto">
          <button onClick={clearFilters} className="bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md shadow-sm text-sm font-medium hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-indigo-500">
            Clear Filters
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Action</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Resource</th>
              <th className="px-6 py-3 text-left font-medium text-gray-500 uppercase tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {logs.map((log) => (
              <tr key={log._id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-gray-600">
                  {new Date(log.createdAt).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{log.user?.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-500">{log.userModel}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                    ${log.action === 'CREATED' ? 'bg-green-100 text-green-800' : 
                      log.action === 'DELETED' ? 'bg-red-100 text-red-800' : 
                      log.action === 'UPDATED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                  {log.resource}
                </td>
                <td className="px-6 py-4 text-gray-500 max-w-xs truncate" title={log.details ? JSON.stringify(log.details) : ''}>
                  {log.details ? JSON.stringify(log.details) : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-4">
        <button 
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="px-4 py-2 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Previous
        </button>
        <span className="text-sm text-gray-600">Page {page} of {totalPages}</span>
        <button 
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          className="px-4 py-2 border rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default ActivityLog;