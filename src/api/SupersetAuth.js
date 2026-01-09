// import axios from "axios";

// const supersetClient = axios.create({
//   baseURL: process.env.REACT_APP_SUPERSET_URL.replace(/\/$/, ""),
//   headers: { "Content-Type": "application/json" },
//   withCredentials: true,  // ⬅️ CHANGE THIS TO TRUE
// });

// // 1️⃣ Login to Superset
// export async function supersetLogin() {
//   try {
//     const { data } = await supersetClient.post("/api/v1/security/login", {
//       username: process.env.REACT_APP_SUPERSET_USER,
//       password: process.env.REACT_APP_SUPERSET_PASS,
//       provider: "db",
//       refresh: true,
//     });

//     console.log("✅ Superset login successful");
//     return data.access_token;
//   } catch (error) {
//     console.error("❌ Superset login failed:", error.response?.data || error.message);
//     throw error;
//   }
// }

// export async function getCsrfToken(accessToken) {
//   const {data: csrfData} = await supersetClient.get('/api/v1/security/csrf_token/', {
//     headers: {Authorization: `Bearer ${accessToken}`},
//   })
//   if (!csrfData.result) new Error('CSRF Token is missing')
 
//   return csrfData.result
// }

// // 2️⃣ Generate Guest Token
// export async function getSupersetGuestToken(dashboardId) {
//   try {
//     const accessToken = await supersetLogin();
//     const csrfToken = await getCsrfToken(accessToken)

//     const { data } = await supersetClient.post(
//       "/api/v1/security/guest_token/",
//       {
//         resources: [{ type: "dashboard", id: dashboardId }],
//         rls: [],
//         user: {
//           username: "admin",
//           first_name: "admin",
//           last_name: "admin",
//         }
//       },
//       {
//         headers: { Authorization: `Bearer ${accessToken}`,  'X-CSRFToken': csrfToken, },
//       }
//     );

//     console.log("✅ Guest token generated successfully");
//     return data.token;
//   } catch (error) {
//     console.error("❌ Guest token generation failed:", error.response?.data || error.message);
//     throw error;
//   }
// }