#! /bin/sh

YARN="$(dirname $(which node))/yarn"
if [ ! -e "$YARN" ]; then
  YARN=$(which yarn)
fi

case $1 in
  first)
    echo "First installation..."

    test "$($YARN list --depth 0 | grep -c ' yarn@')" -eq 0 && $YARN add yarn@^$($YARN --version)

    echo "Install application packages..."
    $YARN add \
    react-scripts react-dom \
    apollo-boost graphql graphql-tag react react-apollo \
    aws-amplify aws-appsync-auth-link aws-appsync-subscription-link

    echo "Install dev packages..."
    $YARN add --dev \
    @babel/node @babel/preset-env apollo-server @apollo/react-testing env-cmd chalk

  ;;
  lock)
    $YARN install --frozen-lockfile
  ;;
  list)
    $YARN list --depth 0
    npm list -g --depth 0
  ;;
esac
