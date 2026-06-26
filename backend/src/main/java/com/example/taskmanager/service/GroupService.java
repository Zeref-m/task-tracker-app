package com.example.taskmanager.service;

import com.example.taskmanager.Group;
import com.example.taskmanager.GroupRepository;
import com.example.taskmanager.User;
import com.example.taskmanager.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class GroupService {

    private final GroupRepository groupRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public Group createGroup(Group group, User creator) {
        group.setCreatedBy(creator);
        group.setGroupPassword(passwordEncoder.encode(group.getGroupPassword()));
        group.getUsers().add(creator);
        return groupRepository.save(group);
    }

    public List<Group> getMyGroups(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return groupRepository.findAll().stream()
                .filter(g -> g.getUsers().contains(user))
                .toList();
    }

    public List<Group> searchGroups(String query, Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return groupRepository.searchByName(query).stream()
                .filter(g -> !g.getUsers().contains(user))
                .toList();
    }

    public Group joinGroup(Long groupId, String rawPassword, User joiner) {
        Group group = getGroupById(groupId);
        if (group.getGroupPassword() == null) {
            throw new RuntimeException("Group has no password set");
        }
        if (group.getUsers().contains(joiner)) {
            throw new RuntimeException("You are already a member of this group");
        }
        if (!passwordEncoder.matches(rawPassword, group.getGroupPassword())) {
            throw new RuntimeException("Invalid group password");
        }
        group.getUsers().add(joiner);
        return groupRepository.save(group);
    }

    @Transactional
    public Group addUserToGroup(Long groupId, Long userId, User currentUser) {
        Group group = getGroupById(groupId);
        checkAdmin(group, currentUser);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        group.getUsers().add(user);
        return groupRepository.save(group);
    }

    @Transactional
    public Group removeUserFromGroup(Long groupId, Long userId, User currentUser) {
        Group group = getGroupById(groupId);
        checkAdmin(group, currentUser);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        group.getUsers().remove(user);
        return groupRepository.save(group);
    }

    @Transactional
    public Group updateGroup(Long id, String groupName, String description, User currentUser) {
        Group group = getGroupById(id);
        checkAdmin(group, currentUser);
        group.setGroupName(groupName);
        group.setDescription(description);
        return groupRepository.save(group);
    }

    @Transactional
    public void deleteGroup(Long id, User currentUser) {
        Group group = getGroupById(id);
        checkAdmin(group, currentUser);
        groupRepository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public Group getGroupById(Long id) {
        return groupRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Group with id " + id + " not found"));
    }

    public void checkAdmin(Group group, User user) {
        if (group.getCreatedBy() == null || !group.getCreatedBy().getId().equals(user.getId())) {
            throw new RuntimeException("Only the group admin can perform this action");
        }
    }
}
