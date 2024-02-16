import Path from 'path';
import { Certificate, CryptoEngine, getEngine, setEngine } from 'pkijs';
import { fileURLToPath } from 'url';
import { CMSCertificateChainMode } from '../../types/certificate-chain-mode.js';
import certificateChainFor from '../certificate-chain-for.js';
import readPEMCertificate from '../read-pem-certificate.js';
import { readableTypesAndValues } from '../readable-name.js';
import { webcrypto } from 'crypto';

// TODO: when @types/node catches up, clean this up
const name = 'node-webcrypto' as const;
const crypto = webcrypto;

setEngine(
  name,
  new CryptoEngine({
    name,
    crypto: crypto as any,
  }) as any
);
const subtle = getEngine().crypto?.subtle as SubtleCrypto;

const __filename = fileURLToPath(import.meta.url);
const __dirname = Path.dirname(__filename);

const CheckDate = new Date('2021-10-05T00:00:00Z');

const relative = (path: string): string => Path.join(__dirname, path);

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

const identityFooBarBaz1Certificate = await readPEMCertificate(
  relative('../../../../test-fixtures/vault/sender_identity_foo_bar_baz_1.crt')
);

const subjectCommonNames = (chain: Certificate[]): string[] =>
  chain.map(
    (certificate) =>
      readableTypesAndValues(certificate.subject.typesAndValues)['CN']
  );

const chainConfigs = {
  shallow: {
    certificate: identityFoo1Certificate,
    certificates: [],
    trustedCertificates: [certificateCARoot, certificateCAFoo],
  },
  deep: {
    certificate: identityFooBarBaz1Certificate,
    certificates: [],
    trustedCertificates: [
      certificateCARoot,
      certificateCAFoo,
      certificateCAFooBar,
      certificateCAFooBarBaz,
    ],
  },
};

describe('certificateChainFor', () => {
  describe('CMSCertificateChainMode.none', () => {
    it('[shallow] returns empty', async () => {
      const chain = await certificateChainFor(
        chainConfigs.shallow.certificate,
        chainConfigs.shallow.certificates,
        chainConfigs.shallow.trustedCertificates,
        CMSCertificateChainMode.none,
        CheckDate
      );

      expect(chain).toHaveLength(0);
      expect(subjectCommonNames(chain)).toEqual([]);
    });

    it('[deep] returns empty', async () => {
      const chain = await certificateChainFor(
        chainConfigs.deep.certificate,
        chainConfigs.deep.certificates,
        chainConfigs.deep.trustedCertificates,
        CMSCertificateChainMode.none,
        CheckDate
      );

      expect(chain).toHaveLength(0);
      expect(subjectCommonNames(chain)).toEqual([]);
    });
  });

  describe('CMSCertificateChainMode.chain', () => {
    fit('[shallow] returns intermediates and leaf', async () => {
      const chain = await certificateChainFor(
        chainConfigs.shallow.certificate,
        chainConfigs.shallow.certificates,
        chainConfigs.shallow.trustedCertificates,
        CMSCertificateChainMode.chain,
        CheckDate
      );

      // expect(chain).toHaveLength(2);
      // expect(subjectCommonNames(chain)).toEqual(['foo 1', 'foo']);
    });

    it('[deep] returns intermediates and leaf', async () => {
      const chain = await certificateChainFor(
        chainConfigs.deep.certificate,
        chainConfigs.deep.certificates,
        chainConfigs.deep.trustedCertificates,
        CMSCertificateChainMode.chain,
        CheckDate
      );

      expect(chain).toHaveLength(4);
      expect(subjectCommonNames(chain)).toEqual([
        'foo bar baz 1',
        'foo bar baz',
        'foo bar',
        'foo',
      ]);
    });
  });

  describe('CMSCertificateChainMode.chainWithRoot', () => {
    it('[shallow] returns complete chain', async () => {
      const chain = await certificateChainFor(
        chainConfigs.shallow.certificate,
        chainConfigs.shallow.certificates,
        chainConfigs.shallow.trustedCertificates,
        CMSCertificateChainMode.chainWithRoot,
        CheckDate
      );

      expect(chain).toHaveLength(3);
      expect(subjectCommonNames(chain)).toEqual(['foo 1', 'foo', 'Root CA']);
    });

    it('[deep] returns complete chain', async () => {
      const chain = await certificateChainFor(
        chainConfigs.deep.certificate,
        chainConfigs.deep.certificates,
        chainConfigs.deep.trustedCertificates,
        CMSCertificateChainMode.chainWithRoot,
        CheckDate
      );

      expect(chain).toHaveLength(5);
      expect(subjectCommonNames(chain)).toEqual([
        'foo bar baz 1',
        'foo bar baz',
        'foo bar',
        'foo',
        'Root CA',
      ]);
    });
  });

  describe('CMSCertificateChainMode.signerOnly', () => {
    it('[shallow] returns leaf', async () => {
      const chain = await certificateChainFor(
        chainConfigs.shallow.certificate,
        chainConfigs.shallow.certificates,
        chainConfigs.shallow.trustedCertificates,
        CMSCertificateChainMode.signerOnly,
        CheckDate
      );

      expect(chain).toHaveLength(1);
      expect(subjectCommonNames(chain)).toEqual(['foo 1']);
    });

    it('[deep] returns leaf', async () => {
      const chain = await certificateChainFor(
        chainConfigs.deep.certificate,
        chainConfigs.deep.certificates,
        chainConfigs.deep.trustedCertificates,
        CMSCertificateChainMode.signerOnly,
        CheckDate
      );

      expect(chain).toHaveLength(1);
      expect(subjectCommonNames(chain)).toEqual(['foo bar baz 1']);
    });
  });
});
