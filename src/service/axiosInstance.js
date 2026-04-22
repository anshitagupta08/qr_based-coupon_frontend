import axios from "axios";

const api = axios.create({
  baseURL: "https://retailuat.abisaio.com:9001/api",
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
