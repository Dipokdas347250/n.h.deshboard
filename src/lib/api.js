import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

/**
 * The server's English message for an axios failure.
 *
 * Inside a component prefer `useLanguage().apiMessage(error)`, which returns
 * the same message in whichever language the reader picked.
 */
export function getErrorMessage(error) {
  return error?.response?.data?.message || error?.message || "Something went wrong";
}
