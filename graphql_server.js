const chalk = require('chalk');
// eslint-disable-next-line no-console
const log = console.log;
import { ApolloServer } from 'apollo-server';
import { findMock } from './src/Mock';
import gql from 'graphql-tag';

const schema = gql`
  type DataLng {
    id: ID!
    name: String
  }

  type DataConnectionLng {
    items: [DataLng]
    nextToken: String
  }

  type Query {
    listData(language: String, nextToken: String): DataConnectionLng
  }
`;

const serverFindMock = (parent, args, context, info) => {
  const result = findMock(info.fieldName, info.variableValues);
  const msg = `Ask mock for ${info.fieldName} ${JSON.stringify(info.variableValues)} -->`;
  if (result !== undefined) log(chalk.yellowBright(`${msg} found`));
  else log(chalk.red(`${msg} NOT found`));
  // To be checked why not to return undefined
  return result !== undefined ? result : 'failed_mocked';
};

// A map of functions which return data for the schema.
const resolvers = {
  Query: {},
};

const server = new ApolloServer({
  typeDefs: schema,
  mocks: {
    DataConnectionLng: serverFindMock,
  },
  mockEntireSchema: false,
  resolvers,
  context: async () => {
    return {
      req_context: true,
    };
  },
});

server.listen({ port: process.env.REACT_APP_GRAPHQL_SERVER_PORT }).then(({ url }) => {
  log(chalk.green(`🚀 Graphql server ready at ${url}`));
});
