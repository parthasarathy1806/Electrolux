// backend/graphql/index.js
import { makeExecutableSchema } from "@graphql-tools/schema";
import { graphqlHTTP } from "express-graphql";

import schemaSDL from "./schema.js";
import resolvers from "./resolvers.js";
import { mongoMapperTypeDefs, mongoMapperResolvers } from "./mongoMapperSchema.js";

// 1️⃣ Merge schema SDLs (strings)
const typeDefs = `
  ${schemaSDL}
  ${mongoMapperTypeDefs}
`;

// 2️⃣ Combine resolvers
const rootResolvers = {
  Query: {
    ...(resolvers.Query || {}),
    ...(mongoMapperResolvers.Query || {}),
  },
};

// 3️⃣ Build actual GraphQL schema (no longer a string!)
const schema = makeExecutableSchema({
  typeDefs,
  resolvers: rootResolvers,
});

// 4️⃣ Export proper GraphQL middleware
export const graphqlMiddleware = graphqlHTTP({
  schema,
  graphiql: true,
});
