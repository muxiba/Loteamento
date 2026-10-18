export function printHtml(parts, ...values) {
  const escape = value => String(value ?? '').replace(/[&<>"']/g, char =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  return parts.reduce((html, part, index) => html + part + (index < values.length ? escape(values[index]) : ''), '');
}
