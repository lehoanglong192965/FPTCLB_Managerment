package com.fptu.fcms.service.impl;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.net.Socket;
import java.nio.charset.StandardCharsets;

@Service
public class ClamAvScanService {

    @Value("${clamav.host:localhost}")
    private String host;

    @Value("${clamav.port:3310}")
    private int port;

    public void scan(MultipartFile file) {
        try (Socket socket = new Socket(host, port);
             InputStream inputStream = file.getInputStream()) {
            socket.getOutputStream().write("zINSTREAM\0".getBytes(StandardCharsets.UTF_8));
            socket.getOutputStream().flush();

            byte[] buffer = new byte[8192];
            int read;
            while ((read = inputStream.read(buffer)) != -1) {
                socket.getOutputStream().write(new byte[] {
                        (byte) ((read >> 24) & 0xFF),
                        (byte) ((read >> 16) & 0xFF),
                        (byte) ((read >> 8) & 0xFF),
                        (byte) (read & 0xFF)
                });
                socket.getOutputStream().write(buffer, 0, read);
            }
            socket.getOutputStream().write(new byte[] {0, 0, 0, 0});
            socket.getOutputStream().flush();

            String response = new String(socket.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            if (!response.contains("OK")) {
                throw new IllegalArgumentException("File failed antivirus scan.");
            }
        } catch (java.net.ConnectException ex) {
            // ClamAV not reachable (dev/local) — skip scan
        } catch (IOException ex) {
            throw new IllegalStateException("Unable to scan file with ClamAV.", ex);
        }
    }
}
