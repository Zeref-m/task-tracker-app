package com.example.taskmanager.service;

import com.example.taskmanager.Group;
import com.example.taskmanager.Task;
import com.example.taskmanager.TaskRepository;
import com.example.taskmanager.User;
import com.example.taskmanager.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final GroupService groupService;

    public Task createTask(Task task, User currentUser) {
        Group group = groupService.getGroupById(task.getGroup().getId());
        boolean isAdmin = group.getCreatedBy() != null && group.getCreatedBy().getId().equals(currentUser.getId());
        if (!isAdmin) {
            task.setAssignee(currentUser);
        }
        return taskRepository.save(task);
    }

    public Task getTaskById(Long id) {
        return taskRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Task not found with id: " + id));
    }

    public List<Task> getAllTasks() {
        return taskRepository.findAll();
    }

    @Transactional
    public Task updateTask(Long id, Task taskDetails, User currentUser) {
        Task task = getTaskById(id);
        Group group = groupService.getGroupById(task.getGroup().getId());

        boolean isAdmin = group.getCreatedBy() != null && group.getCreatedBy().getId().equals(currentUser.getId());
        boolean isAssignee = task.getAssignee() != null && task.getAssignee().getId().equals(currentUser.getId());

        if (!isAdmin && !isAssignee) {
            throw new RuntimeException("You can only update your own tasks");
        }

        task.setDescription(taskDetails.getDescription());
        task.setStatus(taskDetails.getStatus());
        task.setDeadline(taskDetails.getDeadline());

        if (isAdmin) {
            task.setAssignee(taskDetails.getAssignee());
        }

        return taskRepository.save(task);
    }

    public void deleteTask(Long id, User currentUser) {
        Task task = getTaskById(id);
        Group group = groupService.getGroupById(task.getGroup().getId());

        boolean isAdmin = group.getCreatedBy() != null && group.getCreatedBy().getId().equals(currentUser.getId());
        boolean isAssignee = task.getAssignee() != null && task.getAssignee().getId().equals(currentUser.getId());

        if (!isAdmin && !isAssignee) {
            throw new RuntimeException("You can only delete your own tasks");
        }

        taskRepository.deleteById(id);
    }
}
