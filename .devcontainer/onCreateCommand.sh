#!/bin/bash

if grep avx /proc/cpuinfo &>/dev/null; then
  sudo apt-get install gnupg curl
  curl -fsSL https://pgp.mongodb.com/server-7.0.asc | \
    sudo gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg \
    --dearmor
  echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/debian bullseye/mongodb-org/7.0 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
else
  wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
  echo "deb http://repo.mongodb.org/apt/debian buster/mongodb-org/4.4 main" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
fi

sudo apt-get update
if ! sudo apt-get install -y mongodb-org; then
  wget https://security.debian.org/debian-security/pool/updates/main/o/openssl/libssl1.1_1.1.1n-0+deb10u6_amd64.deb
  sudo dpkg -i ./libssl1.1_1.1.1n-0+deb10u6_amd64.deb
  rm ./libssl1.1_1.1.1n-0+deb10u6_amd64.deb
  sudo apt-get install -y mongodb-org
fi