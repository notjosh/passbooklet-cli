const notEmpty = <TValue>(
  value: TValue | null | undefined
): value is TValue => {
  if (value === null || value === undefined) {
    return false;
  }

  const testDummy: TValue = value;
  return true;
};

export default notEmpty;
