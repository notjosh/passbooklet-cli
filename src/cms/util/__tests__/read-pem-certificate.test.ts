import readPEMCertificate from '../read-pem-certificate';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('readPEMCertificate', () => {
  it('decodes certificate successfully', async () => {
    const path = join(__dirname, './fixtures/certificate.pem');
    const certificate = await readPEMCertificate(path);

    expect(certificate).not.toBeFalsy();
    expect(certificate).toHaveProperty('issuer');
    expect(certificate).toHaveProperty('subject');
  });

  it('decodes certificate successfully from joined file', async () => {
    const path = join(__dirname, './fixtures/certificate-and-key.pem');
    const certificate = await readPEMCertificate(path);

    expect(certificate).not.toBeFalsy();
    expect(certificate).toHaveProperty('issuer');
    expect(certificate).toHaveProperty('subject');
  });
});
