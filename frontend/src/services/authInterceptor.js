import axios from "axios";
import { API_BASE_URL } from "./apiConfig";

axios.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest?._retry &&
      !originalRequest?.url?.includes(
        "/api/auth/token/refresh/"
      )
    ) {
      originalRequest._retry = true;

      const refreshToken =
        localStorage.getItem("refresh_token");

      if (!refreshToken) {
        localStorage.clear();
        window.location.href = "/";
        return Promise.reject(error);
      }

      try {
        const response = await axios.post(
         `${API_BASE_URL}/api/auth/token/refresh/`,
          {
            refresh: refreshToken,
          }
        );

        const nouveauToken = response.data.access;

        localStorage.setItem(
          "access_token",
          nouveauToken
        );

        originalRequest.headers.Authorization =
          `Bearer ${nouveauToken}`;

        return axios(originalRequest);
      } catch {
        localStorage.clear();
        window.location.href = "/";

        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);