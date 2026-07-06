import api from './api'; // Aapka axios instance path

// 1. Regular Project Task Banayein
export const createProjectTask = async (taskData) => {
  const response = await api.post('/tasks', taskData);
  return response.data;
};

// 2. Global Task Banayein
export const createGlobalTask = async (taskData) => {
  const response = await api.post('/tasks/global', taskData);
  return response.data;
};

// 3. Project ke hisaab se Tasks mangwayein (Sirf Login User ka data aayega)
export const getProjectTasks = async (projectId) => {
  const response = await api.get(`/tasks/project/${projectId}`);
  return response.data;
};

// 4. Global Tasks mangwayein
export const getGlobalTasks = async () => {
  const response = await api.get('/tasks/global/all');
  return response.data;
};

// 5. Drag and Drop ke liye status update karein
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