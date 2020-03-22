import React, { PureComponent } from 'react';
import { Query, withApollo, graphql } from 'react-apollo';
import { useQuery, useApolloClient } from '@apollo/react-hooks';
import { ApolloConsumer } from 'react-apollo';
import ListData from './QueryData';
import BasePureComponent from './BaseComponent';

export function withApolloComponent(component, query, getProps, getOptions = () => ({})) {
  return withApollo(
    graphql(query, {
      options: props => ({
        ...{
          context: {
            props,
          },
          fetchPolicy: 'network-only',
        },
        ...getOptions(props),
      }),
      props: ({ data, ownProps }) => ({ graphqlData: data, ...getProps(data, ownProps) }),
    })(component),
  );
}

class DataComp extends BasePureComponent {
  doRender() {
    return (
      <div>
        {this.props.graphqlData.result.items.map(item => (
          <div key={item.id}>{item.id}</div>
        ))}
      </div>
    );
  }
}

// withApollo
const getGraphlqlProps = ({ result = { items: [] } }) => {
  return { result };
};
const getGraphlOptions = props => ({ variables: props.variables });
const WithApolloComp = withApolloComponent(DataComp, ListData, getGraphlqlProps, getGraphlOptions);

// React class component
class ApolloComponent extends PureComponent {
  render() {
    return <ApolloConsumer>{client => <ApolloComponentConsumer client={client} {...this.props} />}</ApolloConsumer>;
  }
}
class ApolloComponentConsumer extends PureComponent {
  constructor(props) {
    super(props);
    this.state = { data: { loading: true } };
    if (this.props.client) {
      this.props.client
        .query({ query: props.query, variables: props.variables })
        .then(data => {
          this.setState({ data: { ...data, ...{ result: data.data && data.data.result ? data.data.result : null } } });
        })
        .catch(error => {
          this.setState({
            data: {
              error: error,
            },
          });
        });
    }
  }

  render() {
    const { Comp } = this.props;
    return <Comp graphqlData={this.state.data} />;
  }
}

// React function
const ApolloFunction = props => {
  const [data, setData] = React.useState({ loading: true });
  const [error, setError] = React.useState(null);
  const client = useApolloClient();

  React.useEffect(() => {
    client
      .query({ query: props.query, variables: props.variables })
      .then(data => {
        setData({ ...data, ...{ result: data.data && data.data.result ? data.data.result : null } });
      })
      .catch(error => setError(error));
  }, [props, client]);
  const graphqlData = error ? { error: error } : data;
  const { Comp } = props;
  return <Comp graphqlData={graphqlData} />;
};

// React class ApolloConsumer and Query
const WithQuery = props => (
  <ApolloConsumer>
    {client => (
      <Query client={client} {...props}>
        {({ loading, error, data }) => {
          console.log(data);
          const { Comp } = props;
          let graphqlData = null;
          if (loading) graphqlData = { loading: true };
          else if (error)
            graphqlData = {
              error: error,
            };
          else {
            graphqlData = data;
          }
          return <Comp graphqlData={graphqlData} />;
        }}
      </Query>
    )}
  </ApolloConsumer>
);

// React function useQuery
const WithUseQuery = props => {
  const info = useQuery(props.query, { ...props });
  console.log(info);
  const { Comp } = props;
  return <Comp graphqlData={{ ...info, ...{ result: info.data && info.data.result ? info.data.result : null } }} />;
};

export default class App extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      query: ListData,
      variables: { language: 'en' },
      Comp: DataComp,
    };
  }
  render() {
    return (
      <div>
        <p>
          Testing apollo Query.
          <br />
          <br />
          <a href="/">Try local mock (default)</a>
          <br />
          <a href="/data=local_server">Try local server</a>
          <br />
          <a href="/data=online">Try online</a>
          <br />
        </p>
        <div>Testing with ApolloComponent: </div>
        <ApolloComponent {...this.state} />
        <br></br>
        <div>Testing with Query: </div>
        <WithQuery {...this.state} />
        <br></br>
        <div>Testing with ApolloFunction</div>
        <ApolloFunction {...this.state} />
        <br></br>
        <div>Testing with useQuery</div>
        <WithUseQuery {...this.state} />
        <br></br>
        <div>Testing with useApollo</div>
        <WithApolloComp {...this.state} />
      </div>
    );
  }
}
