import asn1js from 'asn1js';
import { spawn } from 'child_process';
import { readFile } from 'fs/promises';
import Path from 'path';
import AlgorithmIdentifier from 'pkijs/src/AlgorithmIdentifier.js';
import Attribute from 'pkijs/src/Attribute.js';
import AttributeTypeAndValue from 'pkijs/src/AttributeTypeAndValue.js';
import Certificate from 'pkijs/src/Certificate.js';
import CertificateChainValidationEngine from 'pkijs/src/CertificateChainValidationEngine.js';
import { getEngine } from 'pkijs/src/common.js';
import ContentInfo from 'pkijs/src/ContentInfo.js';
import EncapsulatedContentInfo from 'pkijs/src/EncapsulatedContentInfo.js';
import IssuerAndSerialNumber from 'pkijs/src/IssuerAndSerialNumber.js';
import SignedAndUnsignedAttributes from 'pkijs/src/SignedAndUnsignedAttributes.js';
import SignedData from 'pkijs/src/SignedData.js';
import SignerInfo from 'pkijs/src/SignerInfo.js';
import { rootCertificates } from 'tls';
import { wwdrCertificates } from '../creepto/known-certificates.js';

export type SignerConfig = {
  wwdrCertificatePath: string;
  certificatePath: string;
};

