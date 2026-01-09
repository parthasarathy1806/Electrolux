const schemaSDL = `#graphql
  scalar JSON

  type Query {
    getLookupData(
      lookupName: String!
      status: String
    ): [JSON]

    getFinancialPlatforms(
      functionalGroupId: ID!
    ): [FinancialPlatform!]!
  }

  type FinancialPlatform {
    platformId: ID!
    platformName: String!
    platformCategory: String!   # DIRECT | COMMON
    months: JSON                # { "YYYY-MM": units }
  }
`;

export default schemaSDL;
