import Amplify, { Auth } from 'aws-amplify';
import { createAuthLink } from 'aws-appsync-auth-link';
import { createSubscriptionHandshakeLink } from 'aws-appsync-subscription-link';
import { ApolloClient, InMemoryCache } from 'apollo-boost';
import { ApolloLink } from 'apollo-link';
import { onError } from 'apollo-link-error';
import { createHttpLink } from 'apollo-link-http';

// Fill up with your data
const AmplifyConfig = {
  cognito: {
    REGION: '',
    APP_CLIENT_ID: '',
    IDENTITY_POOL_ID: '',
    USER_POOL_ID: '',
  },
};

// Fill up with your data
const appsyncConfig = {
  graphqlEndpoint: '',
  region: '',
  authenticationType: 'AWS_IAM',
};

const errorLink = onError(({ graphQLErrors, networkError, forward, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.map(({ message, locations, path }) =>
      console.warn(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`),
    );
  } else if (networkError) console.warn(`[Network error]: ${networkError}`);
  else {
    return forward(operation);
  }
  return null;
});

// Get an apollo client from given links
function getApolloClient(links) {
  const link = ApolloLink.from([errorLink, ...links]);
  return new ApolloClient({
    link,
    cache: new InMemoryCache(),
  });
}

// Get client to use in local with local graphql server
export function getClientLocal() {
  const url = `http://localhost:${process.env.REACT_APP_GRAPHQL_SERVER_PORT}/`;
  const httpLink = createHttpLink({ uri: url, fetch: fetch });
  return getApolloClient([httpLink]);
}

export function getClient() {
  Amplify.configure({
    Auth: {
      identityPoolId: AmplifyConfig.cognito.IDENTITY_POOL_ID,
      region: AmplifyConfig.cognito.REGION,
      userPoolId: AmplifyConfig.cognito.USER_POOL_ID,
      userPoolWebClientId: AmplifyConfig.cognito.APP_CLIENT_ID,
    },
  });

  const url = appsyncConfig.graphqlEndpoint;
  const httpLink = createHttpLink({ uri: url, fetch: fetch });
  let link = ApolloLink.from([errorLink, httpLink]);
  const region = appsyncConfig.region;
  const auth = {
    type: appsyncConfig.authenticationType,
    credentials: () => Auth.currentCredentials().then(data => data),
  };
  link = [createAuthLink({ url, region, auth }), createSubscriptionHandshakeLink(url, httpLink)];

  return getApolloClient(link);
}
