package com.example.taskmanager.dto;

import com.example.taskmanager.TaskStatus;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class TaskDTO {
    private Long id;
    private String description;
    private TaskStatus status;
    private LocalDateTime deadline;
    private UserDTO assignee;
}
