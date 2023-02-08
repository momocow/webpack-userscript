export function interpolate(str: string, data: Record<string, string>): string {
  return Object.entries(data).reduce((value, [dataKey, dataVal]) => {
    return value.replace(new RegExp(`\\[${dataKey}\\]`, 'g'), `${dataVal}`);
  }, str);
}
