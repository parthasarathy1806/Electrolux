// backend/utils/getNextSequence.js
export async function getNextSequence(db, name, startValue) {
  const res = await db.collection("counters").findOneAndUpdate(
    { _id: name },
    [
      {
        $set: {
          seq: {
            $cond: [
              { $gt: ["$seq", null] },
              { $add: ["$seq", 1] },
              startValue
            ]
          }
        }
      }
    ],
    {
      upsert: true,
      returnDocument: "after",   // ✅ REQUIRED
      includeResultMetadata: false // ✅ REQUIRED in newer drivers
    }
  );

  if (!res || !res.value) {
    throw new Error("Failed to generate sequence number");
  }

  return res.value.seq;
}
