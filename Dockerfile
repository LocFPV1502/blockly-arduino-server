FROM node:18-bullseye-slim

# Cài đặt curl để tải arduino-cli
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

# Cài đặt arduino-cli
RUN curl -fsSL https://raw.githubusercontent.com/arduino/arduino-cli/master/install.sh | sh
RUN mv bin/arduino-cli /usr/local/bin/

# Cấu hình và cài đặt core Arduino (AVR & ESP32)
RUN arduino-cli config init --overwrite
RUN arduino-cli config set board_manager.additional_urls https://dl.espressif.com/dl/package_esp32_index.json
RUN arduino-cli core update-index
RUN arduino-cli core install arduino:avr
RUN arduino-cli core install esp32:esp32

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy package.json và cài đặt thư viện Node.js
COPY package*.json ./
RUN npm install

# Copy mã nguồn
COPY index.js ./

# Mở cổng
EXPOSE 4000

# Khởi chạy server
CMD ["npm", "start"]
