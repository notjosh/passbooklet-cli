import asn1js from 'asn1js';
import Certificate from 'pkijs/src/Certificate.js';

const certificateFor = (buffer: Buffer): Certificate => {
  const arrayBuffer = new Uint8Array(buffer).buffer;
  const asn1 = asn1js.fromBER(arrayBuffer);

  return new Certificate({
    schema: asn1.result,
  });
};

export default certificateFor;
