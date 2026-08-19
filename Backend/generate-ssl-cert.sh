#!/bin/bash
# Generate self-signed SSL certificate for local development

KEYSTORE_PATH="./src/main/resources/keystore.p12"
KEYSTORE_PASSWORD="dev-password-change-in-prod"
VALIDITY_DAYS=365

echo "Generating self-signed SSL certificate..."
keytool -genkeypair \
  -alias tomcat \
  -keyalg RSA \
  -keysize 2048 \
  -storetype PKCS12 \
  -keystore "$KEYSTORE_PATH" \
  -validity "$VALIDITY_DAYS" \
  -storepass "$KEYSTORE_PASSWORD" \
  -keypass "$KEYSTORE_PASSWORD" \
  -dname "CN=localhost, OU=Development, O=Workforce, C=US"

if [ $? -eq 0 ]; then
  echo "✅ Certificate generated successfully"
  echo "Location: $KEYSTORE_PATH"
  echo "Password: $KEYSTORE_PASSWORD"
  echo ""
  echo "Add to .env:"
  echo "SSL_KEYSTORE_PATH=$(pwd)/$KEYSTORE_PATH"
  echo "SSL_KEYSTORE_PASSWORD=$KEYSTORE_PASSWORD"
else
  echo "❌ Failed to generate certificate"
  exit 1
fi
