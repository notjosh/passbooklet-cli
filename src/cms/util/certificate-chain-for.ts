import Certificate from 'pkijs/src/Certificate.js';
import CertificateChainValidationEngine from 'pkijs/src/CertificateChainValidationEngine.js';
import { CMSCertificateChainMode } from '../types/certificate-chain-mode.js';

// we have a number of valid candidates, depending on who issues the certificate we want to sign with
const certificateChainFor = async (
  certificate: Certificate,
  candidatesArg: Certificate[],
  trustedCerts: Certificate[],
  chainMode: CMSCertificateChainMode = CMSCertificateChainMode.chain
): Promise<Certificate[]> => {
  // short circuit for "none" case
  if (chainMode === CMSCertificateChainMode.none) {
    return [];
  }

  // TODO: do we need to filter duplicates of `certificate`?
  const candidates = [
    ...candidatesArg,
    ...trustedCerts,

    // target for sorting must be at end of list
    // found via: https://github.com/PeculiarVentures/PKI.js/issues/114
    certificate,
  ];

  // TODO: to we need `trustedCerts` separate from `certs`? could they be merged for our purposes?
  const certificateChainValidationEngineParameters = {
    certs: candidates,
    trustedCerts,
  };

  const certificateChainEngine = new CertificateChainValidationEngine(
    certificateChainValidationEngineParameters
  );

  const chain: Certificate[] = await certificateChainEngine.sort();

  switch (chainMode) {
    case CMSCertificateChainMode.chain:
      return chain.slice(0, chain.length - 1);
    case CMSCertificateChainMode.chainWithRoot:
      return chain;
    case CMSCertificateChainMode.signerOnly:
      return chain.slice(0, 1);
  }
};

export default certificateChainFor;
