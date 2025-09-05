import axios from "axios";

const API = axios.create({
  // Change the baseURL to a relative path
  baseURL: "/api",
  withCredentials: false,
});

// Notes
export const getNotes = (userId) => API.get(`/notes?userId=${userId}`);
export const createNote = (note) => API.post("/notes", note);
export const deleteNote = (id) => API.delete(`/notes/${id}`);

// Auth
export const sendEmail = (email) => API.post("/sendEmail", { email });
// The /verifyOtp and /signup endpoints were missing from the original api.js, let's add them
export const verifyOtp = (payload) => API.post("/verifyOtp", payload);
export const signup = (payload) => API.post("/signup", payload);


export default API;