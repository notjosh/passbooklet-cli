#!/bin/bash

# read certificates in `certificates/` and dump them as strings
# in `src/model/creepto/certificates/` wrapped in functions

rm -f ./src/model/creepto/certificates/*.ts

while IFS= read -r -d $'\0' file; do
    BASENAME=$(basename "${file}" .cer)
    DESTINATION="src/model/creepto/certificates/${BASENAME}.ts"

    TEMPFILE=$(mktemp -t passbooklet)
    base64 "${file}" > "${TEMPFILE}"

    CONTENTS=$(sed "/###CONTENTS###/ {
        r ${TEMPFILE}
        d
    }" ./src/model/creepto/certificates/template)

    echo "${CONTENTS}" > "${DESTINATION}"

    rm "${TEMPFILE}"
    echo "wrote to: ${DESTINATION}"
done < <(find ./certificates -maxdepth 1 -type f -iname "*.cer" -print0)