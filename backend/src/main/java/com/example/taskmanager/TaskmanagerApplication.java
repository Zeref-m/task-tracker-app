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
            // Enable foreign key checks for PostgreSQL
            jdbcTemplate.execute("SET CONSTRAINTS ALL DEFERRED");

            jdbcTemplate.execute("DELETE FROM tasks");
            jdbcTemplate.execute("DELETE FROM user_group");
            jdbcTemplate.execute("DELETE FROM groups");
            jdbcTemplate.execute("DELETE FROM users");
            System.out.println("Old data cleared.");

            org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder encoder = new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder();
            String passwordHash = encoder.encode("password123");
            String groupPasswordHash = encoder.encode("groupPass123");

            jdbcTemplate.execute("INSERT INTO users (username, email, password) VALUES ('admin', 'admin@example.com', '" + passwordHash + "')");
            jdbcTemplate.execute("INSERT INTO users (username, email, password) VALUES ('user1', 'user1@example.com', '" + passwordHash + "')");
            jdbcTemplate.execute("INSERT INTO users (username, email, password) VALUES ('user2', 'user2@example.com', '" + passwordHash + "')");

            Long adminId = jdbcTemplate.queryForObject("SELECT id FROM users WHERE username = 'admin'", Long.class);
            Long user1Id = jdbcTemplate.queryForObject("SELECT id FROM users WHERE username = 'user1'", Long.class);
            Long user2Id = jdbcTemplate.queryForObject("SELECT id FROM users WHERE username = 'user2'", Long.class);

            jdbcTemplate.execute("INSERT INTO groups (groupname, description, created_by_id, grouppassword) VALUES ('Project Alpha', 'Main project group', " + adminId + ", '" + groupPasswordHash + "')");
            jdbcTemplate.execute("INSERT INTO groups (groupname, description, created_by_id, grouppassword) VALUES ('Project Beta', 'Secondary project group', " + user1Id + ", '" + groupPasswordHash + "')");
            Long groupAlphaId = jdbcTemplate.queryForObject("SELECT id FROM groups WHERE groupname = 'Project Alpha'", Long.class);
            Long groupBetaId = jdbcTemplate.queryForObject("SELECT id FROM groups WHERE groupname = 'Project Beta'", Long.class);

            jdbcTemplate.execute("INSERT INTO user_group (group_id, user_id) VALUES (" + groupAlphaId + ", " + adminId + ")");
            jdbcTemplate.execute("INSERT INTO user_group (group_id, user_id) VALUES (" + groupAlphaId + ", " + user1Id + ")");
            jdbcTemplate.execute("INSERT INTO user_group (group_id, user_id) VALUES (" + groupAlphaId + ", " + user2Id + ")");
            jdbcTemplate.execute("INSERT INTO user_group (group_id, user_id) VALUES (" + groupBetaId + ", " + user1Id + ")");
            jdbcTemplate.execute("INSERT INTO user_group (group_id, user_id) VALUES (" + groupBetaId + ", " + user2Id + ")");

            java.time.LocalDateTime now = java.time.LocalDateTime.now();
            jdbcTemplate.execute("INSERT INTO tasks (description, status, deadline, user_id, group_id) VALUES ('Complete documentation', 'TODO', '" + now.plusDays(1) + "', " + adminId + ", " + groupAlphaId + ")");
            jdbcTemplate.execute("INSERT INTO tasks (description, status, deadline, user_id, group_id) VALUES ('Design API structure', 'IN_PROGRESS', '" + now.plusDays(2) + "', " + user1Id + ", " + groupAlphaId + ")");
            jdbcTemplate.execute("INSERT INTO tasks (description, status, deadline, user_id, group_id) VALUES ('Review code', 'DONE', '" + now.minusDays(1) + "', " + user2Id + ", " + groupBetaId + ")");
            jdbcTemplate.execute("INSERT INTO tasks (description, status, deadline, user_id, group_id) VALUES ('Update documentation', 'TODO', '" + now.plusDays(3) + "', " + user2Id + ", " + groupBetaId + ")");

            // Reset foreign key checks
            jdbcTemplate.execute("SET CONSTRAINTS ALL IMMEDIATE");

            System.out.println("Default data restored successfully.");
        };
    }
}
