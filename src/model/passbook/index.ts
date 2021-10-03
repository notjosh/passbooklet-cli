import flat from 'flat';
import { readFile } from 'fs/promises';
import set from 'lodash.set';
import CMSEncoder, {
  CMSSignedAttributes,
  CMSSigningIdentity,
} from '../../cms/encoder/index.js';
import certificateFromBuffer from '../../cms/util/certificate-from-buffer.js';
import keyFromBuffer from '../../cms/util/key-from-buffer.js';
import readPEM, { PEMContentKind } from '../../cms/util/read-pem.js';
import {
  rootCertificates,
  wwdrCertificates,
} from '../creepto/known-certificates.js';
import CreeptoValidator from '../creepto/validator.js';
import Manifesto from '../manifesto/index.js';
import { SignerConfig } from '../signer/index.js';
import Zip from '../zip/index.js';
import { Pass } from './types.js';

type SaveConfig = {
  teamIdentifier: string;
  passTypeIdentifier: string;
} & SignerConfig;

class Passbook {
  private zip: Zip;
  private _pass: Pass | undefined;

  static async fromFile(path: string): Promise<Passbook> {
    const zip = await Zip.readAtPath(path);
    return new Passbook(zip);
  }

  private constructor(zip: Zip) {
    this.zip = zip;
  }

  async extractPass(): Promise<Pass> {
    const string = await this.zip.stringFor('pass.json');
    const json = JSON.parse(string || '');

    // TODO: validate `pass` as `Pass`

    return json as unknown as Pass;
  }

  async readPass(): Promise<Pass> {
    if (this._pass == null) {
      this._pass = await this.extractPass();
    }

    return this._pass;
  }

  async flattened(): Promise<Record<string, unknown>> {
    const pass = await this.readPass();

    const flattened: Record<string, unknown> = flat.flatten(pass);

    return flattened;
  }

  async update(updates: string[]): Promise<void> {
    const updateKeyValues = updates.reduce((acc, update) => {
      const [key, value] = update.split(/=(.*)/);
      acc[key] = value;
      return acc;
    }, {} as Record<string, unknown>);

    const pass = await this.readPass();

    for (const [key, value] of Object.entries(updateKeyValues)) {
      set(pass, key, value);
    }
  }

  async save(outputPath: string, config: SaveConfig): Promise<void> {
    // super-function, which must:
    // - rewrite team ID/bundle ID
    // - remove auto-update URL
    // - remove manifest + signature
    // - generate new manifest
    // - sign manifest
    // - write new signature
    // - save .zip

    const pass = await this.readPass();

    pass.teamIdentifier = config.teamIdentifier;
    pass.passTypeIdentifier = config.passTypeIdentifier;

    delete pass.webServiceURL;
    delete pass.authenticationToken;

    const passString = JSON.stringify(pass, null, 2);
    await this.zip.writeString('pass.json', passString);

    await this.zip.remove('manifest.json');
    await this.zip.remove('signature');

    const manifesto = new Manifesto(this.zip);
    const manifest = await manifesto.generate();
    const manifestString = JSON.stringify(manifest, null, 2);

    const signature = await CMSEncoder.encode(
      [...rootCertificates, ...wwdrCertificates],
      await makeSignerIdentity(config.certificatePath),
      undefined,
      undefined,
      true,
      [CMSSignedAttributes.signingTime],
      Buffer.from(manifestString, 'utf-8')
    );

    await this.zip.writeString('manifest.json', manifestString);
    await this.zip.writeBinary('signature', signature);

    await this.zip.saveTo(outputPath);
  }

  async validate(): Promise<string[]> {
    const validator = new CreeptoValidator(this.zip);
    return validator.validate();
  }
}

const makeSignerIdentity = async (
  pemPath: string
): Promise<CMSSigningIdentity> => {
  const contents = await readFile(pemPath, 'utf-8');

  const certificate = certificateFromBuffer(
    await readPEM(contents, PEMContentKind.Certificate)
  );
  const key = await keyFromBuffer(
    await readPEM(contents, PEMContentKind.PrivateKey),
    (
      await certificate.getPublicKey()
    ).algorithm
  );

  return {
    certificate,
    key,
  };
};

export default Passbook;
