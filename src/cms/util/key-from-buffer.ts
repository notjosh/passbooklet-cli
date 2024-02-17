import asn1js from 'asn1js';
import { getEngine } from 'pkijs';
import buf2ab from './buf2ab.js';

export default async (
  buffer: Buffer,
  algorithm: globalThis.AlgorithmIdentifier,
  usages: KeyUsage[] = ['sign']
): Promise<CryptoKey> => {
  const arrayBuffer = buf2ab(buffer);
  const asn1 = asn1js.fromBER(arrayBuffer);

  const subtle = getEngine().crypto?.subtle;

  if (subtle == null) {
    throw new Error('WebCrypto not available');
  }

  return subtle.importKey('pkcs8', buf2ab(buffer), algorithm, true, usages);
};
