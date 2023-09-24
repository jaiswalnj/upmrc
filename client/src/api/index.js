import axios from "axios";
const apiInstance = axios.create({
  baseURL: "https://upmrctest.onrender.com/api",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

export default apiInstance;
