package com.example.taskmanager.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserWithTasksDTO {
    private Long id;
    private String username;
    private String email;
    private TaskDTO currentTask;
}
