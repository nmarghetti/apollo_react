import { MockedProvider } from '@apollo/react-testing';
import ListData from './QueryData';

export default class AppMocked extends MockedProvider {
  constructor(props) {
    super({ mocks: mocks, ...props });
  }
}

export const findMock = (query_name, variables) => {
  var result = undefined;
  mocks.forEach(mock => {
    if (result !== undefined) return;
    mock.request.query.definitions.forEach(def => {
      if (result !== undefined) return;
      if (def.operation === 'query') {
        if (def.selectionSet.selections[0].name.value === query_name) {
          if (
            JSON.stringify(Object.entries(mock.request.variables).sort((a, b) => a[0].localeCompare(b[0]))) ===
            JSON.stringify(Object.entries(variables).sort((a, b) => a[0].localeCompare(b[0])))
          ) {
            result = mock.result.data.result;
          }
        }
      }
    });
  });
  return result;
};

export const mocks = [
  {
    request: {
      query: ListData,
      variables: {
        language: 'en',
      },
    },
    result: {
      data: {
        result: {
          items: [
            {
              id: 'data001',
              hidden: false,
              name: 'Data 001',
              __typename: 'ListData',
            },
            {
              id: 'data002',
              hidden: false,
              name: 'Data 002',
              __typename: 'ListData',
            },
            {
              id: 'data003',
              hidden: false,
              name: 'Data 003',
              __typename: 'ListData',
            },
          ],
          __typename: 'ListDataConnection',
        },
      },
    },
  },
];
