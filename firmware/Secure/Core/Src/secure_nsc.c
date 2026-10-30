/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file    Secure/Src/secure_nsc.c
  * @author  MCD Application Team
  * @brief   This file contains the non-secure callable APIs (secure world)
  ******************************************************************************
    * @attention
  *
  * Copyright (c) 2026 STMicroelectronics.
  * All rights reserved.
  *
  * This software is licensed under terms that can be found in the LICENSE file
  * in the root directory of this software component.
  * If no LICENSE file comes with this software, it is provided AS-IS.
  *
  ******************************************************************************
  */
/* USER CODE END Header */

/* USER CODE BEGIN Non_Secure_CallLib */
/* Includes ------------------------------------------------------------------*/
#include "main.h"
#include "secure_nsc.h"
#include "mbedtls/ecdsa.h"
#include "mbedtls/entropy.h"
#include "mbedtls/ecp.h"
#include "mbedtls/ctr_drbg.h"
#include <stdint.h>
#include <string.h>
/** @addtogroup STM32U5xx_HAL_Examples

  * @{
  */

/** @addtogroup Templates
  * @{
  */

/* Global variables ----------------------------------------------------------*/

/* Private typedef -----------------------------------------------------------*/
/* Private define ------------------------------------------------------------*/
/* Private macro -------------------------------------------------------------*/
/* Private variables ---------------------------------------------------------*/
/* Private function prototypes -----------------------------------------------*/
/* Private functions ---------------------------------------------------------*/

extern HASH_HandleTypeDef hhash;
extern RNG_HandleTypeDef hrng;

static const uint8_t DEVICE_ECDSA_PRIVATE_KEY[32] = {
    0x41, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
    0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x00,
    0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
    0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x01
};

/* * mbedTLS calls this function to grab true random bytes from the STM32U5 hardware RNG.
 * It is required because MBEDTLS_ENTROPY_HARDWARE_ALT is defined.
 */
int mbedtls_hardware_poll(void *data, unsigned char *output, size_t len, size_t *olen)
{
    uint32_t random_val;
    size_t generated = 0;

    // Loop until we have gathered the exact number of bytes mbedTLS requested
    while (generated < len) {
        // Ask the hardware RNG for 32 bits (4 bytes) of true randomness
        if (HAL_RNG_GenerateRandomNumber(&hrng, &random_val) != HAL_OK) {
            return -1; // Return failure if the hardware RNG faults
        }

        // Figure out how many bytes we actually need to copy to the output buffer
        size_t copy_len = (len - generated > 4) ? 4 : (len - generated);
        memcpy(output + generated, &random_val, copy_len);
        generated += copy_len;
    }

    *olen = generated; // Tell Mbed TLS how many bytes we successfully gathered
    return 0;          // 0 means success
}


int32_t compute_hash_hw(const uint8_t *data, size_t length, uint8_t *hash_out)
{
	 if (data == NULL || hash_out == NULL || length == 0U) {
		return -1;
	}

	if (((uintptr_t)data % 4U) != 0U) {
		return -1;
	}

    if (((uintptr_t)data % 4U) != 0U) {
        return -2;
    }

    if ((length % 4U) != 0U) {
        return -3;
    }

    hhash.Init.DataType = HASH_DATATYPE_8B;

    if (HAL_HASH_Init(&hhash) != HAL_OK) {
        return -4;
    }

    // Save and disable interrupts
    //uint32_t primask = __get_PRIMASK();
    //__disable_irq();

    HAL_StatusTypeDef status = HAL_HASHEx_SHA256_Start(
        &hhash,
        (uint8_t *)data,
        (uint32_t)length,
        hash_out,
        HAL_MAX_DELAY
    );

    // Restore interrupt state
    // __set_PRIMASK(primask);

    if (status != HAL_OK) {
        memset(hash_out, 0, ATTESTATION_HASH_SIZE);
        return -5;
    }

    return 0;
}

static const uint8_t DEVICE_SECRET_KEY[32] = {
    0x12, 0x34, 0x56, 0x78, 0xAA, 0xBB, 0xCC, 0xDD,
    0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
    0x99, 0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0xFF, 0x00,
    0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88
};

