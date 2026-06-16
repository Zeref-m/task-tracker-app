package com.example.taskmanager;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Entity
@Table(name = "users")
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "username cannot be empty")
    @Size(min = 3, max = 50, message = "username must be between 3 and 50 characters long")
    @Column(nullable = false, unique = true)
    private String username;

    @NotBlank(message ="email cannot be empty")
    @Email(message = "incorrect email")
    @Column(nullable = false, unique = true)
    private String email;

    @NotBlank(message = "password cannot be empty")
    @Size(min = 8, message = "password must be at least 6 characters long")
    @Column(nullable = false)
    private String password;
}
