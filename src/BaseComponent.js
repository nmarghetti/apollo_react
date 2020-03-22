import React, { PureComponent } from 'react';
import PropTypes from 'prop-types';
import { traceFlow, DebugFlow, traceError } from './Trace';

export const ComponentStatus = {
  BORN: 1,
  LOADING: 2,
  READY: 3,
  NO_DATA: 4,
  DATA_ERROR: 5,
  ERROR: 6,
  DYING: 7,
  UNDEFINED: 8,
  properties: {
    1: { name: 'born' },
    2: { name: 'loading' },
    3: { name: 'ready' },
    4: { name: 'no_graphql_data' },
    5: { name: 'graphql_error' },
    6: { name: 'error' },
    7: { name: 'dying' },
    8: { name: 'undefined' },
  },
};

// Check here to know how to choose between Component and PureComponent:
// https://stackoverflow.com/questions/41340697/react-component-vs-react-purecomponent
// Basically PureComponent do a shallow comparison on props and state to know if an update is needed.
// Component do a deeper comparison and allow to override this function for a better control:
// shouldComponentUpdate(nextProps, nextState, nextContext)

/**
 * Replace some react functions by custom ones to have specific behaviours:
 * "initConstructor" --> "constructor".
 * "didMount" --> "componentDidMount".
 * "beforeUpdate" --> "getSnapshotBeforeUpdate".
 * "didUpdate" --> "componentDidUpdate".
 * "doRender" --> "render".
 * "didCatch" --> "componentDidCatch".
 * "willUnmount" --> "componentWillUnmount".
 * "getDerivedStateFromProps" --> just override as it is static.
 * This will allow to debug the content of the object at creation/rendering/update time.
 *
 * Redefine several functions for rendering:
 * "renderLoading" to change the rendering while loading graphql data.
 * "renderAlternativeLoading" to render something else while loading graphql data.
 * "renderNodata" to change the rendering when there is not data retrieved from graphqhl.
 * "renderError" to change the rendering of error.
 *
 * Define several functions to be notified on status update
 * "onStatusChange" will be called when the component status changes, it gives the old and new status as parameters
 * "onDataReady" will be called when the graphl data are ready
 */
export class BasePureComponent extends PureComponent {
  static propTypes = {
    notrace: PropTypes.bool,
    graphqlData: PropTypes.object,
  };

  static defaultProps = {
    notrace: false,
    graphqlData: null,
  };

  constructor(props) {
    super(props);
    this.state = {};

    if (props.graphqlData && props.graphqlData.error) {
      this.state._status = ComponentStatus.DATA_ERROR;
      traceFlow(this, DebugFlow.INIT);
      traceFlow(this, DebugFlow.DATA_ERROR);
      return;
    }

    if (this.initConstructor !== undefined) this.initConstructor(props);
    this.state._status = ComponentStatus.BORN;
    traceFlow(this, DebugFlow.INIT);
  }

  static getDerivedStateFromProps(props, state) {
    traceFlow({ props, state }, DebugFlow.DERIVE_STATE);
    return null;
  }

  updateComponentStatus() {
    const status = this.state._status === undefined ? ComponentStatus.UNDEFINED : this.state._status;
    if (status === ComponentStatus.UNDEFINED) {
      traceError(
        `BasePureComponent is misused${
          this.state._name === undefined ? '' : ` for ${this.state._name}`
        }, its status is undefined, did you call initConstructor instead of constructor ?`,
      );
    }

    if ([ComponentStatus.ERROR, ComponentStatus.DATA_ERROR, ComponentStatus.NO_DATA].indexOf(status) !== -1) return;

    var newStatus = ComponentStatus.READY;
    if (this.props.graphqlData) {
      if (this.props.graphqlData.error) newStatus = ComponentStatus.DATA_ERROR;
      else if (!this.props.graphqlData.loading && !this.props.graphqlData.result) newStatus = ComponentStatus.NO_DATA;
      else if (this.props.graphqlData.loading) newStatus = ComponentStatus.LOADING;
    }

    if (newStatus !== status) {
      this.setState({ _status: newStatus });
      traceFlow(this, DebugFlow.STATUS_CHANGE, ComponentStatus.properties[status].name, ComponentStatus.properties[newStatus].name);
      if (this.onStatusChange !== undefined) this.onStatusChange(status, newStatus);
      if (newStatus === ComponentStatus.DATA_ERROR) {
        traceFlow(this, DebugFlow.DATA_ERROR);
      } else if (newStatus === ComponentStatus.NO_DATA) {
        traceFlow(this, DebugFlow.NO_DATA);
      } else if (newStatus === ComponentStatus.READY && this.props.graphqlData) {
        traceFlow(this, DebugFlow.DATA);
        if (this.onDataReady !== undefined) this.onDataReady();
      }
    }
  }

  componentDidMount() {
    traceFlow(this, DebugFlow.MOUNT);
    this.updateComponentStatus();
    if (this.didMount !== undefined) this.didMount();
  }

  getSnapshotBeforeUpdate(prevProps, prevState) {
    traceFlow(this, DebugFlow.BEFORE_UPDATE, prevProps, prevState);
    // the return value here will be the snapshot given to componentDidUpdate
    return this.beforeUpdate !== undefined ? this.beforeUpdate(prevProps, prevState) : null;
  }

  componentDidUpdate(prevProps, prevState, snapshot) {
    traceFlow(this, DebugFlow.UPDATE, prevProps, prevState, snapshot);
    this.updateComponentStatus();
    if (this.didUpdate !== undefined) this.didUpdate(prevProps, prevState, snapshot);
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ _status: ComponentStatus.ERROR });
    traceFlow(this, DebugFlow.CATCH, error, errorInfo);
    if (this.didCatch !== undefined) this.didCatch(error, errorInfo);
  }

  componentWillUnmount() {
    this.setState({ _status: ComponentStatus.DYING });
    traceFlow(this, DebugFlow.UNMOUNT);
    if (this.willUnmount !== undefined) this.willUnmount();
  }

  traceFlowEvent(...args) {
    traceFlow(this, DebugFlow.EVENT, ...args);
  }

  // eslint-disable-next-line class-methods-use-this
  renderError() {
    return <div>Error</div>;
  }

  // eslint-disable-next-line class-methods-use-this
  renderLoading() {
    const alternativeLoading = this.renderAlternativeLoading !== undefined ? this.renderAlternativeLoading() : null;
    if (alternativeLoading) return alternativeLoading;
    return <div>Loading data...</div>;
  }

  // eslint-disable-next-line class-methods-use-this
  renderNodata() {
    return <div>No data found...</div>;
  }

  render() {
    traceFlow(this, DebugFlow.RENDER);

    const status = this.state._status;
    if (status === ComponentStatus.ERROR) return this.renderError();
    if (status === ComponentStatus.DATA_ERROR) return this.renderError();
    if (status === ComponentStatus.NO_DATA) return this.renderNodata();
    if (status === ComponentStatus.LOADING) return this.renderLoading();
    if (status === ComponentStatus.READY && this.doRender !== undefined) return this.doRender();
    return null;
  }
}

export default BasePureComponent;
