// export const fetchOmdForm = async () => {
//   const res = await fetch("http://localhost:5000/api/omd/schema");
//   return res.json();
// };


import axios from "axios";

export const fetchOmdForm = async () => {
  try {
    const token = import.meta.env.OMD_JWT; // or however you stored your JWT
    const response = await axios.get("http://localhost:8585/api/v1/metadata/jsonSchema/brand", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    // ✅ Validate schema
    if (!response.data || typeof response.data !== "object") {
      throw new Error("Invalid schema response");
    }

    return response.data;
  } catch (error) {
    console.error("Failed to fetch OMD form schema:", error);
    return null; // ✅ avoid undefined
  }
};
