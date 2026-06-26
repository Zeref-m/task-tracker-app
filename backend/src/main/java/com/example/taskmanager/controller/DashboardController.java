package com.example.taskmanager.controller;

import com.example.taskmanager.GroupRepository;
import com.example.taskmanager.Task;
import com.example.taskmanager.TaskRepository;
import com.example.taskmanager.User;
import com.example.taskmanager.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final GroupRepository groupRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(Authentication auth) {
        User me = getCurrentUser(auth);

        List<Task> allMyTasks = taskRepository.findAll().stream()
                .filter(t -> t.getAssignee() != null && t.getAssignee().getId().equals(me.getId()))
                .collect(Collectors.toList());

        long groupCount = groupRepository.findAll().stream()
                .filter(g -> g.getUsers().contains(me))
                .count();

        long taskCount = allMyTasks.size();
        long overdueCount = allMyTasks.stream()
                .filter(t -> t.getDeadline() != null
                        && t.getDeadline().isBefore(java.time.LocalDateTime.now())
                        && t.getStatus() != com.example.taskmanager.TaskStatus.DONE)
                .count();

        Map<String, Object> stats = new HashMap<>();
        stats.put("groupCount", groupCount);
        stats.put("taskCount", taskCount);
        stats.put("overdueCount", overdueCount);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/activity")
    public ResponseEntity<List<Map<String, Object>>> getActivity(Authentication auth) {
        User me = getCurrentUser(auth);

        List<Task> recentTasks = taskRepository.findAll().stream()
                .filter(t -> {
                    if (t.getAssignee() == null) return false;
                    Set<User> groupUsers = t.getGroup() != null ? t.getGroup().getUsers() : new HashSet<>();
                    return groupUsers.contains(me);
                })
                .sorted((a, b) -> Long.compare(b.getId(), a.getId()))
                .limit(10)
                .collect(Collectors.toList());

        List<Map<String, Object>> activity = recentTasks.stream().map(t -> {
            Map<String, Object> entry = new HashMap<>();
            entry.put("type", "TASK_" + t.getStatus().name());
            entry.put("taskDescription", t.getDescription());
            entry.put("taskId", t.getId());
            entry.put("username", t.getAssignee().getUsername());
            entry.put("groupId", t.getGroup() != null ? t.getGroup().getId() : null);
            entry.put("groupName", t.getGroup() != null ? t.getGroup().getGroupName() : null);
            return entry;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(activity);
    }

    private User getCurrentUser(Authentication auth) {
        if (auth == null) throw new RuntimeException("Not authenticated");
        UserDetails details = (UserDetails) auth.getPrincipal();
        return userRepository.findByUsername(details.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
