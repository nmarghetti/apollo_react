import React from 'react';
import ReactDOM from 'react-dom';
import { ApolloProvider } from 'react-apollo';
import App from './App';
import { getClientLocal, getClient } from './Client';
import AppMocked from './Mock';
import { getData } from './Application';

export function getApp() {
  const data = getData();
  if (data === 'mock') {
    return (
      <div>
        <div style={{ backgroundColor: 'chartreuse' }}>!!! You are using mock data !!!</div>
        <AppMocked>
          <App />
        </AppMocked>
      </div>
    );
  } else if (data === 'local_server') {
    return (
      <div>
        <div style={{ backgroundColor: 'ForestGreen' }}>
          {"!!! You are using local graphql server !!! Run 'yarn graphql_server' if not done yet ;)"}
        </div>
        <ApolloProvider client={getClientLocal()}>
          <App />
        </ApolloProvider>
      </div>
    );
  }
  return (
    <div>
      <div style={{ backgroundColor: 'LightBlue' }}>
        {'!!! You are using online server !!! Dont forget to setup your config in Client.js ;)'}
      </div>
      <ApolloProvider client={getClient()}>
        <App />
      </ApolloProvider>
    </div>
  );
}

ReactDOM.render(getApp(), document.getElementById('root'));
