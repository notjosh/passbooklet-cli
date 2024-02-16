// status = CMSEncodeContent(
//   identity, // signer/s
//   NULL, // recipient/s
//   0, // content type OID
//   TRUE, // detached content
//   kCMSAttrSigningTime, // CMSSignedAttributes
//   bytes, // content
//   len,   //  -> len
//   (CFDataRef *)&signedData // -> encoded data
//);

import asn1js from 'asn1js';
import castArray from 'lodash.castarray';
import uniq from 'lodash.uniq';
import {
  AlgorithmIdentifier,
  Attribute,
  Certificate,
  ContentInfo,
  EncapsulatedContentInfo,
  IssuerAndSerialNumber,
  SignedAndUnsignedAttributes,
  SignedData,
  SignerInfo,
  getEngine,
} from 'pkijs';
import { CMSCertificateChainMode } from '../types/certificate-chain-mode.js';
import buf2ab from '../util/buf2ab.js';
import certificateChainFor from '../util/certificate-chain-for.js';
import { readableTypesAndValues } from '../util/readable-name.js';

// func CMSEncodeContent(_ signers: CFTypeRef?,
//                     _ recipients: CFTypeRef?,
//                     _ eContentTypeOID: CFTypeRef?,
//                     _ detachedContent: Bool,
//                     _ signedAttributes: CMSSignedAttributes,
//                     _ content: UnsafeRawPointer,
//                     _ contentLen: Int,
//                     _ encodedContentOut: UnsafeMutablePointer<CFData?>?) -> OSStatus

export type CMSSigningIdentity = {
  certificate: Certificate;
  key: CryptoKey;
};
export type CMSCertificate = Certificate;

export enum CMSSignedAttributes {
  signingTime,
}

const DefaultHasDetachedContent = false;
const DefaultEncapsulatedContentTypeOID = '1.2.840.113549.1.7.1';

class CMSEncoder {
  private _certificateChainMode: CMSCertificateChainMode =
    CMSCertificateChainMode.chain;

  private _signers: CMSSigningIdentity[] = [];
  private _recipients: CMSCertificate[] = [];
  private _signedAttributes: CMSSignedAttributes[] = [];
  private _supportingCertificates: Certificate[] = [];
  private _hasDetachedContent?: boolean;
  private _encapsulatedContentTypeOID?: string;
  private _signerAlgorithm?: string;

  private _trustedCertificates: CMSCertificate[];

  private content?: Buffer;
  private output?: Buffer;

  // TODO: convert to kind of "vault" with roots and certs and etc etc and etc, etc. (etc)
  constructor(trustedCertificates: CMSCertificate | CMSCertificate[]) {
    this._trustedCertificates = castArray(trustedCertificates);
  }

  addSigners(signers: CMSSigningIdentity | CMSSigningIdentity[]) {
    if (this.output != null) {
      throw new Error(
        'Content has already been generated, this cannot be called now.'
      );
    }

    this._signers = [
      ...this._signers,
      ...(Array.isArray(signers) ? signers : [signers]),
    ];
  }

  addRecipients(recipients: CMSCertificate | CMSCertificate[]) {
    if (this.output != null) {
      throw new Error(
        'Content has already been generated, this cannot be called now.'
      );
    }

    this._recipients = [...this._recipients, ...castArray(recipients)];
  }

  setHasDetachedContent(hasDetachedContent: boolean) {
    if (this.output != null) {
      throw new Error(
        'Content has already been generated, this cannot be called now.'
      );
    }

    this._hasDetachedContent = hasDetachedContent;
  }

  setSignerAlgorithm(signerAlgorithm: string) {
    if (this.output != null) {
      throw new Error(
        'Content has already been generated, this cannot be called now.'
      );
    }

    this._signerAlgorithm = signerAlgorithm;
  }

  setEncapsulatedContentTypeOID(encapsulatedContentTypeOID: string) {
    if (this.output != null) {
      throw new Error(
        'Content has already been generated, this cannot be called now.'
      );
    }

    this._encapsulatedContentTypeOID = encapsulatedContentTypeOID;
  }

  addSupportingCertificates(
    supportingCertificates: CMSCertificate | CMSCertificate[]
  ) {
    if (this.output != null) {
      throw new Error(
        'Content has already been generated, this cannot be called now.'
      );
    }

    this._supportingCertificates = uniq([
      ...this._supportingCertificates,
      ...castArray(supportingCertificates),
    ]);
  }

  addSignedAttributes(
    newSignedAttributes: CMSSignedAttributes | CMSSignedAttributes[]
  ) {
    if (this.output != null) {
      throw new Error(
        'Content has already been generated, this cannot be called now.'
      );
    }

    this._signedAttributes = uniq([
      ...this._signedAttributes,
      ...castArray(newSignedAttributes),
    ]);
  }

