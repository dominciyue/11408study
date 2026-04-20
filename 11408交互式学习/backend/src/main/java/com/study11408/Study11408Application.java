package com.study11408;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;

@SpringBootApplication
@EnableCaching
public class Study11408Application {

    public static void main(String[] args) {
        SpringApplication.run(Study11408Application.class, args);
    }
}
