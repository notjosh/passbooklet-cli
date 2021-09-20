import dotenv from 'dotenv';
dotenv.config();

import temp from 'temp';
import fs from 'fs';

import { webcrypto } from 'crypto';
import { setEngine } from 'pkijs/src/common.js';
import CryptoEngine from 'pkijs/src/CryptoEngine.js';

// TODO: when @types/node catches up, clean this up
const name = 'node-webcrypto';
const crypto = webcrypto;
setEngine(
  name,
  crypto as unknown as Crypto,
  new CryptoEngine({ name, crypto, subtle: (crypto as any)['subtle'] })
);

const configFromEnv = () => {
  const {
    TEAM_IDENTIFIER,
    PASS_TYPE_IDENTIFIER,
    CERTIFICATE,
    WWDR_CERTIFICATE,
  } = process.env;

  if (TEAM_IDENTIFIER == null) {
    throw new Error('TEAM_IDENTIFIER not found in process.env');
  }

  if (PASS_TYPE_IDENTIFIER == null) {
    throw new Error('PASS_TYPE_IDENTIFIER not found in process.env');
  }

  if (WWDR_CERTIFICATE == null) {
    throw new Error('WWDR_CERTIFICATE not found in process.env');
  }

  if (CERTIFICATE == null) {
    throw new Error('CERTIFICATE not found in process.env');
  }

  temp.track();

  // write certs to temp files
  const tmpCert = temp.openSync('passbooklet-');
  fs.writeSync(tmpCert.fd, CERTIFICATE);
  const CERTIFICATE_PATH = tmpCert.path;
  process.env.CERTIFICATE_PATH = CERTIFICATE_PATH;

  const tmpWwdrCert = temp.openSync('passbooklet-');
  fs.writeSync(tmpWwdrCert.fd, WWDR_CERTIFICATE);
  const WWDR_CERTIFICATE_PATH = tmpWwdrCert.path;
  process.env.WWDR_CERTIFICATE_PATH = WWDR_CERTIFICATE_PATH;

  return {
    TEAM_IDENTIFIER,
    PASS_TYPE_IDENTIFIER,
    CERTIFICATE,
    CERTIFICATE_PATH,
    WWDR_CERTIFICATE,
    WWDR_CERTIFICATE_PATH,
  };
};

export { configFromEnv };
