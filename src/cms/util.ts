import AttributeTypeAndValue from 'pkijs/src/AttributeTypeAndValue.js';

const typeMap: Record<string, string> = {
  '2.5.4.6': 'C',
  '2.5.4.10': 'OU',
  '2.5.4.11': 'O',
  '2.5.4.3': 'CN',
  '2.5.4.7': 'L',
  '2.5.4.8': 'S',
  '2.5.4.12': 'T',
  '2.5.4.42': 'GN',
  '2.5.4.43': 'I',
  '2.5.4.4': 'SN',
};

const readableName = (tavs: AttributeTypeAndValue[]) => {
  return tavs
    .map((tav) => {
      // XXX: not sure if @types/pkijs is wrong, or if there are different returns, but this
      // usually seems like it's a string, so let's at least just try it.
      const typeKey = tav.type as unknown as string;
      const type = typeMap[typeKey] ?? typeKey;
      const value = tav.value.valueBlock.value;
      return `/${type}=${value}`;
    })
    .join('');
};

export { readableName };