/*
Convert a string into an ArrayBuffer
from https://developers.google.com/web/updates/2012/06/How-to-convert-ArrayBuffer-to-and-from-String
*/
function str2ab(str: string): ArrayBuffer {
  const buf = new ArrayBuffer(str.length);
  const bufView = new Uint8Array(buf);
  for (let i = 0, strLen = str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
  return buf;
}

function buf2ab(buf: Buffer): ArrayBuffer {
  return new Uint8Array(buf).buffer;
}

/*
Import a PEM encoded RSA private key, to use for RSA-PSS signing.
Takes a string containing the PEM encoded key, and returns a Promise
that will resolve to a CryptoKey representing the private key.
*/
const importPrivateKey = async (pem: string) => {
  // fetch the part of the PEM string between header and footer
  const pemHeader = '-----BEGIN PRIVATE KEY-----';
  const pemFooter = '-----END PRIVATE KEY-----';
  const start = pem.indexOf(pemHeader);
  const end = pem.indexOf(pemFooter);

  if (start === -1 || end === -1) {
    throw new Error('pem does not contain private key');
  }

  const pemContents = pem
    .substring(start + pemHeader.length, end)
    .trim()
    .split('\n')
    .join('');
  console.log({ pemContents });
  // base64 decode the string to get the binary data
  const binaryDerString = Buffer.from(pemContents, 'base64');
  // convert from a binary string to an ArrayBuffer
  const binaryDer = buf2ab(binaryDerString);

  const engine = getEngine();

  return engine.subtle.importKey(
    'pkcs8',
    binaryDer,
    {
      name: 'RSASSA-PKCS1-V1_5',
      hash: { name: 'SHA-1' },
    },
    true,
    ['sign']
  );
};

const importCertificate = async (pem: string) => {
  // fetch the part of the PEM string between header and footer
  const pemHeader = '-----BEGIN CERTIFICATE-----';
  const pemFooter = '-----END CERTIFICATE-----';
  const start = pem.indexOf(pemHeader);
  const end = pem.indexOf(pemFooter);

  if (start === -1 || end === -1) {
    throw new Error('pem does not contain certificate');
  }

  const pemContents = pem
    .substring(start + pemHeader.length, end)
    .trim()
    .split('\n')
    .join('');
  console.log({ pemContents });

  const binaryDerString = Buffer.from(pemContents, 'base64');
  const arrayBuffer = buf2ab(binaryDerString);
  const asn1 = asn1js.fromBER(arrayBuffer);

  return new Certificate({
    schema: asn1.result,
  });
};

function dumptavs(tavs: AttributeTypeAndValue[]) {
  let pieces = [];
  for (var i = 0; i < tavs.length; i++) {
    const tav = tavs[i];
    // console.log({tav});
    // OID map
    var typemap: Record<string, string> = {
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
    const typestring = tav.type as any as string;
    const typeval = typemap[typestring] ?? tav.type;
    const val = tav.value.valueBlock.value;
    const ulrow = `${typeval}: ${val}`;

    //   document.getElementById("cert-subject").innerHTML = document.getElementById("cert-subject").innerHTML + ulrow;
    pieces.push(ulrow);
    // if(typeval == "CN")
    //       document.getElementById("cert-subject-cn").innerHTML = subjval;
    // console.log(val)
  }

  console.log(pieces.join(' / '));
}

// we have a number of valid candidates, depending on who issues the certificate we want to sign with
const findWwdrCertificateFor = async (
  certificate: Certificate
): Promise<Certificate> => {
  const candidates = [
    ...wwdrCertificates,

    // target for sorting must be at end of list
    // found via: https://github.com/PeculiarVentures/PKI.js/issues/114
    certificate,
  ];

  const certificateChainValidationEngineParameters = {
    certs: candidates,
    trustedCerts: rootCertificates, // XXX: include CA here? we only want to check a single level, does it recurse?
  };

  const certificateChainEngine = new CertificateChainValidationEngine(
    certificateChainValidationEngineParameters
  );

  const chain: Certificate[] = await certificateChainEngine.sort();

  if (chain.length < 3) {
    throw new Error(
      'expected certificate chain of: [your certificate] -> [WWDR certificate] -> [Apple CA], but could not find a full chain. perhaps the code needs to be made aware of new Apple certificates!'
    );
  }

  if (!certificate.subject.isEqual(chain[0].subject)) {
    throw new Error(
      'somehow, the certificate chain found another entry at the top, instead of your certificate!'
    );
  }

  return chain[1];
};

class PKIJSSigner {
  private config: SignerConfig;

  constructor(config: SignerConfig) {
    this.config = config;
  }

  async signString(string: string): Promise<Buffer> {
    const pempempem = await readFile(this.config.certificatePath, 'utf-8');
    const privateKey: CryptoKey = await importPrivateKey(pempempem);
    console.log({ privateKey });
    const certificate: Certificate = await importCertificate(pempempem);
    console.log({ certificate });
    const wwdrcertificate: Certificate = await findWwdrCertificateFor(
      certificate
    );

    console.log({ certificate });

    const engine = getEngine();
    const ab = buf2ab(Buffer.from(string, 'utf-8'));
    const hash = await engine.subtle.digest({ name: 'SHA-1' }, ab);

    const signedData = new SignedData({
      version: 1,
      encapContentInfo: new EncapsulatedContentInfo({
        eContentType: '1.2.840.113549.1.7.1', // "data" content type
      }),
      certificates: [wwdrcertificate, certificate],
    });

    const signerInfo = new SignerInfo({
      version: 1,
      signatureAlgorithm: new AlgorithmIdentifier({
        algorithmId: '1.2.840.113549.1.1.1',
      }),
      sid: new IssuerAndSerialNumber({
        issuer: certificate.issuer,
        serialNumber: certificate.serialNumber,
      }),
      signedAttrs: new SignedAndUnsignedAttributes({
        type: 0,
        attributes: [
          // contentType
          new Attribute({
            type: '1.2.840.113549.1.9.3',
            values: [
              new asn1js.ObjectIdentifier({
                value: '1.2.840.113549.1.7.1',
              }),
            ],
          }),
          // signingTime
          new Attribute({
            type: '1.2.840.113549.1.9.5',
            values: [new asn1js.UTCTime({ valueDate: new Date() })],
          }),
          // messageDigest
          new Attribute({
            type: '1.2.840.113549.1.9.4',
            values: [new asn1js.OctetString({ valueHex: hash })],
          }),
        ],
      }),
    });

    signedData.signerInfos.push(signerInfo);

    // XXX: requires await, no matter what typescript suggests!
    await signedData.sign(privateKey, 0, 'SHA-1');

    console.log('signed, brb');

    const contentInfo = new ContentInfo({
      content: signedData.toSchema(true),
      contentType: '1.2.840.113549.1.7.2', // signedData
    });

    // console.log(JSON.stringify(contentInfo.toJSON(), null, 2));

    // TODO: export as binary, so make sure it's binary!
    const blob: ArrayBuffer = contentInfo.toSchema().toBER(false);

    // console.log({ blob });

    // TODO: verify output, maybe at callside, to make sure it looks sensible (optional with flag?)

    return Buffer.from(blob);
  }
}

class OpenSSLSigner {
  private config: SignerConfig;

  constructor(config: SignerConfig) {
    this.config = config;
  }

  async signString(string: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const args = [
        'smime',
        '-sign',
        '-binary',
        '-outform',
        'der',
        '-signer',
        Path.resolve(this.config.certificatePath),
        '-certfile',
        Path.resolve(this.config.wwdrCertificatePath),
      ];

      let stdout: any[] = [];
      let stderr: any[] = [];

      const child = spawn('openssl', args, {
        env: process.env,
      });

      child.on('error', (err) => reject({ code: 1, error: err }));
      child.stdout.on('error', (err) => reject({ code: 1, error: err }));
      child.stderr.on('error', (err) => reject({ code: 1, error: err }));
      child.stdin.on('error', (err) => reject({ code: 1, error: err }));

      child.stdout.on('data', (data) => stdout.push(data));
      child.stderr.on('data', (data) => stderr.push(data));

      child.stdin.write(string);
      child.stdin.end();

      child.on('close', (code) => {
        const out = Buffer.concat(stdout);
        const err = Buffer.concat(stderr);

        if (code === 0) {
          return resolve(out);
        }

        let error = {
          code,
          message: `command exited with code: ${code}`,
          stdout: out,
          stderr: err,
        };

        console.error(`openssl error: ${err.toString('utf-8')}`);

        return reject(error);
      });
    });
  }
}

export default PKIJSSigner;
