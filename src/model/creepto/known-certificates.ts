import AppleComputerRootCertificate from './certificates/AppleComputerRootCertificate.js';
import AppleIncRootCertificate from './certificates/AppleIncRootCertificate.js';
import AppleRootCAG2 from './certificates/AppleRootCA-G2.js';
import AppleRootCAG3 from './certificates/AppleRootCA-G3.js';
import AppleWWDRCA from './certificates/AppleWWDRCA.js';
import AppleWWDRCAG2 from './certificates/AppleWWDRCAG2.js';
import AppleWWDRCAG3 from './certificates/AppleWWDRCAG3.js';
import AppleWWDRCAG4 from './certificates/AppleWWDRCAG4.js';
import AppleWWDRCAG5 from './certificates/AppleWWDRCAG5.js';
import AppleWWDRCAG6 from './certificates/AppleWWDRCAG6.js';

const wwdrCertificates = [
  AppleWWDRCA(),
  AppleWWDRCAG2(),
  AppleWWDRCAG3(),
  AppleWWDRCAG4(),
  AppleWWDRCAG5(),
  AppleWWDRCAG6(),
];

const rootCertificates = [
  AppleIncRootCertificate(),
  AppleComputerRootCertificate(),
  AppleRootCAG2(),
  AppleRootCAG3(),
];

export { rootCertificates, wwdrCertificates };
