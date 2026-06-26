package com.example.taskmanager.controller;

import com.example.taskmanager.Group;
import com.example.taskmanager.User;
import com.example.taskmanager.UserRepository;
import com.example.taskmanager.service.GroupService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/groups")
public class GroupController {

    private final GroupService groupService;
    private final UserRepository userRepository;

    @PostMapping
    public Group createGroup(@RequestBody Group group, Authentication auth) {
        User creator = getCurrentUser(auth);
        return groupService.createGroup(group, creator);
    }

    @GetMapping
    public List<Group> getMyGroups(Authentication auth) {
        User me = getCurrentUser(auth);
        return groupService.getMyGroups(me.getId());
    }

    @GetMapping("/search")
    public List<Group> searchGroups(@RequestParam String q, Authentication auth) {
        User me = getCurrentUser(auth);
        return groupService.searchGroups(q, me.getId());
    }

    @PostMapping("/{id}/join")
    public ResponseEntity<Group> joinGroup(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        User joiner = getCurrentUser(auth);
        Group updated = groupService.joinGroup(id, body.get("groupPassword"), joiner);
        return ResponseEntity.ok(updated);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Group> getGroupById(@PathVariable Long id) {
        Group group = groupService.getGroupById(id);
        return ResponseEntity.ok(group);
    }

    @PostMapping("/{id}/users")
    public ResponseEntity<Group> addUserToGroup(@PathVariable Long id, @RequestBody Map<String, Long> body, Authentication auth) {
        User me = getCurrentUser(auth);
        Group updated = groupService.addUserToGroup(id, body.get("userId"), me);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}/users/{userId}")
    public ResponseEntity<Group> removeUserFromGroup(@PathVariable Long id, @PathVariable Long userId, Authentication auth) {
        User me = getCurrentUser(auth);
        Group updated = groupService.removeUserFromGroup(id, userId, me);
        return ResponseEntity.ok(updated);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Group> updateGroup(@PathVariable Long id, @RequestBody Map<String, String> body, Authentication auth) {
        User me = getCurrentUser(auth);
        Group updated = groupService.updateGroup(id, body.get("groupName"), body.get("description"), me);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteGroup(@PathVariable Long id, Authentication auth) {
        User me = getCurrentUser(auth);
        groupService.deleteGroup(id, me);
        return ResponseEntity.noContent().build();
    }

    private User getCurrentUser(Authentication auth) {
        if (auth == null) throw new RuntimeException("Not authenticated");
        UserDetails details = (UserDetails) auth.getPrincipal();
        return userRepository.findByUsername(details.getUsername())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }
}
