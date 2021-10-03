import { jest } from '@jest/globals';
import { dirname, join } from 'path';
import { getEngine } from 'pkijs/src/common.js';
import { fileURLToPath } from 'url';
import readPEMCertificate from '../../util/read-pem-certificate';
import CMSEncoder from '../index';
import readPEM, { PEMContentKind } from '../../util/read-pem';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import { webcrypto } from 'crypto';
import { setEngine } from 'pkijs/src/common.js';
import CryptoEngine from 'pkijs/src/CryptoEngine.js';
import buf2ab from '../../util/buf2ab';
// TODO: when @types/node catches up, clean this up
const name = 'node-webcrypto';
const crypto = webcrypto;
setEngine(
  name,
  crypto as unknown as Crypto,
  new CryptoEngine({
    name,
    crypto,
    subtle: (crypto as any)['subtle'],
  }) as unknown as SubtleCrypto
);
const subtle = getEngine().subtle;

const relative = (path: string): string => join(__dirname, path);

const certificateCARoot = await readPEMCertificate(
  relative('../../../../test-fixtures/vault/sender_ca_root/CA.crt')
);

const certificateCAFoo = await readPEMCertificate(
  relative('../../../../test-fixtures/vault/sender_ca_foo/CA.crt')
);

const certificateCAFooBar = await readPEMCertificate(
  relative('../../../../test-fixtures/vault/sender_ca_foo_bar/CA.crt')
);

const certificateCAFooBarBaz = await readPEMCertificate(
  relative('../../../../test-fixtures/vault/sender_ca_foo_bar_baz/CA.crt')
);

const identityFoo1Certificate = await readPEMCertificate(
  relative('../../../../test-fixtures/vault/sender_identity_foo_1.crt')
);

const identityFoo1KeyPath = relative(
  '../../../../test-fixtures/vault/sender_identity_foo_1.pkcs8.key'
);

const identityFoo1Key = await subtle.importKey(
  'pkcs8',
  buf2ab(await readPEM(identityFoo1KeyPath, PEMContentKind.PrivateKey)),
  (
    await identityFoo1Certificate.getPublicKey()
  ).algorithm,
  true,
  ['sign']
);

const identityFoo1 = {
  certificate: identityFoo1Certificate,
  key: identityFoo1Key,
};

const identityFooBarBaz1Certificate = await readPEMCertificate(
  relative('../../../../test-fixtures/vault/sender_identity_foo_bar_baz_1.crt')
);

describe('CMSEncoder', () => {
  it('encode() detached content', async () => {
    // it will encode the date, so let's make sure it's deterministic
    const mockDate = new Date('2021-10-04T11:01:58.135Z');

    // XXX: is there a way to convince TypeScript that this _should_ be a Date by default?
    const spy = jest.spyOn(global, 'Date') as unknown as jest.SpyInstance<Date>;
    spy.mockImplementation(() => mockDate);

    const content = Buffer.from('hello, world!', 'utf-8');

    const result = await CMSEncoder.encode(
      [certificateCARoot, certificateCAFoo],
      identityFoo1,
      undefined,
      undefined,
      true,
      [],
      content
    );

    spy.mockRestore();

    // TODO: more checks:
    //       - number of signers
    //       - algorithm
    //       - certificate chain
    //       - signature is valid according to external tool
    // TODO: base64 comparison is fragile and opaque, remove it asap
    expect(result.toString('base64')).toBe(
      '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'
    );
  });

  // TODO: attached content
  // TODO: multiple senders
  // TODO: encryption (aka recipients)
  // TODO: different certificate chain modes
  // TODO: signed attributes
  // TODO: supporting certificates
  // TODO: error case: missing intermediate certificate
});
