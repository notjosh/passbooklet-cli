#!/bin/bash

# okay, this is a bit complicated overall, and very hardcoded, but is enough for now
# but, tldr is: install https://github.com/johndoe31415/x509sak
# as it does the heavy lifting for building PKI (CA, intermediate CAs, etc)
#
# it also requires a """newer" version of OpenSSL than macOS ships with (as of Monterey),
# so install via `brew`, otherwise you'll get errors around unsupported algorithms.
# we manually add that to $PATH here, since it might not be wanted at a system-wide level.
#
# TODO: when this is reasonably stable, replace x509sak with direct openssl(/libressl?)

export PATH="/usr/local/opt/openssl@3/bin:$PATH"

HERE=$(dirname "$0")
VAULT_DIR="${HERE}/vault"
X509SAK_DIR="${HERE}/../../../ext/x509sak/"

rm -rf "${VAULT_DIR}"
mkdir "${VAULT_DIR}"

# set up x509sak
source "${X509SAK_DIR}/venv/bin/activate"

X509SAK_SHARED_ARGS="-vv"

# generate some certs & keys & whatnot
echo "Generating PKI (sender)"

# sender: root CA
# TODO: Key Usage, remove "digital signature"
"${X509SAK_DIR}"/x509sak.py createca ${X509SAK_SHARED_ARGS} -g rsa:2048 -h sha1 -s "/O=Passbooklet/OU=Passbooklet Sender CA/CN=Root CA" "${VAULT_DIR}"/sender_ca_root

# sender: "root > foo" intermediate + identities
# TODO: create an example with "Signature Algorithm=ECDSA Signature with SHA-XXX", like AppleWWDRCAG6.cer
#       this seems tricky with OpenSSL though, i.e. https://github.com/openssl/openssl/issues/11413
"${X509SAK_DIR}"/x509sak.py createca ${X509SAK_SHARED_ARGS} -g ecc:secp384r1 -h sha384 -s "/O=Passbooklet/OU=Passbooklet Sender Intermediate/CN=foo" -p "${VAULT_DIR}"/sender_ca_root "${VAULT_DIR}"/sender_ca_foo
"${X509SAK_DIR}"/x509sak.py createcsr ${X509SAK_SHARED_ARGS} -c "${VAULT_DIR}"/sender_ca_foo -g rsa:2048 --san-dns foobar --san-ip 1.2.3.4 -s "/CN=foo 1" -f "${VAULT_DIR}"/sender_identity_foo_1.key "${VAULT_DIR}"/sender_identity_foo_1.crt
"${X509SAK_DIR}"/x509sak.py createcsr ${X509SAK_SHARED_ARGS} -c "${VAULT_DIR}"/sender_ca_foo -g rsa:4096 --san-dns foobar --san-ip 1.2.3.4 -s "/CN=foo 2" -f "${VAULT_DIR}"/sender_identity_foo_2.key "${VAULT_DIR}"/sender_identity_foo_2.crt
"${X509SAK_DIR}"/x509sak.py createcsr ${X509SAK_SHARED_ARGS} -c "${VAULT_DIR}"/sender_ca_foo -g ecc:secp384r1 -h sha256 --san-dns foobar --san-ip 1.2.3.4 -s "/CN=foo 3" -f "${VAULT_DIR}"/sender_identity_foo_3.key "${VAULT_DIR}"/sender_identity_foo_3.crt

# sender: "root > foo > bar > baz" intermediates + identities
"${X509SAK_DIR}"/x509sak.py createca ${X509SAK_SHARED_ARGS} -g ecc:secp384r1 -h sha384 -s "/O=Passbooklet/OU=Passbooklet Sender Intermediate/CN=foo bar" -p "${VAULT_DIR}"/sender_ca_foo "${VAULT_DIR}"/sender_ca_foo_bar
"${X509SAK_DIR}"/x509sak.py createca ${X509SAK_SHARED_ARGS} -g rsa:2048 -h sha512 -s "/O=Passbooklet/OU=Passbooklet Sender Intermediate/CN=foo bar baz" -p "${VAULT_DIR}"/sender_ca_foo_bar "${VAULT_DIR}"/sender_ca_foo_bar_baz
"${X509SAK_DIR}"/x509sak.py createcsr ${X509SAK_SHARED_ARGS} -c "${VAULT_DIR}"/sender_ca_foo_bar_baz -g rsa:2048 --san-dns foobar --san-ip 1.2.3.4 -s "/CN=foo bar baz 1" -f "${VAULT_DIR}"/sender_identity_foo_bar_baz_1.key "${VAULT_DIR}"/sender_identity_foo_bar_baz_1.crt

# sender: "root > bar" intermediate + identities
"${X509SAK_DIR}"/x509sak.py createca ${X509SAK_SHARED_ARGS} -g rsa:2048 -h sha384 -s "/O=Passbooklet/OU=Passbooklet Sender Intermediate 2/CN=bar" -p "${VAULT_DIR}"/sender_ca_root "${VAULT_DIR}"/sender_ca_bar
"${X509SAK_DIR}"/x509sak.py createcsr ${X509SAK_SHARED_ARGS} -c "${VAULT_DIR}"/sender_ca_bar -g rsa:2048 --san-dns foobar --san-ip 1.2.3.4 -s "/CN=bar 1" -f "${VAULT_DIR}"/sender_identity_bar_1.key "${VAULT_DIR}"/sender_identity_bar_1.crt
echo "...done generating PKI (sender)"