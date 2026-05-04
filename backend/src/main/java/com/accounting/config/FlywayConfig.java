package com.accounting.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.flywaydb.core.Flyway;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import javax.sql.DataSource;

@Slf4j
@Configuration
@RequiredArgsConstructor
public class FlywayConfig {

    private final DataSource dataSource;

    @Bean
    public ApplicationRunner runPublicMigrations() {
        return args -> {
            log.info("Running Flyway migrations for public schema...");
            Flyway flyway = Flyway.configure()
                    .dataSource(dataSource)
                    .schemas("public")
                    .defaultSchema("public")
                    .locations("classpath:db/migration/public")
                    .baselineOnMigrate(true)
                    .load();
            flyway.migrate();
            log.info("Public schema migrations completed.");
        };
    }
}
