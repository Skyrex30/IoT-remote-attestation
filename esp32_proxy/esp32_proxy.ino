#include <WiFi.h>
#include <WebServer.h>
#include "secrets.h"

#define STM32_RX_PIN 3
#define STM32_TX_PIN 1
#define STM32_BAUD   115200

#define REQ_MAGIC   0x31515241UL
#define RESP_MAGIC  0x31505241UL

// STM32 command id's
#define CMD_ATTEST_HMAC   1U
#define CMD_ATTEST_ECDSA  2U
#define CMD_GET_PUBKEY    3U

#define UART_TIMEOUT_MS 8000
#define RATE_LIMIT_MS  5000

WebServer server(80);
HardwareSerial Stm32Serial(2);

static uint32_t last_attest_ms = 0;

typedef struct __attribute__((packed)) {
  uint32_t magic;
  uint32_t command;
  uint32_t nonce;
} attest_request_t;

typedef struct __attribute__((packed)) {
  uint32_t magic;
  uint32_t status;
  uint32_t nonce;
  uint32_t timestamp;
  uint8_t  hash[32];
  uint8_t  auth_data[75]; // Holds the variable HMAC, ECDSA, or PubKey
  uint8_t  _padding;
  uint32_t auth_len;
} attest_response_t;


String bytes_to_hex(const uint8_t *data, size_t len)
{
  static const char hex[] = "0123456789abcdef";
  String out;
  out.reserve(len * 2);

  for (size_t i = 0; i < len; i++) {
    out += hex[data[i] >> 4];
    out += hex[data[i] & 0x0F];
  }

  return out;
}

bool read_exact(uint8_t *buf, size_t len, uint32_t timeout_ms)
{
  size_t got = 0;
  uint32_t start = millis();

  while (got < len) {
    if ((millis() - start) > timeout_ms) {
      return false;
    }

    while (Stm32Serial.available() > 0 && got < len) {
      buf[got++] = (uint8_t)Stm32Serial.read();
    }
    delay(1);
  }
  return true;
}

void handle_attest()
{
  uint32_t now = millis();

  if ((now - last_attest_ms) < RATE_LIMIT_MS) {
    server.send(429, "application/json", "{\"error\":\"too_many_requests\"}");
    return;
  }

  last_attest_ms = now;

  if (!server.hasArg("nonce")) {
    server.send(400, "application/json", "{\"error\":\"missing_nonce\"}");
    return;
  }

  uint32_t nonce = strtoul(server.arg("nonce").c_str(), nullptr, 0);

  uint32_t cmd = CMD_ATTEST_HMAC;
  if (server.hasArg("type")) {
    String type_str = server.arg("type");
    if (type_str == "ecdsa") {
      cmd = CMD_ATTEST_ECDSA;
    } else if (type_str == "pubkey") {
      cmd = CMD_GET_PUBKEY;
    }
  }

  attest_request_t req;
  req.magic = REQ_MAGIC;
  req.command = cmd;
  req.nonce = nonce;

  attest_response_t resp;
  memset(&resp, 0, sizeof(resp));

  while (Stm32Serial.available() > 0) {
    Stm32Serial.read();
  }

  // Transmit req
  Stm32Serial.write((uint8_t *)&req, sizeof(req));
  Stm32Serial.flush();

  // Wait for 128-byte resp
  if (!read_exact((uint8_t *)&resp, sizeof(resp), UART_TIMEOUT_MS)) {
    server.send(504, "application/json", "{\"error\":\"stm32_timeout\"}");
    return;
  }

  // logging
  Serial.print("Magic received: 0x");
  Serial.println(resp.magic, HEX);

  if (resp.magic != RESP_MAGIC) {
    server.send(502, "application/json", "{\"error\":\"bad_stm32_response_magic\"}");
    return;
  }

  // Prevent buffer overflow
  uint32_t safe_auth_len = (resp.auth_len <= 75) ? resp.auth_len : 0;

  // Build the JSON response
  String json = "{";
  json += "\"status\":" + String(resp.status) + ",";
  json += "\"nonce\":" + String(resp.nonce) + ",";
  json += "\"timestamp\":" + String(resp.timestamp) + ",";
  json += "\"hash\":\"" + bytes_to_hex(resp.hash, 32) + "\",";
  json += "\"auth_data\":\"" + bytes_to_hex(resp.auth_data, safe_auth_len) + "\",";
  json += "\"auth_len\":" + String(safe_auth_len);
  json += "}";

  server.send(200, "application/json", json);
}

void setup()
{
  Serial.begin(115200);

  Stm32Serial.begin(STM32_BAUD, SERIAL_8N1, STM32_RX_PIN, STM32_TX_PIN);

  WiFi.begin(WIFI_SSID, WIFI_PASS);

  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
  }

  server.on("/attest", HTTP_GET, handle_attest);
  server.begin();
  
  Serial.println("ESP32 Ready. WiFi Connected.");
}

void loop()
{
  server.handleClient();
}