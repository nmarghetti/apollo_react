import gql from 'graphql-tag';

export default gql`
  query($language: String!) {
    result: listData(language: $language) {
      items {
        id
        name
      }
    }
  }
`;
