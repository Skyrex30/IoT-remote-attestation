/*
 * attestation_protocol.h
 *
 */

#ifndef INC_ATTESTATION_PROTOCOL_H_
#define INC_ATTESTATION_PROTOCOL_H_

#include <stdint.h>

#define ATTEST_REQ_MAGIC   0x31515241U
#define ATTEST_RESP_MAGIC  0x31505241U

// Command definitions for the Server to send
#define CMD_ATTEST_HMAC   1U
#define CMD_ATTEST_ECDSA  2U
#define CMD_GET_PUBKEY    3U

typedef struct {
    uint32_t magic;
    uint32_t command; // Tells the STM32 which algorithm/action to use
    uint32_t nonce;
} attest_request_t;

typedef struct {
    uint32_t magic;
    uint32_t status;
    uint32_t nonce;
    uint32_t timestamp;
    uint8_t  hash[32];
    uint8_t  auth_data[75]; // Large enough for HMAC(32), PubKey(65), or ECDSA Sig(~72)
    uint32_t auth_len;      // Tells the server exactly how many bytes to read from auth_data
} attest_response_t;

#endif /* INC_ATTESTATION_PROTOCOL_H_ */
