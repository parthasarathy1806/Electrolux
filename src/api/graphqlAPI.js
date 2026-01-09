import axios from "axios";

const GRAPHQL_URL = `${process.env.REACT_APP_API_BASE}/graphql`;

/**
 * Fetch lookup data via GraphQL with status support.
 * Falls back to REST if disabled or GraphQL fails.
 */
export const fetchGraphQLLookup = async (lookupKey, statusFilter, fallbackUrl) => {
  if (process.env.REACT_APP_USE_GRAPHQL !== "true") {
    const fallback = await axios.get(fallbackUrl);
    return fallback.data;
  }

  const query = `
  query {
    getLookupData(
      lookupName: "${lookupKey}"
      ${statusFilter ? `, status: "${statusFilter}"` : ""}
    )
  }
`;

  try {
    const res = await axios.post(GRAPHQL_URL, { query });
    const raw = res.data?.data?.getLookupData;

    if (!raw) throw new Error("Empty GraphQL response");

    // ✅ Case 1: already an array
    if (Array.isArray(raw)) return raw;

    // ✅ Case 2: wrapped object
    if (raw.data && Array.isArray(raw.data)) return raw.data;
    if (raw.items && Array.isArray(raw.items)) return raw.items;

    // ✅ Case 3: JSON string
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }

    // ❌ Unexpected shape → fallback
    throw new Error("Unsupported GraphQL response shape");

  } catch (err) {
    console.warn(`⚠️ GraphQL failed for ${lookupKey}, falling back to REST`, err);
    const fallback = await axios.get(fallbackUrl);
    return fallback.data;
  }
};
