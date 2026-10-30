/*
 * uart_protocol.c
 *
 */

#include "uart_protocol.h"

#include "main.h"
#include "attestation_protocol.h"
#include "attestation_client.h"

#include <string.h>

extern UART_HandleTypeDef huart2;

static void send_error_response(uint32_t nonce, uint8_t status)
{
    attest_response_t resp;
    memset(&resp, 0, sizeof(resp));

    resp.magic = ATTEST_RESP_MAGIC;
    resp.status = status;
    resp.nonce = nonce;
    resp.timestamp = HAL_GetTick();

    (void)HAL_UART_Transmit(&huart2,
                            (uint8_t *)&resp,
                            sizeof(resp),
                            HAL_MAX_DELAY);
}

void UART_AttestationLoop(void)
{
    attest_request_t req;
    authenticated_attestation_t att;
    attest_response_t resp;

    while (1)
    {
        memset(&req, 0, sizeof(req));

        if (HAL_UART_Receive(&huart2,
                             (uint8_t *)&req,
                             sizeof(req),
                             HAL_MAX_DELAY) != HAL_OK)
        {
            continue;
        }

        if (req.magic != ATTEST_REQ_MAGIC)
        {
            continue;
        }

        memset(&att, 0, sizeof(att));

        int32_t result = AttestationClient_Run(req.command, req.nonce, &att);

        memset(&resp, 0, sizeof(resp));
        resp.magic = ATTEST_RESP_MAGIC;

        if (result != 0)
        {
            resp.status = 2U; // Generic Error
            resp.nonce = req.nonce;
            resp.timestamp = HAL_GetTick();
            resp.auth_len = 0;
        }
        else
        {
            resp.status = att.report.status;
            resp.nonce = att.report.nonce;
            resp.timestamp = att.report.timestamp;
            memcpy(resp.hash, att.report.hash, 32);

            memcpy(resp.auth_data, att.auth_data, att.auth_len);
            resp.auth_len = att.auth_len;
        }

        HAL_UART_Transmit(&huart2,
                          (uint8_t *)&resp,
                          sizeof(resp),
                          HAL_MAX_DELAY);
    }
}
