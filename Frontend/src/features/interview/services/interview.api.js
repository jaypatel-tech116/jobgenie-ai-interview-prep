import apiClient from "../../../lib/apiClient";

/**
 * @description Service to generate interview report based on user self description, resume and job description.
 */
export const generateInterviewReport = async ({
  jobDescription,
  selfDescription,
  resumeFile,
  difficulty,
}) => {
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

    const response = await apiClient.post("/api/interview/", formData);
    return response.data;
  } catch (error) {
    console.error("Generate Interview Error:", error);
    throw error.response?.data || { message: "Something went wrong" };
  }
};

/**
 * @description Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (interviewId) => {
  try {
    const response = await apiClient.get(`/api/interview/report/${interviewId}`);
    return response.data;
  } catch (error) {
    console.error("Get Report Error:", error);
    throw error.response?.data || { message: "Failed to fetch report" };
  }
};

/**
 * @description Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {
  try {
    const response = await apiClient.get("/api/interview/");
    return response.data;
  } catch (error) {
    console.error("Get All Reports Error:", error);
    throw error.response?.data || { message: "Failed to fetch reports" };
  }
};

/**
 * @description Service to generate resume pdf based on user self description, resume content and job description.
 */
export const generateResumePdf = async ({ interviewReportId }) => {
  try {
    const response = await apiClient.post(
      `/api/interview/resume/pdf/${interviewReportId}`,
      null,
      {
        responseType: "blob",
      },
    );

    return response.data;
  } catch (error) {
    console.error("PDF Error:", error);
    throw error.response?.data || { message: "Failed to generate PDF" };
  }
};

/**
 * @description Service to generate interview report Q&A PDF.
 */
export const generateReportPdf = async ({ interviewReportId }) => {
  try {
    const response = await apiClient.post(
      `/api/interview/report/pdf/${interviewReportId}`,
      null,
      {
        responseType: "blob",
      },
    );

    return response.data;
  } catch (error) {
    console.error("Q&A PDF Error:", error);
    throw error.response?.data || { message: "Failed to generate Q&A PDF" };
  }
};

/**
 * @description Service to delete an interview report.
 */
export const deleteInterviewReport = async (interviewId) => {
  try {
    const response = await apiClient.delete(`/api/interview/${interviewId}`);
    return response.data;
  } catch (error) {
    console.error("Delete Report Error:", error);
    throw error.response?.data || { message: "Failed to delete report" };
  }
};

/**
 * @description Service to update interview report details (rename title).
 */
export const updateInterviewReport = async (interviewId, { title }) => {
  try {
    const response = await apiClient.patch(`/api/interview/${interviewId}`, { title });
    return response.data;
  } catch (error) {
    console.error("Update Report Error:", error);
    throw error.response?.data || { message: "Failed to update report" };
  }
};

/**
 * @description Service to generate Cover Letter PDF.
 */
export const generateCoverLetterPdf = async ({ interviewReportId }) => {
  try {
    const response = await apiClient.post(
      `/api/interview/cover-letter/pdf/${interviewReportId}`,
      null,
      {
        responseType: "blob",
      },
    );

    return response.data;
  } catch (error) {
    console.error("Cover Letter PDF Error:", error);
    throw error.response?.data || { message: "Failed to generate Cover Letter PDF" };
  }
};

/**
 * @description Service to fetch a public shared interview report.
 */
export const getSharedInterviewReport = async (shareToken) => {
  try {
    const response = await apiClient.get(`/api/interview/shared/${shareToken}`);
    return response.data;
  } catch (error) {
    console.error("Fetch Shared Report Error:", error);
    throw error.response?.data || { message: "Failed to fetch shared report" };
  }
};
