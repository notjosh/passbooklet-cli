import asn1js from 'asn1js';
import difference from 'lodash.difference';
import Certificate from 'pkijs/src/Certificate.js';
import ContentInfo from 'pkijs/src/ContentInfo.js';
import SignedData from 'pkijs/src/SignedData.js';
import notEmpty from '../../util/not-empty.js';
import Manifesto from '../manifesto/index.js';
import Zip from '../zip/index.js';
import { rootCertificates } from './known-certificates.js';

class CreeptoValidator {
  private zip: Zip;
  constructor(zip: Zip) {
    this.zip = zip;
  }

  async validate(): Promise<string[]> {
    const errors = [
      ...(await this.validateManifest()),
      ...(await this.validateSignature()),
    ];

    return errors;
  }

  async validateSignature(): Promise<string[]> {
    const errors = [] as string[];

    const signature = await this.zip.bufferFor('signature');
    const manifest = await this.zip.bufferFor('manifest.json');

    if (signature == null || manifest == null) {
      let errors: string[] = [];

      if (signature == null) {
        errors.push('Could not read `signature` file');
      }

      if (manifest == null) {
        errors.push('Could not read `manifest.json` file');
      }

      return errors;
    }

    // verify signature:
    // openssl smime -verify -in ./signature -inform der -content ./manifest.json -noverify -binary -out /dev/null
    // OR with chain verification:
    // openssl smime -verify -in ./signature -inform der -content ./manifest.json -binary -CAfile ./certificates/AppleIncRootCertificate.pem -purpose sslclient

    // TODO: this is slow, I think jszip can return this directly?
    const arrayBuffer = new Uint8Array(signature).buffer;
    const asn1 = asn1js.fromBER(arrayBuffer);
    if (asn1.offset === -1) {
      console.log({ asn1, signature: signature });
      errors.push('Incorrect message format!');
      return errors;
    }

    let cmsContentSimpl: ContentInfo;
    let cmsSignedSimpl: SignedData;

    try {
      cmsContentSimpl = new ContentInfo({ schema: asn1.result });
      cmsSignedSimpl = new SignedData({
        schema: cmsContentSimpl.content,
      });
    } catch (ex) {
      console.error(ex);
      errors.push('Incorrect message format!');
      return errors;
    }

    console.log('okie doke');

    // Get signed data buffer
    // noinspection JSUnresolvedVariable
    const signedDataBuffer = manifest;

    // Verify the signed data
    try {
      console.log('gonna verify, brb');
      const result = await cmsSignedSimpl.verify({
        signer: 0,
        data: signedDataBuffer,
        checkChain: true,
        extendedMode: true,
        trustedCerts: rootCertificates,
      });

      console.log({ result });

      let failed = true;
      const verified = result.signatureVerified;
      if (verified != null) {
        if (verified === true) {
          failed = false;
        }
      }

      console.log(
        `S/MIME message ${
          failed ? 'verification failed' : 'successfully verified'
        }!`
      );
    } catch (error) {
      // console.error(error);
      errors.push(`Error during verification: ${(error as any).message}`);
    }

    // ok, if we made it here, then we have a valid signature for manifest.json
    // let's check the certificates to make sure they're trusted & via WWDR

    // show certificates:
    // openssl pkcs7 -in ./signature -inform der -print_certs -noout
    // or with pipe:
    // cat ./signature | openssl pkcs7  -inform der -print_certs -noout

    // TODO: update types, based on observation here
    const certificates = (cmsSignedSimpl.certificates ?? []) as Certificate[];
    const search =
      'Apple Worldwide Developer Relations Certification Authority';

    const certificateNames = certificates.map((certificate) => {
      const subject = certificate.subject;
      // TODO: is there shorthand for finding common values?
      const cn = subject.typesAndValues.find(
        (n) => (n.type as any) === '2.5.4.3'
      );
      const commonName = cn?.value.valueBlock.value;
      return commonName;
    });

    const foundWWDRCert = certificateNames.some((certificateName) => {
      return certificateName === search;
    });

    console.log('certificates in chain:', certificateNames);
    console.log(`found WWDR in chain? ${foundWWDRCert ? 'yes' : 'no'}`);

    console.log(`signature errors: ${errors.length}`);

    return errors;
  }

  async validateManifest(): Promise<string[]> {
    const errors = [] as string[];

    const manifestJson = await this.zip.stringFor('manifest.json');

    if (manifestJson == null) {
      errors.push('manifest.json is empty, missing, or invalid');
      return errors;
    }

    const manifest = JSON.parse(manifestJson) as Record<string, string>;
    const manifesto = new Manifesto(this.zip);

    const contents = this.zip
      .map((path, file) => {
        // skip directories
        if (file.dir === true) {
          return;
        }

        // TODO: ensure file is not a symlink

        // skip unnecessary files
        if (['manifest.json', 'signature'].includes(path)) {
          return;
        }

        return path;
      })
      .filter(notEmpty);

    // items in the manifest that are considered okay
    const validPaths = [] as string[];

    for (const path of contents) {
      const manifestHash = manifest[path];

      if (manifestHash == null) {
        errors.push(`no manifest entry for ${path}`);
        continue;
      }

      const hash = await manifesto.hashFor(path);

      if (hash !== manifestHash) {
        errors.push(
          `file at path ${path} has hash ${hash}, but manifest states ${manifestHash}`
        );
        continue;
      }

      validPaths.push(path);
    }

    const itemsInManifestButNotZip = difference(contents, validPaths);

    if (itemsInManifestButNotZip.length > 0) {
      errors.push(
        `manifest list files that are missing from zip: ${itemsInManifestButNotZip.join(
          ', '
        )}`
      );
    }

    console.log(`manifest errors: ${errors.length}`);

    return errors;
  }
}

export default CreeptoValidator;
