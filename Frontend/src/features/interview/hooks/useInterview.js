import {
  getAllInterviewReports,
  generateInterviewReport,
  getInterviewReportById,
  generateResumePdf,
  generateReportPdf,
  deleteInterviewReport,
  updateInterviewReport,
  generateCoverLetterPdf,
  getSharedInterviewReport,
} from "../services/interview.api";
import { useContext, useEffect } from "react";
import { InterviewContext } from "../interview.context";
import { useParams } from "react-router";
import { useCallback } from "react";

export const useInterview = () => {
  const context = useContext(InterviewContext);
  const { interviewId } = useParams();

  if (!context) {
    throw new Error("useInterview must be used within an InterviewProvider");
  }

  const { loading, setLoading, report, setReport, reports, setReports } =
    context;

  // Generate report
  const generateReport = async ({
    jobDescription,
    selfDescription,
    resumeFile,
    difficulty,
  }) => {
    setLoading(true);
    try {
      const response = await generateInterviewReport({
        jobDescription,
        selfDescription,
        resumeFile,
        difficulty,
      });

      setReport(response.interviewReport);
      return response.interviewReport;
    } catch (error) {
      console.error("Generate Error:", error);
      return null; // safe return
    } finally {
      setLoading(false);
    }
  };

  // Get single report
  const getReportById = useCallback(async (interviewId) => {
    setLoading(true);
    try {
      const response = await getInterviewReportById(interviewId);
      setReport(response.interviewReport);
      return response.interviewReport;
    } catch (error) {
      console.error("Get Report Error:", error);
      return null;
    } finally {
      setLoading(false);
    }
  }, [setLoading, setReport]);

  // Get all reports
  const getReports = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getAllInterviewReports();
      setReports(response.interviewReports);
      return response.interviewReports;
    } catch (error) {
      console.error("Get Reports Error:", error);
      return [];
    } finally {
      setLoading(false);
    }
  }, [setLoading, setReports]);

  // Download PDF
  const getResumePdf = async (interviewReportId) => {
    try {
      const blob = await generateResumePdf({ interviewReportId });

      if (!(blob instanceof Blob)) {
        throw new Error("Invalid PDF received");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `resume_${interviewReportId}.pdf`; // ✅ fixed

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download error:", err);
      throw err;
    }
  };

  // Download Q&A PDF
  const getReportPdf = async (interviewReportId) => {
    try {
      const blob = await generateReportPdf({ interviewReportId });

      if (!(blob instanceof Blob)) {
        throw new Error("Invalid PDF received");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `report_${interviewReportId}.pdf`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download Q&A PDF error:", err);
      throw err;
    }
  };

  // Delete report
  const deleteReport = async (interviewId) => {
    setLoading(true);
    try {
      await deleteInterviewReport(interviewId);
      setReports((prev) => prev.filter((r) => r._id !== interviewId));
      if (report && report._id === interviewId) {
        setReport(null);
      }
      return true;
    } catch (error) {
      console.error("Delete report error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Update report title
  const updateReportTitle = async (interviewId, title) => {
    setLoading(true);
    try {
      const data = await updateInterviewReport(interviewId, { title });
      setReports((prev) =>
        prev.map((r) => (r._id === interviewId ? { ...r, title } : r))
      );
      if (report && report._id === interviewId) {
        setReport((prev) => ({ ...prev, title }));
      }
      return data.interviewReport;
    } catch (error) {
      console.error("Update report title error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Download Cover Letter PDF
  const getCoverLetterPdf = async (interviewReportId) => {
    try {
      const blob = await generateCoverLetterPdf({ interviewReportId });

      if (!(blob instanceof Blob)) {
        throw new Error("Invalid PDF received");
      }

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = `cover_letter_${interviewReportId}.pdf`;

      document.body.appendChild(link);
      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download Cover Letter PDF error:", err);
      throw err;
    }
  };

  // Fetch shared report
  const fetchSharedReport = useCallback(async (shareToken) => {
    setLoading(true);
    try {
      const data = await getSharedInterviewReport(shareToken);
      setReport(data.interviewReport);
      return data.interviewReport;
    } catch (error) {
      console.error("Fetch shared report error:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [setReport, setLoading]);

  // Auto fetch
  useEffect(() => {
    if (interviewId) {
      getReportById(interviewId);
    } else {
      getReports();
    }
  }, [interviewId, getReportById, getReports]);

  return {
    loading,
    report,
    reports,
    generateReport,
    getReportById,
    getReports,
    getResumePdf,
    getReportPdf,
    deleteReport,
    updateReportTitle,
    getCoverLetterPdf,
    fetchSharedReport,
  };
};