  public get certificateChainMode(): CMSCertificateChainMode {
    return this._certificateChainMode;
  }
  public set certificateChainMode(value: CMSCertificateChainMode) {
    if (this.output != null) {
      throw new Error(
        'Content has already been generated, this cannot be called now.'
      );
    }

    this._certificateChainMode = value;
  }

  async updateContent(content: Buffer) {
    if (this.output != null) {
      throw new Error(
        'Content has already been generated, this cannot be called now.'
      );
    }

    // TODO:
    // if we haven't generated output, _or_ the content is different to what we generated, let's build the output
    if (this.output == null) {
      this.output = await this.buildOutput(content);
    }

    return this.output;
  }

  private async buildOutput(content: Buffer): Promise<Buffer> {
    const isSigning = this._signers.length > 0;
    const isEncrypting = this._recipients.length > 0;

    if (isEncrypting) {
      throw new Error('Encrypting currently not implemented :(');
    }

    if (this._hasDetachedContent && isEncrypting) {
      throw new Error(
        'Cannot encrypt with detached content. Either remove recipients (i.e. no longer request encryption - only signing), or attach content.'
      );
    }

    const engine = getEngine();
    const ab = buf2ab(content);
    const hash = await engine.crypto?.subtle.digest(
      { name: this._signerAlgorithm ?? 'SHA-1' },
      ab
    );

    const signedData = new SignedData({
      version: 1,
      encapContentInfo: new EncapsulatedContentInfo({
        eContentType:
          this._encapsulatedContentTypeOID ?? DefaultEncapsulatedContentTypeOID, // "data" content type
      }),
    });

    const subjectCommonNames = (chain: Certificate[]): string[] =>
      chain.map(
        (certificate) =>
          readableTypesAndValues(certificate.subject.typesAndValues)['CN']
      );

    let certificates: Certificate[] = [];

    for (const signer of this._signers) {
      const chain = await certificateChainFor(
        signer.certificate,
        [],
        this._trustedCertificates,
        this._certificateChainMode
      );

      certificates = [...certificates, ...chain];

      const signerInfo = new SignerInfo({
        version: 1,
        signatureAlgorithm: new AlgorithmIdentifier({
          algorithmId: '1.2.840.113549.1.1.1',
        }),
        sid: new IssuerAndSerialNumber({
          issuer: signer.certificate.issuer,
          serialNumber: signer.certificate.serialNumber,
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

            // TODO: only if in `this._signedAttributes`
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

      await signedData.sign(signer.key, 0, this._signerAlgorithm ?? 'SHA-1');
    }

    signedData.certificates = certificates;

    const contentInfo = new ContentInfo({
      content: signedData.toSchema(true),
      contentType: '1.2.840.113549.1.7.2', // signedData
    });

    // console.log(JSON.stringify(contentInfo.toJSON(), null, 2));

    // TODO: export as binary, so make sure it's binary! (probably on consumer/call side, or via preference)
    const blob = contentInfo.toSchema().toBER(false) as ArrayBuffer;

    // console.log({ blob });

    // TODO: verify output, maybe at callside, to make sure it looks sensible (optional with flag?)

    return Buffer.from(blob);
  }

  // top-level encoder, with (mostly) defaults possible
  // TODO: convert to "properties" object
  static async encode(
    certificates: CMSCertificate[], // "keychain"-esque group of all certificates
    signers: CMSSigningIdentity | CMSSigningIdentity[] | undefined,
    recipients: CMSCertificate | CMSCertificate[] | undefined, // when value -> encrypt. when empty -> sign
    eContentTypeOID: string | undefined, // optional top-level OID, otherwise "data" used as default
    detachedContent: boolean, // cannot be true when "encrypt" mode
    signedAttributes: CMSSignedAttributes | CMSSignedAttributes[], // placeholder for additional signed attributes
    content: Buffer
  ): Promise<Buffer | undefined> {
    const encoder = new this(certificates);
    if (signers != null) {
      encoder.addSigners(signers);
    }
    if (recipients != null) {
      encoder.addRecipients(recipients);
    }
    if (eContentTypeOID != null) {
      encoder.setEncapsulatedContentTypeOID(eContentTypeOID);
    }
    encoder.setHasDetachedContent(detachedContent);
    encoder.addSignedAttributes(signedAttributes);
    encoder.certificateChainMode = CMSCertificateChainMode.chainWithRoot; // TODO: uhhhh do I need root? tests pass with it, but hm
    return await encoder.updateContent(content);
  }
}

export default CMSEncoder;
