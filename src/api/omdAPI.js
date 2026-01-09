// import axios from "axios";

// const API_URL = "http://localhost:5000";

// export const fetchOMDSchema = async (schemaName) => {
//   const res = await axios.get(`${API_URL}/api/omd/schema/${schemaName}`);
//   return res.data;
// };

import axios from "axios";

export const fetchOMDSchema = async (url) => {
  const token = import.meta.env.VITE_OMD_JWT;
  const response = await axios.get(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return response.data;
};
