import { spawn } from 'child_process';
import Path from 'path';

export type SignerConfig = {
  wwdrCertificatePath: string;
  certificatePath: string;
};

class Signer {
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

export default Signer;
