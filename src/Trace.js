const isProductionMode = () => false;
const isRunningTestMode = () => false;
const isDebugFlow = () => true;

/* eslint no-console: 'off' */

const traceLevel = {
  debug: 1,
  log: 2,
  info: 3,
  warn: 4,
  error: 5,
  stack: 6,
  count: 7,
  table: 8,
};

function trace(level, ...data) {
  if (isRunningTestMode()) return;
  if (isProductionMode()) {
    switch (level) {
      case traceLevel.warn:
      case traceLevel.error:
        break;
      default:
        return;
    }
  }
  if (!console) return;
  switch (level) {
    case traceLevel.debug:
      if (console.debug) console.debug(...data);
      break;
    case traceLevel.log:
      if (console.log) console.log(...data);
      break;
    case traceLevel.info:
      if (console.info) console.info(...data);
      break;
    case traceLevel.warn:
      if (console.warn) console.warn(...data);
      break;
    case traceLevel.error:
      if (console.error) console.error(...data);
      break;
    case traceLevel.stack:
      if (console.log) {
        console.log('%c - %s -', 'color: yellow; background-color: black;', data.join(' '));
      }
      if (console.trace) console.trace(...data);
      break;
    case traceLevel.count:
      if (console.count) console.count(...data);
      break;
    case traceLevel.table:
      if (console.table) console.table(...data);
      break;
    default:
      if (console.log) console.log(...data);
  }
}

export function traceAssert(assertion, ...data) {
  if (!console || !console.assert || !console.trace) return;
  console.assert(assertion, ...data);
  if (!assertion) {
    console.trace();
  }
}

export function traceTable(...data) {
  trace(traceLevel.table, ...data);
}

export const DebugFlow = {
  // React component
  INIT: 1,
  MOUNT: 2,
  DERIVE_STATE: 3,
  BEFORE_UPDATE: 4,
  UPDATE: 5,
  RENDER: 6,
  STATUS_CHANGE: 7,
  DATA: 8,
  NO_DATA: 9,
  DATA_ERROR: 10,
  CATCH: 11,
  UNMOUNT: 12,
  // Other flow
  EVENT: 13,
  colors: [
    'color: yellow; background-color: blue;', // 0
    'color: yellow; background-color: green;', // 1
    'color: yellow; background-color: grey;', // 2
    'color: yellow; background-color: purple;', // 3
    'color: yellow; background-color: red;', // 4
    'color: yellow; background-color: brown;', // 5
    'color: yellow; background-color: darkslategray;', // 6
  ],
  datas: [
    (obj, name) => [...(obj.props ? ['props', obj.props] : []), ...(obj.state ? ['state', obj.state] : []), name, obj], // 0
    obj => ['props', obj.props, 'state', obj.state], // 1
    (obj, name, ...data) => ['prevProps', data[0], 'prevState', data[1]], // 2
    (obj, name, ...data) => ['props', obj.props, 'state', obj.state, 'snapshot', data[2]], // 3
    obj => [obj], // 4
    (obj, name, ...data) => data, // 5
    obj => [obj.props.graphqlData], // 6
    obj => [
      obj.props.graphqlData.error.message.substr(
        0,
        obj.props.graphqlData.error.message.indexOf(':') !== -1 ? obj.props.graphqlData.error.message.indexOf(':') : 64,
      ),
      { details: { error: obj.props.graphqlData.error } },
    ], // 7
    () => [], // 8
  ],
  properties: {
    1: { color: 0, data: 0, message: 'Constructor of %s' },
    2: { color: 2, data: 1, message: '%s did mount' },
    3: { color: 2, data: 1, message: 'getDerivedStateFromProps %s' },
    4: { color: 2, data: 2, message: '%s before update' },
    5: { color: 2, data: 3, message: '%s did update' },
    6: { color: 1, data: 4, message: 'Rendering of %s' },
    7: { color: 2, data: 5, message: '%s changed status: %s -> %s' },
    8: { color: 3, data: 6, message: '%s received graphql data' },
    9: { color: 3, data: 8, message: '%s received no graphql data' },
    10: { color: 4, data: 7, message: '%s had graphql error' },
    11: { color: 4, data: 5, message: '%s caught an error' },
    12: { color: 5, data: 8, message: '%s is dying' },
    13: { color: 6, data: 5, message: '%s event %s' },
  },
};

export function traceFlow(obj, flow, ...data) {
  if (obj && obj.props && obj.props.notrace) return;
  if (isDebugFlow()) {
    var name = '?';
    if (obj.state && obj.state._name) name = obj.state._name;
    else {
      /* eslint-disable-next-line no-proto */
      name = obj.__proto__.constructor.name;
      if (name !== 'Object' && obj.state) obj.state._name = name;
    }
    trace(
      traceLevel.debug,
      `%c- ${DebugFlow.properties[flow].message} -`,
      DebugFlow.colors[DebugFlow.properties[flow].color],
      name,
      ...DebugFlow.datas[DebugFlow.properties[flow].data](obj, name, ...data),
    );
  } else {
    // Still trace the errors if not in debug flow
    if (flow === DebugFlow.DATA_ERROR) {
      traceError(obj.props.graphqlData.error);
    } else if (flow === DebugFlow.CATCH) {
      traceError(...data);
    }
  }
}

export function traceDebug(...data) {
  trace(traceLevel.debug, ...data);
}

export function traceLog(...data) {
  trace(traceLevel.log, ...data);
}

export function traceInfo(...data) {
  trace(traceLevel.info, ...data);
}

export function traceWarn(...data) {
  trace(traceLevel.warn, ...data);
}

export function traceError(...data) {
  trace(traceLevel.error, ...data);
}

export function traceStack(...data) {
  trace(traceLevel.stack, ...data);
}
