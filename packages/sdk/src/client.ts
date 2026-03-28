import axios, { AxiosInstance } from "axios";
import { DriftConfig, DriftError } from "./types";

export function createHttpClient(config: DriftConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.apiUrl ?? "https://api.drift.ai/v1",
    timeout: config.timeout ?? 10_000,
    headers: {
      "Authorization": `Bearer ${config.apiKey}`,
      "X-Drift-Org": config.organizationId,
      "Content-Type": "application/json",
      "X-Drift-SDK-Version": "0.1.0",
    },
  });

  // Retry interceptor
  client.interceptors.response.use(
    (res) => res,
    async (error) => {
      const maxRetries = config.retries ?? 2;
      const retryCount = (error.config?._retryCount ?? 0) as number;
      if (retryCount < maxRetries && error.response?.status >= 500) {
        error.config._retryCount = retryCount + 1;
        const delay = Math.pow(2, retryCount) * 300;
        await new Promise((r) => setTimeout(r, delay));
        return client(error.config);
      }
      const msg = error.response?.data?.message ?? error.message;
      const code = error.response?.data?.code ?? "UNKNOWN_ERROR";
      throw new DriftError(msg, code, error.response?.status, error.response?.data);
    }
  );

  return client;
}
