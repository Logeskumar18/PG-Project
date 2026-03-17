import { useState, useEffect } from 'react';
import { Form, Button, Spinner } from 'react-bootstrap';
import api from '../services/api';

const ProjectForm = ({ project, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setTitle(project.title || '');
      setDescription(project.description || '');
    }
  }, [project]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (project && project._id) {
        // Resubmitting or updating project
        await api.put(`/student/projects/${project._id}`, { title, description });
      } else {
        // Submitting new project
        await api.post('/student/projects', { title, description });
      }
      if (onSave) onSave();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save project. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <div className="mb-3">
        <h2>{project ? 'Update Your Project' : 'Submit a New Project'}</h2>
      </div>
      
      {error && (
        <div style={{ color: '#D8000C', backgroundColor: '#FFD2D2', border: '1px solid #D8000C', padding: '10px', marginBottom: '1rem', borderRadius: '4px' }}>
          {error}
        </div>
      )}

      <div style={{ marginBottom: '1rem' }}>
        <Form.Group>
          <Form.Label>Project Title *</Form.Label>
          <Form.Control
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter project title"
            required
          />
        </Form.Group>
      </div>

      <div style={{ marginBottom: '1.5rem' }}>
        <Form.Group>
          <Form.Label>Project Description *</Form.Label>
          <Form.Control
            as="textarea"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Provide a brief description of your project"
            required
          />
        </Form.Group>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? <Spinner animation="border" size="sm" /> : 'Save Project'}
        </Button>
      </div>
    </Form>
  );
};

export default ProjectForm;