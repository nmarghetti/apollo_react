export function getData() {
  const { href } = window.location;
  if (href.match(/data=online/)) return null;
  if (href.match(/data=local_server/)) return 'local_server';
  return 'mock';
}
