import buf2ab from '../buf2ab';
import certificateFromBuffer from '../certificate-from-buffer';

const fixture = `
MIIDrjCCApigAwIBAgIBATALBgkqhkiG9w0BAQUwHjEcMAkGA1UEBhMCUlUwDwYD
VQQDHggAVABlAHMAdDAeFw0xOTAxMzEyMzAwMDBaFw0yMjAxMzEyMzAwMDBaMB4x
HDAJBgNVBAYTAlJVMA8GA1UEAx4IAFQAZQBzAHQwggEiMA0GCSqGSIb3DQEBAQUA
A4IBDwAwggEKAoIBAQC3rcu7I7nXhgpWt45y90v1Czy2daSCqM+D4XGTcs6EYRe3
TJWhQTK1S0pbVUOen5iLngNgUhYyoGKweEI/VnhE/WwEmhRrW1VadMA+MyGU/G3a
ub75VZdtmz7dQm77BFYEeiRnj4/1ZvUbQoCuFamVgn+tHZJ+przbmUc/MtznkdOY
1CseRf3AOlX/ymyJhjbnP/ctiTE2Fn9PuV3IZTNHCD6TNZAkCF5YoZhYm51G2euQ
MB9kjSAh/Mxo+JN53N7CBd/e3q9IcTHxWnlMVj9UU4+IXRDzJLt45Gnu63ee2iJA
9Nx41Ww/TReDNs2dcGD5A6GFJy4FhzziX7/3OAMXAgMBAAGjgfowgfcwEgYDVR0T
AQH/BAgwBgEB/wIBAzALBgNVHQ8EBAMCAAYwYwYDVR0lBFwwWgYEVR0lAAYIKwYB
BQUHAwEGCCsGAQUFBwMCBggrBgEFBQcDAwYIKwYBBQUHAwQGCCsGAQUFBwMIBggr
BgEFBQcDCQYKKwYBBAGCNwoDAQYKKwYBBAGCNwoDBDAXBgkrBgEEAYI3FAIECgwI
Y2VydFR5cGUwIwYJKwYBBAGCNxUCBBYEFAEBAQEBAQEBAQEBAQEBAQEBAQEBMBwG
CSsGAQQBgjcVBwQPMA0GBSkBAQEBAgEKAgEUMBMGCSsGAQQBgjcVAQQGAgQAFAAK
MAsGCSqGSIb3DQEBBQOCAQEAZB1KX8JgNglFC68xFmEEC+rb/E7wM97ke+hsFkw5
4CMi5v3EUwiXQiUOs8EU0uLr2Lsp9IKqjrTSN5IevN/Z0Jm2gEb9dOz6krAeMoH0
AfCZSLAUsspfGEk05ez0ie0govisdA4E6WOAk+G5/FJw6LqSFQIdidpZTY6M/BZC
KswmV5OvTIvuQuRi9Srlu6k11lttq3IWcOJtVrMH5704hAtH3Q2tOUlw/XqG76p8
Zc8Q9VTKRAV9BBrGgeF4ixEnX5aHSuz+7fB6rUPkoqTNRtS7FLLB4vXKh03yQFXl
zviRbbFi5eSX+irqMEHta3EHnseKbWqq+gCqMKSKCkj2QA==
`.trim();

describe('certificateFromBuffer', () => {
  it('decodes certificate successfully', () => {
    const buffer = Buffer.from(fixture, 'base64');
    const certificate = certificateFromBuffer(buffer);

    expect(certificate).not.toBeFalsy();
    expect(certificate).toHaveProperty('issuer');
    expect(certificate).toHaveProperty('subject');
  });
});
