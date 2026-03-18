import React, { useState, useEffect } from 'react';
import api from '../services/api.js';
import { Spinner, Card, Table, Badge, Button, Form, Row, Col, Container } from 'react-bootstrap';

const ActivityLog = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Filter States - matching server params exactly
  const [actionFilter, setActionFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchLogs = async (isAutoRefresh = false) => {
      if (!isAutoRefresh) setLoading(true);
      try {
        const params = {
          page,
          limit: 50,
          action: actionFilter || undefined,
          role: roleFilter || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined
        };

        // Correct endpoint + shared api instance (includes auth token)
        const response = await api.get('/activities', { params });

        
        setLogs(response.data.data || []);
        setTotalPages(response.data.totalPages || 1);
        setError(null);
      } catch (err) {
        setError(err?.response?.data?.message || err?.message || 'Failed to fetch activity logs.');
        console.error('ActivityLog error:', err);
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

  const formatDetails = (details) => {
    if (!details) return '-';
    try {
      return typeof details === 'object' ? JSON.stringify(details) : details;
    } catch {
      return 'Details unavailable';
    }
  };

  if (loading && page === 1) {
    return (
      <div className="d-flex justify-content-center align-items-center p-5">
        <Spinner animation="border" variant="primary" />
        <span className="ms-2">Loading activity logs...</span>
      </div>
    );
  }

  return (
    <Container fluid>
      <Row>
        <Col lg={12}>
          <Card className="border-0 shadow-sm">
            <Card.Header className="bg-white border-bottom">
              <h5 className="fw-bold mb-0">🕒 Activity Log</h5>
            </Card.Header>
            <Card.Body className="p-0">
              {/* Filters */}
              <div className="p-4 border-bottom bg-light">
                <Row className="g-3 align-items-end">
                  <Col md={2}>
                    <Form.Label className="mb-1 fw-semibold">Action</Form.Label>
                    <Form.Select 
                      value={actionFilter} 
                      onChange={(e) => { setActionFilter(e.target.value); setPage(1); }}
                      size="sm"
                    >
                      <option value="">All Actions</option>
                      <option value="CREATED">CREATED</option>
                      <option value="UPDATED">UPDATED</option>
                      <option value="DELETED">DELETED</option>
                      <option value="LOGIN">LOGIN</option>
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <Form.Label className="mb-1 fw-semibold">Role</Form.Label>
                    <Form.Select 
                      value={roleFilter} 
                      onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
                      size="sm"
                    >
                      <option value="">All Roles</option>
                      <option value="HOD">HOD</option>
                      <option value="Staff">Staff</option>
                      <option value="Student">Student</option>
                    </Form.Select>
                  </Col>
                  <Col md={2}>
                    <Form.Label className="mb-1 fw-semibold">Start Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={startDate} 
                      onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                      size="sm"
                    />
                  </Col>
                  <Col md={2}>
                    <Form.Label className="mb-1 fw-semibold">End Date</Form.Label>
                    <Form.Control 
                      type="date" 
                      value={endDate} 
                      onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                      size="sm"
                    />
                  </Col>
                  <Col md={4} className="text-end">
                    <Button 
                      variant="outline-secondary" 
                      size="sm" 
                      onClick={clearFilters}
                    >
                      Clear Filters
                    </Button>
                  </Col>
                </Row>
              </div>

              {/* Table */}
              {error ? (
                <div className="p-4 text-center text-danger">
                  <strong>Error: </strong>{error}
                </div>
              ) : logs.length === 0 ? (
                <div className="p-4 text-center text-muted py-5">
No activity logs found.
                </div>
              ) : (
                <div className="table-responsive">
                  <Table hover className="mb-0">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>User</th>
                        <th>Role</th>
                        <th>Action</th>
                        <th>Resource</th>
                        <th>Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => (
                        <tr key={log._id || log.id}>
                          <td>
                            {log.createdAt ? new Date(log.createdAt).toLocaleString() : 
                             log.date ? new Date(log.date).toLocaleString() : 'N/A'}
                          </td>
                          <td className="fw-semibold">
                            {log.user?.name || log.user || 'Unknown'}
                          </td>
                          <td>
                            <Badge bg="info">{log.userModel || log.role || 'N/A'}</Badge>
                          </td>
                          <td>
                            <Badge 
                              bg={
                                log.action === 'CREATED' ? 'success' : 
                                log.action === 'DELETED' ? 'danger' :
                                log.action === 'UPDATED' ? 'warning' : 'secondary'
                              }
                            >
                              {log.action}
                            </Badge>
                          </td>
                          <td>{log.resource}</td>
                          <td className="text-muted small">
                            <div 
                              className="text-truncate" 
                              style={{maxWidth: '200px'}} 
                              title={formatDetails(log.details)}
                            >
                              {formatDetails(log.details)}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="p-3 border-top bg-light">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-muted small">
                      Page {page} of {totalPages}
                    </div>
                    <div className="d-flex gap-1">
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                      >
                        Previous
                      </Button>
                      <Button 
                        variant="outline-primary" 
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                      >
                        Next
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ActivityLog;

