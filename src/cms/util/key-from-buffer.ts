import asn1js from 'asn1js';
import { getEngine } from 'pkijs/src/common.js';
import buf2ab from './buf2ab.js';

export default async (
  buffer: Buffer,
  algorithm: globalThis.AlgorithmIdentifier,
  usages: KeyUsage[] = ['sign']
): Promise<CryptoKey> => {
  const arrayBuffer = buf2ab(buffer);
  const asn1 = asn1js.fromBER(arrayBuffer);

  const subtle = getEngine().subtle;

  return subtle.importKey('pkcs8', buf2ab(buffer), algorithm, true, usages);
};
