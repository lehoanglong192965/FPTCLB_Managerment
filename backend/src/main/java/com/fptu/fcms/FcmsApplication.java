package com.fptu.fcms;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class FcmsApplication {

    public static void main(String[] args) {
        SpringApplication.run(FcmsApplication.class, args);
    }

}