#define HMAC_BLOCK_SIZE 64U
static int32_t compute_hmac_sha256(const uint8_t *message, size_t msg_len, uint8_t *hmac_out) {

    if (message == NULL || hmac_out == NULL || msg_len == 0U) {
        return -1;
    }

    if (msg_len != 44U) {
        return -2;
    }

    uint8_t key_block[64] __attribute__((aligned(4)));
    uint8_t ipad[64] __attribute__((aligned(4)));
    uint8_t opad[64] __attribute__((aligned(4)));
    uint8_t inner_hash[32] __attribute__((aligned(4)));

    // 64-byte ipad + 44-byte message = 108 bytes (perfectly divisible by 4)
    uint8_t inner_buf[108] __attribute__((aligned(4)));
    // 64-byte opad + 32-byte inner hash = 96 bytes (perfectly divisible by 4)
    uint8_t outer_buf[96] __attribute__((aligned(4)));

    memset(key_block, 0, sizeof(key_block));
    memcpy(key_block, DEVICE_SECRET_KEY, sizeof(DEVICE_SECRET_KEY));

    for (uint32_t i = 0; i < 64U; i++) {
        ipad[i] = key_block[i] ^ 0x36U;
        opad[i] = key_block[i] ^ 0x5CU;
    }

    memcpy(inner_buf, ipad, 64U);
    memcpy(inner_buf + 64U, message, msg_len);

    if (compute_hash_hw(inner_buf, sizeof(inner_buf), inner_hash) != 0) {
        memset(inner_hash, 0, sizeof(inner_hash));
        return -3;
    }

    memcpy(outer_buf, opad, 64U);
    memcpy(outer_buf + 64U, inner_hash, 32U);

    if (compute_hash_hw(outer_buf, sizeof(outer_buf), hmac_out) != 0) {
        memset(hmac_out, 0, ATTESTATION_HMAC_SIZE);
        return -4;
    }

    // Clean sensitive stack parameters
    memset(key_block, 0, sizeof(key_block));
    memset(ipad, 0, sizeof(ipad));
    memset(opad, 0, sizeof(opad));
    memset(inner_hash, 0, sizeof(inner_hash));
    memset(inner_buf, 0, sizeof(inner_buf));
    memset(outer_buf, 0, sizeof(outer_buf));

    return 0;
}

static uint32_t last_nonce = 0;

__attribute__((cmse_nonsecure_entry))
int32_t SECURE_Attest(uint32_t nonce, attestation_report_t *report)
{
    attestation_report_t *report_ns =
        (attestation_report_t *)cmse_check_pointed_object(report, CMSE_NONSECURE);

    if (report_ns == NULL) {
        return -1;
    }

    // validate if the NS firmware region is actually NonSecure
	void *ns_region = cmse_check_address_range(
			(void *)NS_FW_START_ADDR,
			NS_FW_SIZE,
			CMSE_NONSECURE
	);

	if (ns_region == NULL) {
			report_ns->status = 1U;
			return -10;  // Invalid memory region
	}

	// Check for nonce reuse
    if (nonce == last_nonce) {
        return -11;
    }
    last_nonce = nonce;


    uint8_t fw_hash[ATTESTATION_HASH_SIZE];

    int32_t result = compute_hash_hw(
        (const uint8_t *)NS_FW_START_ADDR,
        NS_FW_SIZE,
        fw_hash
    );

    if (result != 0) {
        report_ns->status = 1U;
        memset(report_ns->hash, 0, ATTESTATION_HASH_SIZE);
        report_ns->nonce = nonce;
        report_ns->timestamp = HAL_GetTick();
        return result;
    }

    memcpy(report_ns->hash, fw_hash, ATTESTATION_HASH_SIZE);
    report_ns->nonce = nonce;
    report_ns->timestamp = HAL_GetTick();
    report_ns->status = 0U;

    return 0;
}

