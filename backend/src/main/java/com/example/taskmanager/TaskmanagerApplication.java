package com.example.taskmanager;

import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootApplication
public class TaskmanagerApplication {

    private final JdbcTemplate jdbcTemplate;

    public TaskmanagerApplication(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public static void main(String[] args) {
        SpringApplication.run(TaskmanagerApplication.class, args);
    }

    @Bean
    public CommandLineRunner resetData() {
        return args -> {
            jdbcTemplate.execute("DELETE FROM tasks");
            jdbcTemplate.execute("DELETE FROM user_group");
            jdbcTemplate.execute("DELETE FROM groups");
            System.out.println("Old data cleared.");
        };
    }
}
