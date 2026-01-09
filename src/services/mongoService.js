export const fetchMongoData = async () => {
  const res = await fetch("http://localhost:5000/api/mongo/data");
  return res.json();
};
