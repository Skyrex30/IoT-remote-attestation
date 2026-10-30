/* USER CODE BEGIN Header */
/**
  ******************************************************************************
  * @file    Secure_nsclib/secure_nsc.h
  * @author  MCD Application Team
  * @brief   Header for secure non-secure callable APIs list
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

/* USER CODE BEGIN Non_Secure_CallLib_h */
/* Define to prevent recursive inclusion -------------------------------------*/
#ifndef SECURE_NSC_H
#define SECURE_NSC_H

/* Includes ------------------------------------------------------------------*/
#include <stdint.h>
/* Exported types ------------------------------------------------------------*/

// Hash output size (SHA-256)
#define ATTESTATION_HASH_SIZE 32U
#define ATTESTATION_HMAC_SIZE 32U

#define NS_FW_START_ADDR 0x08100000U
#define NS_FW_END_ADDR    0x081FFFFFU
#define NS_FW_SIZE  (1024U * 1024U)

/* Report layout dedicated for HMAC verification */
typedef struct {
    uint8_t hash[ATTESTATION_HASH_SIZE];
    uint32_t nonce;
    uint32_t timestamp;
    uint8_t status;
} attestation_report_t;

/* Report layout dedicated for ECDSA verification */
typedef struct {
    uint32_t nonce;
    uint32_t timestamp;
    uint8_t  status;
    uint8_t  reserved[3]; // 4-byte boundary padding
    uint8_t  hash[ATTESTATION_HASH_SIZE];
} attestation_report_ecdsa_t; // Total: 44 bytes

/* Exported constants --------------------------------------------------------*/
/* Exported macro ------------------------------------------------------------*/
/* Exported functions ------------------------------------------------------- */
int32_t SECURE_Attest(uint32_t nonce, attestation_report_t *report);
int32_t SECURE_GenerateHMACReport(const attestation_report_t *report,
                                           uint8_t *hmac_out);
int32_t SECURE_GenerateECDSAReport(const attestation_report_ecdsa_t *report,
                                      uint8_t *sig_out,
                                      size_t max_sig_len,
                                      size_t *actual_sig_len);
int32_t SECURE_ExportPublicKey(uint8_t *pub_key_out, size_t max_len, size_t *actual_len);

#endif /* SECURE_NSC_H */
/* USER CODE END Non_Secure_CallLib_h */

