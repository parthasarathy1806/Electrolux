// import axios from "axios";

// const API_URL = "http://localhost:5000";

// export const fetchBrandData = async () => {
//   const res = await axios.get(`${API_URL}/api/mongo/brand`);
//   return res.data;
// };

import axios from "axios";

const API_URL = "http://localhost:5000";

// dynamic Mongo API fetch
export const fetchMongoData = async (lookupKey) => {
  const res = await axios.get(`${API_URL}/api/mongo/data/${lookupKey}`);
  return res.data;
};

export const saveMongoData = async (lookupKey, data) => {
  const res = await axios.post(`${API_URL}/api/mongo/data/${lookupKey}`, data);
  return res.data;
};

export const deleteMongoData = async (lookupKey, id, userName) => {
  const res = await axios.delete(`${API_URL}/api/mongo/data/${lookupKey}/${id}`, {
    data: { userName },
  });
  return res.data;
};
