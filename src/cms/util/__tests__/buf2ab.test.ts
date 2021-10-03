import buf2ab from '../buf2ab';

describe('buf2ab', () => {
  it('works', () => {
    const buffer = Buffer.from('hello, world', 'utf-8');
    const ab = buf2ab(buffer);

    expect(ab).toBeInstanceOf(ArrayBuffer);
  });
});