__attribute__((cmse_nonsecure_entry))
int32_t SECURE_GenerateHMACReport(const attestation_report_t *report,
                                  uint8_t *hmac_out)
{
    const attestation_report_t *report_ns =
        (const attestation_report_t *)cmse_check_pointed_object(report, CMSE_NONSECURE);

    uint8_t *hmac_ns =
        (uint8_t *)cmse_check_address_range(hmac_out, ATTESTATION_HMAC_SIZE, CMSE_NONSECURE);

    if (report_ns == NULL || hmac_ns == NULL) {
        return -1;
    }

    attestation_report_t secure_copy;
    memcpy(&secure_copy, report_ns, sizeof(attestation_report_t));

    if (secure_copy.status != 0U) {
        memset(hmac_ns, 0, ATTESTATION_HMAC_SIZE);
        return -2;
    }

    // 44 bytes total: hash[32] || nonce[4] || timestamp[4] || status[1] || padding[3]
    uint8_t message[44] __attribute__((aligned(4)));
    memset(message, 0, sizeof(message));

    memcpy(message, secure_copy.hash, 32);
    memcpy(message + 32, &secure_copy.nonce, 4);
    memcpy(message + 36, &secure_copy.timestamp, 4);
    message[40] = secure_copy.status;

    // Bytes 41, 42, 43 remain 0x00 padding to align the block to a 4-byte boundary

    int32_t result = compute_hmac_sha256(message, sizeof(message), hmac_ns);

    if (result != 0) {
        memset(hmac_ns, 0, ATTESTATION_HMAC_SIZE);
        return result;
    }

    memset(message, 0, sizeof(message));
    return 0;
}

__attribute__((cmse_nonsecure_entry))
int32_t SECURE_GenerateECDSAReport(const attestation_report_ecdsa_t *report,
                                   uint8_t *sig_out,
                                   size_t max_sig_len,
                                   size_t *actual_sig_len)
{
    const attestation_report_ecdsa_t *report_ns =
        (const attestation_report_ecdsa_t *)cmse_check_pointed_object(report, CMSE_NONSECURE);

    uint8_t *sig_ns =
        (uint8_t *)cmse_check_address_range(sig_out, max_sig_len, CMSE_NONSECURE);

    size_t *len_ns =
        (size_t *)cmse_check_pointed_object(actual_sig_len, CMSE_NONSECURE);

    if (report_ns == NULL || sig_ns == NULL || len_ns == NULL) {
        return -1;
    }

    attestation_report_ecdsa_t secure_copy;
    memcpy(&secure_copy, report_ns, sizeof(attestation_report_ecdsa_t));

    if (secure_copy.status != 0U) {
        return -2;
    }

    // Serialize precisely into an identical 44-byte array
    uint8_t message[44];
    memcpy(message, &secure_copy.nonce, 4);
    memcpy(message + 4, &secure_copy.timestamp, 4);
    message[8] = secure_copy.status;
    message[9] = secure_copy.reserved[0];
    message[10] = secure_copy.reserved[1];
    message[11] = secure_copy.reserved[2];
    memcpy(message + 12, secure_copy.hash, 32);

    // Hash the message payload (required for ECDSA)
    uint8_t message_hash[32];
    int32_t final_ret = compute_hash_hw(message, sizeof(message), message_hash);
    if (final_ret != 0) {
        memset(message, 0, sizeof(message));
        return -3;
    }

    // Mbed TLS Contexts
    mbedtls_ecdsa_context ecdsa;
    mbedtls_entropy_context entropy;
    mbedtls_ctr_drbg_context ctr_drbg;
    const char *pers = "tz_ecdsa";
    uint8_t temp_sig[100];
    size_t sig_len = 0;

    mbedtls_ecdsa_init(&ecdsa);
    mbedtls_entropy_init(&entropy);
    mbedtls_ctr_drbg_init(&ctr_drbg);

    // Seed Random Number Generator and lLoad PK
    final_ret = mbedtls_ctr_drbg_seed(&ctr_drbg, mbedtls_entropy_func, &entropy,
                                      (const unsigned char *)pers, strlen(pers));
    if (final_ret != 0) goto cleanup;

    final_ret = mbedtls_ecp_read_key(MBEDTLS_ECP_DP_SECP256R1, &ecdsa,
                                     DEVICE_ECDSA_PRIVATE_KEY, sizeof(DEVICE_ECDSA_PRIVATE_KEY));
    if (final_ret != 0) goto cleanup;

    // Write the signature
    final_ret = mbedtls_ecdsa_write_signature(&ecdsa, MBEDTLS_MD_SHA256,
                                              message_hash, sizeof(message_hash),
                                              temp_sig, sizeof(temp_sig), &sig_len,
                                              mbedtls_ctr_drbg_random, &ctr_drbg);

    if (final_ret == 0) {
        if (sig_len <= max_sig_len) {
            memcpy(sig_ns, temp_sig, sig_len);
            *len_ns = sig_len;
        } else {
            final_ret = -4; // Non-Secure buffer overflow warn
        }
    }

cleanup:
    mbedtls_ecdsa_free(&ecdsa);
    mbedtls_entropy_free(&entropy);
    mbedtls_ctr_drbg_free(&ctr_drbg);
    memset(message, 0, sizeof(message));
    memset(message_hash, 0, sizeof(message_hash));
    memset(temp_sig, 0, sizeof(temp_sig));

    return final_ret;
}

