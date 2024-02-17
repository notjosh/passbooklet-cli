import asn1js from 'asn1js';
import { Certificate } from 'pkijs';

const certificateFor = (buffer: Buffer): Certificate => {
  // TODO: use buf2ab
  const arrayBuffer = new Uint8Array(buffer).buffer;
  const asn1 = asn1js.fromBER(arrayBuffer);

  return new Certificate({
    schema: asn1.result,
  });
};

export default certificateFor;
