/** ISO-строка с сервера → значение для input type="datetime-local" (локальное время). */
export function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Значение datetime-local → ISO для API. */
export function fromDatetimeLocalValue(value: string): string {
  return new Date(value).toISOString();
}
