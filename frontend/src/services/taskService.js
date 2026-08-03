import api from './api'; 


export const createProjectTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

// create global task
export const createGlobalTask = async (taskData) => {
  const response = await api.post('/tasks/global', taskData);
  return response.data;
};


export const getProjectTasks = async (projectId) => {
  const response = await api.get(`/tasks/project/${projectId}`);
  return response.data;
};

// get global task
export const getGlobalTasks = async () => {
  const response = await api.get('/tasks/global/all');
  return response.data;
};


export const getAllOrganizationTasks = async () => {
  const response = await api.get('/tasks/all');
  return response.data;
};

export const updateTaskStatus = async (taskId, status) => {
  const response = await api.patch(`/tasks/${taskId}/status`, { status });
  return response.data;
};

export const deleteTask = async (taskId) => {
  const response = await api.delete(`/tasks/${taskId}`);
  return response.data;
};

export const updateTaskDetails = async (taskId, taskData) => {
  const response = await api.put(`/tasks/${taskId}`, taskData);
  return response.data;
};


// Get Task Analytics for Dashboard
export const getAnalyticsStats = async () => {
  const response = await api.get('/tasks/analytics/stats');
  return response.data;
};