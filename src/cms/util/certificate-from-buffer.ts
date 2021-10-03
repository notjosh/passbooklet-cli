import asn1js from 'asn1js';
import Certificate from 'pkijs/src/Certificate.js';
import buf2ab from './buf2ab.js';

export default (buffer: Buffer): Certificate => {
  const arrayBuffer = buf2ab(buffer);
  const asn1 = asn1js.fromBER(arrayBuffer);

  return new Certificate({
    schema: asn1.result,
  });
};
