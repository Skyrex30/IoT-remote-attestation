/*
 * attestation_client.h
 *
 *  Created on: May 11, 2026
 *      Author: cs
 */

#ifndef INC_ATTESTATION_CLIENT_H_
#define INC_ATTESTATION_CLIENT_H_

#include <stdint.h>
#include "secure_nsc.h"
#include "attestation_protocol.h"

typedef struct {
    attestation_report_t report;
    uint8_t auth_data[75];
    size_t  auth_len;
} authenticated_attestation_t;

int32_t AttestationClient_Run(uint32_t command,
							   uint32_t server_nonce,
							   authenticated_attestation_t *out);
#endif /* INC_ATTESTATION_CLIENT_H_ */
