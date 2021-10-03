import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import readableName from '../readable-name';
import readPEMCertificate from '../read-pem-certificate';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const path = join(__dirname, './fixtures/certificate.pem');
const certificate = await readPEMCertificate(path);

describe('readableName', () => {
  it('makes subject readable', () => {
    const subject = readableName(certificate.subject.typesAndValues);

    expect(subject).toBe(
      '/C=zw/S=State/OU=Passbooklet/CN=Unit Testing/L=City/O=Passbooklet Inc/E=test@example.com'
    );
  });
});
