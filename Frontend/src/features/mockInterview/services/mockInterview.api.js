import apiClient from "../../../lib/apiClient";

/**
 * Starts a new mock interview session by generating questions from upload forms.
 */
export const startMockInterview = async ({ jobDescription, selfDescription, resumeFile, difficulty }) => {
  try {
    const formData = new FormData();
    formData.append("jobDescription", jobDescription);
    if (selfDescription) {
      formData.append("selfDescription", selfDescription);
    }
    if (resumeFile) {
      formData.append("resume", resumeFile);
    }
    if (difficulty) {
      formData.append("difficulty", difficulty);
    }

    const response = await apiClient.post("/api/mock-interview/", formData);
    return response.data;
  } catch (error) {
    console.error("Start Mock Interview Error:", error);
    throw error.response?.data || { message: "Failed to start mock interview session" };
  }
};

/**
 * Submits an answer for the current question in a session.
 */
export const submitMockAnswer = async (sessionId, { userAnswer }) => {
  try {
    const response = await apiClient.post(`/api/mock-interview/${sessionId}/submit`, { userAnswer });
    return response.data;
  } catch (error) {
    console.error("Submit Answer Error:", error);
    throw error.response?.data || { message: "Failed to submit and evaluate answer" };
  }
};

/**
 * Fetches single mock interview session.
 */
export const getMockInterviewSession = async (sessionId) => {
  try {
    const response = await apiClient.get(`/api/mock-interview/${sessionId}`);
    return response.data;
  } catch (error) {
    console.error("Get Mock Session Error:", error);
    throw error.response?.data || { message: "Failed to fetch mock session details" };
  }
};

/**
 * Fetches all mock interview sessions of the current user.
 */
export const getAllMockInterviewSessions = async (page = 1, limit = 10) => {
  try {
    const response = await apiClient.get(`/api/mock-interview/?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Get All Mock Sessions Error:", error);
    throw error.response?.data || { message: "Failed to fetch mock sessions list" };
  }
};
