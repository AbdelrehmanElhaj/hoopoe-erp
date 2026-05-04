package com.accounting;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.autoconfigure.flyway.FlywayAutoConfiguration;

// Exclude Flyway autoconfiguration - we manage it manually for multi-tenancy
@SpringBootApplication(exclude = {FlywayAutoConfiguration.class})
public class SaudiAccountingSystemApplication {

    public static void main(String[] args) {
        SpringApplication.run(SaudiAccountingSystemApplication.class, args);
    }
}