__attribute__((cmse_nonsecure_entry))
int32_t SECURE_ExportPublicKey(uint8_t *pub_key_out, size_t max_len, size_t *actual_len)
{
	// 1. Validate Non-Secure pointers (CMSE)
	uint8_t *key_ns = (uint8_t *)cmse_check_address_range(pub_key_out, max_len, CMSE_NONSECURE);
	size_t *len_ns  = (size_t *)cmse_check_pointed_object(actual_len, CMSE_NONSECURE);

	if (key_ns == NULL || len_ns == NULL) {
		return -1;
	}

	int ret;
	mbedtls_ecp_group grp;
	mbedtls_mpi d;
	mbedtls_ecp_point Q;
	mbedtls_entropy_context entropy;
	mbedtls_ctr_drbg_context ctr_drbg;
	const char *pers = "tz_pubkey_gen";

	// 2. Initialize ECP structures
	mbedtls_ecp_group_init(&grp);
	mbedtls_mpi_init(&d);
	mbedtls_ecp_point_init(&Q);
	mbedtls_entropy_init(&entropy);
	mbedtls_ctr_drbg_init(&ctr_drbg);

	// 3. Seed RNG
	ret = mbedtls_ctr_drbg_seed(&ctr_drbg, mbedtls_entropy_func, &entropy,
								(const unsigned char *)pers, strlen(pers));
	if (ret != 0) goto cleanup;

	// 4. Load the SECP256R1 Curve parameters
	ret = mbedtls_ecp_group_load(&grp, MBEDTLS_ECP_DP_SECP256R1);
	if (ret != 0) goto cleanup;

	// 5. Load the Private Key into a Big Number (MPI) object
	ret = mbedtls_mpi_read_binary(&d, DEVICE_ECDSA_PRIVATE_KEY, sizeof(DEVICE_ECDSA_PRIVATE_KEY));
	if (ret != 0) goto cleanup;

	// 6. Calculate the Public Key: Q = d * G (Multiply Private Key by the Curve Generator Base)
	ret = mbedtls_ecp_mul(&grp, &Q, &d, &grp.G, mbedtls_ctr_drbg_random, &ctr_drbg);
	if (ret != 0) goto cleanup;

	// 7. Serialize the Public Key Point into the Non-Secure buffer
	// MBEDTLS_ECP_PF_UNCOMPRESSED yields a 65-byte array (0x04 || X || Y)
	size_t olen = 0;
	ret = mbedtls_ecp_point_write_binary(&grp, &Q, MBEDTLS_ECP_PF_UNCOMPRESSED,
										 &olen, key_ns, max_len);

	if (ret == 0) {
		*len_ns = olen;
	} else if (ret == MBEDTLS_ERR_ECP_BUFFER_TOO_SMALL) {
		ret = -2; // The NS buffer max_len was less than 65 bytes
	}

cleanup:
	// 8. Securely wipe the Big Numbers and points from the Secure stack
	mbedtls_ecp_group_free(&grp);
	mbedtls_mpi_free(&d);
	mbedtls_ecp_point_free(&Q);
	mbedtls_entropy_free(&entropy);
	mbedtls_ctr_drbg_free(&ctr_drbg);

	return (ret == 0) ? 0 : ret;
}
/**
  * @}
  */

/**
  * @}
  */
/* USER CODE END Non_Secure_CallLib */

