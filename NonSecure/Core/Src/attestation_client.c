/*
 * attestation_client.c
 *
 */

#include <stdio.h>
#include <string.h>
#include <stdint.h>

#include "attestation_client.h"
#include "main.h"

extern UART_HandleTypeDef huart1;

static void log_uart(const char *msg)
{
    HAL_UART_Transmit(&huart1,
                      (uint8_t *)msg,
                      strlen(msg),
                      HAL_MAX_DELAY);
}

static void log_hex(const char *label,
                    const uint8_t *data,
                    size_t len)
{
    char buf[128];

    int offset = snprintf(buf, sizeof(buf), "%s", label);

    for (size_t i = 0; i < len; i++) {

        if ((offset + 3) >= (int)sizeof(buf)) {
            break;
        }

        offset += snprintf(&buf[offset],
                           sizeof(buf) - offset,
                           "%02X",
                           data[i]);
    }

    snprintf(&buf[offset],
             sizeof(buf) - offset,
             "\r\n");

    HAL_UART_Transmit(&huart1,
                      (uint8_t *)buf,
                      strlen(buf),
                      HAL_MAX_DELAY);
}

int32_t AttestationClient_Run(uint32_t command,
                              uint32_t server_nonce,
                              authenticated_attestation_t *out)
{
    char logbuf[128];

    if (out == NULL) {
        log_uart("[ATTEST] ERROR: out == NULL\r\n");
        return -1;
    }

    memset(out, 0, sizeof(*out));

    // PATH A: Public Key Export (No firmware measurement)
    if (command == CMD_GET_PUBKEY) {
        log_uart("[ATTEST] Requesting Public Key from Secure World...\r\n");

        size_t actual_len = 0;
        int32_t res = SECURE_ExportPublicKey(out->auth_data, sizeof(out->auth_data), &actual_len);

        if (res == 0) {
            out->auth_len = actual_len;
            out->report.status = 0; // Success
            out->report.nonce = server_nonce;
            out->report.timestamp = HAL_GetTick();
            log_uart("[ATTEST] Public Key Exported Successfully\r\n");
        } else {
            log_uart("[ATTEST] Public Key Export Failed\r\n");
        }
        return res;
    }

    // PATH B: Attestation (Firmware Measurement Phase)
    snprintf(logbuf, sizeof(logbuf),
             "[ATTEST] Starting attestation nonce=%lu, cmd=%lu\r\n",
             (unsigned long)server_nonce, (unsigned long)command);
    log_uart(logbuf);

    log_uart("[ATTEST] Calling SECURE_Attest()\r\n");
    int32_t result = SECURE_Attest(server_nonce, &out->report);

    if (result != 0) {
        snprintf(logbuf, sizeof(logbuf), "[ATTEST] SECURE_Attest failed result=%ld\r\n", (long)result);
        log_uart(logbuf);
        return -2;
    }

    snprintf(logbuf, sizeof(logbuf), "[ATTEST] Measurement OK status=%u timestamp=%lu\r\n",
             out->report.status, (unsigned long)out->report.timestamp);
    log_uart(logbuf);

    if (out->report.status != 0U) {
        log_uart("[ATTEST] Report status invalid\r\n");
        return -3;
    }

    // PATH B: Attestation (Signature Phase)
    if (command == CMD_ATTEST_HMAC) {

        log_uart("[ATTEST] Generating HMAC\r\n");
        result = SECURE_GenerateHMACReport(&out->report, out->auth_data);

        if (result != 0) {
            log_uart("[ATTEST] HMAC generation failed\r\n");
            return -4;
        }
        out->auth_len = 32U; // ATTESTATION_HMAC_SIZE
        log_hex("[ATTEST] HMAC: ", out->auth_data, out->auth_len);

    }
    else if (command == CMD_ATTEST_ECDSA) {

        log_uart("[ATTEST] Generating ECDSA Signature\r\n");

        attestation_report_ecdsa_t ecdsa_report;
        memset(&ecdsa_report, 0, sizeof(ecdsa_report));
        ecdsa_report.nonce = out->report.nonce;
        ecdsa_report.timestamp = out->report.timestamp;
        ecdsa_report.status = out->report.status;
        memcpy(ecdsa_report.hash, out->report.hash, 32);

        size_t actual_sig_len = 0;
        result = SECURE_GenerateECDSAReport(&ecdsa_report,
                                            out->auth_data,
                                            sizeof(out->auth_data),
                                            &actual_sig_len);

        if (result != 0) {
            log_uart("[ATTEST] ECDSA generation failed\r\n");
            return -5;
        }
        out->auth_len = actual_sig_len;
        log_hex("[ATTEST] ECDSA Sig: ", out->auth_data, out->auth_len);

    }
    else {
        log_uart("[ATTEST] Unknown command requested\r\n");
        return -6;
    }

    log_uart("[ATTEST] Attestation completed successfully\r\n");
    log_hex("[ATTEST] HASH: ", out->report.hash, 32);

    return 0;
}
