import apiClient from "../../../lib/apiClient";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../../config/firebase";

export async function register({ username, email, password }) {
  try {
    const response = await apiClient.post("/api/auth/register", {
      username,
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function login({ email, password }) {
  try {
    const response = await apiClient.post("/api/auth/login", {
      email,
      password,
    });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function logout() {
  try {
    const response = await apiClient.get("/api/auth/logout");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function googleLogin() {
  try {
    const result = await signInWithPopup(auth, googleProvider);

    const idToken = await result.user.getIdToken();

    const response = await apiClient.post("/api/auth/google", {
      token: idToken,
    });

    return response.data;
  } catch (error) {
    console.error(error);
    throw error; // ✅ IMPORTANT
  }
}

export async function getMe() {
  try {
    const response = await apiClient.get("/api/auth/get-me");
    return response.data;
  } catch (error) {
    if (error.response?.status !== 401) {
      console.error(error);
    }
    throw error;
  }
}

export async function requestEmailVerification() {
  try {
    const response = await apiClient.post("/api/auth/verify-email/request");
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data || { message: "Failed to request email verification" };
  }
}

export async function confirmEmailVerification({ otp }) {
  try {
    const response = await apiClient.post("/api/auth/verify-email/confirm", { otp });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data || { message: "Failed to verify email OTP" };
  }
}

export async function forgotPassword({ email }) {
  try {
    const response = await apiClient.post("/api/auth/forgot-password", { email });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data || { message: "Failed to request password reset OTP" };
  }
}

export async function resetPassword({ email, otp, newPassword }) {
  try {
    const response = await apiClient.post("/api/auth/reset-password", { email, otp, newPassword });
    return response.data;
  } catch (error) {
    console.error(error);
    throw error.response?.data || { message: "Failed to reset password" };
  }
}
