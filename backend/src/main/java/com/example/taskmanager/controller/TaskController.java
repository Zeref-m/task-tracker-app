package com.example.taskmanager.controller;

import com.example.taskmanager.Task;
import com.example.taskmanager.User;
import com.example.taskmanager.UserRepository;
import com.example.taskmanager.service.TaskService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;
    private final UserRepository userRepository;

    @PostMapping
    public Task createTask(@RequestBody Task task, Authentication auth) {
        User me = getCurrentUser(auth);
        return taskService.createTask(task, me);
    }

    @GetMapping
    public List<Task> getAllTasks() {
        return taskService.getAllTasks();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> getTaskById(@PathVariable Long id) {
        Task task = taskService.getTaskById(id);
        return ResponseEntity.ok(task);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable Long id, @RequestBody Task taskDetails, Authentication auth) {
        User me = getCurrentUser(auth);
        Task updatedTask = taskService.updateTask(id, taskDetails, me);
        return ResponseEntity.ok(updatedTask);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable Long id, Authentication auth) {
        User me = getCurrentUser(auth);
        taskService.deleteTask(id, me);
        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser(Authentication auth) {
        if (auth == null) throw new RuntimeException("Not authenticated");
        UserDetails details = (UserDetails) auth.getPrincipal();
        return userRepository.findByUsername(details.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
