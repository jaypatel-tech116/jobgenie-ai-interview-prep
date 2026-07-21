import apiClient from "../../../lib/apiClient";

/**
 * Uploads resume file and check ATS readability score.
 */
export const checkAtsScore = async ({ resumeFile, jobDescription }) => {
  try {
    const formData = new FormData();
    formData.append("resume", resumeFile);
    if (jobDescription) {
      formData.append("jobDescription", jobDescription);
    }

    const response = await apiClient.post("/api/ats-check/", formData);
    return response.data;
  } catch (error) {
    console.error("Check ATS Score API Error:", error);
    throw error.response?.data || { message: "Failed to evaluate ATS score" };
  }
};

/**
 * Retrieves past ATS score logs.
 */
export const getAllAtsChecks = async (page = 1, limit = 20) => {
  try {
    const response = await apiClient.get(`/api/ats-check/?page=${page}&limit=${limit}`);
    return response.data;
  } catch (error) {
    console.error("Fetch ATS Logs API Error:", error);
    throw error.response?.data || { message: "Failed to fetch past ATS logs" };
  }
};
